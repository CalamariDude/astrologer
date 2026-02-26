import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const XAI_API_KEY = Deno.env.get("XAI_API_KEY") || Deno.env.get("COSMOSIS_GROK_API_KEY")!;
const FREE_AI_LIMIT = 3;
const PAID_AI_LIMIT = 1000;
const SEPARATOR = "---TECHNICAL---";

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Per-Vantage Deep Analysis ────────────────────────────────────

async function analyzeVantage(
  vantage: any,
  category: string,
  derived?: { label: string; house: number } | null,
): Promise<string> {
  const systemPrompt = `You are analyzing a single energy center in a natal chart. Walk through every data point systematically in the order below. Be thorough — every detail matters. Use full astrological language freely — this is an internal analysis that will be synthesized later.

INTERPRETATION ORDER — follow this EXACT sequence:

1. PLANET — the core energy itself
   - What does this planet represent? Its archetype, drive, and function.
   - Retrograde: if true, this energy turns inward / re-processes / revisits.

2. HOUSE — the life domain where this energy operates
   - Which house is this planet in? What area of life does it activate?
   - Fusion cusp: if present, the planet straddles two houses and operates in BOTH domains simultaneously.

3. SPARK — the degree-based sub-sign (most specific coloring)
   - The spark.sign is the most granular zodiac layer — it shows the very specific flavor at this exact degree.

4. DECAN — the 10° sub-ruler (mid-level coloring)
   - The decan.sign tells you which sign co-rules this 10° portion of the zodiac.
   - Decan number (1, 2, 3) shows early/middle/late expression within the sign.

5. SIGN — the broadest zodiac coloring
   - The main sign is the most general layer. Interpret it LAST of the three layers (Spark → Decan → Sign, specific to general).

6. ASPECTS (interpret in the order given — sorted tightest orb first = strongest influence first)
   - For each aspect:
     * "forced: false" = TRUE aspect — sign distance matches the aspect type. Clean, reliable connection.
     * "forced: true" = FORCED aspect — angular distance qualifies but sign distance doesn't match. Real but operates with tension/ambiguity.
     * energy_flow ("planet_a -> planet_b") shows who initiates: left planet pushes energy toward right planet.
     * orb: smaller = stronger. Under 1° is exact and dominant. 1-3° is strong. 3-6° is moderate.
   - Interpret EVERY aspect. Do not skip any.

7. RULER / FORWARD TRACE — the dispositor chain
   - What sign is on the cusp of this planet's house? Who rules that sign?
   - Where does that ruler sit? Follow the chain — this shows where this planet's energy FLOWS NEXT.

8. BACKWARD TRACE — what feeds into this energy
   - What houses does this planet rule? What planets sit in those houses?
   - This shows the SOURCE MATERIAL feeding into this energy center.

9. CO-TENANTS — who shares this space
   - Who else shares this house? How does each co-tenant interact with the vantage planet?

Be specific and analytical. Every detail you note will help create a better reading.`;

  let categoryContext = `Category context: ${category}`;
  if (derived) {
    categoryContext = `Category context: ${category} (${derived.label} — turned chart, house ${derived.house} as house 1)`;
  }

  const userPrompt = `${categoryContext}

Vantage planet data:
${JSON.stringify(vantage, null, 2)}

Analyze this energy pattern thoroughly.`;

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "grok-3-fast",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`Vantage analysis error for ${vantage.planet?.planet}:`, response.status, errText);
    throw new Error(`AI vantage analysis error: ${response.status}`);
  }

  const result = await response.json();
  return result.choices?.[0]?.message?.content || "";
}

// ─── Synthesis ────────────────────────────────────────────────────

async function synthesize(
  vantageAnalyses: { planet: string; analysis: string }[],
  question: string,
  risingSign: string,
  categories: string,
  isSynastry: boolean,
  personName?: string,
  personNameB?: string,
  hasDerived?: boolean,
): Promise<string> {
  let systemPrompt: string;

  if (isSynastry) {
    const nameA = personName || 'Person A';
    const nameB = personNameB || 'Person B';
    systemPrompt = `You are a wise, perceptive relationship advisor. You have detailed analysis of the dynamic BETWEEN ${nameA} and ${nameB} — how they affect each other, what they trigger in one another, and what their relationship creates as its own entity.

You produce TWO sections in this exact format:

[Plain language reading about their relationship dynamic — all the rules below apply.
Write in flowing paragraphs with behavioral micro-scenarios involving BOTH people by name.]

${SEPARATOR}

[Technical synastry summary for an astrologer. Use proper planet names,
sign names, house overlays, cross-chart aspects with orbs.
Structure with markdown headers per perspective.]

RULES FOR THE READING SECTION (before ${SEPARATOR}):
- NEVER use astrology terminology — no planet names, sign names, house numbers, aspect names, "retrograde", "chart", "synastry", "composite", "natal"
- Describe the DYNAMIC between ${nameA} and ${nameB} using their actual names
- Show how they interact, what they bring out in each other, where they clash, where they flow
- Use behavioral micro-scenarios that both people would recognize:
  * "When ${nameA} starts a sentence with 'I was thinking...' ${nameB} already knows something ambitious is coming — and ${nameB}'s first instinct is to find the flaw in the plan, not because they don't believe in it, but because they want to make sure it's bulletproof."
  * "${nameB} is the one who'll quietly take care of logistics while ${nameA} is still debating the vision. They'll never say 'you're welcome' — they'll just hand ${nameA} the keys and say 'I moved the car so it's easier to leave.'"
- Every major dynamic should include at least one two-person micro-scenario
- Address their question directly about the relationship
- NO preamble, NO "let's explore...", NO "based on...". Dive straight into the reading.
- NO closing summary paragraph restating everything. End on a specific insight, not a recap.

RULES FOR THE TECHNICAL SECTION (after ${SEPARATOR}):
- Use full synastry/composite terminology
- Structure with ## headers per major theme
- Note tight cross-chart aspects with orbs
- Be concise but thorough`;
  } else {
    systemPrompt = `You are a wise, perceptive advisor who understands people deeply. You have access to detailed analysis of this person's inner patterns — personality layers, emotional tendencies, relationship dynamics, career drives, and life timing.

You produce TWO sections in this exact format:

[Plain language reading — all the rules below apply to this section.
Write in flowing paragraphs with behavioral micro-scenarios.]

${SEPARATOR}

[Technical astrology summary for an astrologer. Use proper planet names,
sign names, house numbers, aspect types. Structure with markdown headers
per major theme. Be concise but precise.]

RULES FOR THE READING SECTION (before ${SEPARATOR}):
- NEVER use astrology terminology: no planet names (Saturn, Venus, Mars, Jupiter, Mercury, Moon, Sun, Uranus, Neptune, Pluto, etc.), no sign names (Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces), no house numbers, no aspect names (conjunction, trine, square, opposition, sextile, quincunx), no "retrograde", no "cusp", no "natal", no "chart", no "decan", no "ruling planet"
- Translate everything into plain human language: personality traits, tendencies, strengths, challenges, timing patterns, relationship dynamics
- Use the analysis data to inform your answer but the reader should never know the source is astrology
- Be specific and concrete to THIS person — avoid generic advice
- Write in flowing paragraphs, not bullet lists
- Address the question directly and personally
- NO preamble, NO "let's dive in...", NO "based on your chart...". Start directly with the first insight.
- NO closing summary paragraph that restates everything. End on a specific, forward-looking insight, not a recap.

EXPLANATION STYLE — use "behavioral micro-scenarios":
Don't just state traits abstractly. Show each pattern through a tiny, hyper-specific moment from everyday life that makes the person say "that's literally me." These vignettes are your primary tool.

Examples:

ABSTRACT (avoid): "You tend to be impulsive in conversation and then regret it."
VIGNETTE (do this): "You're the type who'll blurt out 'I honestly love cheese' completely randomly mid-conversation, immediately feel weird about it, then quietly scan everyone's face to see if anyone found it funny — and if they didn't laugh, you'll replay that exact moment at 2am wondering why you're like this."

ABSTRACT (avoid): "You crave deep connection but fear vulnerability."
VIGNETTE (do this): "You'll spend three hours in deep conversation with someone at a party, feel like you've found your actual soul twin — then leave without exchanging numbers because something in you decided it was 'too much too fast.' Two weeks later you'll still be thinking about them."

Every major insight should include at least one micro-scenario like this. Mix vignettes with analysis — don't just list scenarios.

RULES FOR THE TECHNICAL SECTION (after ${SEPARATOR}):
- Use full astrological terminology: planet names, sign names, house numbers, aspect names with orbs
- Structure with markdown headers (##) per major theme
- Include specific placements (e.g. "Venus in Scorpio in the 8th house")
- Note significant aspects with orbs
- Be concise but thorough`;
  }

  const analysesText = vantageAnalyses
    .map(a => `=== ${a.planet.toUpperCase()} ===\n${a.analysis}`)
    .join("\n\n");

  let userPrompt: string;

  if (isSynastry) {
    const nameA = personName || 'Person A';
    const nameB = personNameB || 'Person B';
    userPrompt = `The question about ${nameA} and ${nameB}: "${question}"

Categories analyzed: ${categories}
${nameA}'s rising pattern: ${risingSign}

Deep analyses of their charts:

${analysesText}

Synthesize these into a cohesive answer about ${nameA} and ${nameB}, with TWO sections separated by "${SEPARATOR}".
The first section is the plain-language relationship reading using both names (no astrology terms).
The second section is the technical astrology summary.`;
  } else {
    userPrompt = `The person asked: "${question}"

Categories analyzed: ${categories}
Rising pattern: ${risingSign}

Deep analyses of this person's key energy patterns:

${analysesText}

Synthesize these into a cohesive answer with TWO sections separated by "${SEPARATOR}".
The first section is the plain-language reading (no astrology terms).
The second section is the technical astrology summary.`;
  }

  if (hasDerived) {
    userPrompt += `\n\nNOTE: Some analyses use "derived" house perspectives (turned charts). Integrate these perspectives naturally.`;
  }

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "grok-3-fast",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 6000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Synthesis error:", response.status, errText);
    throw new Error(`AI synthesis error: ${response.status}`);
  }

  const result = await response.json();
  return result.choices?.[0]?.message?.content || "";
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
    const { trees, treesB, question, readingFocus, personName, personNameB } = body;

    // ── Legacy fallback: if no trees, use old flat format ──
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
      .select("subscription_status, trial_ends_at, ai_credits_used, ai_credits_reset_at")
      .eq("id", verifiedUser.id)
      .single();

    if (profileErr) {
      console.warn("Full profile query failed, trying basic:", profileErr.message);
      const { data: basicProfile } = await adminSupabase
        .from("astrologer_profiles")
        .select("subscription_status, trial_ends_at")
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
      }, { onConflict: "id" });
      profile = { subscription_status: "free", trial_ends_at: null, ai_credits_used: 0, ai_credits_reset_at: null };
    }

    const isPaid = profile.subscription_status === "active" ||
      (profile.subscription_status === "trialing" && profile.trial_ends_at && new Date(profile.trial_ends_at) > new Date());

    const limit = isPaid ? PAID_AI_LIMIT : FREE_AI_LIMIT;

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
      return jsonResponse({
        error: "credit_limit",
        message: isPaid
          ? `You've used all ${PAID_AI_LIMIT} AI readings this month. Credits reset on the 1st.`
          : `Free accounts get ${FREE_AI_LIMIT} AI readings per month. Upgrade to Pro for ${PAID_AI_LIMIT}/month.`,
        credits_used: creditsUsed,
        credits_limit: limit,
      });
    }

    // ── Collect all vantages from trees ──
    const isSynastry = readingFocus === 'synastry' && Array.isArray(treesB);
    const hasDerived = trees.some((t: any) => t.derived) || (treesB || []).some((t: any) => t.derived);

    const vantagesWithContext: { vantage: any; category: string; derived?: { label: string; house: number }; label?: string }[] = [];

    for (const t of trees) {
      for (const v of (t.vantages || [])) {
        vantagesWithContext.push({
          vantage: v,
          category: t.category,
          derived: t.derived ? { label: t.derived.label, house: t.derived.derived_from_house } : undefined,
          label: isSynastry ? `${personName || 'A'}'s ${v.planet?.planet}` : undefined,
        });
      }
    }

    if (isSynastry && treesB) {
      for (const t of treesB) {
        for (const v of (t.vantages || [])) {
          vantagesWithContext.push({
            vantage: v,
            category: t.category,
            derived: t.derived ? { label: t.derived.label, house: t.derived.derived_from_house } : undefined,
            label: `${personNameB || 'B'}'s ${v.planet?.planet}`,
          });
        }
      }
    }

    const risingSign = trees[0]?.rising_sign || 'Unknown';
    const categories = [...new Set(trees.map((t: any) => t.category))].join(", ");

    // ── Phase 1: Parallel per-vantage analysis ──
    console.log(`Starting Phase 1: ${vantagesWithContext.length} vantage analyses...`);
    const startTime = Date.now();

    const analysisPromises = vantagesWithContext.map(({ vantage, category, derived, label }) =>
      analyzeVantage(vantage, category, derived).then(analysis => ({
        planet: label || vantage.planet?.planet || 'unknown',
        analysis,
      }))
    );

    const vantageAnalyses = await Promise.all(analysisPromises);
    console.log(`Phase 1 complete in ${Date.now() - startTime}ms`);

    // ── Phase 2: Synthesis ──
    console.log("Starting Phase 2: Synthesis...");
    const synthStart = Date.now();
    const reading = await synthesize(
      vantageAnalyses,
      question || "Give me a comprehensive chart reading",
      risingSign,
      categories,
      isSynastry,
      personName,
      personNameB,
      hasDerived,
    );
    console.log(`Phase 2 complete in ${Date.now() - synthStart}ms`);

    // ── Increment usage ──
    try {
      await adminSupabase
        .from("astrologer_profiles")
        .update({ ai_credits_used: creditsUsed + 1 })
        .eq("id", verifiedUser.id);
    } catch { /* columns may not exist yet */ }

    return jsonResponse({
      reading,
      credits_used: creditsUsed + 1,
      credits_limit: limit,
    });
  } catch (err) {
    console.error("Error:", err);
    return jsonResponse({ error: err.message || "Internal error" });
  }
});
