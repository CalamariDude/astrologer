-- ============================================================
-- Live Sessions: Record, Broadcast, and Replay
-- ============================================================

-- ── Core session metadata ──────────────────────────────────
create table if not exists astrologer_sessions (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references astrologer_profiles(id) on delete cascade,
  saved_chart_id uuid references saved_charts(id) on delete set null,

  title text not null default 'Untitled Session',
  status text not null default 'created'
    check (status in ('created','live','paused','ended','processing','ready','failed')),

  share_token text unique not null default encode(gen_random_bytes(12), 'hex'),

  -- Full chart snapshot so replay works even if chart is deleted
  chart_snapshot jsonb not null default '{}'::jsonb,

  -- Daily.co room info
  daily_room_name text,
  daily_room_url text,

  -- Timestamps
  started_at timestamptz,
  paused_at timestamptz,
  ended_at timestamptz,
  total_duration_ms integer default 0,

  -- Audio pipeline
  audio_status text not null default 'none'
    check (audio_status in ('none','recording','uploading','merging','transcribing','summarizing','ready','failed')),
  audio_storage_path text,
  audio_duration_ms integer,

  -- Post-processing results
  transcript text,
  summary text,
  chapters jsonb default '[]'::jsonb,

  -- Guest info
  guest_joined_at timestamptz,
  guest_display_name text,
  guest_email text,

  -- Host display name (cached from profile at session creation)
  host_display_name text,

  -- Speaker diarization from Deepgram
  utterances jsonb default '[]'::jsonb,

  -- Heartbeat for disconnect detection
  host_last_heartbeat timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at
create trigger astrologer_sessions_updated_at
  before update on astrologer_sessions
  for each row execute function update_updated_at();

-- ── Recorded cursor + chart state change events ────────────
create table if not exists session_events (
  id bigint generated always as identity primary key,
  session_id uuid not null references astrologer_sessions(id) on delete cascade,
  timestamp_ms integer not null,
  event_type text not null
    check (event_type in (
      'cursor','chart_mode','visible_planets','visible_aspects',
      'tab_switch','theme_change','transit_toggle','transit_date',
      'progressed','relocated','zoom_pan','asteroid_group',
      'show_houses','show_degrees','solar_arc','galactic_toggle',
      'state_snapshot','custom'
    )),
  payload jsonb not null default '{}'::jsonb
);

create index idx_session_events_lookup on session_events(session_id, timestamp_ms);

-- ── Audio chunk tracking ───────────────────────────────────
create table if not exists session_audio_chunks (
  id bigint generated always as identity primary key,
  session_id uuid not null references astrologer_sessions(id) on delete cascade,
  chunk_index integer not null,
  storage_path text not null,
  duration_ms integer,
  size_bytes integer,
  uploaded_at timestamptz not null default now()
);

-- ── RLS ────────────────────────────────────────────────────
alter table astrologer_sessions enable row level security;
alter table session_events enable row level security;
alter table session_audio_chunks enable row level security;

-- Sessions: host CRUD own sessions
create policy "sessions_select_own" on astrologer_sessions
  for select using (host_id = auth.uid());
create policy "sessions_insert_own" on astrologer_sessions
  for insert with check (host_id = auth.uid());
create policy "sessions_update_own" on astrologer_sessions
  for update using (host_id = auth.uid());
create policy "sessions_delete_own" on astrologer_sessions
  for delete using (host_id = auth.uid());

-- Events: host can insert + select own session events
create policy "events_select_own" on session_events
  for select using (
    session_id in (select id from astrologer_sessions where host_id = auth.uid())
  );
create policy "events_insert_own" on session_events
  for insert with check (
    session_id in (select id from astrologer_sessions where host_id = auth.uid())
  );

-- Audio chunks: host can insert + select own chunks
create policy "chunks_select_own" on session_audio_chunks
  for select using (
    session_id in (select id from astrologer_sessions where host_id = auth.uid())
  );
create policy "chunks_insert_own" on session_audio_chunks
  for insert with check (
    session_id in (select id from astrologer_sessions where host_id = auth.uid())
  );

-- ── Security-definer functions (guest/replay access) ───────

-- Get session metadata by share token (no auth required)
create or replace function get_session_by_token(p_token text)
returns jsonb
language plpgsql
security definer
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'id', s.id,
    'host_id', s.host_id,
    'saved_chart_id', s.saved_chart_id,
    'title', s.title,
    'status', s.status,
    'share_token', s.share_token,
    'chart_snapshot', s.chart_snapshot,
    'daily_room_name', s.daily_room_name,
    'daily_room_url', s.daily_room_url,
    'started_at', s.started_at,
    'paused_at', s.paused_at,
    'ended_at', s.ended_at,
    'total_duration_ms', s.total_duration_ms,
    'audio_status', s.audio_status,
    'audio_storage_path', s.audio_storage_path,
    'audio_duration_ms', s.audio_duration_ms,
    'transcript', s.transcript,
    'utterances', coalesce(s.utterances, '[]'::jsonb),
    'summary', s.summary,
    'chapters', s.chapters,
    'guest_joined_at', s.guest_joined_at,
    'guest_display_name', s.guest_display_name,
    'guest_email', s.guest_email,
    'host_display_name', s.host_display_name,
    'host_last_heartbeat', s.host_last_heartbeat,
    'created_at', s.created_at,
    'updated_at', s.updated_at
  ) into result
  from astrologer_sessions s
  where s.share_token = p_token;

  return result;
end;
$$;

grant execute on function get_session_by_token(text) to anon, authenticated;
grant execute on function get_session_events(text) to anon, authenticated;

-- Get session events for completed sessions (no auth required)
create or replace function get_session_events(p_token text)
returns setof session_events
language plpgsql
security definer
as $$
declare
  v_session_id uuid;
  v_status text;
begin
  select id, status into v_session_id, v_status
  from astrologer_sessions
  where share_token = p_token;

  if v_session_id is null then
    raise exception 'Session not found';
  end if;

  if v_status not in ('ready', 'ended') then
    raise exception 'Session events not available yet';
  end if;

  return query
    select e.*
    from session_events e
    where e.session_id = v_session_id
    order by e.timestamp_ms;
end;
$$;

-- ── Realtime publication ───────────────────────────────────
alter publication supabase_realtime add table astrologer_sessions;

-- ── Storage bucket ─────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'session-recordings',
  'session-recordings',
  false,
  52428800, -- 50MB
  array['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg']
)
on conflict (id) do nothing;

-- Storage policies: host can upload/read/delete own session folder
create policy "session_recordings_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'session-recordings'
    and (storage.foldername(name))[1] in (
      select id::text from astrologer_sessions where host_id = auth.uid()
    )
  );

create policy "session_recordings_select"
  on storage.objects for select
  using (
    bucket_id = 'session-recordings'
    and (storage.foldername(name))[1] in (
      select id::text from astrologer_sessions where host_id = auth.uid()
    )
  );

create policy "session_recordings_delete"
  on storage.objects for delete
  using (
    bucket_id = 'session-recordings'
    and (storage.foldername(name))[1] in (
      select id::text from astrologer_sessions where host_id = auth.uid()
    )
  );
