import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const XAI_API_KEY = Deno.env.get("XAI_API_KEY") || Deno.env.get("COSMOSIS_GROK_API_KEY")!;
const SWISSEPH_API_URL = "https://druzematch.fly.dev";
const SWISSEPH_API_KEY = Deno.env.get("SWISSEPH_API_KEY")!;

const TIER_ORDER = ["horoscope", "astrologer", "professional"];

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getSign(longitude: number): string {
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  return signs[Math.floor(longitude / 30)];
}

// ─── Rich interpretation helpers ───────────────────────────────────

const AVG_DAILY_MOTION: Record<string, number> = {
  sun: 0.986, moon: 13.176, mercury: 1.383, venus: 1.2,
  mars: 0.524, jupiter: 0.083, saturn: 0.034,
  uranus: 0.012, neptune: 0.006, pluto: 0.004,
  northnode: 0.053, chiron: 0.02,
};

const ASPECT_ANGLES: Record<string, number> = {
  Conjunction: 0, Opposition: 180, Trine: 120, Square: 90,
  Sextile: 60, Quincunx: 150, SemiSextile: 30,
  SemiSquare: 45, Sesquiquadrate: 135, Quintile: 72,
};

function getHouseWSS(longitude: number, ascendant: number): number {
  const offset = ((longitude - ascendant) % 360 + 360) % 360;
  return Math.floor(offset / 30) + 1;
}

function getDecan(longitude: number): number {
  return Math.floor((longitude % 30) / 10) + 1;
}

function isApplying(
  transitLong: number, natalLong: number, aspectAngle: number,
  dailyMotion: number, retrograde: boolean
): { applying: boolean; daysToExact: number } {
  const diff = ((transitLong - natalLong) % 360 + 360) % 360;
  const orb = Math.min(
    Math.abs(diff - aspectAngle),
    Math.abs(diff - aspectAngle + 360),
    Math.abs(diff - aspectAngle - 360)
  );
  const effectiveMotion = retrograde ? -dailyMotion : dailyMotion;
  const nextDiff = (((transitLong + effectiveMotion) - natalLong) % 360 + 360) % 360;
  const nextOrb = Math.min(
    Math.abs(nextDiff - aspectAngle),
    Math.abs(nextDiff - aspectAngle + 360),
    Math.abs(nextDiff - aspectAngle - 360)
  );
  const applying = nextOrb < orb;
  const daysToExact = orb / Math.abs(dailyMotion || 0.01);
  return { applying, daysToExact: applying ? daysToExact : -daysToExact };
}

// Helper to get the Monday of the current week (for weekly lookup)
function getCurrentWeekMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
}

// Helper to get the 1st of the current month (for monthly lookup)
function getCurrentMonthFirst(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

// ─── Main handler ──────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Auth user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "No auth header" }, 401);
    }

    // Parse optional body for local_date
    let requestBody: Record<string, unknown> = {};
    try { requestBody = await req.json(); } catch { /* no body is fine */ }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser(token);
    if (authError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // 2. Check tier
    const { data: profile } = await supabaseAdmin
      .from("astrologer_profiles")
      .select("subscription_tier, subscription_status")
      .eq("id", user.id)
      .maybeSingle();

    const userTier = profile?.subscription_tier || "lite";
    const hasHoroscopeAccess = TIER_ORDER.includes(userTier);

    // 3. Fetch user's first saved natal chart
    const { data: savedChart } = await supabaseAdmin
      .from("saved_charts")
      .select("person_a_name, person_a_date, person_a_time, person_a_location, person_a_lat, person_a_lng, person_a_chart")
      .eq("user_id", user.id)
      .eq("chart_type", "natal")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!savedChart) {
      return jsonResponse({
        error: "Save a birth chart first to get personalized horoscopes",
        code: "no_natal_chart",
        horoscope: null,
      });
    }

    // Use client's local date if provided (resets at user's midnight), fallback to server UTC
    const localDate = typeof requestBody?.local_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(requestBody.local_date)
      ? requestBody.local_date
      : null;
    const today = localDate || getTodayDate();

    // ── FREE USER: try generic sign horoscopes first ───────────────
    if (!hasHoroscopeAccess) {
      const natalChart = savedChart.person_a_chart;
      const sunLong = natalChart?.planets?.sun?.longitude || 0;
      const sunSign = natalChart?.planets?.sun?.sign || getSign(sunLong);

      // Fetch daily, weekly, and monthly sign horoscopes
      const weekMonday = getCurrentWeekMonday();
      const monthFirst = getCurrentMonthFirst();

      const { data: signHoroscopes } = await supabaseAdmin
        .from("astrologer_sign_horoscopes")
        .select("period, content, horoscope_date")
        .eq("sign", sunSign)
        .or(`and(period.eq.daily,horoscope_date.eq.${today}),and(period.eq.weekly,horoscope_date.eq.${weekMonday}),and(period.eq.monthly,horoscope_date.eq.${monthFirst})`);

      const daily = signHoroscopes?.find(h => h.period === "daily");
      const weekly = signHoroscopes?.find(h => h.period === "weekly");
      const monthly = signHoroscopes?.find(h => h.period === "monthly");

      // If sign horoscopes exist, return them
      if (daily) {
        return jsonResponse({
          horoscope: { content: daily.content, generic: true, sign: sunSign },
          weekly: weekly ? { content: weekly.content, generic: true, sign: sunSign } : null,
          monthly: monthly ? { content: monthly.content, generic: true, sign: sunSign } : null,
          cached: true,
          date: today,
        });
      }
      // Otherwise, fall through to personal horoscope generation below
    }

    // ── PERSONAL HOROSCOPE (paid users, or free users without sign data) ──

    // 4. Check DB cache for today's horoscope (single "daily" row)
    const { data: cached } = await supabaseAdmin
      .from("astrologer_horoscopes")
      .select("content, transit_summary, natal_snapshot")
      .eq("user_id", user.id)
      .eq("horoscope_date", today)
      .eq("topic", "daily")
      .maybeSingle();

    // 5. If cached, return immediately
    if (cached) {
      return jsonResponse({
        horoscope: {
          content: cached.content,
          question: cached.transit_summary?.question || null,
          natal_snapshot: cached.natal_snapshot,
        },
        cached: true,
        date: today,
      });
    }

    // 6. Call Swiss Ephemeris /transit
    const natalChart = savedChart.person_a_chart;
    const transitRes = await fetch(`${SWISSEPH_API_URL}/transit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SWISSEPH_API_KEY}`,
      },
      body: JSON.stringify({
        natal_chart: natalChart,
        transit_date: today,
        transit_time: "12:00",
        lat: savedChart.person_a_lat,
        lng: savedChart.person_a_lng,
      }),
    });

    if (!transitRes.ok) {
      const errText = await transitRes.text();
      console.error("Transit API error:", errText);
      return jsonResponse({ error: "Failed to fetch transit data" }, 500);
    }

    const transitData = await transitRes.json();

    // ── Build rich natal context ──────────────────────────────────
    const planets = natalChart?.planets || {};
    const ascLong = natalChart?.ascendant || natalChart?.houses?.[0] || 0;

    const richNatalSummary = Object.entries(planets)
      .filter(([key]) => !["ascendant", "midheaven", "ic", "descendant"].includes(key))
      .map(([key, val]: [string, any]) => {
        const long = val.longitude || 0;
        const sign = val.sign || getSign(long);
        const house = getHouseWSS(long, ascLong);
        const deg = (long % 30).toFixed(1);
        const decan = getDecan(long);
        return `${key}: ${deg}° ${sign}, House ${house}, Decan ${decan}${val.retrograde ? " [R]" : ""}`;
      })
      .join("\n");

    const natalAspects = (natalChart?.aspects || [])
      .slice(0, 15)
      .map((a: any) => `${a.planet1} ${a.aspect} ${a.planet2} (orb ${a.orb?.toFixed(1)}°)`)
      .join("\n");

    // ── Build rich transit context ────────────────────────────────
    const enrichedTransits = (transitData.aspects_to_natal || [])
      .filter((a: any) => a.orb <= 5)
      .slice(0, 20)
      .map((a: any) => {
        const tPlanet = (transitData.transit_planets || []).find((p: any) => p.planet === a.transitPlanet);
        const nPlanet = planets[(a.natalPlanet || "").toLowerCase()];
        const tKey = (a.transitPlanet || "").toLowerCase();
        const motion = AVG_DAILY_MOTION[tKey] || 0.01;
        let timing = "";
        if (tPlanet && nPlanet) {
          const { applying, daysToExact } = isApplying(
            tPlanet.longitude, nPlanet.longitude,
            ASPECT_ANGLES[a.aspect] ?? 0, motion, tPlanet.retrograde
          );
          timing = applying
            ? `APPLYING (~${Math.abs(daysToExact).toFixed(1)}d to exact, energy BUILDING)`
            : `SEPARATING (peaked ~${Math.abs(daysToExact).toFixed(1)}d ago, INTEGRATING)`;
        }
        const speed = motion > 1 ? "fast" : motion > 0.1 ? "moderate" : "slow";
        return `${a.transitPlanet} ${a.aspect} natal ${a.natalPlanet} (orb ${a.orb.toFixed(1)}°, ${timing}, ${speed}-moving)${tPlanet?.retrograde ? " [transit R]" : ""}`;
      })
      .join("\n");

    const allTransitPositions = (transitData.transit_planets || [])
      .map((p: any) => `${p.planet} in ${p.sign}${p.retrograde ? " (R)" : ""}`)
      .join(", ");

    // Build simple natal summary for snapshot storage
    const sunSign = planets.sun?.sign || getSign(planets.sun?.longitude || 0);
    const moonSign = planets.moon?.sign || getSign(planets.moon?.longitude || 0);
    let risingSign = "unknown";
    if (natalChart?.houses?.length > 0) {
      risingSign = getSign(natalChart.houses[0]);
    } else if (natalChart?.ascendant) {
      risingSign = getSign(natalChart.ascendant);
    }

    const natalSummary = {
      sun: `${sunSign} Sun`,
      moon: `${moonSign} Moon`,
      rising: risingSign !== "unknown" ? `${risingSign} Rising` : null,
    };

    // 7. Single Grok call — reading + question
    // Rotate question style by day-of-year so each day feels different
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const questionStyles = [
      `a bold "What if you..." opener — an exciting possibility they haven't considered yet`,
      `a gentle dare: "Today might be the day to..." — something specific and achievable they can act on`,
      `a vivid either/or: "Would you rather X or Y today?" — both options inspired by the best energy available`,
      `a permission slip: "You're allowed to..." — something they secretly want but haven't given themselves permission for`,
      `a playful challenge: "I dare you to..." — something small but meaningful that rides the day's momentum`,
      `a reframe: "What would change if you saw [situation] as [positive angle]?" — rooted in today's energy`,
      `a "notice this" prompt: "Pay attention to..." — pointing them toward a specific sign, feeling, or opportunity today`,
    ];
    const questionStyle = questionStyles[dayOfYear % questionStyles.length];

    const systemPrompt = `You write short, punchy daily energy readings grounded in precise chart data.

Your job: tell this person what today FEELS LIKE for them specifically. Be concrete — mention the areas of life affected (love, work, creativity, money, friendships, family, health, etc.), name the moods and impulses they'll notice, and highlight the #1 thing working in their favor today.

Structure:
- 2-3 short sentences. Each sentence should land a specific, useful insight. Think fortune cookie meets best friend — vivid, warm, a little surprising.
- Then one catalyzing question in the style described below.

Today's question style: ${questionStyle}

The question must be rooted in the POSITIVE energies available to them today — it should inspire action or shift perspective, never make them anxious.

RULES:
- Zero astrological jargon (no planet names, sign names, house numbers, aspect names, degrees)
- Be SPECIFIC: instead of "good energy for communication" say "a conversation you've been putting off could go surprisingly well"
- Each sentence = one clear insight, separated by line breaks
- Warm, direct, slightly exciting — like a perceptive friend giving them the inside scoop on their day`;

    const userPrompt = `Write a personalized daily energy reading for today (${today}).

**Natal Chart (full placements):**
${richNatalSummary}

**Key Natal Aspects:**
${natalAspects || "Not available"}

**Today's Transits to This Chart:**
${enrichedTransits || "No significant transits today"}

**Current Sky:**
${allTransitPositions}

Respond ONLY with JSON (no markdown, no code fences):
{"content": "sentence one\\nsentence two\\nsentence three", "question": "the catalyzing question"}`;

    const grokRes = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${XAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-4-1-fast",
        temperature: 0.7,
        max_tokens: 600,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!grokRes.ok) {
      const errText = await grokRes.text();
      console.error("Grok API error:", errText);
      return jsonResponse({ error: "Failed to generate horoscopes" }, 500);
    }

    const grokData = await grokRes.json();
    let content = grokData.choices?.[0]?.message?.content || "";

    // Strip markdown code fences if present
    content = content.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();

    let parsed: { content: string; question: string };
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("Failed to parse Grok response:", content);
      return jsonResponse({ error: "Failed to parse horoscope response" }, 500);
    }

    // 8. Upsert single row into astrologer_horoscopes
    const natalSnapshot = {
      sun: natalSummary.sun,
      moon: natalSummary.moon,
      rising: natalSummary.rising,
      name: savedChart.person_a_name,
    };

    await supabaseAdmin
      .from("astrologer_horoscopes")
      .upsert({
        user_id: user.id,
        topic: "daily",
        horoscope_date: today,
        content: parsed.content,
        transit_summary: { question: parsed.question },
        natal_snapshot: natalSnapshot,
      }, { onConflict: "user_id,topic,horoscope_date" });

    // 9. Return singular horoscope object
    return jsonResponse({
      horoscope: {
        content: parsed.content,
        question: parsed.question,
        natal_snapshot: natalSnapshot,
      },
      cached: false,
      date: today,
    });
  } catch (err: any) {
    console.error("Daily horoscope error:", err?.message, err?.stack);
    return jsonResponse({ error: err?.message || "Unknown error", detail: String(err) }, 500);
  }
});
