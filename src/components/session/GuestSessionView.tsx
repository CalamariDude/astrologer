/**
 * GuestSessionView — Live view for session guests
 *
 * Shows a name prompt, joins Daily.co audio+video, subscribes to Supabase Realtime
 * broadcast for chart state + cursor, renders the chart in read-only mode.
 * Supports multiple participants in the call.
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Video, VideoOff, Loader2, User, LayoutGrid, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { BroadcastManager } from '@/lib/session/BroadcastManager';
import { RemoteCursor } from './RemoteCursor';
import { VideoFeed } from './VideoFeed';
import { VideoGallery } from './VideoGallery';
import { BiWheelMobileWrapper } from '@/components/biwheel';
import type { SessionRecord, SessionStatus, SessionEventType, CursorPayload } from '@/lib/session/types';
import type { TransitData, CompositeData, ProgressedData, RelocatedData, AsteroidsParam } from '@/components/biwheel/types';
import { THEME_SWATCHES } from '@/components/biwheel/utils/themes';
import type { ThemeName } from '@/components/biwheel/utils/themes';
import { swissEphemeris } from '@/api/swissEphemeris';
import { toast } from 'sonner';

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

interface GuestSessionViewProps {
  session: SessionRecord;
}

interface RemoteParticipant {
  id: string;
  name: string;
  videoStream: MediaStream | null;
}

export const GuestSessionView: React.FC<GuestSessionViewProps> = ({ session }) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [hostStatus, setHostStatus] = useState<SessionStatus>(session.status);
  const [cursor, setCursor] = useState<CursorPayload>({ x: 0, y: 0 });
  const [externalState, setExternalState] = useState<Record<string, any>>(
    session.chart_snapshot?.initialState || {}
  );
  const [lastHeartbeat, setLastHeartbeat] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  const [viewMode, setViewMode] = useState<'chart' | 'video'>('chart');

  // Mutable chart data — updated when host swaps charts mid-session
  const [liveChartA, setLiveChartA] = useState<Record<string, any>>(session.chart_snapshot?.chartA);
  const [liveChartB, setLiveChartB] = useState<Record<string, any> | undefined>(session.chart_snapshot?.chartB);
  const [liveNameA, setLiveNameA] = useState(session.chart_snapshot?.nameA || 'Person A');
  const [liveNameB, setLiveNameB] = useState(session.chart_snapshot?.nameB);
  const [liveBirthA, setLiveBirthA] = useState(session.chart_snapshot?.birthDataA);
  const [liveBirthB, setLiveBirthB] = useState(session.chart_snapshot?.birthDataB);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);

  // Pre-join camera preview
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [previewMuted, setPreviewMuted] = useState(false);
  const [previewVideoOff, setPreviewVideoOff] = useState(false);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  const dailyRef = useRef<any>(null);
  const broadcastRef = useRef<BroadcastManager | null>(null);

  const hostDisconnected = now - lastHeartbeat > 30_000;

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(timer);
  }, []);

  // Request camera/mic for pre-join preview
  useEffect(() => {
    if (joined) return;
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        setPreviewStream(stream);
      } catch {
        // Permission denied — that's fine, guest will join without preview
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [joined]);

  // Attach preview stream to video element
  useEffect(() => {
    if (previewVideoRef.current && previewStream) {
      previewVideoRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  // Toggle preview mic
  const togglePreviewMic = useCallback(() => {
    if (previewStream) {
      previewStream.getAudioTracks().forEach(t => { t.enabled = previewMuted; });
      setPreviewMuted(!previewMuted);
    }
  }, [previewStream, previewMuted]);

  // Toggle preview camera
  const togglePreviewVideo = useCallback(() => {
    if (previewStream) {
      previewStream.getVideoTracks().forEach(t => { t.enabled = previewVideoOff; });
      setPreviewVideoOff(!previewVideoOff);
    }
  }, [previewStream, previewVideoOff]);

  const handleJoin = useCallback(async () => {
    if (!displayName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setJoining(true);
    try {
      const { data, error } = await supabase.functions.invoke('astrologer-session-join', {
        body: { share_token: session.share_token, display_name: displayName, email: email || undefined },
      });

      if (error || !data) {
        throw new Error(data?.error || error?.message || 'Failed to join session');
      }

      const { room_url, guest_token } = data;

      const DailyIframe = (await import('@daily-co/daily-js')).default;
      const callObject = DailyIframe.createCallObject({ audioSource: true, videoSource: true });
      dailyRef.current = callObject;

      // Handle all participant tracks
      callObject.on('track-started', (event: any) => {
        const pid = event.participant?.session_id;
        if (event.participant?.local) {
          if (event.track?.kind === 'video') {
            setLocalVideoStream(new MediaStream([event.track]));
          }
          return;
        }
        if (!pid) return;
        // Remote participant (host or other guests)
        if (event.track?.kind === 'video') {
          setRemoteParticipants((prev) => {
            const existing = prev.find((p) => p.id === pid);
            if (existing) return prev.map((p) => p.id === pid ? { ...p, videoStream: new MediaStream([event.track]) } : p);
            return [...prev, { id: pid, name: event.participant?.user_name || 'Participant', videoStream: new MediaStream([event.track]) }];
          });
        }
        if (event.track?.kind === 'audio') {
          setRemoteParticipants((prev) => {
            if (prev.find((p) => p.id === pid)) return prev;
            return [...prev, { id: pid, name: event.participant?.user_name || 'Participant', videoStream: null }];
          });
        }
      });

      callObject.on('track-stopped', (event: any) => {
        const pid = event.participant?.session_id;
        if (event.participant?.local || !pid) return;
        if (event.track?.kind === 'video') {
          setRemoteParticipants((prev) =>
            prev.map((p) => p.id === pid ? { ...p, videoStream: null } : p)
          );
        }
      });

      callObject.on('participant-joined', (event: any) => {
        const pid = event.participant?.session_id;
        if (event.participant?.local || !pid) return;
        setRemoteParticipants((prev) => {
          if (prev.find((p) => p.id === pid)) return prev;
          return [...prev, { id: pid, name: event.participant?.user_name || 'Participant', videoStream: null }];
        });
      });

      callObject.on('participant-left', (event: any) => {
        const pid = event.participant?.session_id;
        if (!pid) return;
        setRemoteParticipants((prev) => prev.filter((p) => p.id !== pid));
      });

      callObject.on('active-speaker-change', (event: any) => {
        setActiveSpeakerId(event.activeSpeaker?.peerId || null);
      });

      await callObject.join({ url: room_url, token: guest_token });

      // Join broadcast channel for live state updates
      const broadcast = new BroadcastManager();
      broadcastRef.current = broadcast;

      broadcast.joinGuestChannel(session.id, callObject, {
        onCursor: (payload) => setCursor(payload),
        onStateChange: (type: SessionEventType, payload: Record<string, any>) => {
          console.log('[Guest] Received state_change:', type, 'planets:', payload.visiblePlanets?.length, 'asteroids:', payload.enabledAsteroidGroups?.length);
          setExternalState((prev) => {
            const next = { ...prev };
            switch (type) {
              case 'chart_mode': next.chartMode = payload.mode; break;
              case 'visible_planets': next.visiblePlanets = payload.planets; break;
              case 'visible_aspects': next.visibleAspects = payload.aspects; break;
              case 'show_houses': next.showHouses = payload.show; break;
              case 'show_degrees': next.showDegreeMarkers = payload.show; break;
              case 'transit_toggle': next.showTransits = payload.show; break;
              case 'transit_date': next.transitDate = payload.date; next.transitTime = payload.time; break;
              case 'progressed': next.progressedPerson = payload.person; next.progressedDate = payload.date; next.showSolarArc = payload.solarArc; break;
              case 'theme_change': next.chartTheme = payload.theme; break;
              case 'asteroid_group': next.enabledAsteroidGroups = payload.groups; break;
              case 'zoom_pan': next.scale = payload.scale; next.translateX = payload.translateX; next.translateY = payload.translateY; break;
              case 'wheel_rotation': next.rotateToAscendant = payload.rotateToAscendant; next.zodiacVantage = payload.zodiacVantage; break;
              case 'chart_swap':
                // Host loaded a different chart — update chart data + birth data
                if (payload.chartA) setLiveChartA(payload.chartA);
                setLiveChartB(payload.chartB || undefined);
                if (payload.nameA) setLiveNameA(payload.nameA);
                setLiveNameB(payload.nameB || undefined);
                setLiveBirthA(payload.birthDataA || undefined);
                setLiveBirthB(payload.birthDataB || undefined);
                // Also update chart mode to match the new chart
                if (payload.mode) next.chartMode = payload.mode;
                break;
              case 'view_mode': setViewMode(payload.mode); return prev; // no chart state change
              case 'state_snapshot': Object.assign(next, payload); break;
            }
            return next;
          });
        },
        onSessionStatus: (status) => setHostStatus(status),
        onHeartbeat: () => setLastHeartbeat(Date.now()),
      });

      // Stop preview stream now that we've joined Daily
      if (previewStream) {
        previewStream.getTracks().forEach(t => t.stop());
        setPreviewStream(null);
      }

      setJoined(true);
    } catch (err) {
      console.error('Join failed:', err);
      toast.error((err as Error).message || 'Failed to join session');
    } finally {
      setJoining(false);
    }
  }, [displayName, email, session, previewStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      previewStream?.getTracks().forEach(t => t.stop());
      broadcastRef.current?.destroy();
      try { dailyRef.current?.leave(); } catch {}
      try { dailyRef.current?.destroy(); } catch {}
    };
  }, []);

  const toggleMute = () => {
    if (dailyRef.current) {
      dailyRef.current.setLocalAudio(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (dailyRef.current) {
      dailyRef.current.setLocalVideo(isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleSpeaker = () => {
    const newOff = !isSpeakerOff;
    setIsSpeakerOff(newOff);
    if (dailyRef.current) {
      const participants = dailyRef.current.participants();
      for (const [id] of Object.entries(participants) as any) {
        if (id !== 'local') {
          dailyRef.current.updateParticipant(id, { setAudio: !newOff });
        }
      }
    }
  };

  // ─── Fetch callbacks for chart modes (composite, transits, progressed, relocated, asteroids) ───
  // Use live birth data (updated on chart_swap) instead of static snapshot
  const birthA = liveBirthA;
  const birthB = liveBirthB;

  const handleFetchTransits = useCallback(async (
    date: string, time: string, _chartA: any, _chartB: any, asteroids?: AsteroidsParam
  ): Promise<TransitData> => {
    const body: Record<string, unknown> = {
      birth_date: date, birth_time: time, lat: birthA?.lat ?? 33.89, lng: birthA?.lng ?? 35.50,
    };
    if (asteroids) body.asteroids = asteroids;
    const data = await swissEphemeris.natal(body);
    const transitPlanets: any[] = [];
    for (const p of (data.planets || [])) {
      let key = (p.name || p.planet || '').toLowerCase();
      if (key === 'north node' || key === 'true_node' || key === 'mean_node') key = 'northnode';
      if (key === 'south node') key = 'southnode';
      if (!key) continue;
      transitPlanets.push({
        planet: key, longitude: p.longitude ?? p.abs_pos ?? 0, latitude: p.latitude ?? 0,
        sign: p.sign || ZODIAC_SIGNS[Math.floor((p.longitude ?? 0) / 30)] || '',
        degree: Math.floor((p.longitude ?? 0) % 30), minute: Math.floor(((p.longitude ?? 0) % 1) * 60),
        retrograde: p.retrograde ?? false,
      });
    }
    return { transit_date: date, transit_time: time, transit_planets: transitPlanets, aspects_to_natal: [] };
  }, [birthA?.lat, birthA?.lng]);

  const handleFetchComposite = useCallback(async (
    cA: any, cB: any, asteroids?: AsteroidsParam
  ): Promise<CompositeData> => {
    let charts = { chartA: cA, chartB: cB };
    if (asteroids && Array.isArray(asteroids) && asteroids.length > 0 && birthA?.lat && birthB?.lat) {
      try {
        const [dataA, dataB] = await Promise.all([
          swissEphemeris.natal({ birth_date: birthA.date, birth_time: birthA.time || '12:00', lat: birthA.lat, lng: birthA.lng, asteroids }),
          swissEphemeris.natal({ birth_date: birthB.date, birth_time: birthB.time || '12:00', lat: birthB.lat, lng: birthB.lng, asteroids }),
        ]);
        const merge = (response: any, base: any) => {
          const extra: Record<string, any> = {};
          for (const p of (response.planets || [])) {
            const k = (p.name || p.planet || '').toLowerCase();
            if (k && !base.planets[k]) extra[k] = { longitude: p.longitude ?? p.abs_pos ?? 0, sign: p.sign || ZODIAC_SIGNS[Math.floor((p.longitude ?? 0) / 30)], retrograde: p.retrograde ?? false };
          }
          return { ...base, planets: { ...base.planets, ...extra } };
        };
        charts.chartA = merge(dataA, cA);
        charts.chartB = merge(dataB, cB);
      } catch (err) { console.error('Asteroid fetch for composite failed:', err); }
    }
    const compositePlanets: any[] = [];
    const keys = new Set([...Object.keys(charts.chartA.planets || {}), ...Object.keys(charts.chartB.planets || {})]);
    for (const key of keys) {
      const pA = charts.chartA.planets[key]; const pB = charts.chartB.planets?.[key];
      if (pA && pB) {
        let mid = (pA.longitude + pB.longitude) / 2;
        if (Math.abs(pA.longitude - pB.longitude) > 180) mid = (mid + 180) % 360;
        compositePlanets.push({ planet: key, longitude: mid, latitude: 0, sign: ZODIAC_SIGNS[Math.floor(mid / 30)], degree: Math.floor(mid % 30), minute: Math.floor((mid % 1) * 60), retrograde: false });
      }
    }
    let compositeHouses = { cusps: [] as number[], ascendant: 0, mc: 0 }; let ascSign = 'Aries';
    if (cA.angles && cB.angles) {
      let midAsc = (cA.angles.ascendant + cB.angles.ascendant) / 2;
      if (Math.abs(cA.angles.ascendant - cB.angles.ascendant) > 180) midAsc = (midAsc + 180) % 360;
      let midMc = (cA.angles.midheaven + cB.angles.midheaven) / 2;
      if (Math.abs(cA.angles.midheaven - cB.angles.midheaven) > 180) midMc = (midMc + 180) % 360;
      compositeHouses = { cusps: [], ascendant: midAsc, mc: midMc };
      ascSign = ZODIAC_SIGNS[Math.floor(midAsc / 30)];
    }
    return { planets: compositePlanets, houses: compositeHouses, aspects: [], ascendantSign: ascSign };
  }, [birthA, birthB]);

  const handleFetchProgressed = useCallback(async (
    person: 'A' | 'B', progressedTo: string, asteroids?: AsteroidsParam
  ): Promise<ProgressedData> => {
    const src = person === 'A' ? birthA : birthB;
    if (!src?.lat) throw new Error(`Person ${person} birth info not available`);
    const body: Record<string, unknown> = { birth_date: src.date, birth_time: src.time || '12:00', lat: src.lat, lng: src.lng, progressed_to: progressedTo };
    if (asteroids) body.asteroids = asteroids;
    const data = await swissEphemeris.progressed(body);
    return { natal_date: data.natal_date || '', progressed_to: data.progressed_to || progressedTo, progressed_chart_date: data.progressed_chart_date || '', years_progressed: data.years_progressed || 0, progressed_planets: data.progressed_planets || [], houses: data.houses, aspects_to_natal: data.aspects_to_natal || [], ascendantSign: data.ascendantSign || '' };
  }, [birthA, birthB]);

  const handleFetchRelocated = useCallback(async (
    person: 'A' | 'B', newLat: number, newLng: number, asteroids?: AsteroidsParam
  ): Promise<RelocatedData> => {
    const src = person === 'A' ? birthA : birthB;
    if (!src?.lat) throw new Error(`Person ${person} birth info not available`);
    const body: Record<string, unknown> = { birth_date: src.date, birth_time: src.time || '12:00', lat: newLat, lng: newLng };
    if (asteroids) body.asteroids = asteroids;
    const data = await swissEphemeris.natal(body);
    return { original_location: { lat: src.lat, lng: src.lng, name: src.location || 'Birth Location' }, relocated_location: { lat: newLat, lng: newLng, name: 'Relocated Location' }, relocated_planets: data.planets || [], houses: data.houses || { cusps: [], ascendant: 0, mc: 0 }, ascendantSign: data.ascendantSign || '' };
  }, [birthA, birthB]);

  const handleFetchAsteroidData = useCallback(async (asteroids: string[]): Promise<{ chartA: Record<string, any>; chartB: Record<string, any> }> => {
    const resA: Record<string, any> = {}; const resB: Record<string, any> = {};
    const parse = (data: any): Record<string, any> => {
      const r: Record<string, any> = {};
      for (const p of (data.planets || [])) {
        const k = (p.name || p.planet || '').toLowerCase();
        if (k) r[k] = { longitude: p.longitude ?? p.abs_pos ?? 0, sign: p.sign || ZODIAC_SIGNS[Math.floor((p.longitude ?? 0) / 30)], retrograde: p.retrograde ?? false };
      }
      return r;
    };
    try {
      if (birthA?.lat) { const d = await swissEphemeris.natal({ birth_date: birthA.date, birth_time: birthA.time || '12:00', lat: birthA.lat, lng: birthA.lng, asteroids }); Object.assign(resA, parse(d)); }
      if (birthB?.lat) { const d = await swissEphemeris.natal({ birth_date: birthB.date, birth_time: birthB.time || '12:00', lat: birthB.lat, lng: birthB.lng, asteroids }); Object.assign(resB, parse(d)); }
      else { Object.assign(resB, resA); }
    } catch (err) { console.error('Asteroid fetch failed:', err); }
    return { chartA: resA, chartB: resB };
  }, [birthA, birthB]);

  // Pre-join lobby with camera preview
  if (!joined) {
    const hasVideoTrack = previewStream && previewStream.getVideoTracks().length > 0 && !previewVideoOff;
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-5 text-center">
          <h2 className="text-lg font-semibold">{session.title}</h2>
          <p className="text-sm text-muted-foreground">
            Check your camera and mic, then join the live session
          </p>

          {/* Camera preview */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-800 mx-auto max-w-sm">
            {hasVideoTrack ? (
              <video
                ref={previewVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-16 h-16 text-white/30" />
              </div>
            )}
          </div>

          {/* Mic/Camera toggles */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={togglePreviewMic}
              className={`p-3 rounded-full transition-colors ${previewMuted ? 'bg-red-500/20 text-red-400' : 'bg-zinc-100 dark:bg-zinc-800 text-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
              title={previewMuted ? 'Unmute' : 'Mute'}
            >
              {previewMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button
              onClick={togglePreviewVideo}
              className={`p-3 rounded-full transition-colors ${previewVideoOff ? 'bg-red-500/20 text-red-400' : 'bg-zinc-100 dark:bg-zinc-800 text-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
              title={previewVideoOff ? 'Turn camera on' : 'Turn camera off'}
            >
              {previewVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          </div>

          {/* Name + email inputs */}
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (optional — to receive the recording)"
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />
          <Button onClick={handleJoin} disabled={joining} className="w-full gap-2">
            {joining ? <><Loader2 className="w-4 h-4 animate-spin" /> Joining...</> : 'Join Session'}
          </Button>
        </div>
      </div>
    );
  }

  const chartSnapshot = session.chart_snapshot;
  const hostName = session.host_display_name || 'Host';
  // Use live theme from broadcast, falling back to initial snapshot
  const themeName = ((externalState.chartTheme || chartSnapshot.theme || 'classic') as ThemeName);
  const themeBg = THEME_SWATCHES[themeName]?.bg || '#ffffff';
  const themeFg = THEME_SWATCHES[themeName]?.fg || '#000000';
  const isDarkTheme = ['dark', 'midnight', 'cosmic', 'forest', 'sunset', 'ocean'].includes(themeName);

  return (
    <div className="min-h-screen" style={{ backgroundColor: themeBg, color: themeFg }}>
      {/* Status banners */}
      {hostStatus === 'paused' && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 text-center text-sm text-yellow-600">
          Host has paused the session
        </div>
      )}
      {hostStatus === 'ended' && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-center text-sm text-red-600">
          Session has ended
        </div>
      )}
      {hostDisconnected && hostStatus === 'live' && (
        <div className="bg-orange-500/10 border-b border-orange-500/20 px-4 py-2 text-center text-sm text-orange-600">
          Host disconnected — waiting for reconnection...
        </div>
      )}

      {viewMode === 'video' ? (
        /* Video gallery mode: side-by-side layout */
        <div className="flex h-[calc(100vh-64px)]">
          {/* Video gallery — left 70% */}
          <div className="w-[70%] h-full min-w-0">
            <VideoGallery
              participants={[
                ...remoteParticipants.map((p) => ({
                  id: p.id,
                  name: p.name,
                  stream: p.videoStream,
                })),
                {
                  id: 'local',
                  name: 'You',
                  stream: localVideoStream,
                  muted: true,
                  mirrored: true,
                },
              ]}
              activeSpeakerId={activeSpeakerId}
            />
          </div>
          {/* Chart sidebar — right 30%, scrollable */}
          <div className="w-[30%] h-full overflow-y-auto border-l border-border/30" style={{ backgroundColor: themeBg }}>
            <div className="py-4 px-3">
              <div className="mb-3">
                <h1 className="text-sm font-semibold" style={{ color: themeFg }}>{session.title}</h1>
                <p className="text-xs" style={{ color: themeFg, opacity: 0.6 }}>
                  {liveNameA}
                  {liveNameB && <span> & {liveNameB}</span>}
                </p>
              </div>
              <BiWheelMobileWrapper
                key={`${liveNameA}-${liveNameB || ''}`}
                chartA={liveChartA}
                chartB={liveChartB || liveChartA}
                nameA={liveNameA}
                nameB={liveNameB || liveNameA}
                initialChartMode={(chartSnapshot.mode === 'natal' ? 'personA' : chartSnapshot.mode) as any || 'personA'}
                initialTheme={chartSnapshot.theme}
                readOnly
                externalState={externalState}
                enableTransits
                enableComposite={!!liveChartB}
                enableProgressed
                enableRelocated
                originalLocation={birthA?.lat ? { lat: birthA.lat, lng: birthA.lng, name: birthA.location || 'Birth Location' } : undefined}
                locationB={birthB?.lat ? { lat: birthB.lat, lng: birthB.lng, name: birthB.location || 'Birth Location' } : undefined}
                birthDateA={birthA?.date}
                birthTimeA={birthA?.time}
                birthDateB={birthB?.date}
                birthTimeB={birthB?.time}
                onFetchTransits={handleFetchTransits}
                onFetchComposite={liveChartB ? handleFetchComposite : undefined}
                onFetchProgressed={handleFetchProgressed}
                onFetchRelocated={handleFetchRelocated}
                onFetchAsteroidData={handleFetchAsteroidData}
                remoteCursor={<RemoteCursor x={cursor.x} y={cursor.y} label={hostName} />}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Floating video feeds — chart mode only */}
          <div className="fixed top-2 right-2 md:top-4 md:right-4 z-50 flex flex-col items-end gap-2">
            {remoteParticipants.map((p) => (
              <VideoFeed key={p.id} stream={p.videoStream} label={p.name} isSpeaking={activeSpeakerId === p.id} />
            ))}
            <VideoFeed stream={localVideoStream} muted mirrored label="You" isSpeaking={activeSpeakerId === 'local'} />
          </div>

          {/* Chart */}
          <div className="container py-4 px-2 md:px-6">
            <div className="mb-3">
              <h1 className="text-lg font-semibold" style={{ color: themeFg }}>{session.title}</h1>
              <p className="text-xs" style={{ color: themeFg, opacity: 0.6 }}>
                {liveNameA}
                {liveNameB && <span> & {liveNameB}</span>}
              </p>
            </div>

            <BiWheelMobileWrapper
              key={`${liveNameA}-${liveNameB || ''}`}
              chartA={liveChartA}
              chartB={liveChartB || liveChartA}
              nameA={liveNameA}
              nameB={liveNameB || liveNameA}
              initialChartMode={(chartSnapshot.mode === 'natal' ? 'personA' : chartSnapshot.mode) as any || 'personA'}
              initialTheme={chartSnapshot.theme}
              readOnly
              externalState={externalState}
              enableTransits
              enableComposite={!!liveChartB}
              enableProgressed
              enableRelocated
              originalLocation={birthA?.lat ? { lat: birthA.lat, lng: birthA.lng, name: birthA.location || 'Birth Location' } : undefined}
              locationB={birthB?.lat ? { lat: birthB.lat, lng: birthB.lng, name: birthB.location || 'Birth Location' } : undefined}
              birthDateA={birthA?.date}
              birthTimeA={birthA?.time}
              birthDateB={birthB?.date}
              birthTimeB={birthB?.time}
              onFetchTransits={handleFetchTransits}
              onFetchComposite={liveChartB ? handleFetchComposite : undefined}
              onFetchProgressed={handleFetchProgressed}
              onFetchRelocated={handleFetchRelocated}
              onFetchAsteroidData={handleFetchAsteroidData}
              remoteCursor={<RemoteCursor x={cursor.x} y={cursor.y} label={hostName} />}
            />
          </div>
        </>
      )}

      {/* Audio/video controls */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-black/80 backdrop-blur-sm border border-white/10 rounded-full shadow-2xl" style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <button onClick={toggleMute} className={`p-2 rounded-full transition-colors ${isMuted ? 'bg-red-500/20 text-red-400' : 'text-white/70 hover:text-white'}`} title={isMuted ? 'Unmute' : 'Mute'}>
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        <button onClick={toggleVideo} className={`p-2 rounded-full transition-colors ${isVideoOff ? 'bg-red-500/20 text-red-400' : 'text-white/70 hover:text-white'}`} title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}>
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>
        {/* View mode toggle */}
        <button
          onClick={() => setViewMode(v => {
            const next = v === 'chart' ? 'video' : 'chart';
            broadcastRef.current?.broadcastStateChange('view_mode', { mode: next });
            return next;
          })}
          className="p-2 rounded-full transition-colors text-white/70 hover:text-white"
          title={viewMode === 'chart' ? 'Switch to video gallery' : 'Switch to chart view'}
        >
          {viewMode === 'chart' ? <LayoutGrid className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
        </button>
        <button onClick={toggleSpeaker} className={`p-2 rounded-full transition-colors ${isSpeakerOff ? 'bg-red-500/20 text-red-400' : 'text-white/70 hover:text-white'}`} title={isSpeakerOff ? 'Mute speaker' : 'Unmute speaker'}>
          {isSpeakerOff ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};
