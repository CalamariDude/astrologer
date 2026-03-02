/**
 * useSession — Central session orchestration hook
 *
 * Manages the lifecycle of a live session: creating the session, joining Daily.co,
 * recording audio + events, broadcasting state to guests, and ending/processing.
 *
 * Supports:
 * - Host reconnect on page refresh (session info persisted in sessionStorage)
 * - Multiple guests in the call
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AudioRecorder } from '@/lib/session/AudioRecorder';
import { EventRecorder } from '@/lib/session/EventRecorder';
import { BroadcastManager } from '@/lib/session/BroadcastManager';
import type { SessionRecord, SessionChartSnapshot, ChartStateSnapshot, SessionEventType } from '@/lib/session/types';
import { toast } from 'sonner';

const SESSION_STORAGE_KEY = 'astrologer_active_session';

interface PersistedSession {
  sessionId: string;
  roomUrl: string;
  hostToken: string;
  startedAt: number; // epoch ms
}

export interface RemoteParticipant {
  id: string;
  name: string;
  videoStream: MediaStream | null;
  audioStream: MediaStream | null;
  hasAudio: boolean;
}

export interface MediaDeviceInfo {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'videoinput' | 'audiooutput';
}

interface UseSessionReturn {
  // State
  session: SessionRecord | null;
  isSessionActive: boolean;
  isSessionEnded: boolean; // true after session ends, until dismissed
  isSessionInOtherWindow: boolean; // active session exists but is owned by another tab
  isRecording: boolean;
  sessionDuration: number; // seconds
  guestConnected: boolean; // true if any guest is connected
  guestCount: number;
  shareUrl: string;
  replayUrl: string;
  isMuted: boolean;
  isVideoOff: boolean;
  localVideoStream: MediaStream | null;
  remoteParticipants: RemoteParticipant[];
  reconnecting: boolean;
  activeSpeakerId: string | null;

  // Device selection
  audioDevices: MediaDeviceInfo[];
  videoDevices: MediaDeviceInfo[];
  currentAudioDeviceId: string;
  currentVideoDeviceId: string;
  switchAudioDevice: (deviceId: string) => Promise<void>;
  switchVideoDevice: (deviceId: string) => Promise<void>;
  refreshDevices: () => Promise<void>;

  // Actions
  startSession: (title: string, chartSnapshot: SessionChartSnapshot, getSnapshot: () => ChartStateSnapshot) => Promise<string>;
  endSession: () => Promise<void>;
  dismissSession: () => void;
  takeOverSession: () => Promise<void>; // take over from another window
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => void;
  copyShareLink: () => void;

  // Recording callbacks
  recordStateChange: (type: SessionEventType, payload: Record<string, any>) => void;
  recordCursor: (x: number, y: number) => void;
  setSnapshotGetter: (getter: () => ChartStateSnapshot) => void;

  // Bidirectional callbacks from guests
  onRemoteViewMode: (cb: (mode: 'chart' | 'video') => void) => void;
}

export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  const [reconnecting, setReconnecting] = useState(false);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentAudioDeviceId, setCurrentAudioDeviceId] = useState('');
  const [currentVideoDeviceId, setCurrentVideoDeviceId] = useState('');
  const [otherWindowSession, setOtherWindowSession] = useState<{
    sessionId: string;
    title: string;
    shareToken: string;
  } | null>(null);

  // Map of remote participant id → HTMLAudioElement for playing remote audio
  const remoteAudioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Stored credentials from reconnect endpoint (used by takeOverSession)
  const pendingReconnectRef = useRef<{
    sessionId: string;
    sessionData: SessionRecord;
    roomUrl: string;
    hostToken: string;
    startedAt: number;
  } | null>(null);

  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const eventRecorderRef = useRef<EventRecorder | null>(null);
  const broadcastRef = useRef<BroadcastManager | null>(null);
  const dailyRef = useRef<any>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef(0);
  const snapshotGetterRef = useRef<(() => ChartStateSnapshot) | null>(null);
  const remoteViewModeCallbackRef = useRef<((mode: 'chart' | 'video') => void) | null>(null);
  const sessionStartEpochRef = useRef(0); // epoch ms when session started
  const endSessionRef = useRef<() => Promise<void>>();
  const endingRef = useRef(false);

  const isSessionActive = !!session && ['created', 'live', 'paused'].includes(session.status);
  const isSessionEnded = !!session && ['ended', 'processing', 'ready'].includes(session.status);
  const isSessionInOtherWindow = !!otherWindowSession && !isSessionActive;
  const shareUrl = session ? `${window.location.origin}/session/${session.share_token}` : '';
  const replayUrl = session ? `${window.location.origin}/session/${session.share_token}` : '';
  const guestConnected = remoteParticipants.length > 0;
  const guestCount = remoteParticipants.length;

  // ── Persist / restore session info ────────────────────────
  const persistSession = (data: PersistedSession) => {
    try { sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data)); } catch {}
  };

  const clearPersistedSession = () => {
    try { sessionStorage.removeItem(SESSION_STORAGE_KEY); } catch {}
  };

  const getPersistedSession = (): PersistedSession | null => {
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  // ── Duration timer ────────────────────────────────────────
  useEffect(() => {
    if (isRecording) {
      durationTimerRef.current = setInterval(() => {
        durationRef.current += 1;
        setSessionDuration((d) => d + 1);
      }, 1000);
    }
    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    };
  }, [isRecording]);

  // ── Setup Daily.co event handlers ─────────────────────────
  const setupDailyHandlers = useCallback((callObject: any) => {
    callObject.on('track-started', (event: any) => {
      const pid = event.participant?.session_id;
      if (event.participant?.local) {
        if (event.track?.kind === 'video') {
          setLocalVideoStream(new MediaStream([event.track]));
        }
        return;
      }
      // Remote participant
      if (event.track?.kind === 'audio' && pid) {
        audioRecorderRef.current?.addRemoteTrack(pid, event.track);

        // Play remote audio through an <audio> element (createCallObject doesn't auto-play remote audio)
        const audioStream = new MediaStream([event.track]);
        const existingEl = remoteAudioElementsRef.current.get(pid);
        if (existingEl) {
          existingEl.srcObject = audioStream;
        } else {
          const audioEl = document.createElement('audio');
          audioEl.srcObject = audioStream;
          audioEl.autoplay = true;
          audioEl.playsInline = true;
          // Append to DOM so browser plays it
          audioEl.style.display = 'none';
          document.body.appendChild(audioEl);
          audioEl.play().catch(() => {});
          remoteAudioElementsRef.current.set(pid, audioEl);
        }

        setRemoteParticipants((prev) => {
          const existing = prev.find((p) => p.id === pid);
          if (existing) return prev.map((p) => p.id === pid ? { ...p, hasAudio: true, audioStream } : p);
          // New participant
          toast.success(`${event.participant?.user_name || 'Guest'} joined`);
          try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.value = 880;
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.start(); osc.stop(ctx.currentTime + 0.3);
          } catch {}
          return [...prev, { id: pid, name: event.participant?.user_name || 'Guest', videoStream: null, audioStream, hasAudio: true }];
        });
      }
      if (event.track?.kind === 'video' && pid) {
        setRemoteParticipants((prev) =>
          prev.map((p) => p.id === pid ? { ...p, videoStream: new MediaStream([event.track]) } : p)
        );
      }
    });

    callObject.on('track-stopped', (event: any) => {
      const pid = event.participant?.session_id;
      if (event.participant?.local || !pid) return;
      if (event.track?.kind === 'audio') {
        audioRecorderRef.current?.removeRemoteTrack(pid);
        // Remove audio element
        const audioEl = remoteAudioElementsRef.current.get(pid);
        if (audioEl) {
          audioEl.srcObject = null;
          audioEl.remove();
          remoteAudioElementsRef.current.delete(pid);
        }
        setRemoteParticipants((prev) =>
          prev.map((p) => p.id === pid ? { ...p, hasAudio: false, audioStream: null } : p)
        );
      }
      if (event.track?.kind === 'video') {
        setRemoteParticipants((prev) =>
          prev.map((p) => p.id === pid ? { ...p, videoStream: null } : p)
        );
      }
    });

    callObject.on('participant-left', (event: any) => {
      const pid = event.participant?.session_id;
      if (!pid) return;
      audioRecorderRef.current?.removeRemoteTrack(pid);
      // Cleanup audio element
      const audioEl = remoteAudioElementsRef.current.get(pid);
      if (audioEl) {
        audioEl.srcObject = null;
        audioEl.remove();
        remoteAudioElementsRef.current.delete(pid);
      }
      setRemoteParticipants((prev) => prev.filter((p) => p.id !== pid));
    });

    callObject.on('participant-joined', (event: any) => {
      const pid = event.participant?.session_id;
      if (event.participant?.local || !pid) return;
      // Pre-create entry (tracks arrive via track-started)
      setRemoteParticipants((prev) => {
        if (prev.find((p) => p.id === pid)) return prev;
        return [...prev, { id: pid, name: event.participant?.user_name || 'Guest', videoStream: null, audioStream: null, hasAudio: false }];
      });
      // Send current chart state to the new participant so they don't start with stale DB snapshot
      const currentState = snapshotGetterRef.current?.();
      if (currentState && broadcastRef.current) {
        console.log('[Session] Sending current state to new participant:', pid);
        broadcastRef.current.broadcastStateChange('state_snapshot' as any, currentState);
      }
    });

    // When the local user leaves the call (or gets disconnected), end the session
    callObject.on('left-meeting', () => {
      endSessionRef.current?.();
    });

    // Active speaker indicator (Zoom-style green border)
    callObject.on('active-speaker-change', (event: any) => {
      setActiveSpeakerId(event.activeSpeaker?.peerId || null);
    });
  }, []);

  // ── Start heartbeat ───────────────────────────────────────
  const startHeartbeat = useCallback((sessionId: string) => {
    if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    heartbeatTimerRef.current = setInterval(async () => {
      await supabase
        .from('astrologer_sessions')
        .update({ host_last_heartbeat: new Date().toISOString() })
        .eq('id', sessionId);
    }, 15_000);
  }, []);

  // (Snapshot broadcast is now driven by BiWheelMobileWrapper's onChange — no timer needed)

  // ── Start session (fresh) ─────────────────────────────────
  const startSession = useCallback(async (
    title: string,
    chartSnapshot: SessionChartSnapshot,
    getSnapshot: () => ChartStateSnapshot
  ): Promise<string> => {
    // If a session appears active locally, clean it up first (server auto-ends old sessions)
    if (isSessionActive) {
      try { await dailyRef.current?.leave(); } catch {}
      try { dailyRef.current?.destroy(); } catch {}
      dailyRef.current = null;
      await audioRecorderRef.current?.stop();
      await eventRecorderRef.current?.stop();
      broadcastRef.current?.destroy();
      broadcastRef.current = null;
      setCallActive(false);
      setIsRecording(false);
    }

    // Clear stale state
    setOtherWindowSession(null);
    pendingReconnectRef.current = null;
    clearPersistedSession();

    snapshotGetterRef.current = getSnapshot;

    // Explicitly pass auth header — supabase-js may not auto-attach it in all cases
    const { data: { session: authSession } } = await supabase.auth.getSession();
    if (!authSession?.access_token) {
      throw new Error('Not authenticated — please log in and try again');
    }

    const { data, error } = await supabase.functions.invoke('astrologer-session-create', {
      body: { title, chart_snapshot: chartSnapshot },
      headers: { Authorization: `Bearer ${authSession.access_token}` },
    });

    if (error || !data) {
      throw new Error(data?.error || error?.message || 'Failed to create session');
    }

    const { session_id, share_token, room_url, host_token } = data;

    // Fetch full session record
    const { data: sessionData } = await supabase
      .from('astrologer_sessions')
      .select('*')
      .eq('id', session_id)
      .single();

    if (sessionData) setSession(sessionData as SessionRecord);

    // Persist for reconnect
    const startedAt = Date.now();
    sessionStartEpochRef.current = startedAt;
    persistSession({ sessionId: session_id, roomUrl: room_url, hostToken: host_token, startedAt });

    // Enumerate available audio devices and log them
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter((d) => d.kind === 'audioinput');
      if (audioInputs.length === 0) {
        toast.error('No microphone found — check your system audio settings');
      }
    } catch (enumErr) {
      // Device enumeration failed — non-critical
    }

    // Pre-check microphone access — ensures browser has granted permission
    try {
      const preCheckStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioTrack = preCheckStream.getAudioTracks()[0];
      // Release immediately so Daily.co can claim the mic
      preCheckStream.getTracks().forEach((t) => t.stop());
    } catch (micErr) {
      toast.error('Microphone access denied — check browser permissions and try again');
    }

    // Join Daily.co
    const DailyIframe = (await import('@daily-co/daily-js')).default;
    const callObject = DailyIframe.createCallObject({ audioSource: true, videoSource: true });
    dailyRef.current = callObject;
    setupDailyHandlers(callObject);

    // Log device errors from Daily
    callObject.on('error', (e: any) => console.error('[Daily] Error:', e));
    callObject.on('camera-error', (e: any) => console.error('[Daily] Camera/mic error:', e));

    await callObject.join({ url: room_url, token: host_token });
    setCallActive(true);

    // Enumerate available devices now that we're in a call
    refreshDevices();

    // Start audio recording — track may not be available immediately after join
    const startAudioRecording = async (track: MediaStreamTrack) => {
      const audioRecorder = new AudioRecorder();
      audioRecorderRef.current = audioRecorder;
      await audioRecorder.start(session_id, new MediaStream([track]));
    };

    const localTracks = callObject.participants()?.local?.tracks;
    const localAudioTrack = localTracks?.audio?.persistentTrack;
    if (localAudioTrack && localAudioTrack.readyState === 'live') {
      await startAudioRecording(localAudioTrack);
    } else {
      // Wait for local audio track via track-started event
      const trackWaitTimeout = setTimeout(() => {
        if (!audioRecorderRef.current) {
          toast.warning('No microphone detected — session will not have audio recording');
        }
      }, 10000);

      callObject.on('track-started', async (event: any) => {
        if (event.participant?.local && event.track?.kind === 'audio' && !audioRecorderRef.current) {
          clearTimeout(trackWaitTimeout);
          await startAudioRecording(event.track);
        }
      });
    }

    // Start event recording
    const eventRecorder = new EventRecorder();
    eventRecorderRef.current = eventRecorder;
    eventRecorder.start(session_id, () => snapshotGetterRef.current?.() ?? chartSnapshot.initialState);

    // Start broadcast (uses Daily.co sendAppMessage)
    const broadcast = new BroadcastManager();
    broadcastRef.current = broadcast;
    broadcast.createHostChannel(session_id, callObject, {
      onStateChange: (type, payload) => {
        if (type === 'view_mode') {
          remoteViewModeCallbackRef.current?.(payload.mode);
        }
      },
    });

    // Update status
    await supabase
      .from('astrologer_sessions')
      .update({ status: 'live', started_at: new Date().toISOString() })
      .eq('id', session_id);

    startHeartbeat(session_id);
    setIsRecording(true);
    setSessionDuration(0);
    durationRef.current = 0;
    setSession((s) => s ? { ...s, status: 'live', started_at: new Date().toISOString() } : s);
    broadcast.broadcastStatus('live');

    return `${window.location.origin}/session/${share_token}`;
  }, [setupDailyHandlers, startHeartbeat]);

  // ── Reconnect to active session ──────────────────────────
  // Accepts session data + Daily.co credentials (from sessionStorage or reconnect endpoint)
  const reconnectToSession = useCallback(async (opts: {
    sessionId: string;
    sessionData: SessionRecord;
    roomUrl: string;
    hostToken: string;
    startedAt: number; // epoch ms
  }) => {
    const { sessionId, sessionData, roomUrl, hostToken, startedAt } = opts;

    setSession(sessionData);

    // Calculate elapsed duration
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    durationRef.current = elapsed;
    setSessionDuration(elapsed);
    sessionStartEpochRef.current = startedAt;

    // Persist for fast reconnect on same-tab refresh
    persistSession({ sessionId, roomUrl, hostToken, startedAt });

    // Rejoin Daily.co
    const DailyIframe = (await import('@daily-co/daily-js')).default;

    // Destroy any stale call object first
    if (dailyRef.current) {
      try { await dailyRef.current.leave(); } catch {}
      try { dailyRef.current.destroy(); } catch {}
      dailyRef.current = null;
    }

    const callObject = DailyIframe.createCallObject({ audioSource: true, videoSource: true });
    dailyRef.current = callObject;
    setupDailyHandlers(callObject);

    // Log Daily errors during reconnect
    callObject.on('error', (e: any) => console.error('[Session] Reconnect Daily error:', e));
    callObject.on('camera-error', (e: any) => console.error('[Session] Reconnect camera/mic error:', e));

    try {
      await callObject.join({ url: roomUrl, token: hostToken });
      setCallActive(true);
      refreshDevices();
    } catch (joinErr) {
      // Token may be expired — try getting a fresh one from the reconnect endpoint
      try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        if (authSession?.access_token) {
          const { data: reconnectData } = await supabase.functions.invoke('astrologer-session-reconnect', {
            headers: { Authorization: `Bearer ${authSession.access_token}` },
          });
          if (reconnectData?.active && reconnectData.host_token) {
            persistSession({ sessionId, roomUrl, hostToken: reconnectData.host_token, startedAt });
            await callObject.join({ url: roomUrl, token: reconnectData.host_token });
            setCallActive(true);
            refreshDevices();
          } else {
            throw new Error('Could not get fresh token');
          }
        }
      } catch (retryErr) {
        toast.error('Could not rejoin the call — the room may have expired');
        return;
      }
    }

    // Restart audio recording (new recorder, continue chunk index from DB)
    const startReconnectAudio = async (track: MediaStreamTrack) => {
      const { count } = await supabase
        .from('session_audio_chunks')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);

      const audioRecorder = new AudioRecorder();
      audioRecorderRef.current = audioRecorder;
      await audioRecorder.startWithExistingChunks(
        sessionId,
        new MediaStream([track]),
        (count ?? 0)
      );
    };

    const localTracks = callObject.participants()?.local?.tracks;
    const localAudioTrack = localTracks?.audio?.persistentTrack;
    if (localAudioTrack && localAudioTrack.readyState === 'live') {
      await startReconnectAudio(localAudioTrack);
    } else {
      callObject.on('track-started', async (event: any) => {
        if (event.participant?.local && event.track?.kind === 'audio' && !audioRecorderRef.current) {
          await startReconnectAudio(event.track);
        }
      });
    }

    // Restart event recording
    const eventRecorder = new EventRecorder();
    eventRecorderRef.current = eventRecorder;
    const initialState = sessionData.chart_snapshot?.initialState;
    eventRecorder.start(
      sessionId,
      () => snapshotGetterRef.current?.() ?? initialState ?? {} as ChartStateSnapshot
    );

    // Restart broadcast (uses Daily.co sendAppMessage)
    const broadcast = new BroadcastManager();
    broadcastRef.current = broadcast;
    broadcast.createHostChannel(sessionId, callObject, {
      onStateChange: (type, payload) => {
        if (type === 'view_mode') {
          remoteViewModeCallbackRef.current?.(payload.mode);
        }
      },
    });

    // Resume status
    if (sessionData.status !== 'live') {
      await supabase
        .from('astrologer_sessions')
        .update({ status: 'live', paused_at: null })
        .eq('id', sessionId);
      setSession((s) => s ? { ...s, status: 'live' } : s);
    }

    startHeartbeat(sessionId);
    setIsRecording(true);
    broadcast.broadcastStatus('live');
    toast.success('Reconnected to active session');
  }, [setupDailyHandlers, startHeartbeat]);

  // ── Auto-reconnect on mount ───────────────────────────────
  // 1. sessionStorage exists → this tab had the session, get fresh token + auto-reconnect
  // 2. No sessionStorage → check DB for active session, show "other window" banner
  useEffect(() => {
    let cancelled = false;

    const getFreshTokenAndReconnect = async (sessionId?: string): Promise<boolean> => {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token || cancelled) return false;

      const { data, error } = await supabase.functions.invoke('astrologer-session-reconnect', {
        headers: { Authorization: `Bearer ${authSession.access_token}` },
      });

      if (cancelled) return false;

      if (error || !data?.active) return false;

      // If a specific session was expected, verify it matches
      if (sessionId && data.session_id !== sessionId) return false;

      const startedAt = data.started_at ? new Date(data.started_at).getTime() : Date.now();
      await reconnectToSession({
        sessionId: data.session_id,
        sessionData: data.session as SessionRecord,
        roomUrl: data.room_url,
        hostToken: data.host_token,
        startedAt,
      });
      return true;
    };

    const tryReconnect = async () => {
      setReconnecting(true);

      const hadSessionStorage = !!getPersistedSession();
      const persisted = getPersistedSession();

      if (persisted) {

        // Verify session is still active in DB
        const { data: sessionData } = await supabase
          .from('astrologer_sessions')
          .select('*')
          .eq('id', persisted.sessionId)
          .single();

        if (cancelled) return;

        if (!sessionData || !['created', 'live', 'paused'].includes(sessionData.status)) {
          clearPersistedSession();
          if (!cancelled) setReconnecting(false);
          return;
        }

        // Session is active — try reconnecting with stored token first, fall back to fresh token
        try {
          await reconnectToSession({
            sessionId: persisted.sessionId,
            sessionData: sessionData as SessionRecord,
            roomUrl: persisted.roomUrl,
            hostToken: persisted.hostToken,
            startedAt: persisted.startedAt,
          });
          if (!cancelled) setReconnecting(false);
          return;
        } catch (err) {
          clearPersistedSession();
        }

        // Stored token failed (expired?) — get a fresh one and auto-reconnect
        try {
          const ok = await getFreshTokenAndReconnect(persisted.sessionId);
          if (ok) {
            if (!cancelled) setReconnecting(false);
            return;
          }
        } catch (err) {
          // Fresh token reconnect failed
        }

        if (!cancelled) {
          setReconnecting(false);
          toast.error('Could not reconnect to session — the call may have expired');
        }
        return;
      }

      // No sessionStorage — check DB for active session and auto-reconnect
      try {
        await getFreshTokenAndReconnect();
      } catch (err) {
        toast.error('Could not reconnect to session');
      } finally {
        if (!cancelled) setReconnecting(false);
      }
    };

    // Small delay to avoid React StrictMode double-invocation race condition
    // (StrictMode mounts → unmounts → remounts; the delay lets the first cleanup run first)
    const timer = setTimeout(() => tryReconnect(), 100);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── End session ───────────────────────────────────────────
  const endSession = useCallback(async () => {
    if (!session || endingRef.current) return;
    endingRef.current = true;

    broadcastRef.current?.broadcastStatus('ended');
    setIsRecording(false);
    await audioRecorderRef.current?.stop();
    await eventRecorderRef.current?.stop();

    try { await dailyRef.current?.leave(); } catch {}
    try { dailyRef.current?.destroy(); } catch {}
    dailyRef.current = null;
    setCallActive(false);
    setLocalVideoStream(null);
    setRemoteParticipants([]);

    // Cleanup remote audio elements
    for (const [, audioEl] of remoteAudioElementsRef.current) {
      audioEl.srcObject = null;
      audioEl.remove();
    }
    remoteAudioElementsRef.current.clear();

    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }

    broadcastRef.current?.destroy();
    broadcastRef.current = null;
    clearPersistedSession();

    await supabase
      .from('astrologer_sessions')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        total_duration_ms: durationRef.current * 1000,
      })
      .eq('id', session.id);

    supabase.functions.invoke('astrologer-session-process', {
      body: { session_id: session.id },
    }).catch(console.error);

    setSession((s) => s ? { ...s, status: 'ended' } : null);
    endingRef.current = false;
  }, [session]);

  const dismissSession = useCallback(() => {
    setSession(null);
    setOtherWindowSession(null);
    pendingReconnectRef.current = null;
    endingRef.current = false;
  }, []);

  // Take over the session from another window
  const takeOverSession = useCallback(async () => {
    const pending = pendingReconnectRef.current;
    if (!pending) return;

    setReconnecting(true);
    setOtherWindowSession(null);
    try {
      await reconnectToSession(pending);
      pendingReconnectRef.current = null;
    } catch (err) {
      console.error('Take over failed:', err);
      toast.error('Failed to take over session');
    } finally {
      setReconnecting(false);
    }
  }, [reconnectToSession]);

  // Keep endSessionRef in sync so Daily.co left-meeting handler can call it
  endSessionRef.current = endSession;

  // ── Pause / Resume ────────────────────────────────────────
  const pauseSession = useCallback(async () => {
    if (!session) return;
    broadcastRef.current?.broadcastStatus('paused');
    await supabase
      .from('astrologer_sessions')
      .update({ status: 'paused', paused_at: new Date().toISOString() })
      .eq('id', session.id);
    setSession((s) => s ? { ...s, status: 'paused' } : s);
    setIsRecording(false);
    audioRecorderRef.current?.pause();
    eventRecorderRef.current?.pause();
  }, [session]);

  const resumeSession = useCallback(async () => {
    if (!session) return;
    broadcastRef.current?.broadcastStatus('live');
    await supabase
      .from('astrologer_sessions')
      .update({ status: 'live', paused_at: null })
      .eq('id', session.id);
    setSession((s) => s ? { ...s, status: 'live' } : s);
    setIsRecording(true);
    audioRecorderRef.current?.resume();
    eventRecorderRef.current?.resume();
  }, [session]);

  // ── Mute / Video ──────────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (dailyRef.current) {
      const newMuted = !isMuted;
      dailyRef.current.setLocalAudio(!newMuted);
      setIsMuted(newMuted);
    }
  }, [isMuted]);

  const toggleVideo = useCallback(() => {
    if (dailyRef.current) {
      const newOff = !isVideoOff;
      dailyRef.current.setLocalVideo(!newOff);
      setIsVideoOff(newOff);
    }
  }, [isVideoOff]);

  // endCall removed — ending the Daily.co call now ends the session via left-meeting handler

  // ── Device enumeration + switching ─────────────────────────
  const refreshDevices = useCallback(async () => {
    if (!dailyRef.current) return;
    try {
      const { devices } = await dailyRef.current.enumerateDevices();
      const audioInputs = (devices || [])
        .filter((d: any) => d.kind === 'audioinput' && d.deviceId)
        .map((d: any) => ({ deviceId: d.deviceId, label: d.label || `Mic ${d.deviceId.slice(0, 4)}`, kind: 'audioinput' as const }));
      const videoInputs = (devices || [])
        .filter((d: any) => d.kind === 'videoinput' && d.deviceId)
        .map((d: any) => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 4)}`, kind: 'videoinput' as const }));
      setAudioDevices(audioInputs);
      setVideoDevices(videoInputs);

      // Set current device IDs from Daily.co
      const currentInputs = dailyRef.current.getInputDevices?.();
      if (currentInputs) {
        // getInputDevices is synchronous and returns { camera, mic, speaker }
        if (currentInputs.mic?.deviceId) setCurrentAudioDeviceId(currentInputs.mic.deviceId);
        if (currentInputs.camera?.deviceId) setCurrentVideoDeviceId(currentInputs.camera.deviceId);
      }
    } catch (err) {
      console.error('[Session] Device enumeration failed:', err);
    }
  }, []);

  const switchAudioDevice = useCallback(async (deviceId: string) => {
    if (!dailyRef.current) return;
    try {
      await dailyRef.current.setInputDevicesAsync({ audioDeviceId: deviceId });
      setCurrentAudioDeviceId(deviceId);
    } catch (err) {
      console.error('[Session] Failed to switch audio device:', err);
      toast.error('Failed to switch microphone');
    }
  }, []);

  const switchVideoDevice = useCallback(async (deviceId: string) => {
    if (!dailyRef.current) return;
    try {
      await dailyRef.current.setInputDevicesAsync({ videoDeviceId: deviceId });
      setCurrentVideoDeviceId(deviceId);
    } catch (err) {
      console.error('[Session] Failed to switch video device:', err);
      toast.error('Failed to switch camera');
    }
  }, []);

  // ── Copy share link ────────────────────────────────────────
  const copyShareLink = useCallback(() => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success('Session link copied!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  }, [shareUrl]);

  // ── Recording callbacks ───────────────────────────────────
  const recordStateChange = useCallback((type: SessionEventType, payload: Record<string, any>) => {
    console.log('[Session] recordStateChange:', type, 'hasBroadcast:', !!broadcastRef.current, 'planets:', (payload as any).visiblePlanets?.length, 'asteroids:', (payload as any).enabledAsteroidGroups?.length);
    eventRecorderRef.current?.record(type, payload);
    broadcastRef.current?.broadcastStateChange(type, payload);
  }, []);

  const recordCursor = useCallback((x: number, y: number) => {
    eventRecorderRef.current?.recordCursor(x, y);
    broadcastRef.current?.broadcastCursor(x, y);
  }, []);

  // ── Beforeunload warning ──────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (session && ['created', 'live', 'paused'].includes(session.status)) {
        // Flush events before leaving
        eventRecorderRef.current?.flush();
        e.preventDefault();
        e.returnValue = 'You have an active session. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [session]);

  // ── Cleanup on unmount ────────────────────────────────────
  useEffect(() => {
    return () => {
      audioRecorderRef.current?.stop();
      eventRecorderRef.current?.stop();
      broadcastRef.current?.destroy();
      try { dailyRef.current?.destroy(); } catch {}
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      // Cleanup remote audio elements
      for (const [, audioEl] of remoteAudioElementsRef.current) {
        audioEl.srcObject = null;
        audioEl.remove();
      }
      remoteAudioElementsRef.current.clear();
    };
  }, []);

  return {
    session,
    isSessionActive,
    isSessionEnded,
    isSessionInOtherWindow,
    isRecording,
    sessionDuration,
    guestConnected,
    guestCount,
    shareUrl,
    replayUrl,
    isMuted,
    isVideoOff,
    localVideoStream,
    remoteParticipants,
    reconnecting,
    activeSpeakerId,
    audioDevices,
    videoDevices,
    currentAudioDeviceId,
    currentVideoDeviceId,
    switchAudioDevice,
    switchVideoDevice,
    refreshDevices,
    startSession,
    endSession,
    dismissSession,
    takeOverSession,
    pauseSession,
    resumeSession,
    toggleMute,
    toggleVideo,
    copyShareLink,
    recordStateChange,
    recordCursor,
    setSnapshotGetter: useCallback((getter: () => ChartStateSnapshot) => {
      snapshotGetterRef.current = getter;
    }, []),
    onRemoteViewMode: useCallback((cb: (mode: 'chart' | 'video') => void) => {
      remoteViewModeCallbackRef.current = cb;
    }, []),
  };
}
