/**
 * InsightJourney — 2D chart journey for insight reading pages
 * Uses the real BiWheel chart component with TTS narration and scene progression.
 * First 2 scenes are free (teaser), remaining scenes behind paywall.
 */

import React, { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Lock, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { NatalChart } from '@/components/biwheel/types';

const BiWheelMobileWrapper = lazy(() => import('@/components/biwheel/BiWheelMobileWrapper'));

// ─── Types ────────────────────────────────────────────────────────

interface JourneyScene {
  title: string;
  narration: string;
  focusPlanet: string;
  mood: 'calm' | 'intense' | 'joyful' | 'reflective' | 'transformative';
}

interface JourneyData {
  title: string;
  intro: string;
  scenes: JourneyScene[];
  outro: string;
}

interface InsightJourneyProps {
  journeyData: JourneyData;
  chart: NatalChart;
  totalSceneCount: number; // Total scenes expected (from planner), used for progress bar + locked count
  freeSceneCount: number;
  resumeAtScene?: number; // Scene index to resume from (after Stripe return)
  onPaywallHit: () => void;
  onComplete: (responses: Array<{ sceneIndex: number; title: string; narration: string; response: 'yes' | 'no' | 'skipped' }>) => void;
}

const MOOD_COLORS: Record<string, string> = {
  calm: '#818cf8', intense: '#ef4444', joyful: '#f59e0b',
  reflective: '#8b5cf6', transformative: '#22c55e',
};

// ─── TTS Engine ───────────────────────────────────────────────────

const supabaseUrl = import.meta.env.VITE_ASTROLOGER_SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_ASTROLOGER_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

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
  // Persistent Audio element — once unlocked by a user gesture, it stays trusted
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const genRef = useRef(0);
  const cacheRef = useRef<Map<number, Blob>>(new Map());
  const [speaking, setSpeaking] = useState(false);
  const pendingRef = useRef<{ gen: number; onEnd?: () => void } | null>(null);
  const currentUrlRef = useRef<string | null>(null);
  const unlockedRef = useRef(false);

  const cleanup = useCallback(() => {
    const audio = audioRef.current;
    audio.pause();
    audio.onplay = null;
    audio.onended = null;
    audio.onerror = null;
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current);
      currentUrlRef.current = null;
    }
    pendingRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const preload = useCallback(async (data: JourneyData) => {
    cacheRef.current.clear();
    const entries: [number, string][] = [
      [-1, data.intro],
      ...data.scenes.map((s, i): [number, string] => [i, s.narration]),
      [data.scenes.length, data.outro],
    ];
    const promises = entries.map(async ([idx, text]) => {
      const blob = await fetchTTSBlob(text);
      if (blob) cacheRef.current.set(idx, blob);
    });
    await Promise.race([promises[0], new Promise(r => setTimeout(r, 8000))]);
    Promise.allSettled(promises);
  }, []);

  const speak = useCallback(async (idx: number, text: string, onEnd?: () => void) => {
    cleanup();
    setSpeaking(false);
    const gen = ++genRef.current;

    let blob = cacheRef.current.get(idx) ?? null;
    if (!blob) blob = await fetchTTSBlob(text);
    if (gen !== genRef.current) return;
    if (!blob) { onEnd?.(); return; }

    const url = URL.createObjectURL(blob);
    currentUrlRef.current = url;
    const audio = audioRef.current;
    audio.src = url;

    audio.onplay = () => { if (gen === genRef.current) { setSpeaking(true); unlockedRef.current = true; } };
    audio.onended = () => {
      setSpeaking(false);
      if (currentUrlRef.current === url) { URL.revokeObjectURL(url); currentUrlRef.current = null; }
      if (gen === genRef.current) onEnd?.();
    };
    audio.onerror = () => {
      setSpeaking(false);
      if (currentUrlRef.current === url) { URL.revokeObjectURL(url); currentUrlRef.current = null; }
      if (gen === genRef.current) onEnd?.();
    };

    try {
      await audio.play();
    } catch {
      // Autoplay blocked — store pending so user gesture can unlock
      setSpeaking(false);
      pendingRef.current = { gen, onEnd };
    }
  }, [cleanup]);

  // Called on any user interaction to unlock the persistent Audio element.
  // Once play() succeeds from a gesture, the browser trusts this element for future plays.
  const unlockAndPlay = useCallback(() => {
    if (unlockedRef.current) return; // already unlocked
    // Mark as unlocked optimistically — the play() call from a gesture context
    // is what the browser needs, even if the promise resolves later
    unlockedRef.current = true;

    const pending = pendingRef.current;
    if (pending && pending.gen === genRef.current) {
      // There's pending audio — play it (this gesture unlocks the element)
      pendingRef.current = null;
      audioRef.current.play().then(() => {
        setSpeaking(true);
      }).catch(() => {
        setSpeaking(false);
        unlockedRef.current = false; // wasn't actually unlocked
        pending.onEnd?.();
      });
    } else {
      // No pending audio — do a silent unlock so future speak() calls work
      const audio = audioRef.current;
      const prevHandlers = { onplay: audio.onplay, onended: audio.onended, onerror: audio.onerror };
      audio.onplay = null;
      audio.onended = null;
      audio.onerror = null;
      audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
      audio.volume = 0;
      audio.play().then(() => {
        audio.pause();
        audio.volume = 1;
        audio.onplay = prevHandlers.onplay;
        audio.onended = prevHandlers.onended;
        audio.onerror = prevHandlers.onerror;
      }).catch(() => {
        audio.volume = 1;
        audio.onplay = prevHandlers.onplay;
        audio.onended = prevHandlers.onended;
        audio.onerror = prevHandlers.onerror;
        unlockedRef.current = false;
      });
    }
  }, []);

  const stop = useCallback(() => { genRef.current++; cleanup(); setSpeaking(false); }, [cleanup]);
  const pause = useCallback(() => { audioRef.current.pause(); }, []);
  const resume = useCallback(() => { audioRef.current.play(); }, []);

  return { speak, stop, pause, resume, preload, speaking, unlockAndPlay, cacheRef };
}

// ─── Journey Player ───────────────────────────────────────────────

export function InsightJourney({
  journeyData,
  chart,
  totalSceneCount,
  freeSceneCount,
  resumeAtScene,
  onPaywallHit,
  onComplete,
}: InsightJourneyProps) {
  const [currentScene, setCurrentScene] = useState(resumeAtScene ?? -1); // -1 = intro
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [paywallReached, setPaywallReached] = useState(false);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const [waitingForLoad, setWaitingForLoad] = useState(false); // waiting for next scene to stream in
  const [highestScene, setHighestScene] = useState(resumeAtScene ?? -1); // track furthest visited scene
  const sceneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playingRef = useRef(-2);
  const responsesRef = useRef<Array<{ sceneIndex: number; title: string; narration: string; response: 'yes' | 'no' | 'skipped' }>>([]);
  const tts = useTTS();

  // Track which TTS indices we've already started preloading
  const preloadedRef = useRef<Set<number>>(new Set());

  // Incremental TTS preloading — preload intro + current scene + next 3 as scenes stream in
  useEffect(() => {
    const cache = preloadedRef.current;

    // Always preload intro first
    if (!cache.has(-1) && journeyData.intro) {
      cache.add(-1);
      fetchTTSBlob(journeyData.intro).then(blob => {
        if (blob) tts.cacheRef?.current?.set(-1, blob);
        setIsReady(true); // Ready once intro is preloaded
      });
    }

    // Preload current + next 3 scenes
    const start = Math.max(0, currentScene);
    const end = Math.min(start + 4, journeyData.scenes.length);
    for (let i = start; i < end; i++) {
      const scene = journeyData.scenes[i];
      if (!scene?.narration || cache.has(i)) continue;
      cache.add(i);
      fetchTTSBlob(scene.narration).then(blob => {
        if (blob) tts.cacheRef?.current?.set(i, blob);
      });
    }

    // Preload outro when near the end
    if (journeyData.scenes.length >= totalSceneCount - 2 && journeyData.outro && !cache.has(totalSceneCount)) {
      cache.add(totalSceneCount);
      fetchTTSBlob(journeyData.outro).then(blob => {
        if (blob) tts.cacheRef?.current?.set(journeyData.scenes.length, blob);
      });
    }
  }, [journeyData.scenes.length, currentScene]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-resume when waiting for load and the scene becomes available
  useEffect(() => {
    if (waitingForLoad && currentScene >= 0 && currentScene < journeyData.scenes.length && journeyData.scenes[currentScene]) {
      setWaitingForLoad(false);
      playingRef.current = -2; // force re-trigger
    }
  }, [waitingForLoad, journeyData.scenes.length, currentScene]); // eslint-disable-line react-hooks/exhaustive-deps

  // When freeSceneCount increases (payment), resume from where we left off
  useEffect(() => {
    if (paywallReached && freeSceneCount > 3) {
      setPaywallReached(false);
      setIsPlaying(true);
      playingRef.current = -2; // force re-trigger of play effect
    }
  }, [freeSceneCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const scene = currentScene >= 0 && currentScene < journeyData.scenes.length
    ? journeyData.scenes[currentScene]
    : null;
  const isIntro = currentScene === -1;
  const isOutro = currentScene >= totalSceneCount;
  const moodColor = scene ? MOOD_COLORS[scene.mood] ?? '#818cf8' : '#818cf8';
  const totalScenes = totalSceneCount;
  const progress = isIntro ? 0 : isOutro ? 100 : Math.min(((currentScene + 1) / totalScenes) * 100, 100);

  const startJourney = useCallback(() => {
    setCurrentScene(-1);
    setIsPlaying(true);
    playingRef.current = -2;
  }, []);

  const advanceScene = useCallback(() => {
    setCurrentScene(prev => {
      const next = prev + 1;
      if (next >= freeSceneCount && !paywallReached) {
        setPaywallReached(true);
        setIsPlaying(false);
        onPaywallHit();
        return prev;
      }
      // Check if all scenes are done (use totalSceneCount as the true total)
      const actualTotal = Math.max(journeyData.scenes.length, totalSceneCount);
      if (next >= actualTotal) {
        // Last scene done — complete immediately, no outro
        setIsPlaying(false);
        onComplete(responsesRef.current);
        return prev;
      }
      // Guard: if next scene hasn't streamed in yet, show loading
      if (next >= journeyData.scenes.length || !journeyData.scenes[next]) {
        setWaitingForLoad(true);
        setHighestScene(h => Math.max(h, next));
        return next; // move to that index, but waitingForLoad will show spinner
      }
      setHighestScene(h => Math.max(h, next));
      return next;
    });
  }, [journeyData, totalSceneCount, freeSceneCount, paywallReached, onPaywallHit, onComplete]);

  // Navigate to a previously visited scene
  const goToScene = useCallback((target: number) => {
    if (target < -1 || target > highestScene) return;
    if (target >= freeSceneCount) return; // can't jump past paywall
    tts.stop();
    if (sceneTimerRef.current) clearTimeout(sceneTimerRef.current);
    setWaitingForResponse(false);
    playingRef.current = -2;
    setCurrentScene(target);
  }, [highestScene, freeSceneCount, tts]);

  const goBack = useCallback(() => {
    if (currentScene <= 0) return; // don't go back past first scene
    goToScene(currentScene - 1);
  }, [currentScene, goToScene]);

  // Whether this scene is a revisit (already been past it)
  const isRevisit = currentScene < highestScene;

  // Play scene effects — narrate, then wait for user response
  useEffect(() => {
    if (!isPlaying || !isReady) return;
    if (waitingForLoad) return; // waiting for scene to stream in
    if (playingRef.current === currentScene) return;
    playingRef.current = currentScene;

    if (sceneTimerRef.current) clearTimeout(sceneTimerRef.current);

    // Revisited scenes: skip TTS, just show text with nav controls
    if (isRevisit && !isIntro && !isOutro) {
      setWaitingForResponse(true);
      return;
    }

    const text = isIntro
      ? journeyData.intro
      : isOutro
        ? journeyData.outro
        : scene?.narration ?? '';

    if (!isMuted && text) {
      setWaitingForResponse(false);
      tts.speak(currentScene, text, () => {
        // After TTS finishes:
        if (isIntro || isOutro) {
          // Auto-advance intro and outro
          sceneTimerRef.current = setTimeout(advanceScene, 1500);
        } else {
          // For scenes: wait for user to press yes/no
          setWaitingForResponse(true);
        }
      });
      // Fallback: if audio doesn't start within 2s (autoplay blocked), show yes/no buttons anyway
      // The user's tap on yes/no will unlock audio for subsequent cards
      sceneTimerRef.current = setTimeout(() => {
        if (!tts.speaking && !waitingForResponse) {
          setWaitingForResponse(true);
        }
      }, 2000);
    } else {
      if (isIntro || isOutro) {
        const duration = isIntro ? 4000 : 5000;
        sceneTimerRef.current = setTimeout(advanceScene, duration);
      } else {
        // Muted or no text: show text, wait for response
        if (!waitingForResponse) setWaitingForResponse(true);
      }
    }

    return () => {
      if (sceneTimerRef.current) clearTimeout(sceneTimerRef.current);
    };
  }, [isPlaying, isReady, currentScene, isMuted, waitingForLoad]); // eslint-disable-line react-hooks/exhaustive-deps

  // User responds to a scene
  const handleResponse = useCallback((response: 'yes' | 'no') => {
    setWaitingForResponse(false);
    tts.stop();
    if (sceneTimerRef.current) clearTimeout(sceneTimerRef.current);
    playingRef.current = -2;
    // Track the response
    if (scene) {
      responsesRef.current.push({
        sceneIndex: currentScene,
        title: scene.title,
        narration: scene.narration,
        response,
      });
    }
    advanceScene();
  }, [tts, advanceScene, scene, currentScene]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      tts.pause();
      if (sceneTimerRef.current) clearTimeout(sceneTimerRef.current);
    } else {
      playingRef.current = -2;
      tts.resume();
    }
    setIsPlaying(v => !v);
  }, [isPlaying, tts]);

  const skipScene = useCallback(() => {
    tts.stop();
    if (sceneTimerRef.current) clearTimeout(sceneTimerRef.current);
    playingRef.current = -2;
    // Track skip as a response
    if (scene) {
      responsesRef.current.push({
        sceneIndex: currentScene,
        title: scene.title,
        narration: scene.narration,
        response: 'skipped',
      });
    }
    advanceScene();
  }, [tts, advanceScene, scene, currentScene]);

  const focusPlanetKey = scene?.focusPlanet ?? null;

  const PLANET_LABELS: Record<string, string> = {
    sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
    jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune',
    pluto: 'Pluto', northnode: 'North Node', southnode: 'South Node', chiron: 'Chiron',
    lilith: 'Lilith', ascendant: 'Ascendant', midheaven: 'Midheaven',
  };

  const ASPECT_DEFS = [
    { name: 'conjunct', angle: 0, orb: 8, symbol: '\u260C' },
    { name: 'opposite', angle: 180, orb: 8, symbol: '\u260D' },
    { name: 'trine', angle: 120, orb: 8, symbol: '\u25B3' },
    { name: 'square', angle: 90, orb: 8, symbol: '\u25A1' },
    { name: 'sextile', angle: 60, orb: 6, symbol: '\u2731' },
  ];

  // Build chart context for the current scene's focus planet
  const sceneContext = React.useMemo(() => {
    if (!focusPlanetKey || !chart.planets[focusPlanetKey]) return null;
    const p = chart.planets[focusPlanetKey];
    const label = PLANET_LABELS[focusPlanetKey] ?? focusPlanetKey;
    const house = p.house ? `${p.house}${p.house === 1 ? 'st' : p.house === 2 ? 'nd' : p.house === 3 ? 'rd' : 'th'} house` : null;
    const retro = p.retrograde ? ' (retrograde)' : '';

    // Find aspects to this planet (only major planets)
    const aspects: { planet: string; type: string; symbol: string; orb: string }[] = [];
    for (const [key, other] of Object.entries(chart.planets)) {
      if (key === focusPlanetKey) continue;
      if (!PLANET_LABELS[key]) continue; // skip asteroids/minor bodies
      const otherP = other as any;
      if (!otherP.longitude) continue;
      const diff = Math.abs(p.longitude - otherP.longitude);
      const angle = diff > 180 ? 360 - diff : diff;
      for (const asp of ASPECT_DEFS) {
        const orb = Math.abs(angle - asp.angle);
        if (orb <= asp.orb) {
          aspects.push({
            planet: PLANET_LABELS[key] ?? key,
            type: asp.name,
            symbol: asp.symbol,
            orb: orb.toFixed(1),
          });
          break;
        }
      }
    }
    // Sort by tightest orb
    aspects.sort((a, b) => parseFloat(a.orb) - parseFloat(b.orb));

    return {
      label,
      sign: p.sign,
      house,
      retro,
      degree: p.longitude ? `${Math.floor(p.longitude % 30)}°` : null,
      aspects: aspects.slice(0, 4), // show top 4
    };
  }, [focusPlanetKey, chart]);

  // Compute the highlight for the current scene's focus planet
  const highlightPlanet = React.useMemo(() => {
    if (!focusPlanetKey || isIntro || isOutro) return null;
    // Only highlight when actively playing a scene
    if (!chart.planets[focusPlanetKey]) return null;
    return { planet: focusPlanetKey, chart: 'A' as const };
  }, [focusPlanetKey, isIntro, isOutro, chart.planets]);

  // All planets/points that can appear in an AI reading
  const ALL_READING_PLANETS = React.useMemo(() => new Set([
    'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn',
    'uranus', 'neptune', 'pluto', 'northnode', 'southnode', 'chiron', 'lilith',
    'ascendant', 'midheaven', 'descendant', 'ic',
  ]), []);

  // ── Chart component (shared across states) ──
  const chartEl = (
    <div className="relative rounded-xl overflow-hidden border border-border">
      <Suspense fallback={
        <div className="flex items-center justify-center h-[400px] bg-card">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      }>
        <BiWheelMobileWrapper
          chartA={chart}
          chartB={chart}
          nameA=""
          nameB=""
          readOnly
          initialChartMode="personA"
          initialShowHouses
          initialShowDegreeMarkers
          initialStraightAspects
          initialShowEffects={false}
          initialTheme="classic"
          initialVisiblePlanets={ALL_READING_PLANETS}
          highlightPlanet={highlightPlanet}
        />
      </Suspense>
    </div>
  );

  // Auto-start when ready (both fresh journey and resume after Stripe)
  useEffect(() => {
    if (isReady && !isPlaying && !paywallReached) {
      if (resumeAtScene != null && currentScene === resumeAtScene) {
        // Resume after payment — auto-start, if browser blocks audio the text + yes/no still show
        setIsPlaying(true);
        playingRef.current = -2;
      } else if (currentScene === -1) {
        startJourney();
      }
    }
  }, [isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Not started yet (loading TTS) ──
  if (!isPlaying && !paywallReached && !isReady) {
    return (
      <div className="space-y-5">
        {chartEl}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-[14px] text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Preparing your reading...
          </div>
        </div>
      </div>
    );
  }

  // ── Paywall reached — show the last free card ──
  if (paywallReached) {
    const lastFreeScene = journeyData.scenes[freeSceneCount - 1];
    const lastMoodColor = lastFreeScene ? MOOD_COLORS[lastFreeScene.mood] ?? '#818cf8' : '#818cf8';
    return (
      <div className="space-y-3">
        {/* Progress bar — frozen at last free scene */}
        <div className="h-0.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${(freeSceneCount / totalScenes) * 100}%`, background: lastMoodColor }}
          />
        </div>

        {/* Last free card */}
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: lastMoodColor }}>
              {lastFreeScene?.title}
            </span>
            <span className="flex-1" />
            <span className="text-[10px] text-muted-foreground">
              {freeSceneCount} / {totalSceneCount}
            </span>
          </div>
          <p className="text-[15px] leading-[1.7] text-foreground/80">
            {lastFreeScene?.narration}
          </p>
        </div>
      </div>
    );
  }

  // ── Playing ──
  const narrationText = isIntro
    ? journeyData.intro
    : isOutro
      ? journeyData.outro
      : scene?.narration ?? '';

  return (
    <div className="space-y-3" onPointerDown={tts.unlockAndPlay}>
      {/* Progress bar */}
      <div className="h-0.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full transition-all duration-1000 rounded-full"
          style={{ width: `${progress}%`, background: moodColor }}
        />
      </div>

      {/* Chart */}
      {chartEl}

      {/* Astrological context strip — below chart, not overlaying */}
      {sceneContext && (isPlaying || paywallReached) && (
        <div className="flex flex-wrap items-center gap-1.5 justify-center py-1">
          <span
            className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border"
            style={{ borderColor: moodColor, color: moodColor, background: `${moodColor}08` }}
          >
            {sceneContext.label} {sceneContext.degree} {sceneContext.sign}
            {sceneContext.house ? ` \u2022 ${sceneContext.house}` : ''}
          </span>
          {sceneContext.aspects.slice(0, 3).map((asp, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full text-[9px] bg-muted text-muted-foreground">
              {asp.symbol} {asp.planet} ({asp.orb}°)
            </span>
          ))}
        </div>
      )}

      {/* Narration card */}
      <div className="rounded-xl border border-border bg-card px-5 py-4 transition-all duration-500">
        {/* Scene label */}
        <div className="flex items-center gap-2 mb-2">
          {scene && (
            <>
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: moodColor }}>
                {scene.title}
              </span>
              <span className="flex-1" />
              <span className="text-[10px] text-muted-foreground">
                {currentScene + 1} / {totalSceneCount}
              </span>
              {currentScene + 1 >= freeSceneCount && freeSceneCount < totalSceneCount && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground/60">
                  <Lock className="w-2.5 h-2.5 inline mr-0.5 -mt-px" />{totalSceneCount - freeSceneCount} locked
                </span>
              )}
            </>
          )}
          {isIntro && <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: moodColor }}>Begin</span>}
        </div>

        {/* Narration or loading */}
        {waitingForLoad ? (
          <div className="flex items-center justify-center gap-2 py-6 text-[14px] text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading next insight...
          </div>
        ) : (
          <p className="text-[15px] leading-[1.7] mb-3 text-foreground/80">
            {narrationText}
          </p>
        )}

        {/* Response buttons — show after TTS finishes narrating a scene */}
        {scene && !isIntro && !isOutro && waitingForResponse && (
          isRevisit ? (
            /* Revisiting — show navigation arrows instead of yes/no */
            <div className="flex items-center gap-3 mb-3 animate-in fade-in duration-500">
              <button
                onClick={goBack}
                disabled={currentScene <= 0}
                className="flex-1 py-2.5 rounded-xl text-[14px] text-muted-foreground border border-border hover:bg-muted disabled:opacity-30 transition-all flex items-center justify-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                onClick={() => goToScene(currentScene + 1)}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-medium border transition-all hover:scale-[1.02] flex items-center justify-center gap-1.5"
                style={{ borderColor: moodColor, color: moodColor, background: `${moodColor}08` }}
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : currentScene === freeSceneCount - 1 && freeSceneCount < totalSceneCount ? (
            /* Last free card — show continue CTA instead of yes/no */
            <div className="space-y-2 mb-3 animate-in fade-in duration-500">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleResponse('yes')}
                  className="flex-1 py-2.5 rounded-xl text-[14px] font-medium border transition-all hover:scale-[1.02]"
                  style={{ borderColor: moodColor, color: moodColor, background: `${moodColor}08` }}
                >
                  Yes, that's me
                </button>
                <button
                  onClick={() => handleResponse('no')}
                  className="flex-1 py-2.5 rounded-xl text-[14px] text-muted-foreground border border-border hover:bg-muted transition-all"
                >
                  Not really
                </button>
              </div>
              <p className="text-[11px] text-center text-muted-foreground/50">
                {totalSceneCount - freeSceneCount} more insights in your full reading
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-3 animate-in fade-in duration-500">
              <button
                onClick={() => handleResponse('yes')}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-medium border transition-all hover:scale-[1.02]"
                style={{ borderColor: moodColor, color: moodColor, background: `${moodColor}08` }}
              >
                Yes, that's me
              </button>
              <button
                onClick={() => handleResponse('no')}
                className="flex-1 py-2.5 rounded-xl text-[14px] text-muted-foreground border border-border hover:bg-muted transition-all"
              >
                Not really
              </button>
            </div>
          )
        )}
        {/* Listening indicator while TTS is playing */}
        {scene && !isIntro && !isOutro && !waitingForResponse && isPlaying && (
          <div className="flex items-center gap-2 mb-3 text-[12px] text-muted-foreground">
            <div className="flex gap-0.5">
              <div className="w-1 h-3 bg-current rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-4 bg-current rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
            Listening...
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={goBack}
            disabled={currentScene <= 0}
            className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={togglePlay}
            className="p-2 rounded-lg transition-colors"
            style={{ background: `${moodColor}15`, color: moodColor }}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={() => { setWaitingForResponse(false); skipScene(); }}
            className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setIsMuted(prev => {
                if (!prev) {
                  // Muting: stop the audio
                  tts.stop();
                } else if (!waitingForResponse) {
                  // Unmuting while TTS should be playing: re-trigger TTS for current scene
                  playingRef.current = -2; // force the play effect to re-fire
                }
                return !prev;
              });
            }}
            className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Scene dots — clickable for visited scenes, locked ones dimmed */}
          <div className="flex-1 flex items-center justify-center gap-1">
            {Array.from({ length: totalSceneCount }, (_, i) => i).map(i => {
              const isLocked = i >= freeSceneCount;
              const isVisited = i <= highestScene;
              const isCurrent = i === currentScene;
              return (
                <button
                  key={i}
                  onClick={() => isVisited && !isLocked && goToScene(i)}
                  disabled={!isVisited || isLocked}
                  className={`rounded-full transition-all ${isLocked ? 'w-1 h-1 opacity-30' : isCurrent ? 'w-2.5 h-2.5' : 'w-1.5 h-1.5'} ${isVisited && !isLocked ? 'cursor-pointer hover:scale-150' : ''}`}
                  style={{
                    background: isLocked
                      ? 'hsl(var(--muted-foreground))'
                      : isCurrent ? moodColor : isVisited ? `${moodColor}60` : 'hsl(var(--muted))',
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
