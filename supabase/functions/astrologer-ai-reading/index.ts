import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const XAI_API_KEY = Deno.env.get("XAI_API_KEY") || Deno.env.get("COSMOSIS_GROK_API_KEY")!;
const TIER_AI_LIMITS: Record<string, number> = {
  lite: 3,
  horoscope: 50,
  astrologer: 100,
  professional: 300,
};
const SEPARATOR = "---TECHNICAL---";
const CITATIONS_SEPARATOR = "---CITATIONS---";

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Question-Type Detection ─────────────────────────────────────

type QuestionWeight = 'timing-heavy' | 'horary-electional' | 'natal-heavy' | 'balanced';

function detectQuestionWeight(question: string): QuestionWeight {
  const q = question.toLowerCase();

  // Horary / electional: "should I do X?", "is this a good time to?", "when should I?", "will this work out?"
  const horaryKeywords = [
    'should i', 'is this a good time', 'is now a good time', 'when should i', 'when is the best time',
    'will this work out', 'will it work', 'is this the right time', 'good day to', 'good time to',
    'electional', 'horary', 'pick a date', 'best date', 'best time for', 'auspicious',
    'should we', 'is today good', 'is this week good', 'timing for',
  ];
  if (horaryKeywords.some(kw => q.includes(kw))) return 'horary-electional';

  // Timing-heavy: current events, what's happening now, predictions
  const timingKeywords = [
    'right now', 'currently', 'this month', 'this week', 'this year',
    'lately', 'recently', 'what\'s happening', 'going through', 'phase', 'period', 'season',
    'today', 'upcoming', 'near future', 'soon', 'next few', 'these days',
    'will i', 'will my', 'when will', 'forecast', 'prediction', 'outlook',
    'what to expect', 'what lies ahead', 'coming up',
  ];
  if (timingKeywords.some(kw => q.includes(kw))) return 'timing-heavy';

  // Natal-heavy: personality, strengths, who am I, etc.
  const natalKeywords = [
    'my personality', 'who am i', 'my strengths', 'my weaknesses', 'what am i like',
    'my nature', 'describe me', 'tell me about myself', 'my character',
  ];
  if (natalKeywords.some(kw => q.includes(kw))) return 'natal-heavy';

  return 'balanced';
}

// ─── Phase 0: Smart Vantage Selection ─────────────────────────────

async function phase0SmartSelection(
  chartSummary: any,
  question: string,
): Promise<string[]> {
  const systemPrompt = `You are an astrologer selecting which planets to analyze for a chart reading question.
Given a compact chart summary and a question, return a JSON array of 3-5 planet keys that are most relevant to answering this question.

Consider:
- Which planets rule the themes in the question?
- Which planets have the most aspects (more connected = more relevant)?
- Which houses relate to the question topic?

Return ONLY a JSON array of lowercase planet key strings. Example: ["venus", "moon", "saturn"]
Valid keys: sun, moon, mercury, venus, mars, jupiter, saturn, uranus, neptune, pluto, northnode, chiron`;

  const userPrompt = `Question: "${question}"

Chart summary:
${JSON.stringify(chartSummary, null, 2)}

Return the JSON array of planet keys to analyze.`;

  let content = "[]";
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-4-1-fast",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 100,
        stream: false,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      content = result.choices?.[0]?.message?.content || "[]";
      break;
    }

    const errorText = await response.text();
    console.error(`Grok phase0 error (attempt ${attempt + 1}/${maxRetries}):`, response.status, errorText);

    if ((response.status === 429 || response.status >= 500) && attempt < maxRetries - 1) {
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
      await new Promise(r => setTimeout(r, delay));
      continue;
    }

    // Non-retryable or last attempt — fall back to defaults
    return ["sun", "moon", "venus"];
  }

  const jsonMatch = content.match(/\[[\s\S]*?\]/);
  if (!jsonMatch) return ["sun", "moon", "venus"];

  try {
    const planets = JSON.parse(jsonMatch[0]);
    if (Array.isArray(planets) && planets.length > 0) {
      return planets.map((p: string) => p.toLowerCase()).slice(0, 5);
    }
  } catch {
    // fallback
  }
  return ["sun", "moon", "venus"];
}

// ─── Per-Vantage Deep Analysis ────────────────────────────────────

async function analyzeVantage(
  vantage: any,
  category: string,
  hasTransits: boolean = false,
  derived?: { label: string; house: number } | null,
  synastryContext?: { source_person: string; host_person: string; mode: string; sourcePersonName?: string; hostPersonName?: string } | null,
  questionWeight: QuestionWeight = 'balanced',
  clientDate?: string,
): Promise<string> {
  let systemPrompt: string;

  if (synastryContext && synastryContext.mode === 'composite') {
    // ── Composite mode prompt ──
    systemPrompt = `You are analyzing the COMPOSITE (midpoint) chart — the relationship entity itself. Every planet represents how BOTH people TOGETHER create a combined dynamic. This is not about individuals — it's about the relationship as its own living pattern.

INTERPRETATION ORDER — follow this EXACT sequence:

1. PLANET — what dynamic does this planet represent IN THE RELATIONSHIP?
   - Not what it means for one person, but what it means for the COUPLE as a unit.

2. HOUSE — the domain of relationship life where this energy operates

3. SPARK — the degree-based sub-sign (most specific coloring of this shared energy)

4. DECAN — the 10° sub-ruler (mid-level coloring)

5. SIGN — the broadest zodiac coloring of how the relationship expresses this energy

6. ASPECTS — how this relationship energy connects to OTHER relationship dynamics
   - These are COMPOSITE aspects (within the composite chart, not cross-chart)

7. FORWARD TRACE — dispositor chain through the composite chart

8. BACKWARD TRACE — what relationship themes feed into this energy

9. CO-TENANTS — other relationship energies in the same domain

IMPORTANT: Do NOT use essential dignities (domicile, exaltation, detriment, fall) in your analysis. Skip dignity entirely.

Be specific and analytical. Frame everything as "the relationship" or "together they" — never as one individual.`;
  } else if (synastryContext && (synastryContext.mode === 'a_in_b' || synastryContext.mode === 'b_in_a')) {
    // ── Synastry (A in B / B in A) mode prompt ──
    const sourceName = synastryContext.sourcePersonName || `Person ${synastryContext.source_person}`;
    const hostName = synastryContext.hostPersonName || `Person ${synastryContext.host_person}`;

    systemPrompt = `You are analyzing how one person's planet operates inside another person's chart. This is SYNASTRY — ${sourceName}'s planet placed in ${hostName}'s house system.

INTERPRETATION ORDER — follow this EXACT sequence:

1. PLANET — What energy does ${sourceName} bring through this planet?

2. HOUSE IN PARTNER'S CHART — What area of ${hostName}'s life does this activate?
   - This planet lands in ${hostName}'s house system. Which domain does it stir?

3. CROSS-CHART ASPECTS — How does this planet interact with ${hostName}'s natal planets?
   - These are SYNASTRY aspects — one person's planet touching another person's planet.
   - Tight orbs (under 2°) = powerful, unmissable chemistry or friction.
   - energy_flow shows who initiates.

4. SPARK / DECAN / SIGN — The layers of how ${sourceName} expresses this energy

5. FORWARD TRACE — Ruler chain through ${hostName}'s chart

6. BACKWARD TRACE — What themes ${sourceName} brings from their own chart

7. CO-TENANTS — ${hostName}'s planets that share this house

IMPORTANT: Do NOT use essential dignities (domicile, exaltation, detriment, fall) in your analysis. Skip dignity entirely.

Be specific and interpersonal. Every observation should be about the DYNAMIC BETWEEN these two people.`;
  } else {
    // ── Standard natal prompt ──
    systemPrompt = `You are analyzing a single energy center in a natal chart. Walk through every data point systematically in the order below. Be thorough — every detail matters. Use full astrological language freely — this is an internal analysis that will be synthesized later.

INTERPRETATION ORDER — follow this EXACT sequence:

1. PLANET — the core energy itself
   - What does this planet represent? Its archetype, drive, and function.
   - Retrograde: if true, this energy turns inward / re-processes / revisits.

2. HOUSE — the life domain where this energy operates
   - Which house is this planet in? What area of life does it activate?
   - Fusion cusp: if present, the planet straddles two houses and operates in BOTH domains simultaneously.

3. SPARK — the degree-based sub-sign (most specific coloring)

4. DECAN — the 10° sub-ruler (mid-level coloring)

5. SIGN — the broadest zodiac coloring

6. ASPECTS (interpret in the order given — sorted tightest orb first = strongest influence first)
   - For each aspect:
     * "forced: false" = TRUE aspect — sign distance matches the aspect type. Clean, reliable connection.
     * "forced: true" = FORCED aspect — angular distance qualifies but sign distance doesn't match.
     * energy_flow shows who initiates: left planet pushes energy toward right planet.
     * orb: smaller = stronger. Under 1° is exact and dominant. 1-3° is strong. 3-6° is moderate.
   - Interpret EVERY aspect. Do not skip any.

7. RULER / FORWARD TRACE — the dispositor chain

8. BACKWARD TRACE — what feeds into this energy

9. CO-TENANTS — who shares this space

IMPORTANT: Do NOT use essential dignities (domicile, exaltation, detriment, fall) in your analysis. Skip dignity entirely.

Be specific and analytical. Every detail you note will help create a better reading.`;
  }

  // ── Timing blocks ──
  if (hasTransits) {
    const isTimingFocused = questionWeight === 'horary-electional' || questionWeight === 'timing-heavy';
    systemPrompt += `

10. TRANSIT ASPECTS (current planetary weather hitting this energy center)${isTimingFocused ? ' — ⚡ PRIMARY FOCUS for this question' : ''}
   - Transit energy is EXTERNAL pressure arriving from outside, interacting with the natal pattern${isTimingFocused ? `
   - THIS IS A TIMING QUESTION — transits are the MOST IMPORTANT part of your analysis. Spend the majority of your analysis here.` : ''}
   - For each transit aspect:
     * "applying: true" = approaching exactitude — energy BUILDING, anticipatory, not yet peak
     * "applying: false" = separating — peak PASSED, integrating/releasing
     * "days_to_exact" = days until (positive) or since (negative) peak moment
     * "daily_motion" = speed of transit planet — Moon (~13°/day) = brief intense hit; Pluto (~0.004°/day) = months-long pressure
     * "transit_retrograde" = revisiting, re-processing, bringing back unfinished themes

   TRANSIT PRINCIPLES:
   - APPLYING: Person moving INTO this energy. Building tension, anticipation, emerging awareness.
   - SEPARATING: Peak passed. Processing, integrating, releasing. Lesson being absorbed.
   - LEAD PLANET: When multiple transits hit same natal planet, FASTER planet leads (its themes arrive first). Slower planet = backdrop.
   - HANDOFF: Fast transit separating while slow transit applying to same natal planet = brief emotional hit gives way to deeper structural pressure.
   - TURNOVER: When a faster planet overtakes a slower one in a multi-planet transit, the thematic lead changes — what was background becomes foreground.
   - Connect transits to the natal vantage tree: a transit TO this planet activates the entire tree — backward trace sources get stirred, forward trace outlets get pressured.${questionWeight === 'horary-electional' ? `

   HORARY/ELECTIONAL FOCUS:
   - Assess whether transits SUPPORT or BLOCK the action being asked about
   - Benefic aspects (trines, sextiles from Jupiter/Venus) = favorable timing
   - Malefic aspects (squares, oppositions from Saturn/Mars/Pluto) = caution/delay
   - Moon aspects are key: what is the Moon applying to next? That shows the immediate outcome.
   - Retrograde transit planets = revisiting old ground, not ideal for new beginnings` : ''}`;
  }

  const hasProfection = !!vantage.profection_context;
  if (hasProfection) {
    const pc = vantage.profection_context;
    systemPrompt += `

${hasTransits ? '11' : '10'}. PROFECTION TIMING (current life chapter)
   - YEARLY PROFECTION: House ${pc.yearly.house} (${pc.yearly.sign}) — Year Lord: ${pc.yearly.time_lord_name}
     * Topics activated this year: ${pc.yearly.topics}
   - MONTHLY PROFECTION: House ${pc.monthly.house} (${pc.monthly.sign}) — Month Lord: ${pc.monthly.time_lord_name}
   ${pc.is_year_lord ? `- ⚡ THIS PLANET IS THE CURRENT YEAR LORD — it is the PROTAGONIST of this person's current life chapter.` : ''}
   ${pc.is_month_lord ? `- ⚡ THIS PLANET IS THE CURRENT MONTH LORD — it carries extra weight this month.` : ''}

   PROFECTION PRINCIPLES:
   - Year Lord's natal condition = quality of the year.
   - Transits TO the Year Lord are especially potent — they "activate the activator"`;
  }

  const hasActivations = vantage.activations && vantage.activations.length > 0;
  if (hasActivations) {
    const activationList = vantage.activations.map((a: any) =>
      `${a.planet_name} at ${a.degree_in_sign.toFixed(1)}° ${a.natal_sign} → age ${a.activation_age.toFixed(1)} (cycle ${a.cycle}/${a.cycle_sign})${a.is_current ? ' [ACTIVE NOW]' : ' [recent]'}`
    ).join('\n     ');

    const stepNum = (hasTransits ? 1 : 0) + (hasProfection ? 1 : 0) + 10;
    systemPrompt += `

${stepNum}. AGE-DEGREE PLANETARY ACTIVATIONS
   Planet's degree in its sign = the age at which it "wakes up." Repeats every 30 years in 4 cycles.

   Active/recent activations for this planet:
     ${activationList}

   ACTIVATION PRINCIPLES:
   - [ACTIVE NOW] = this planet's energy is at peak activation
   - [recent] = echo period — the activation peaked recently
   - Cycle 1 (Aries, ages 0-30): raw, initiating energy
   - Cycle 2 (Taurus, ages 30-60): stabilizing, materializing
   - Cycle 3 (Gemini, ages 60-90): communicating, connecting
   - Cycle 4 (Cancer, ages 90-120): nurturing, legacy
   - When activated planet is ALSO Year Lord or has active transits = convergence`;
  }

  const hasFutureTimeline = vantage.future_transit_timeline?.events?.length > 0;
  if (hasFutureTimeline) {
    const ftl = vantage.future_transit_timeline;
    const stepNumFtl = (hasTransits ? 1 : 0) + (hasProfection ? 1 : 0) + (hasActivations ? 1 : 0) + 10;
    systemPrompt += `

${stepNumFtl}. FUTURE TRANSIT TIMELINE (upcoming transits hitting this planet)
   These are estimated dates when significant transits will form exact aspects to this natal planet.

${ftl.summary}

   FUTURE TIMELINE PRINCIPLES:
   - Slow-planet transits (Saturn, Pluto) = major life chapters — worth anchoring timing predictions to
   - Jupiter transits = expansion windows — growth, opportunity, visibility
   - Mars transits = brief catalysts — action, conflict, energy
   - "retrograde risk" = the transit may repeat 3 times (direct pass, retrograde pass, direct again) — giving a longer window
   - confidence: "high" = very reliable date estimate (slow planets). "medium" = ~2 week margin. "low" = rough month
   - Use these dates to give SPECIFIC timing guidance: "around [month]", "late [season]", "by [month]"
   - In the reading: translate into natural time references. NEVER mention transit names.
   - In the technical section: list upcoming transits with estimated dates`;
  }

  let categoryContext = `Category context: ${category}`;
  if (derived) {
    categoryContext = `Category context: ${category} (${derived.label} — turned chart, house ${derived.house} as house 1)`;
  } else if (synastryContext) {
    const sourceName = synastryContext.sourcePersonName || `Person ${synastryContext.source_person}`;
    const hostName = synastryContext.hostPersonName || `Person ${synastryContext.host_person}`;
    if (synastryContext.mode === 'composite') {
      categoryContext = `Category context: composite chart analysis`;
    } else {
      categoryContext = `Category context: synastry — ${sourceName}'s planet in ${hostName}'s chart`;
    }
  }

  const todayStr = clientDate || new Date().toISOString().split('T')[0];
  const currentYear = parseInt(todayStr.split('-')[0], 10);
  const userPrompt = `TODAY'S DATE: ${todayStr} (current year: ${currentYear})

CRITICAL TIMING RULE: Today is ${todayStr}. ALL timing predictions MUST be in the FUTURE relative to this date. NEVER reference dates or time periods that have already passed. If any transit data contains past dates, either skip them or reframe as "this energy has been active recently" — never present past dates as predictions.

${categoryContext}

Vantage planet data:
${JSON.stringify(vantage, null, 2)}

Analyze this energy pattern thoroughly. Any timing references must be relative to today's date — only predict FUTURE windows.`;

  const maxRetries = 3;
  let lastError = "";
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-4-1-fast",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.6,
        max_tokens: 2000,
        stream: false,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return result.choices?.[0]?.message?.content || "";
    }

    const errText = await response.text();
    lastError = `${response.status}: ${errText}`;
    console.error(`Vantage analysis error for ${vantage.planet?.planet} (attempt ${attempt + 1}/${maxRetries}):`, response.status, errText);

    // Retry on rate limit (429) or server errors (5xx)
    if (response.status === 429 || response.status >= 500) {
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
      await new Promise(r => setTimeout(r, delay));
      continue;
    }

    // Non-retryable error
    break;
  }

  throw new Error(`AI vantage analysis error: ${lastError}`);
}

// ─── Main Handler ─────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Sign in to use AI readings" });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      const jwt = authHeader.replace("Bearer ", "");
      const adminSupa = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data: { user: adminUser }, error: adminErr } = await adminSupa.auth.getUser(jwt);
      if (adminErr || !adminUser) {
        console.error("Auth failed both methods:", authError?.message, adminErr?.message);
        return jsonResponse({ error: `Auth failed: ${authError?.message || adminErr?.message || "unknown"}` });
      }
      var verifiedUser = adminUser;
    } else {
      var verifiedUser = user;
    }

    const body = await req.json();

    // ── Phase 0: Smart vantage selection (non-streaming JSON response) ──
    if (body.phase0) {
      const planets = await phase0SmartSelection(
        body.chart_summary,
        body.question || "General reading",
      );
      return jsonResponse({ planets });
    }

    const { trees, treesB, question, readingFocus, personName: realNameA, personNameB: realNameB, currentDate: clientDate } = body;

    // Privacy: never send real names to the AI provider — use anonymous placeholders
    // Real names are substituted back into the response before streaming to the client
    const personName = 'Person A';
    const personNameB = 'Person B';

    // Detect entity type — company charts use "CompanyName (Incorporation)" format
    const companyMatchA = realNameA?.match(/^(.+?)\s*\((Incorporation|IPO|Founded|Launch|Listing|Merger|Rebrand)\)$/i);
    const isCompanyChart = !!companyMatchA;
    // For company charts, use the company name (public info, not personal data)
    const entityNameA = companyMatchA ? companyMatchA[1].trim() : 'Person A';

    if (!trees && body.chartData) {
      return jsonResponse({ error: "Please update the app to use the new reading system." });
    }

    if (!trees || !Array.isArray(trees) || trees.length === 0) {
      return jsonResponse({ error: "Missing chart analysis trees" });
    }

    // ── Auth + Credits ──
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let profile: any = null;
    const { data: fullProfile, error: profileErr } = await adminSupabase
      .from("astrologer_profiles")
      .select("subscription_status, subscription_tier, trial_ends_at, ai_credits_used, ai_credits_reset_at")
      .eq("id", verifiedUser.id)
      .single();

    if (profileErr) {
      console.warn("Full profile query failed, trying basic:", profileErr.message);
      const { data: basicProfile } = await adminSupabase
        .from("astrologer_profiles")
        .select("subscription_status, subscription_tier, trial_ends_at")
        .eq("id", verifiedUser.id)
        .single();
      profile = basicProfile ? { ...basicProfile, ai_credits_used: 0, ai_credits_reset_at: null } : null;
    } else {
      profile = fullProfile;
    }

    if (!profile) {
      await adminSupabase.from("astrologer_profiles").upsert({
        id: verifiedUser.id,
        subscription_status: "free",
        subscription_tier: "lite",
      }, { onConflict: "id" });
      profile = { subscription_status: "free", subscription_tier: "lite", trial_ends_at: null, ai_credits_used: 0, ai_credits_reset_at: null };
    }

    const tier = profile.subscription_tier || "lite";
    const limit = TIER_AI_LIMITS[tier] ?? TIER_AI_LIMITS.lite;

    const resetAt = new Date(profile.ai_credits_reset_at || "2000-01-01");
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    let creditsUsed = profile.ai_credits_used || 0;
    if (resetAt < monthStart) {
      creditsUsed = 0;
      try {
        await adminSupabase
          .from("astrologer_profiles")
          .update({ ai_credits_used: 0, ai_credits_reset_at: monthStart.toISOString() })
          .eq("id", verifiedUser.id);
      } catch { /* columns may not exist yet */ }
    }

    if (creditsUsed >= limit) {
      const tierLabel = tier === "lite" ? "Lite" : tier === "astrologer" ? "Astrologer" : "Professional";
      return jsonResponse({
        error: "credit_limit",
        message: tier === "lite"
          ? `Free accounts get ${limit} AI readings per month. Upgrade for more.`
          : `You've used all ${limit} AI readings this month (${tierLabel} plan). Credits reset on the 1st.`,
        credits_used: creditsUsed,
        credits_limit: limit,
      });
    }

    // ── Detect question weight for data emphasis ──
    const questionWeight = detectQuestionWeight(question || '');

    // ── Collect all vantages from trees ──
    const isSynastry = readingFocus === 'synastry' && Array.isArray(treesB);
    const hasDerived = trees.some((t: any) => t.derived) || (treesB || []).some((t: any) => t.derived);
    const hasTransitData = trees.some((t: any) => t.transit_context?.active_transits?.length > 0) ||
      (treesB || []).some((t: any) => t.transit_context?.active_transits?.length > 0);
    const hasProfectionData = trees.some((t: any) => t.profection_context) ||
      (treesB || []).some((t: any) => t.profection_context);
    const hasActivationData = trees.some((t: any) => t.all_activations?.length > 0) ||
      (treesB || []).some((t: any) => t.all_activations?.length > 0);
    const hasFutureTimeline = trees.some((t: any) => t.future_transit_timeline?.events?.length > 0);

    // Check for synastry tree groups
    const synastryContext = body.synastry_context || null;
    const hasSynastryContext = !!synastryContext;

    const vantagesWithContext: { vantage: any; category: string; hasTransits: boolean; derived?: { label: string; house: number }; synastryCtx?: any; label?: string }[] = [];

    for (const t of trees) {
      for (const v of (t.vantages || [])) {
        const vantageHasTransits = (v.transit_context?.vantage_transits?.length ?? 0) > 0;
        vantagesWithContext.push({
          vantage: v,
          category: t.category,
          hasTransits: vantageHasTransits,
          derived: t.derived ? { label: t.derived.label, house: t.derived.derived_from_house } : undefined,
          synastryCtx: t.synastry_context ? {
            ...t.synastry_context,
            sourcePersonName: synastryContext?.personAName || personName,
            hostPersonName: synastryContext?.personBName || personNameB,
          } : undefined,
          label: isSynastry || hasSynastryContext ? `${personName || 'A'}'s ${v.planet?.planet}` : undefined,
        });
      }
    }

    if (isSynastry && treesB) {
      for (const t of treesB) {
        for (const v of (t.vantages || [])) {
          const vantageHasTransits = (v.transit_context?.vantage_transits?.length ?? 0) > 0;
          vantagesWithContext.push({
            vantage: v,
            category: t.category,
            hasTransits: vantageHasTransits,
            derived: t.derived ? { label: t.derived.label, house: t.derived.derived_from_house } : undefined,
            synastryCtx: t.synastry_context ? {
              ...t.synastry_context,
              sourcePersonName: synastryContext?.personBName || personNameB,
              hostPersonName: synastryContext?.personAName || personName,
            } : undefined,
            label: `${personNameB || 'B'}'s ${v.planet?.planet}`,
          });
        }
      }
    }

    const risingSign = trees[0]?.rising_sign || 'Unknown';
    const categories = [...new Set(trees.map((t: any) => t.category))].join(", ");

    // ── Build synthesis system prompt ──
    let synthesisSystemPrompt: string;

    if (isSynastry || hasSynastryContext) {
      const nameA = personName || synastryContext?.personAName || 'Person A';
      const nameB = personNameB || synastryContext?.personBName || 'Person B';

      synthesisSystemPrompt = `You are a wise, perceptive relationship advisor. You have detailed analysis of the dynamic BETWEEN ${nameA} and ${nameB} — how they affect each other, what they trigger in one another, and what their relationship creates as its own entity.

You produce THREE sections in this exact format:

[Plain language reading with inline citation markers like [^1], [^2], etc.
Write in flowing paragraphs with behavioral micro-scenarios involving BOTH people by name.]

${CITATIONS_SEPARATOR}

[^1] Brief technical note — e.g. "A's Venus conjunct B's Descendant (1.2° orb)"
[^2] Another citation...

${SEPARATOR}

[Technical synastry/composite summary for an astrologer. Use proper planet names,
sign names, house overlays, cross-chart aspects with orbs, and composite positions.
Structure with markdown headers per perspective (A in B, B in A, Composite).]

CITATION RULES:
- Place [^N] markers inline in the reading text at key claims or insights
- Each citation should map to a specific cross-chart aspect, house overlay, or composite placement
- Keep citation text SHORT (1-2 lines max)
- Use 5-12 citations per reading
- Citations go in sentences naturally: "...magnetic pull between them[^1] that..."

RULES FOR THE READING SECTION (before ${CITATIONS_SEPARATOR}):
- NEVER use astrology terminology — no planet names, sign names, house numbers, aspect names, "retrograde", "chart", "synastry", "composite", "natal"
- Describe the DYNAMIC between ${nameA} and ${nameB} using their actual names
- Show how they interact, what they bring out in each other, where they clash, where they flow
- Use behavioral micro-scenarios that both people would recognize
- Weave all three perspectives (how A affects B, how B affects A, what they create together) into a coherent narrative
- Address their question directly about the relationship
- NO preamble, NO "let's explore...", NO "based on...". Dive straight into the reading.
- NO closing summary paragraph restating everything.

RULES FOR THE TECHNICAL SECTION (after ${SEPARATOR}):
- Use full synastry/composite terminology
- Structure with ## headers per perspective
- Note tight cross-chart aspects with orbs
- Do NOT mention essential dignities (domicile, exaltation, detriment, fall)
- Be concise but thorough`;
    } else if (isCompanyChart) {
      synthesisSystemPrompt = `You are a sharp business/financial astrology analyst. You have access to detailed analysis of ${entityNameA}'s incorporation/founding chart — the planetary patterns that reveal the company's DNA, strengths, vulnerabilities, and timing cycles.

You produce THREE sections in this exact format:

[Plain language business analysis with inline citation markers like [^1], [^2], etc.
Write in flowing paragraphs about the company's nature, strategy, and outlook.]

${CITATIONS_SEPARATOR}

[^1] Brief technical note — e.g. "Sun in Taurus H10 trine Jupiter in Virgo H2 (2.1° orb)"
[^2] Another citation...

${SEPARATOR}

[Technical mundane/financial astrology summary. Use proper planet names,
sign names, house numbers (with business meanings), aspect types.
Structure with markdown headers per major theme. Be concise but precise.]

CITATION RULES:
- Place [^N] markers inline in the reading text at key claims or insights
- Each citation should map to a specific placement, aspect, or pattern
- Keep citation text SHORT (1-2 lines max)
- Use 5-12 citations per reading

RULES FOR THE READING SECTION (before ${CITATIONS_SEPARATOR}):
- NEVER use astrology terminology: no planet names, no sign names, no house numbers, no aspect names
- Translate everything into business/corporate language about ${entityNameA}
- Reference the company by name: "${entityNameA}" — NOT "you" or "this person"
- Map planets to business functions: Sun=brand identity, Moon=culture/sentiment, Mercury=communications/tech, Venus=brand appeal/partnerships, Mars=competitive strategy, Jupiter=expansion, Saturn=regulation/structure, Uranus=disruption/innovation, Neptune=brand mystique/scandals, Pluto=power dynamics/M&A
- Map houses to business areas: H1=brand, H2=revenue, H3=PR/comms, H4=HQ/culture, H5=products, H6=operations, H7=partnerships/competitors, H8=debt/M&A, H9=international/legal, H10=market position, H11=shareholders, H12=hidden risks
- Use behavioral micro-scenarios from business: "${entityNameA} is the kind of company that..." / "When competitors move aggressively, ${entityNameA} tends to..."
- NO preamble. Start directly with insights about the company.
- NO closing summary paragraph.

RULES FOR THE TECHNICAL SECTION (after ${SEPARATOR}):
- Use full astrological terminology with business interpretation
- Structure with ## headers per major theme
- Include specific placements mapped to business meaning
- Note significant aspects with orbs
- Do NOT mention essential dignities (domicile, exaltation, detriment, fall)
- Be concise but thorough`;
    } else {
      synthesisSystemPrompt = `You are a wise, perceptive advisor who understands people deeply. You have access to detailed analysis of this person's inner patterns — personality layers, emotional tendencies, relationship dynamics, career drives, and life timing.

You produce THREE sections in this exact format:

[Plain language reading with inline citation markers like [^1], [^2], etc.
Write in flowing paragraphs with behavioral micro-scenarios.]

${CITATIONS_SEPARATOR}

[^1] Brief technical note for this citation — e.g. "Venus in Aquarius H6 trine Moon in Gemini H10 (3.85° orb)"
[^2] Another citation...

${SEPARATOR}

[Technical astrology summary for an astrologer. Use proper planet names,
sign names, house numbers, aspect types. Structure with markdown headers
per major theme. Be concise but precise.]

CITATION RULES — CRITICAL, READ CAREFULLY:
- Place [^N] markers inline in the reading text, SPREAD THROUGHOUT the entire reading. NOT all in one paragraph.
- Each [^N] marker should appear at the specific sentence it supports, not grouped together.
- EACH citation must be ONE short line. Example: [^1] Venus in Aquarius H9 trine Moon in Gemini H10 (3.85° orb)
- NEVER combine multiple placements into one citation. If you have 3 data points, make 3 separate citations [^1] [^2] [^3].
- Use 8-15 citations, distributed evenly across ALL sections of the reading.
- BAD: Putting [^1][^2][^3][^4][^5] all at the end of one sentence
- GOOD: "...you tend to keep the intense parts private[^1]. The people closest to you sometimes feel shut out[^2] because..." — spread naturally through the text
- Citations go in sentences naturally: "...witty charm[^1] that keeps things light..."

RULES FOR THE READING SECTION (before ${CITATIONS_SEPARATOR}):
- NEVER use astrology terminology: no planet names, no sign names, no house numbers, no aspect names, no "retrograde", no "cusp", no "natal", no "chart", no "transit", no "decan", no "ruling planet"
- Translate everything into plain human language
- Use the analysis data to inform your answer but the reader should never know the source is astrology
- Be specific and concrete to THIS person — avoid generic advice
- Write in flowing paragraphs, not bullet lists
- Address the question directly and personally
- NO preamble, NO "let's dive in...", NO "based on your chart...". Start directly with the first insight.
- NO closing summary paragraph that restates everything.

WRITING STYLE — THIS IS THE MOST IMPORTANT RULE:
Write like you're explaining something to a friend over coffee. Every sentence should be immediately understandable on its own — no jargon, no compressed language, no keyword-stacking.

BAD (compressed, keyword-heavy, unreadable):
"You deliver career pitches with blunt speed, cutting through meetings with half-formed gems that spark teams. Brainstorms explode from your direct style in sales or content creation for wide audiences."

GOOD (concrete, readable, each sentence paints a clear picture):
"You're the person who can deliver a pitch deck at speed and cut through a confused boardroom with one sentence that brings everyone back on track. When your team is stuck in a brainstorm, you're usually the one who blurts out the rough idea that everyone ends up building on, even if it wasn't fully formed when you said it."

The difference: BAD stacks abstract nouns and metaphors ("half-formed gems that spark teams"). GOOD describes a specific moment the reader can picture themselves in.

RULES:
- Every insight must include at least one concrete, everyday scenario the reader can picture
- Write in complete, flowing sentences — not fragments or compressed phrases
- If a sentence uses a metaphor, the NEXT sentence must explain what it means practically
- Never use poetic compression like "brainstorms explode" or "voice ignites fires" — instead describe what actually happens in real life
- Each paragraph should read like a story, not a list of adjectives
- Vary sentence length. Mix short punchy sentences with longer explanatory ones.
- NO hyphens or em dashes. Use periods and commas.
- Use simple, everyday words. Write at a 6th-grade reading level. If there's a simpler word, use it. "Hard" instead of "arduous." "Drawn to" instead of "magnetically oriented toward." The reader should never need to re-read a sentence.
- ABSOLUTE BAN on abstract noun chains that sound deep but mean nothing. Examples of what NEVER to write: "Home rituals evolve into global perspectives on surrender." / "Crowds in retreats amplify your quiet knowing." / "Journeys fuel your boundless inner light." These are meaningless. Instead describe what ACTUALLY HAPPENS: "You started journaling at home, and over time it changed how you see the world."
- THE TEST: After writing each sentence, ask "Could the reader picture a specific moment from their life?" If not, rewrite it in plain language.

TIMING RULE — CRITICAL:
- The current year is ${new Date().getFullYear()}. All timing references must be anchored to this.
- NEVER reference past years (${new Date().getFullYear() - 1}, ${new Date().getFullYear() - 2}, etc.) as future events.
- When giving timing windows, use: "in the coming months", "by mid-${new Date().getFullYear()}", "later this year", "early ${new Date().getFullYear() + 1}".

RULES FOR THE TECHNICAL SECTION (after ${SEPARATOR}):
- Use full astrological terminology
- Structure with markdown headers (##) per major theme
- Include specific placements
- Note significant aspects with orbs
- Do NOT mention essential dignities (domicile, exaltation, detriment, fall)
- Be concise but thorough`;
    }

    // Add timing suffixes based on question weight
    if (questionWeight === 'horary-electional' && hasTransitData) {
      synthesisSystemPrompt += `

CRITICAL — HORARY/ELECTIONAL QUESTION DETECTED:
This is a timing-specific question ("should I?", "is this a good time?", "when?").
The TRANSITS are the PRIMARY source of your answer — they represent the current sky and its verdict.
- The natal chart provides context (what this person's relationship to the topic is)
- But the TRANSITS determine the ANSWER: favorable or unfavorable timing, what energies support or block action
- Lead with what the current sky says about the question
- Applying aspects = building energy (action will intensify). Separating = energy waning.
- Benefic transits (Jupiter, Venus) to relevant houses/planets = favorable. Malefic (Saturn, Mars) = caution.
- Moon aspects are especially important for horary: Moon's last aspect before void = the outcome.
- In the reading: frame as clear guidance — "This is / isn't a favorable window because..." (no astro terms)
- In the technical section: list all active transits with orbs, applying/separating, and their horary significance`;
      if (hasFutureTimeline) {
        synthesisSystemPrompt += `
- FUTURE TRANSIT TIMELINE is available — use it to provide SPECIFIC timing predictions
- Give approximate dates or month ranges: "by late April", "around mid-September", "in the coming 3 months"
- Slow-planet transits = major timing anchors. Fast-planet transits = catalysts within those windows.
- In the reading: weave timing naturally — "a significant shift is building toward [month]..."
- In the technical section: list key upcoming transits with estimated dates`;
      }
      if (hasProfectionData) {
        synthesisSystemPrompt += `
- Profections add context: is the Year Lord well-aspected by transits? This colors the entire year's flavor for this topic.`;
      }
      if (hasActivationData) {
        synthesisSystemPrompt += `
- Age-degree activations show if relevant planets are currently "awake" — activated planets respond more strongly to transits.`;
      }
    } else if (questionWeight === 'timing-heavy' && hasTransitData) {
      synthesisSystemPrompt += `

TIMING-FOCUSED QUESTION — transits, profections, and activations should be the BACKBONE of your answer:
- The natal chart shows WHO this person is; the timing data shows WHAT is happening to them NOW
- Structure your answer around current timing: what energies are arriving, peaking, or fading
- In the reading: "Right now you're in a phase where..." / "Over the coming weeks..." — NEVER mention transits, planets, or aspects
- In the technical section: list active transits with orbs and applying/separating status`;
      if (hasFutureTimeline) {
        synthesisSystemPrompt += `
- FUTURE TRANSIT TIMELINE is available — this is your most powerful tool for answering "when" questions
- Provide SPECIFIC timing: "around [month]", "by [season]", "in roughly [N] months"
- Distinguish between slow-planet transits (major life shifts) and fast-planet transits (brief triggers)
- When multiple future transits cluster around the same period, highlight that as a significant window
- In the reading: "A significant opening appears around [month]..." / "The pressure peaks near [date range]..."
- In the technical section: list upcoming transits with estimated dates and significance`;
      }
      if (hasProfectionData) {
        synthesisSystemPrompt += `
- Profection timing reveals the current life chapter — the Year Lord planet is the protagonist of this year
- In the reading: translate the profection year themes into plain language ("this is a year focused on...")
- In the technical section: note the profected house, Year Lord, Month Lord`;
      }
      if (hasActivationData) {
        synthesisSystemPrompt += `
- Age-degree activations show which planets are currently "awake" or recently peaked
- When profections AND activations AND transits converge on the same planet, this is a MAJOR convergence — emphasize it strongly`;
      }
    } else {
      // Balanced or natal-heavy — timing is supplementary
      if (hasTransitData) {
        synthesisSystemPrompt += `
- Timing data (transits) is available — weave it in as supplementary context where relevant, but keep the focus on the natal patterns
- In the reading: briefly mention current timing if it's relevant to their question — "Right now you're in a phase where..."
- In the technical section: list active transits with orbs and applying/separating status`;
      }
      if (hasProfectionData) {
        synthesisSystemPrompt += `
- Profection timing reveals the current life chapter — the Year Lord planet is the protagonist of this year
- In the reading: translate the profection year themes into plain language
- In the technical section: note the profected house, Year Lord, Month Lord`;
      }
      if (hasActivationData) {
        synthesisSystemPrompt += `
- Age-degree activations show which planets are currently "awake" or recently peaked
- In the reading: reference the activated themes naturally
- In the technical section: list active age-degree activations with cycle and degree
- When profections AND activations AND transits converge on the same planet, emphasize this convergence`;
      }
    }

    // ── Name substitution: replace anonymous placeholders with real names in output ──
    const nameSubstitutions: [RegExp, string][] = [];
    if (realNameA && realNameA !== 'Person A') {
      nameSubstitutions.push([/Person A/g, realNameA]);
    }
    if (realNameB && realNameB !== 'Person B') {
      nameSubstitutions.push([/Person B/g, realNameB]);
    }
    function restoreNames(text: string): string {
      for (const [pattern, replacement] of nameSubstitutions) {
        text = text.replace(pattern, replacement);
      }
      return text;
    }

    // ── SSE Streaming Response ──
    const encoder = new TextEncoder();

    const clientStream = new ReadableStream({
      async start(controller) {
        try {
          // === PHASE 1: Per-vantage analysis (parallel) ===
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              phase: "analyzing",
              index: 0,
              total: vantagesWithContext.length,
            })}\n\n`)
          );

          const analysisPromises = vantagesWithContext.map(({ vantage, category, hasTransits, derived, synastryCtx, label }, idx) =>
            // Stagger requests by 200ms each to avoid rate limits
            new Promise(r => setTimeout(r, idx * 200)).then(() =>
              analyzeVantage(vantage, category, hasTransits, derived, synastryCtx, questionWeight, clientDate).then(analysis => ({
                planet: label || vantage.planet?.planet || `vantage_${idx}`,
                analysis,
                index: idx,
              }))
            )
          );

          const vantageAnalyses: { planet: string; analysis: string }[] = [];

          await Promise.all(
            analysisPromises.map(p =>
              p.then(result => {
                vantageAnalyses.push({ planet: result.planet, analysis: result.analysis });

                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    phase: "analyzing_done",
                    vantage: result.planet,
                    index: vantageAnalyses.length,
                    total: vantagesWithContext.length,
                    analysis: result.analysis,
                  })}\n\n`)
                );

                return result;
              })
            )
          );

          // === PHASE 2: Synthesis (streaming) ===
          const analysesText = vantageAnalyses
            .map(a => `=== ${a.planet.toUpperCase()} ===\n${a.analysis}`)
            .join("\n\n");

          let synthesisUserPrompt: string;

          if (isSynastry || hasSynastryContext) {
            const nameA = personName || synastryContext?.personAName || 'Person A';
            const nameB = personNameB || synastryContext?.personBName || 'Person B';

            const todayStr = new Date().toISOString().split('T')[0];
            synthesisUserPrompt = `TODAY'S DATE: ${todayStr}. Current year: ${new Date().getFullYear()}. All timing references must be relative to this date.

The question about ${nameA} and ${nameB}'s relationship: "${question || 'Give me a comprehensive relationship reading'}"

Categories analyzed: ${categories}
${nameA}'s rising pattern: ${risingSign}

Deep analyses of their relationship dynamics:

${analysesText}

Synthesize these into a cohesive answer about the DYNAMIC BETWEEN ${nameA} and ${nameB}, with TWO sections separated by "${SEPARATOR}".
The first section is the plain-language relationship reading using both names (no astrology terms).
The second section is the technical synastry/composite summary.

IMPORTANT: Weave all three perspectives together:
- How ${nameA} shows up in ${nameB}'s life
- How ${nameB} shows up in ${nameA}'s life
- What the relationship itself creates`;
          } else {
            const todayStr = new Date().toISOString().split('T')[0];
            synthesisUserPrompt = `TODAY'S DATE: ${todayStr}
ALL dates and timing references MUST be relative to this date. We are in ${new Date().getFullYear()}. Do NOT reference years before ${new Date().getFullYear()} as future events.

The person asked: "${question || 'Give me a comprehensive chart reading'}"

Categories analyzed: ${categories}
Rising pattern: ${risingSign}

Deep analyses of this person's key energy patterns:

${analysesText}

Synthesize these into a cohesive answer with TWO sections separated by "${SEPARATOR}".
The first section is the plain-language reading (no astrology terms).
The second section is the technical astrology summary.${questionWeight === 'horary-electional' && hasTransitData ? `

CRITICAL: This is a HORARY/ELECTIONAL question. The person wants a timing verdict — is this a good time or not?
The transit data in the analyses above is your PRIMARY evidence. Give a clear, direct answer to their timing question.
Natal chart context tells you what this topic means to them; the TRANSITS tell you the answer.` : questionWeight === 'timing-heavy' && hasTransitData ? `

NOTE: This is a timing-focused question. Current transit, profection, and activation data is included in the analyses.
Structure your answer around what's happening NOW — what energies are arriving, peaking, or fading.` : hasTransitData ? `

NOTE: Current timing data is included in the analyses. Weave it in where relevant.` : ''}`;
          }

          if (hasDerived) {
            synthesisUserPrompt += `\n\nNOTE: Some analyses use "derived" house perspectives (turned charts). Integrate these perspectives naturally.`;
          }

          if (hasProfectionData) {
            const profCtx = trees.find((t: any) => t.profection_context)?.profection_context;
            if (profCtx) {
              synthesisUserPrompt += `\n\nPROFECTION TIMING: Age ${profCtx.current_age}. Year: House ${profCtx.yearly.house} (${profCtx.yearly.sign}), Year Lord = ${profCtx.yearly.time_lord_name}. Month: House ${profCtx.monthly.house} (${profCtx.monthly.sign}), Month Lord = ${profCtx.monthly.time_lord_name}.`;
            }
          }

          if (hasActivationData) {
            const allActs = trees.find((t: any) => t.all_activations?.length > 0)?.all_activations;
            if (allActs && allActs.length > 0) {
              const actSummary = allActs.map((a: any) =>
                `${a.planet_name} (${a.is_current ? 'ACTIVE' : 'recent'}, age ${a.activation_age.toFixed(1)}, cycle ${a.cycle})`
              ).join(', ');
              synthesisUserPrompt += `\n\nAGE-DEGREE ACTIVATIONS: ${actSummary}. These planets are currently "awake" or recently peaked.`;
            }
          }

          // Send debug prompts
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ debug_question_weight: questionWeight })}\n\n`)
          );
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ debug_system_prompt: synthesisSystemPrompt })}\n\n`)
          );
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ debug_user_prompt: synthesisUserPrompt })}\n\n`)
          );

          // Signal synthesis starting
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ phase: "synthesizing" })}\n\n`)
          );

          // Stream synthesis from Grok (with retry for rate limits)
          let grokResponse: Response | null = null;
          for (let attempt = 0; attempt < 3; attempt++) {
            grokResponse = await fetch("https://api.x.ai/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${XAI_API_KEY}`,
              },
              body: JSON.stringify({
                model: "grok-4-1-fast",
                messages: [
                  { role: "system", content: synthesisSystemPrompt },
                  { role: "user", content: synthesisUserPrompt },
                ],
                temperature: 0.7,
                max_tokens: 8000,
                stream: true,
              }),
            });

            if (grokResponse.ok) break;

            const errText = await grokResponse.text();
            console.error(`Synthesis error (attempt ${attempt + 1}/3):`, grokResponse.status, errText);

            if ((grokResponse.status === 429 || grokResponse.status >= 500) && attempt < 2) {
              const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
              await new Promise(r => setTimeout(r, delay));
              continue;
            }

            throw new Error(`AI synthesis error: ${grokResponse.status}`);
          }

          const grokReader = grokResponse.body?.getReader();
          if (!grokReader) {
            throw new Error("No response body from Grok synthesis");
          }

          const decoder = new TextDecoder();

          // Three-section stream: reading → ---CITATIONS--- → citations → ---TECHNICAL--- → technical
          // We stream reading content in real-time, buffer citations, then stream technical.
          let fullBuffer = "";
          // 0 = reading, 1 = citations (buffered), 2 = technical
          let section = 0;
          let readingContentSent = 0;
          const HOLD_BACK = Math.max(CITATIONS_SEPARATOR.length, SEPARATOR.length) + 5;

          while (true) {
            const { done, value } = await grokReader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (!content) continue;

                fullBuffer += content;

                // Check for section transitions
                if (section === 0) {
                  const citIdx = fullBuffer.indexOf(CITATIONS_SEPARATOR);
                  const techIdx = fullBuffer.indexOf(SEPARATOR);

                  if (citIdx !== -1) {
                    // Found citations separator — flush reading, move to section 1
                    const readingPart = fullBuffer.substring(readingContentSent, citIdx).trimEnd();
                    if (readingPart) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: restoreNames(readingPart) })}\n\n`));
                    }
                    section = 1;
                  } else if (techIdx !== -1) {
                    // No citations, straight to technical
                    const readingPart = fullBuffer.substring(readingContentSent, techIdx).trimEnd();
                    if (readingPart) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: restoreNames(readingPart) })}\n\n`));
                    }
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ phase: "technical" })}\n\n`));
                    section = 2;
                    // Send any tech content already buffered
                    const techPart = fullBuffer.substring(techIdx + SEPARATOR.length);
                    if (techPart.trim()) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ technical: restoreNames(techPart) })}\n\n`));
                    }
                  } else {
                    // Stream reading content, hold back for separator detection
                    const safeEnd = Math.max(readingContentSent, fullBuffer.length - HOLD_BACK);
                    const safePart = fullBuffer.substring(readingContentSent, safeEnd);
                    if (safePart) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: restoreNames(safePart) })}\n\n`));
                      readingContentSent = safeEnd;
                    }
                  }
                }

                if (section === 1) {
                  // Buffering citations — look for TECHNICAL separator
                  const techIdx = fullBuffer.indexOf(SEPARATOR);
                  if (techIdx !== -1) {
                    const citStart = fullBuffer.indexOf(CITATIONS_SEPARATOR) + CITATIONS_SEPARATOR.length;
                    const citationsText = fullBuffer.substring(citStart, techIdx).trim();
                    if (citationsText) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ citations: restoreNames(citationsText) })}\n\n`));
                    }
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ phase: "technical" })}\n\n`));
                    section = 2;
                    const techPart = fullBuffer.substring(techIdx + SEPARATOR.length);
                    if (techPart.trim()) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ technical: restoreNames(techPart) })}\n\n`));
                    }
                  }
                }

                if (section === 2) {
                  // Stream technical content — only send the new delta if we're past separator
                  const techIdx = fullBuffer.indexOf(SEPARATOR);
                  if (techIdx < fullBuffer.length - content.length) {
                    // This content chunk is entirely within the technical section
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ technical: restoreNames(content) })}\n\n`));
                  }
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }

          // Flush any remaining content based on final section state
          if (section === 0) {
            // Never found any separator
            const techIdx = fullBuffer.indexOf(SEPARATOR);
            if (techIdx !== -1) {
              const readingPart = fullBuffer.substring(readingContentSent, techIdx).trimEnd();
              if (readingPart) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: restoreNames(readingPart) })}\n\n`));
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ phase: "technical" })}\n\n`));
              const techPart = fullBuffer.substring(techIdx + SEPARATOR.length).trim();
              if (techPart) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ technical: restoreNames(techPart) })}\n\n`));
            } else if (readingContentSent < fullBuffer.length) {
              const remaining = fullBuffer.substring(readingContentSent).trim();
              if (remaining) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: restoreNames(remaining) })}\n\n`));
            }
          } else if (section === 1) {
            // Found citations but never found technical separator
            const citStart = fullBuffer.indexOf(CITATIONS_SEPARATOR) + CITATIONS_SEPARATOR.length;
            const citationsText = fullBuffer.substring(citStart).trim();
            if (citationsText) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ citations: restoreNames(citationsText) })}\n\n`));
          }

          // ── Increment usage ──
          try {
            await adminSupabase
              .from("astrologer_profiles")
              .update({ ai_credits_used: creditsUsed + 1 })
              .eq("id", verifiedUser.id);
          } catch { /* columns may not exist yet */ }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ credits_used: creditsUsed + 1, credits_limit: limit })}\n\n`)
          );

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: error.message || "Stream error" })}\n\n`)
            );
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            controller.close();
          } catch {
            controller.error(error);
          }
        }
      },
    });

    return new Response(clientStream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    console.error("Error:", err);
    return jsonResponse({ error: err.message || "Internal error" });
  }
});
