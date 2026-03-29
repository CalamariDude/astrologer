// ── Session Types ──────────────────────────────────────────

export type SessionStatus = 'created' | 'live' | 'paused' | 'ended' | 'processing' | 'ready' | 'failed';
export type AudioStatus = 'none' | 'recording' | 'uploading' | 'merging' | 'transcribing' | 'summarizing' | 'ready' | 'failed';

export type SessionEventType =
  | 'cursor'
  | 'chart_mode'
  | 'visible_planets'
  | 'visible_aspects'
  | 'tab_switch'
  | 'theme_change'
  | 'transit_toggle'
  | 'transit_date'
  | 'progressed'
  | 'relocated'
  | 'zoom_pan'
  | 'asteroid_group'
  | 'show_houses'
  | 'show_degrees'
  | 'solar_arc'
  | 'galactic_toggle'
  | 'wheel_rotation'
  | 'state_snapshot'
  | 'chart_swap'
  | 'view_mode'
  | 'custom';

export interface SessionEvent {
  id?: number;
  session_id: string;
  timestamp_ms: number;
  event_type: SessionEventType;
  payload: Record<string, any>;
}

export interface CursorPayload {
  x: number; // normalized 0-1
  y: number; // normalized 0-1
}

export interface ChartStateSnapshot {
  chartMode: string;
  visiblePlanets: string[];
  visibleAspects: string[];
  showHouses: boolean;
  showDegreeMarkers: boolean;
  showTransits: boolean;
  transitDate?: string;
  transitTime?: string;
  showProgressed?: boolean;
  progressedPerson: string | null;
  progressedDate?: string;
  showSolarArc: boolean;
  showRelocated?: boolean;
  relocatedPerson: string | null;
  relocatedLocationA?: { lat: number; lng: number; name: string } | null;
  relocatedLocationB?: { lat: number; lng: number; name: string } | null;
  enabledAsteroidGroups: string[];
  chartTheme: string;
  rotateToAscendant: boolean;
  zodiacVantage: number | null;
  straightAspects?: boolean;
  showEffects?: boolean;
  showRetrogrades?: boolean;
  showDecans?: boolean;
  degreeSymbolMode?: 'sign' | 'degree';
  enabledFixedStarGroups?: string[];
  showBirthTimeShift?: boolean;
  timeShiftA?: number;
  timeShiftB?: number;
  houseSystem?: string;
  harmonicNumber?: number;
  scale?: number;
  translateX?: number;
  translateY?: number;
}

export interface SessionChartSnapshot {
  chartA: Record<string, any>;
  chartB?: Record<string, any>;
  nameA: string;
  nameB?: string;
  birthDataA?: {
    name: string;
    date: string;
    time: string;
    location: string;
    lat: number;
    lng: number;
  };
  birthDataB?: {
    name: string;
    date: string;
    time: string;
    location: string;
    lat: number;
    lng: number;
  };
  theme: string;
  mode: string;
  initialState: ChartStateSnapshot;
}

export interface Chapter {
  title: string;
  timestamp_ms: number;
  description: string;
}

export interface Utterance {
  start_ms: number;
  end_ms: number;
  speaker: number;
  text: string;
}

export interface SessionRecord {
  id: string;
  host_id: string;
  saved_chart_id: string | null;
  title: string;
  status: SessionStatus;
  share_token: string;
  chart_snapshot: SessionChartSnapshot;
  daily_room_name: string | null;
  daily_room_url: string | null;
  started_at: string | null;
  paused_at: string | null;
  ended_at: string | null;
  total_duration_ms: number;
  audio_status: AudioStatus;
  audio_storage_path: string | null;
  audio_duration_ms: number | null;
  transcript: string | null;
  utterances: Utterance[];
  summary: string | null;
  chapters: Chapter[];
  guest_joined_at: string | null;
  guest_display_name: string | null;
  guest_email: string | null;
  host_display_name: string | null;
  host_last_heartbeat: string | null;
  created_at: string;
  updated_at: string;
}
