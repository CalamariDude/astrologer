-- Re-create storage policies for session-recordings bucket
-- Need INSERT, UPDATE (for upsert), SELECT, and DELETE

drop policy if exists "session_recordings_insert" on storage.objects;
drop policy if exists "session_recordings_update" on storage.objects;
drop policy if exists "session_recordings_select" on storage.objects;
drop policy if exists "session_recordings_delete" on storage.objects;

create policy "session_recordings_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'session-recordings'
    and (storage.foldername(name))[1] in (
      select id::text from astrologer_sessions where host_id = auth.uid()
    )
  );

create policy "session_recordings_update"
  on storage.objects for update
  using (
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
