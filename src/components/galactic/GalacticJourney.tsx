/**
 * GalacticJourney
 * Immersive AI-narrated planetary experience.
 * User picks a topic (or types a custom question), AI generates a story,
 * the galactic view animates through natal/transit scenes with TTS narration
 * and auto-camera focus on relevant planets.
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles, Play, Pause, SkipForward, X, Volume2, VolumeX,
  ChevronRight, Loader2, RotateCcw, Send,
} from 'lucide-react';
import type { GalacticNatalChart, JourneyTopic, JourneyData, JourneyScene, CameraPreset } from './types';
import { JOURNEY_TOPICS } from './types';
import { createClient } from '@supabase/supabase-js';
import {
  buildTreesForQuestion,
  enrichTreesWithProfections,
  enrichTreesWithActivations,
} from '@/lib/chartReading/buildVantageTree';
import { DEFAULT_PARAMS } from '@/lib/chartReading/types';
import type { NatalChart, ChartReadingTree } from '@/lib/chartReading/types';

const supabaseUrl = import.meta.env.VITE_ASTROLOGER_SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_ASTROLOGER_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

// ─── Mood-based visual config ────────────────────────────────────

const MOOD_COLORS: Record<string, string> = {
  calm: '#818cf8',
  intense: '#ef4444',
  joyful: '#f59e0b',
  reflective: '#8b5cf6',
  transformative: '#22c55e',
};

// ─── TTS Engine (Deepgram via edge function, with preloading) ───

/** Fetch a single TTS audio blob from the edge function */
async function fetchTTSBlob(text: string): Promise<Blob | null> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/astrologer-tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return null;
    return res.blob();
  } catch {
    return null;
  }
}

function useTTS() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const generationRef = useRef(0);
  const cacheRef = useRef<Map<number, Blob>>(new Map()); // scene index → audio blob
  const [speaking, setSpeaking] = useState(false);

  const killAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.onplay = null;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.onpause = null;
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => killAudio();
  }, [killAudio]);

  /** Preload all journey audio in parallel. Returns when at least intro is ready. */
  const preload = useCallback(async (data: { intro: string; scenes: { narration: string }[]; outro: string }) => {
    cacheRef.current.clear();
    const entries: [number, string][] = [
      [-1, data.intro],
      ...data.scenes.map((s, i): [number, string] => [i, s.narration]),
      [data.scenes.length, data.outro],
    ];

    // Fire all fetches in parallel
    const promises = entries.map(async ([idx, text]) => {
      const blob = await fetchTTSBlob(text);
      if (blob) cacheRef.current.set(idx, blob);
    });

    // Wait for at least the intro (index -1) before returning
    // But don't block on all — the rest load in background
    await Promise.race([
      promises[0], // intro
      new Promise(r => setTimeout(r, 8000)), // timeout safety
    ]);

    // Let the rest finish in background
    Promise.allSettled(promises);
  }, []);

  /** Play audio for a scene index. Uses cache if available, fetches on demand if not. */
  const speak = useCallback(async (sceneIndex: number, text: string, onEnd?: () => void) => {
    killAudio();
    setSpeaking(false);

    const gen = ++generationRef.current;

    try {
      // Check preloaded cache first
      let blob = cacheRef.current.get(sceneIndex) ?? null;

      // Fallback: fetch on demand if not cached yet
      if (!blob) {
        blob = await fetchTTSBlob(text);
        if (gen !== generationRef.current) return;
      }

      if (!blob) {
        onEnd?.();
        return;
      }

      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        if (gen === generationRef.current) setSpeaking(true);
      };
      audio.onended = () => {
        setSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        if (gen === generationRef.current) onEnd?.();
      };
      audio.onerror = () => {
        setSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        if (gen === generationRef.current) onEnd?.();
      };

      await audio.play();
    } catch (err) {
      console.error('TTS play error:', err);
      setSpeaking(false);
      if (gen === generationRef.current) onEnd?.();
    }
  }, [killAudio]);

  const stop = useCallback(() => {
    generationRef.current++;
    killAudio();
    setSpeaking(false);
  }, [killAudio]);

  const pause = useCallback(() => {
    if (audioRef.current) audioRef.current.pause();
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current) audioRef.current.play();
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return { speak, stop, pause, resume, preload, clearCache, speaking, available: true };
}

// ─── Topic Picker ────────────────────────────────────────────────

function TopicPicker({
  onSelect,
  onClose,
}: {
  onSelect: (topic: JourneyTopic, customQuestion?: string) => void;
  onClose: () => void;
}) {
  const [customQ, setCustomQ] = useState('');

  const handleCustomSubmit = () => {
    const q = customQ.trim();
    if (q.length >= 5) {
      onSelect('custom' as JourneyTopic, q);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-[420px] bg-black/95 border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Galactic Journey</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        {/* Custom question input */}
        <div className="mb-4">
          <div className="flex gap-2">
            <input
              value={customQ}
              onChange={(e) => setCustomQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
              placeholder="Ask anything... &quot;Will I find love?&quot;"
              className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50"
            />
            <button
              onClick={handleCustomSubmit}
              disabled={customQ.trim().length < 5}
              className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-[11px] text-white/30 uppercase tracking-wider mb-3">Or choose a theme</p>

        <div className="space-y-1.5">
          {(Object.entries(JOURNEY_TOPICS) as [JourneyTopic, typeof JOURNEY_TOPICS[JourneyTopic]][]).map(
            ([key, topic]) => (
              <button
                key={key}
                onClick={() => onSelect(key)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group text-left"
              >
                <span className="text-xl">{topic.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white/90 group-hover:text-white">
                    {topic.label}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Journey Playback Overlay ────────────────────────────────────

function JourneyOverlay({
  data,
  currentScene,
  isPlaying,
  isMuted,
  onTogglePlay,
  onToggleMute,
  onNextScene,
  onExit,
  onRestart,
}: {
  data: JourneyData;
  currentScene: number;
  isPlaying: boolean;
  isMuted: boolean;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onNextScene: () => void;
  onExit: () => void;
  onRestart: () => void;
}) {
  const scene = data.scenes[currentScene];
  const isIntro = currentScene === -1;
  const isOutro = currentScene >= data.scenes.length;
  const moodColor = scene ? MOOD_COLORS[scene.mood] ?? '#818cf8' : '#818cf8';
  const totalSteps = data.scenes.length + 2; // intro + scenes + outro
  const currentStep = currentScene + 1; // -1→0(intro), 0→1, ..., N→N+1(outro)
  const progress = Math.min((currentStep / (totalSteps - 1)) * 100, 100);

  return (
    <>
      {/* Top banner */}
      <div className="absolute top-3 left-3 right-3 z-30 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div
            className="flex items-center gap-2 bg-black/70 backdrop-blur-md rounded-lg px-3 py-1.5"
            style={{ borderLeft: `3px solid ${moodColor}` }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: moodColor }} />
            <span className="text-xs font-medium text-white/80">{data.title}</span>
            {scene && (
              <>
                <span className="text-[10px] text-white/40 ml-1">
                  {currentScene + 1}/{data.scenes.length}
                </span>
                {scene.sceneType && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                    scene.sceneType === 'natal' ? 'bg-blue-500/20 text-blue-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {scene.sceneType}
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleMute}
              className="p-1.5 rounded-md bg-black/50 backdrop-blur-sm text-white/50 hover:text-white/80 transition-colors"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onExit}
              className="p-1.5 rounded-md bg-black/50 backdrop-blur-sm text-white/50 hover:text-white/80 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 z-40 h-0.5">
        <div
          className="h-full transition-all duration-1000"
          style={{ width: `${progress}%`, background: moodColor }}
        />
      </div>

      {/* Bottom narration card */}
      <div className="absolute bottom-3 left-3 right-3 z-30 pointer-events-auto">
        <div className="max-w-xl mx-auto">
          <div
            className="bg-black/80 backdrop-blur-xl rounded-xl border px-5 py-4"
            style={{ borderColor: `${moodColor}30` }}
          >
            {/* Scene title with planet badge */}
            {scene && (
              <div className="flex items-center gap-2 mb-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: moodColor }}>
                  {scene.title}
                </p>
                {scene.focusPlanet && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/50 uppercase tracking-wider">
                    {scene.focusPlanet}
                  </span>
                )}
              </div>
            )}
            {isIntro && (
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: moodColor }}>
                Begin
              </p>
            )}
            {isOutro && (
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: moodColor }}>
                Journey Complete
              </p>
            )}

            {/* Narration text */}
            <p className="text-sm text-white/90 leading-relaxed mb-3">
              {isIntro ? data.intro : isOutro ? data.outro : scene?.narration ?? ''}
            </p>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={onTogglePlay}
                className="p-2 rounded-lg transition-colors"
                style={{ background: `${moodColor}25`, color: moodColor }}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={onNextScene}
                className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors"
                title="Next"
              >
                <SkipForward className="w-4 h-4" />
              </button>
              <button
                onClick={onRestart}
                className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors"
                title="Restart"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Scene dots */}
              <div className="flex-1 flex items-center justify-center gap-1">
                {data.scenes.map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full transition-all"
                    style={{
                      background: i === currentScene ? moodColor : i < currentScene ? `${moodColor}60` : 'rgba(255,255,255,0.15)',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Loading Screen ──────────────────────────────────────────────

function JourneyLoading({ topic, customQuestion }: { topic: JourneyTopic; customQuestion?: string }) {
  const topicInfo = topic === 'custom' ? null : JOURNEY_TOPICS[topic];
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="text-center space-y-4">
        <div className="text-4xl animate-pulse">{topicInfo?.icon ?? '✨'}</div>
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mx-auto" />
        <p className="text-sm text-white/60">Reading your chart...</p>
        {customQuestion && (
          <p className="text-xs text-white/30 max-w-[240px] mx-auto italic">"{customQuestion}"</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────

interface GalacticJourneyProps {
  chart: GalacticNatalChart;
  name: string;
  birthDate?: string;
  onFocusPlanet: (key: string | null, keyB?: string | null) => void;
  onSetTransit: (enabled: boolean, dayOffset: number) => void;
  onSetPreset: (preset: CameraPreset) => void;
  onSetAutoRotate: (v: boolean) => void;
  onRequestFullscreen?: () => void;
  onExitFullscreen?: () => void;
}

export function GalacticJourney({
  chart,
  name,
  birthDate,
  onFocusPlanet,
  onSetTransit,
  onSetPreset,
  onSetAutoRotate,
  onRequestFullscreen,
  onExitFullscreen,
}: GalacticJourneyProps) {
  const [phase, setPhase] = useState<'hidden' | 'picking' | 'loading' | 'playing' | 'done'>('hidden');
  const [journeyData, setJourneyData] = useState<JourneyData | null>(null);
  const [currentScene, setCurrentScene] = useState(-1); // -1 = intro
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<JourneyTopic | null>(null);
  const [customQuestion, setCustomQuestion] = useState<string | undefined>();
  const sceneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playingSceneRef = useRef(-2);
  const tts = useTTS();

  const daysToToday = useMemo(() => {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const now = new Date();
    return Math.round((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
  }, [birthDate]);

  // ── Launch journey ──
  const handleTopicSelect = useCallback(async (topic: JourneyTopic, cq?: string) => {
    setSelectedTopic(topic);
    setCustomQuestion(cq);
    setPhase('loading');

    // Enter fullscreen for immersive experience
    onRequestFullscreen?.();

    try {
      // Build compact summary for AI context
      const chartSummary: Record<string, string> = {};
      // Build full chart for Swiss Eph API transit calculation
      const natalPlanets: { planet: string; longitude: number; latitude: number; sign: string; degree: number; minute: number; retrograde: boolean; house?: number }[] = [];

      for (const [key, data] of Object.entries(chart.planets)) {
        if (['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'northnode', 'chiron'].includes(key)) {
          const sign = data.sign ?? '';
          const house = data.house;
          const retro = data.retrograde ? ' R' : '';
          chartSummary[key] = `${Math.floor(data.longitude % 30)}° ${sign}${house ? ` H${house}` : ''}${retro}`.trim();

          // Format for Swiss Eph API
          const planetName = key === 'northnode' ? 'North Node' : key === 'chiron' ? 'Chiron' : key.charAt(0).toUpperCase() + key.slice(1);
          natalPlanets.push({
            planet: planetName,
            longitude: data.longitude,
            latitude: data.latitude ?? 0,
            sign,
            degree: Math.floor(data.longitude % 30),
            minute: Math.floor((data.longitude % 1) * 60),
            retrograde: data.retrograde ?? false,
            house,
          });
        }
      }

      // Compute natal aspects from planet longitudes for richer AI context
      const ASPECT_DEFS = [
        { name: 'conjunct', angle: 0, orb: 8 },
        { name: 'opposite', angle: 180, orb: 8 },
        { name: 'trine', angle: 120, orb: 8 },
        { name: 'square', angle: 90, orb: 8 },
        { name: 'sextile', angle: 60, orb: 6 },
      ];
      const natalAspects: string[] = [];
      const planetKeys = Object.keys(chartSummary);
      for (let i = 0; i < planetKeys.length; i++) {
        for (let j = i + 1; j < planetKeys.length; j++) {
          const a = chart.planets[planetKeys[i]];
          const b = chart.planets[planetKeys[j]];
          if (!a || !b) continue;
          const diff = Math.abs(a.longitude - b.longitude);
          const angle = diff > 180 ? 360 - diff : diff;
          for (const asp of ASPECT_DEFS) {
            const orb = Math.abs(angle - asp.angle);
            if (orb <= asp.orb) {
              natalAspects.push(`${planetKeys[i]} ${asp.name} ${planetKeys[j]} (${orb.toFixed(1)}°)`);
              break;
            }
          }
        }
      }

      // Build vantage trees for deep chart analysis
      const topicQuestion = cq || (topic === 'custom' ? 'general life themes' : JOURNEY_TOPICS[topic]?.label ?? 'personal growth');
      let vantageTrees: ChartReadingTree[] = [];
      try {
        vantageTrees = buildTreesForQuestion(chart as unknown as NatalChart, topicQuestion, DEFAULT_PARAMS);
        if (birthDate) {
          vantageTrees = enrichTreesWithProfections(vantageTrees, chart as unknown as NatalChart, birthDate);
          vantageTrees = enrichTreesWithActivations(vantageTrees, chart as unknown as NatalChart, birthDate);
        }
      } catch (err) {
        console.warn('Vantage tree build failed, continuing without:', err);
      }

      // Build natal chart object for transit API
      const natalChart: Record<string, unknown> = { planets: natalPlanets };
      if (chart.houses) {
        natalChart.houses = {
          cusps: Object.values(chart.houses),
          ascendant: chart.angles?.ascendant ?? Object.values(chart.houses)[0] ?? 0,
          mc: chart.angles?.midheaven ?? Object.values(chart.houses)[9] ?? 0,
        };
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${supabaseUrl}/functions/v1/astrologer-galactic-journey`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token ?? supabaseKey}`,
            'apikey': supabaseKey,
          },
          body: JSON.stringify({
            chartSummary,
            natalChart,
            natalAspects,
            vantageTrees: vantageTrees.length > 0 ? vantageTrees : undefined,
            topic,
            customQuestion: cq,
            name,
            birthDate,
            daysToToday,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Journey API error: ${response.status}`);
      }

      const result = await response.json() as JourneyData;

      // Preload all TTS audio while still showing loading screen
      await tts.preload(result);

      setJourneyData(result);
      setCurrentScene(-1);
      setIsPlaying(true);
      setPhase('playing');
      onSetAutoRotate(false);

    } catch (err) {
      console.error('Journey generation failed:', err);
      const fallbackJourney = generateFallbackJourney(chart, topic, name, daysToToday);

      await tts.preload(fallbackJourney);

      setJourneyData(fallbackJourney);
      setCurrentScene(-1);
      setIsPlaying(true);
      setPhase('playing');
      onSetAutoRotate(false);
    }
  }, [chart, name, birthDate, daysToToday, onSetAutoRotate, onRequestFullscreen, tts]);

  // ── Scene progression ──
  // -1 = intro, 0..N-1 = scenes, N = outro, N+1 = done
  const advanceScene = useCallback(() => {
    if (!journeyData) return;
    setCurrentScene((prev) => {
      const next = prev + 1;
      if (next > journeyData.scenes.length) {
        setIsPlaying(false);
        setPhase('done');
        onFocusPlanet(null);
        onSetAutoRotate(true);
        onSetTransit(false, 0);
        return prev;
      }
      return next;
    });
  }, [journeyData, onFocusPlanet, onSetAutoRotate, onSetTransit]);

  // ── Play scene effects ──
  useEffect(() => {
    if (phase !== 'playing' || !journeyData || !isPlaying) return;
    if (playingSceneRef.current === currentScene) return;
    playingSceneRef.current = currentScene;

    if (sceneTimerRef.current) {
      clearTimeout(sceneTimerRef.current);
      sceneTimerRef.current = null;
    }

    const scene = currentScene >= 0 && currentScene < journeyData.scenes.length
      ? journeyData.scenes[currentScene]
      : null;

    // ── Intro ──
    if (currentScene === -1) {
      onFocusPlanet(null);
      onSetTransit(false, 0);
      if (!isMuted) {
        tts.speak(-1, journeyData.intro, () => {
          sceneTimerRef.current = setTimeout(advanceScene, 1000);
        });
      } else {
        sceneTimerRef.current = setTimeout(advanceScene, 5000);
      }
      return;
    }

    // ── Outro ──
    if (currentScene >= journeyData.scenes.length) {
      onFocusPlanet(null);
      onSetAutoRotate(true);
      onSetTransit(false, 0);
      if (!isMuted) {
        tts.speak(journeyData.scenes.length, journeyData.outro, () => {
          sceneTimerRef.current = setTimeout(advanceScene, 2000);
        });
      } else {
        sceneTimerRef.current = setTimeout(advanceScene, 6000);
      }
      return;
    }

    if (!scene) return;

    // ── Scene setup based on type ──
    const isTransitScene = scene.sceneType === 'transit';

    if (isTransitScene) {
      // Transit scene: enable transits, focus natal planet (always exists)
      // with transit planet as secondary for dual framing.
      // Natal is primary because transit planets only appear after the next render.
      onSetTransit(true, scene.transitDayOffset);

      const natalKey = scene.natalTarget ?? scene.focusPlanet ?? null;
      const transitKey = scene.transitPlanet ? `transit_${scene.transitPlanet}` : null;

      if (natalKey) {
        onFocusPlanet(natalKey, transitKey);
      } else if (scene.focusPlanet) {
        onFocusPlanet(scene.focusPlanet);
      } else {
        onFocusPlanet(null);
      }
    } else {
      // Natal scene: disable transits, focus on natal planet
      onSetTransit(false, 0);
      if (scene.focusPlanet) {
        onFocusPlanet(scene.focusPlanet);
      } else {
        onFocusPlanet(null);
      }
    }

    // Wait for camera to settle, then narrate
    const cameraSettleDelay = isTransitScene ? 2000 : 1500;

    sceneTimerRef.current = setTimeout(() => {
      if (!isMuted) {
        // Safety: auto-advance if TTS never calls back (max 30s per scene)
        const safetyTimer = setTimeout(() => {
          if (playingSceneRef.current === currentScene) advanceScene();
        }, 30000);

        tts.speak(currentScene, scene.narration, () => {
          clearTimeout(safetyTimer);
          sceneTimerRef.current = setTimeout(advanceScene, 1800);
        });
      } else {
        sceneTimerRef.current = setTimeout(advanceScene, scene.durationSeconds * 1000);
      }
    }, cameraSettleDelay);

    return () => {
      if (sceneTimerRef.current) clearTimeout(sceneTimerRef.current);
    };
  }, [phase, journeyData, currentScene, isPlaying, isMuted]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      tts.pause();
      if (sceneTimerRef.current) clearTimeout(sceneTimerRef.current);
    } else {
      playingSceneRef.current = -2;
      tts.resume();
    }
    setIsPlaying((v) => !v);
  }, [isPlaying, tts]);

  const handleToggleMute = useCallback(() => {
    if (!isMuted) {
      tts.stop();
    }
    setIsMuted((v) => !v);
  }, [isMuted, tts]);

  const handleNextScene = useCallback(() => {
    tts.stop();
    if (sceneTimerRef.current) clearTimeout(sceneTimerRef.current);
    playingSceneRef.current = -2;
    advanceScene();
  }, [tts, advanceScene]);

  const handleRestart = useCallback(() => {
    tts.stop();
    if (sceneTimerRef.current) clearTimeout(sceneTimerRef.current);
    playingSceneRef.current = -2;
    setCurrentScene(-1);
    setIsPlaying(true);
    setPhase('playing');
  }, [tts]);

  const handleExit = useCallback(() => {
    tts.stop();
    tts.clearCache();
    if (sceneTimerRef.current) clearTimeout(sceneTimerRef.current);
    playingSceneRef.current = -2;
    setPhase('hidden');
    setJourneyData(null);
    setCurrentScene(-1);
    setIsPlaying(false);
    onFocusPlanet(null);
    onSetAutoRotate(true);
    onSetTransit(false, 0);
    onExitFullscreen?.();
  }, [tts, onFocusPlanet, onSetAutoRotate, onSetTransit, onExitFullscreen]);

  return (
    <>
      {phase === 'hidden' && (
        <button
          onClick={() => setPhase('picking')}
          className="absolute top-3 left-[calc(50%-60px)] z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 backdrop-blur-sm border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 hover:text-indigo-200 transition-all text-xs font-medium"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Galactic Journey
        </button>
      )}

      {phase === 'picking' && (
        <TopicPicker
          onSelect={handleTopicSelect}
          onClose={() => setPhase('hidden')}
        />
      )}

      {phase === 'loading' && selectedTopic && (
        <JourneyLoading topic={selectedTopic} customQuestion={customQuestion} />
      )}

      {(phase === 'playing' || phase === 'done') && journeyData && (
        <JourneyOverlay
          data={journeyData}
          currentScene={currentScene}
          isPlaying={isPlaying}
          isMuted={isMuted}
          onTogglePlay={handleTogglePlay}
          onToggleMute={handleToggleMute}
          onNextScene={handleNextScene}
          onExit={handleExit}
          onRestart={handleRestart}
        />
      )}
    </>
  );
}

// ─── Fallback Journey Generator (Client-Side) ───────────────────

function generateFallbackJourney(
  chart: GalacticNatalChart,
  topic: JourneyTopic,
  name: string,
  daysToToday: number,
): JourneyData {
  const topicInfo = topic === 'custom' ? { label: 'Your Question', icon: '✨', description: '' } : JOURNEY_TOPICS[topic];

  const topicPlanets: Record<string, string[]> = {
    love: ['venus', 'moon', 'mars', 'jupiter', 'neptune'],
    career: ['saturn', 'sun', 'jupiter', 'mars', 'mercury'],
    growth: ['pluto', 'northnode', 'chiron', 'jupiter', 'saturn'],
    health: ['sun', 'moon', 'mars', 'saturn', 'chiron'],
    spiritual: ['neptune', 'pluto', 'moon', 'northnode', 'chiron'],
    custom: ['sun', 'moon', 'venus', 'mars', 'saturn'],
  };

  const relevantPlanets = (topicPlanets[topic] ?? topicPlanets.growth).filter((k) => chart.planets[k]);

  const scenes: JourneyScene[] = relevantPlanets.map((planetKey, i) => {
    const data = chart.planets[planetKey];
    const sign = data?.sign ?? '';
    const house = data?.house;

    // First half = natal scenes, second half = transit scenes
    const isTransit = i >= Math.ceil(relevantPlanets.length / 2);
    const offset = isTransit ? daysToToday + ((i - Math.ceil(relevantPlanets.length / 2) + 1) * 30) : 0;

    // For transit scenes in fallback, pair with a slow outer planet transiting this natal planet
    const transitingPlanets = ['saturn', 'jupiter', 'pluto', 'neptune', 'uranus'];
    const transitPlanet = isTransit ? (transitingPlanets.find(tp => tp !== planetKey) ?? 'saturn') : undefined;
    const natalTarget = isTransit ? planetKey : undefined;

    const n: Record<string, Record<string, string>> = {
      venus: {
        love: `Your Venus in ${sign}${house ? ` in the ${house}th house` : ''} — you don't just fall in love, you curate it. You're drawn to people who match your aesthetic, your values. That's not shallow, that's Venus knowing exactly what she wants.`,
        career: `Venus in ${sign} means you bring charm and taste to everything you touch at work. People trust your judgment on what looks right, feels right.`,
        growth: `Venus in ${sign} is teaching you what you're actually worth. Not what you settled for. Not what you were told.`,
        health: `Venus in ${sign} says pleasure IS medicine for you. Not guilt. Beautiful food, beautiful spaces, sensory joy.`,
        spiritual: `Venus in ${sign} finds God in beauty. A sunset, a song, a face. That's not superficial — that's your path.`,
      },
      moon: {
        love: `Your Moon in ${sign}${house ? ` in the ${house}th house` : ''} — this is what you actually need, not what you tell people you need. You feel safe when things are ${sign === 'Aries' ? 'honest and direct' : sign === 'Taurus' ? 'stable and predictable' : sign === 'Cancer' ? 'emotionally close' : sign === 'Scorpio' ? 'deep and real' : 'genuine'}.`,
        career: `Moon in ${sign} — you work best when you feel emotionally invested. If you don't care, you can't perform. That's not a weakness, that's your superpower.`,
        growth: `Your Moon in ${sign} holds patterns from way back. Some still serve you. Some are just familiar. This is about learning the difference.`,
        health: `Moon in ${sign} — your body and your emotions are the same system. When you're stressed, your body speaks up. Listen to it.`,
        spiritual: `Moon in ${sign} — your dreams and gut feelings are trying to tell you something. You've probably been right more than you gave yourself credit for.`,
      },
      sun: {
        love: `Your Sun in ${sign}${house ? ` in the ${house}th house` : ''} — this is who you need to be in a relationship. Not smaller. Not filtered. You need someone who can handle the full wattage.`,
        career: `Sun in ${sign} — this is the energy you're supposed to bring to the world. When your work lets you be fully this, you're unstoppable.`,
        growth: `Your Sun in ${sign} is who you're growing into, not who you already are. It's a direction, not a destination.`,
        health: `Sun in ${sign} rules your core vitality. When you're living authentically, your health follows. When you're not, it shows.`,
        spiritual: `Sun in ${sign} — the question isn't what you believe. It's whether you're living from your center or performing for everyone else.`,
      },
      mars: {
        love: `Mars in ${sign}${house ? ` in the ${house}th house` : ''} — this is how you chase what you want. In love, you're ${sign === 'Aries' ? 'direct and impatient' : sign === 'Scorpio' ? 'intense and all-in' : sign === 'Libra' ? 'strategic and charming' : 'deliberate'} about it.`,
        career: `Mars in ${sign} — you fight for things the ${sign} way. That's your competitive edge. Use it.`,
        growth: `Mars in ${sign} is making you deal with anger, desire, and what you're willing to fight for. That's the growth.`,
        health: `Mars in ${sign} — you've got ${sign === 'Aries' || sign === 'Sagittarius' ? 'energy to burn. Move or it turns to anxiety' : 'bursts of energy. Don\'t ignore them'}.`,
        spiritual: `Mars in ${sign} asks what hill you're willing to die on. Not metaphorically. What actually matters enough to push for?`,
      },
      jupiter: {
        love: `Jupiter in ${sign}${house ? ` in the ${house}th house` : ''} — love expands for you when you stop playing it safe. New people, bigger conversations, saying yes to what scares you a little.`,
        career: `Jupiter in ${sign} — opportunities come to you through ${sign === 'Sagittarius' ? 'travel and big thinking' : sign === 'Capricorn' ? 'hard-earned reputation' : 'being genuinely generous'}. That's your luck formula.`,
        growth: `Jupiter in ${sign} amplifies everything you learn right now. One good insight hits different. Seek wisdom.`,
        health: `Jupiter in ${sign} — you tend to overdo it. More isn't always better. Find the sweet spot.`,
        spiritual: `Jupiter in ${sign} — your faith grows through experience, not theory. Go somewhere new. Read something challenging.`,
      },
      saturn: {
        love: `Saturn in ${sign}${house ? ` in the ${house}th house` : ''} — relationships feel heavy sometimes because you take them seriously. That's not a flaw. The ones that survive Saturn are the ones worth keeping.`,
        career: `Saturn in ${sign} — nothing comes free in your career. But what you build, stays built. You're playing the long game.`,
        growth: `Saturn in ${sign} — the lessons feel unfair until they don't. You're being forged, not punished.`,
        health: `Saturn in ${sign} — structure is your medicine. Routines, discipline, boring consistency. It works.`,
        spiritual: `Saturn in ${sign} — there are no shortcuts on your path. That's not a curse. It means what you earn is real.`,
      },
      pluto: {
        love: `Pluto in ${sign}${house ? ` in the ${house}th house` : ''} — you don't do surface-level anything. In love, you need depth or you walk.`,
        career: `Pluto in ${sign} — you're drawn to power dynamics at work whether you realize it or not. Own it, or it owns you.`,
        growth: `Pluto in ${sign} — something in you needs to die so the real you can show up. Stop holding on.`,
        health: `Pluto in ${sign} — deep healing, not band-aids. Root causes. The stuff you don't want to look at.`,
        spiritual: `Pluto in ${sign} — shadow work isn't optional for you. What you avoid becomes your lesson on repeat.`,
      },
      neptune: {
        love: `Neptune in ${sign}${house ? ` in the ${house}th house` : ''} — you romanticize. You know it. The trick is enjoying the dream without losing yourself in it.`,
        career: `Neptune in ${sign} — creative, healing, or spiritual work suits you. Anything too corporate will drain your soul.`,
        growth: `Neptune in ${sign} — growth for you means accepting that not everything has an answer. Some things just are.`,
        health: `Neptune in ${sign} — you absorb other people's energy like a sponge. Protect yourself. Boundaries are health.`,
        spiritual: `Neptune in ${sign} — you're already more connected than you think. Stop trying so hard. Just be still.`,
      },
      northnode: {
        love: `North Node in ${sign}${house ? ` in the ${house}th house` : ''} — the love that grows you is the one that feels unfamiliar. Comfortable isn't the goal.`,
        career: `North Node in ${sign} — your destiny career path scares you a little. That's exactly how you know it's right.`,
        growth: `North Node in ${sign} — everything comfortable is your past. Everything that stretches you is your future. Lean in.`,
        health: `North Node in ${sign} — the health practice you keep avoiding is probably the one you need most.`,
        spiritual: `North Node in ${sign} — your soul didn't come here to repeat the last life. It came here to try something new.`,
      },
      chiron: {
        love: `Chiron in ${sign}${house ? ` in the ${house}th house` : ''} — your biggest relationship wound is also your superpower. What hurt you made you the partner who actually understands.`,
        career: `Chiron in ${sign} — the career struggle you went through? That's your unique expertise now. Teach it.`,
        growth: `Chiron in ${sign} — your wound isn't going away. The growth is learning to create from it, not despite it.`,
        health: `Chiron in ${sign} — traditional medicine might not be enough. Look into the alternatives you've been curious about.`,
        spiritual: `Chiron in ${sign} — you can't heal by going around the wound. You heal by going through it.`,
      },
      mercury: {
        love: `Mercury in ${sign}${house ? ` in the ${house}th house` : ''} — communication is your love language. When someone matches your mental wavelength, everything else follows.`,
        career: `Mercury in ${sign} — your brain works the ${sign} way. Fast, thorough, creative — whatever it is, that's your professional edge.`,
        growth: `Mercury in ${sign} — you process life through thinking about it. Journaling, talking it out, reading. Feed your mind.`,
        health: `Mercury in ${sign} — overthinking is your stress trigger. Get out of your head and into your body.`,
        spiritual: `Mercury in ${sign} — your spiritual insights come through words, conversations, sudden realizations. Pay attention.`,
      },
    };

    const effectiveTopic = topic === 'custom' ? 'growth' : topic;
    const narration = n[planetKey]?.[effectiveTopic] ?? `${name}, your ${planetKey} in ${sign}${house ? ` in the ${house}th house` : ''} has something real to say about this area of your life.`;

    return {
      title: `${planetKey.charAt(0).toUpperCase() + planetKey.slice(1)} in ${sign}`,
      narration,
      focusPlanet: planetKey,
      transitPlanet,
      natalTarget,
      sceneType: isTransit ? 'transit' as const : 'natal' as const,
      transitDayOffset: offset,
      durationSeconds: 14,
      mood: i === 0 ? 'calm' : i === relevantPlanets.length - 1 ? 'transformative' : ['reflective', 'joyful', 'intense'][i % 3] as JourneyScene['mood'],
    };
  });

  return {
    topic,
    title: `${topicInfo.icon} ${topicInfo.label}`,
    intro: `${name}, let's look at what your chart actually says about your ${topicInfo.label.toLowerCase()}.`,
    scenes,
    outro: `That's your chart talking, ${name}. Not fortune-telling — just the patterns that are already playing out in your life. Use what resonates.`,
  };
}
