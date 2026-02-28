/**
 * ReplayPlayer — Replay recorded sessions with synced audio + chart + cursor
 *
 * Loads session events + audio, uses requestAnimationFrame to advance
 * event index in sync with audio playback. When no audio is available,
 * falls back to a timer-based playback using event timestamps.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Loader2, ExternalLink, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { BiWheelMobileWrapper } from '@/components/biwheel';
import { RemoteCursor } from './RemoteCursor';
import { SessionTimeline } from './SessionTimeline';
import { SessionSummary } from './SessionSummary';
import { TranscriptPanel } from './TranscriptPanel';
import type { SessionRecord, SessionEvent, Chapter } from '@/lib/session/types';
import { THEME_SWATCHES } from '@/components/biwheel/utils/themes';
import type { ThemeName } from '@/components/biwheel/utils/themes';

interface ReplayPlayerProps {
  session: SessionRecord;
}

export default function ReplayPlayer({ session }: ReplayPlayerProps) {
  const navigate = useNavigate();
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [externalState, setExternalState] = useState<Record<string, any>>({});
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [deleting, setDeleting] = useState(false);

  // Mutable chart data — updated when replay encounters a chart_swap event
  const [replayChartA, setReplayChartA] = useState<Record<string, any>>(session.chart_snapshot?.chartA);
  const [replayChartB, setReplayChartB] = useState<Record<string, any> | undefined>(session.chart_snapshot?.chartB);
  const [replayNameA, setReplayNameA] = useState(session.chart_snapshot?.nameA || 'Person A');
  const [replayNameB, setReplayNameB] = useState(session.chart_snapshot?.nameB);

  const audioRef = useRef<HTMLAudioElement>(null);
  const eventIndexRef = useRef(0);
  const rafRef = useRef<number>(0);
  // Timer-based playback refs (used when no audio)
  const timerStartRef = useRef(0); // wall-clock time when playback started
  const timerOffsetRef = useRef(0); // ms offset when playback was last started/seeked

  const hasAudio = !!audioUrl;
  const totalMs = session.audio_duration_ms || session.total_duration_ms ||
    (events.length > 0 ? events[events.length - 1].timestamp_ms + 1000 : 0);
  const chapters: Chapter[] = (session.chapters || []) as Chapter[];

  // Load events + audio
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Load events
        const { data: eventData } = await supabase.rpc('get_session_events', {
          p_token: session.share_token,
        });
        if (!cancelled && eventData) {
          setEvents(eventData as SessionEvent[]);
        }

        // Load audio URL (may fail if no audio was recorded)
        try {
          const { data: audioData } = await supabase.functions.invoke('astrologer-session-audio-url', {
            body: { share_token: session.share_token },
          });
          if (!cancelled && audioData?.audio_url) {
            setAudioUrl(audioData.audio_url);
          }
        } catch {
          // No audio available — timer mode will be used
        }
      } catch (err) {
        console.error('Failed to load replay data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [session.share_token]);

  // Apply initial state from chart snapshot (with fallback defaults for older sessions)
  useEffect(() => {
    const initial = session.chart_snapshot?.initialState;
    if (initial) {
      setExternalState({
        ...initial,
        visiblePlanets: initial.visiblePlanets?.length ? initial.visiblePlanets : ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'],
        visibleAspects: initial.visibleAspects?.length ? initial.visibleAspects : ['conjunction', 'sextile', 'square', 'trine', 'opposition', 'quincunx', 'semisextile', 'semisquare'],
        rotateToAscendant: initial.rotateToAscendant ?? true,
      });
    }
  }, [session.chart_snapshot]);

  // Get current playback time (audio-driven or timer-driven)
  const getCurrentMs = useCallback(() => {
    if (hasAudio && audioRef.current) {
      return audioRef.current.currentTime * 1000;
    }
    // Timer mode: calculate elapsed since play started
    return timerOffsetRef.current + (Date.now() - timerStartRef.current) * playbackRate;
  }, [hasAudio, playbackRate]);

  // Playback loop
  const tick = useCallback(() => {
    const ms = getCurrentMs();
    setCurrentMs(ms);

    // Apply events up to current time
    while (eventIndexRef.current < events.length && events[eventIndexRef.current].timestamp_ms <= ms) {
      const evt = events[eventIndexRef.current];
      applyEvent(evt);
      eventIndexRef.current++;
    }

    // Stop at end in timer mode
    if (!hasAudio && ms >= totalMs) {
      setPlaying(false);
      setCurrentMs(totalMs);
      return;
    }

    if (playing) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [events, playing, getCurrentMs, hasAudio, totalMs]);

  useEffect(() => {
    if (playing) {
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, tick]);

  const applyEvent = (evt: SessionEvent) => {
    switch (evt.event_type) {
      case 'cursor':
        setCursor({ x: evt.payload.x, y: evt.payload.y });
        break;
      case 'chart_mode':
        setExternalState((s) => ({ ...s, chartMode: evt.payload.mode }));
        break;
      case 'visible_planets':
        setExternalState((s) => ({ ...s, visiblePlanets: evt.payload.planets }));
        break;
      case 'visible_aspects':
        setExternalState((s) => ({ ...s, visibleAspects: evt.payload.aspects }));
        break;
      case 'show_houses':
        setExternalState((s) => ({ ...s, showHouses: evt.payload.show }));
        break;
      case 'show_degrees':
        setExternalState((s) => ({ ...s, showDegreeMarkers: evt.payload.show }));
        break;
      case 'transit_toggle':
        setExternalState((s) => ({ ...s, showTransits: evt.payload.show }));
        break;
      case 'transit_date':
        setExternalState((s) => ({ ...s, transitDate: evt.payload.date, transitTime: evt.payload.time }));
        break;
      case 'progressed':
        setExternalState((s) => ({ ...s, progressedPerson: evt.payload.person, progressedDate: evt.payload.date, showSolarArc: evt.payload.solarArc }));
        break;
      case 'theme_change':
        setExternalState((s) => ({ ...s, chartTheme: evt.payload.theme }));
        break;
      case 'asteroid_group':
        setExternalState((s) => ({ ...s, enabledAsteroidGroups: evt.payload.groups }));
        break;
      case 'zoom_pan':
        setExternalState((s) => ({ ...s, scale: evt.payload.scale, translateX: evt.payload.translateX, translateY: evt.payload.translateY }));
        break;
      case 'wheel_rotation':
        setExternalState((s) => ({ ...s, rotateToAscendant: evt.payload.rotateToAscendant, zodiacVantage: evt.payload.zodiacVantage }));
        break;
      case 'chart_swap':
        if (evt.payload.chartA) setReplayChartA(evt.payload.chartA);
        setReplayChartB(evt.payload.chartB || undefined);
        if (evt.payload.nameA) setReplayNameA(evt.payload.nameA);
        setReplayNameB(evt.payload.nameB || undefined);
        if (evt.payload.mode) setExternalState((s) => ({ ...s, chartMode: evt.payload.mode }));
        break;
      case 'state_snapshot':
        setExternalState(evt.payload);
        break;
    }
  };

  const handlePlayPause = () => {
    if (playing) {
      // Pause
      if (hasAudio && audioRef.current) {
        audioRef.current.pause();
      } else {
        // Save current offset for resume
        timerOffsetRef.current = getCurrentMs();
      }
      setPlaying(false);
    } else {
      // Play
      if (hasAudio && audioRef.current) {
        audioRef.current.play();
      } else {
        timerStartRef.current = Date.now();
      }
      setPlaying(true);
    }
  };

  const handleSeek = useCallback((ms: number) => {
    const clampedMs = Math.max(0, Math.min(totalMs, ms));

    // Find nearest preceding state_snapshot for fast seeking
    let snapshotIndex = -1;
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].event_type === 'state_snapshot' && events[i].timestamp_ms <= clampedMs) {
        snapshotIndex = i;
        break;
      }
    }

    // Apply snapshot if found, otherwise reset to initial state
    if (snapshotIndex >= 0) {
      setExternalState(events[snapshotIndex].payload);
      eventIndexRef.current = snapshotIndex + 1;
    } else {
      const initial = session.chart_snapshot?.initialState;
      if (initial) {
        setExternalState({
          ...initial,
          visiblePlanets: initial.visiblePlanets?.length ? initial.visiblePlanets : ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'],
          visibleAspects: initial.visibleAspects?.length ? initial.visibleAspects : ['conjunction', 'sextile', 'square', 'trine', 'opposition', 'quincunx', 'semisextile', 'semisquare'],
          rotateToAscendant: initial.rotateToAscendant ?? true,
        });
      }
      eventIndexRef.current = 0;
    }

    // Reset chart data to initial snapshot (chart_swap events in the loop will update if needed)
    setReplayChartA(session.chart_snapshot?.chartA);
    setReplayChartB(session.chart_snapshot?.chartB);
    setReplayNameA(session.chart_snapshot?.nameA || 'Person A');
    setReplayNameB(session.chart_snapshot?.nameB);

    // Replay events from snapshot to seek position
    while (eventIndexRef.current < events.length && events[eventIndexRef.current].timestamp_ms <= clampedMs) {
      applyEvent(events[eventIndexRef.current]);
      eventIndexRef.current++;
    }

    // Set position
    if (hasAudio && audioRef.current) {
      audioRef.current.currentTime = clampedMs / 1000;
    } else {
      timerOffsetRef.current = clampedMs;
      timerStartRef.current = Date.now();
    }
    setCurrentMs(clampedMs);
  }, [events, session.chart_snapshot, hasAudio, totalMs]);

  const handleSkip = (deltaMs: number) => {
    handleSeek(currentMs + deltaMs);
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.5, 2];
    const idx = rates.indexOf(playbackRate);
    const next = rates[(idx + 1) % rates.length];
    setPlaybackRate(next);
    if (hasAudio && audioRef.current) {
      audioRef.current.playbackRate = next;
    } else {
      // Recalibrate timer for new rate
      timerOffsetRef.current = getCurrentMs();
      timerStartRef.current = Date.now();
    }
  };

  const loadingThemeName = (session.chart_snapshot?.theme || 'classic') as ThemeName;
  const loadingBg = THEME_SWATCHES[loadingThemeName]?.bg || '#ffffff';
  const loadingFg = THEME_SWATCHES[loadingThemeName]?.fg || '#000000';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: loadingBg }}>
        <div className="text-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
          <p className="text-xs" style={{ color: loadingFg, opacity: 0.6 }}>Loading replay...</p>
        </div>
      </div>
    );
  }

  const handleDeleteSession = async () => {
    if (!confirm('Delete this session permanently? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const { data: files } = await supabase.storage.from('session-recordings').list(session.id);
      if (files && files.length > 0) {
        await supabase.storage.from('session-recordings').remove(files.map(f => `${session.id}/${f.name}`));
      }
      const { data: chunkFiles } = await supabase.storage.from('session-recordings').list(`${session.id}/chunks`);
      if (chunkFiles && chunkFiles.length > 0) {
        await supabase.storage.from('session-recordings').remove(chunkFiles.map(f => `${session.id}/chunks/${f.name}`));
      }
      await supabase.from('astrologer_sessions').delete().eq('id', session.id);
      toast.success('Session deleted');
      window.location.href = '/chart';
    } catch {
      toast.error('Failed to delete session');
      setDeleting(false);
    }
  };

  const chartSnapshot = session.chart_snapshot;
  const themeName = (chartSnapshot.theme || 'classic') as ThemeName;
  const themeBg = THEME_SWATCHES[themeName]?.bg || '#ffffff';
  const themeFg = THEME_SWATCHES[themeName]?.fg || '#000000';
  const isDarkTheme = ['dark', 'midnight', 'cosmic', 'forest', 'sunset', 'ocean'].includes(themeName);

  return (
    <div className="min-h-screen" style={{ backgroundColor: themeBg, color: themeFg }}>
      {/* Hidden audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          onEnded={() => setPlaying(false)}
        />
      )}

      <div className="container py-4 px-2 md:px-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <Link to="/chart" className="text-xs transition-colors" style={{ color: themeFg, opacity: 0.6 }}>&larr; Back to chart</Link>
            <div className="flex items-center gap-2">
              {chartSnapshot.birthDataA && (
                <button
                  onClick={() => {
                    const bd = chartSnapshot.birthDataA!;
                    const personA = {
                      name: bd.name, date: bd.date, time: bd.time,
                      location: bd.location, lat: bd.lat, lng: bd.lng,
                      natalChart: chartSnapshot.chartA,
                    };
                    let personB = null;
                    if (chartSnapshot.birthDataB && chartSnapshot.chartB) {
                      const bb = chartSnapshot.birthDataB;
                      personB = {
                        name: bb.name, date: bb.date, time: bb.time,
                        location: bb.location, lat: bb.lat, lng: bb.lng,
                        natalChart: chartSnapshot.chartB,
                      };
                    }
                    navigate('/chart', { state: { personA, personB } });
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-opacity hover:opacity-100"
                  style={{ color: themeFg, opacity: 0.6 }}
                  title="Open this chart in full interactive mode"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Explore Chart</span>
                </button>
              )}
              <button
                onClick={handleDeleteSession}
                disabled={deleting}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-opacity hover:opacity-100 disabled:opacity-30"
                style={{ color: isDarkTheme ? '#f87171' : '#dc2626', opacity: 0.6 }}
                title="Delete session"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{deleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>
          <h1 className="text-lg font-semibold mt-1" style={{ color: themeFg }}>{session.title}</h1>
          <p className="text-xs" style={{ color: themeFg, opacity: 0.6 }}>
            {replayNameA}
            {replayNameB && <span> & {replayNameB}</span>}
            <span className="opacity-40 mx-1.5">&middot;</span>
            {new Date(session.created_at).toLocaleDateString()}
            {!hasAudio && <span className="ml-2 text-yellow-600">(No audio)</span>}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart + playback controls (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            <BiWheelMobileWrapper
              key={`${replayNameA}-${replayNameB || ''}`}
              chartA={replayChartA}
              chartB={replayChartB || replayChartA}
              nameA={replayNameA}
              nameB={replayNameB || replayNameA}
              initialChartMode={(chartSnapshot.mode === 'natal' ? 'personA' : chartSnapshot.mode) as any || 'personA'}
              initialTheme={chartSnapshot.theme}
              readOnly
              externalState={externalState}
              remoteCursor={<RemoteCursor x={cursor.x} y={cursor.y} label="Host" />}
            />

            {/* Playback controls */}
            <div className="space-y-2">
              <SessionTimeline
                currentMs={currentMs}
                totalMs={totalMs}
                chapters={chapters}
                onSeek={handleSeek}
              />

              <div className="flex items-center justify-center gap-3">
                <button onClick={() => handleSkip(-15000)} className="p-1.5 transition-colors" style={{ color: themeFg, opacity: 0.6 }} title="Back 15s">
                  <SkipBack className="w-4 h-4" />
                </button>
                <button onClick={handlePlayPause} className="p-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                  {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <button onClick={() => handleSkip(15000)} className="p-1.5 transition-colors" style={{ color: themeFg, opacity: 0.6 }} title="Forward 15s">
                  <SkipForward className="w-4 h-4" />
                </button>
                <button
                  onClick={cyclePlaybackRate}
                  className="ml-2 px-2 py-1 text-xs font-mono rounded transition-colors"
                  style={{ color: themeFg, opacity: 0.6, border: `1px solid ${themeFg}33` }}
                >
                  {playbackRate}x
                </button>
              </div>
            </div>
          </div>

          {/* Summary + transcript sidebar (1/3) */}
          <div className="space-y-4">
            <SessionSummary
              session={session}
              chapters={chapters}
              onSeek={handleSeek}
              audioUrl={audioUrl || undefined}
            />
            <TranscriptPanel
              transcript={session.transcript || ''}
              utterances={session.utterances}
              currentMs={currentMs}
              totalMs={totalMs}
              onSeek={handleSeek}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
