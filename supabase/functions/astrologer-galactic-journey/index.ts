import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const XAI_API_KEY = Deno.env.get("XAI_API_KEY") || Deno.env.get("COSMOSIS_GROK_API_KEY")!;
const SWISSEPH_API_KEY = Deno.env.get("SWISSEPH_API_KEY") || "";
const SWISSEPH_API_URL = "https://druzematch.fly.dev";

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const TOPIC_PROMPTS: Record<string, string> = {
  love: "love, relationships, romance, and partnership",
  career: "career, ambition, work, and professional success",
  growth: "personal growth, transformation, and self-discovery",
  health: "health, vitality, physical energy, and wellness",
  spiritual: "spirituality, intuition, and inner wisdom",
};

const TOPIC_PLANETS: Record<string, string> = {
  love: "Venus (how they love), Moon (emotional needs), Mars (desire/passion), Jupiter (growth in love), Neptune (ideals/soul connection). Optionally Chiron (relationship wounds).",
  career: "Saturn (discipline/structure), Sun (identity/purpose), Jupiter (opportunities), Mars (drive), Mercury (skills). Optionally North Node (career destiny).",
  growth: "Pluto (transformation), North Node (direction), Chiron (healing), Jupiter (expansion), Saturn (lessons). Optionally Neptune (spiritual growth).",
  health: "Sun (vitality), Moon (emotional health), Mars (energy), Saturn (discipline/structure), Chiron (healing). Optionally Neptune (sensitivity).",
  spiritual: "Neptune (mysticism), Moon (intuition), Pluto (shadow work), North Node (soul purpose), Chiron (spiritual gifts). Optionally Jupiter (faith).",
};

// Planet name → key mapping for the frontend
const PLANET_KEY_MAP: Record<string, string> = {
  "Sun": "sun", "Moon": "moon", "Mercury": "mercury", "Venus": "venus",
  "Mars": "mars", "Jupiter": "jupiter", "Saturn": "saturn", "Uranus": "uranus",
  "Neptune": "neptune", "Pluto": "pluto", "North Node": "northnode",
  "NorthNode": "northnode", "Chiron": "chiron",
};

function planetToKey(name: string): string {
  return PLANET_KEY_MAP[name] ?? name.toLowerCase().replace(/\s+/g, "");
}

// Format a transit date string offset from today
function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// Fetch transits from Swiss Ephemeris API
interface TransitAspect {
  transitPlanet: string;
  natalPlanet: string;
  aspect: string;
  orb: number;
}

async function fetchTransits(
  natalChart: Record<string, unknown>,
  transitDate: string,
): Promise<{ aspects: TransitAspect[]; transitPositions: Record<string, string> }> {
  try {
    const resp = await fetch(`${SWISSEPH_API_URL}/transit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SWISSEPH_API_KEY}`,
      },
      body: JSON.stringify({
        natal_chart: natalChart,
        transit_date: transitDate,
      }),
    });

    if (!resp.ok) {
      console.error(`Transit API error: ${resp.status} ${await resp.text()}`);
      return { aspects: [], transitPositions: {} };
    }

    const data = await resp.json();

    const aspects: TransitAspect[] = (data.aspects_to_natal ?? []).map((a: any) => ({
      transitPlanet: a.transitPlanet ?? a.planet1,
      natalPlanet: a.natalPlanet ?? a.planet2,
      aspect: a.aspect,
      orb: a.orb,
    }));

    // Build transit positions summary
    const transitPositions: Record<string, string> = {};
    for (const tp of data.transit_planets ?? []) {
      const key = planetToKey(tp.planet);
      transitPositions[key] = `${tp.sign} ${tp.degree}°${tp.minute}'${tp.retrograde ? " R" : ""}`;
    }

    return { aspects, transitPositions };
  } catch (err) {
    console.error("Transit fetch error:", err);
    return { aspects: [], transitPositions: {} };
  }
}

// Format transit data for the AI prompt — grouped by natal planet
function formatTransitData(
  label: string,
  aspects: TransitAspect[],
): string {
  if (aspects.length === 0) return "";

  // Sort by orb (tightest aspects first = most impactful)
  const sorted = [...aspects].sort((a, b) => a.orb - b.orb);

  // Take top 10 most significant aspects
  const top = sorted.slice(0, 10);

  // Group by natal planet to show which planets are getting hit by multiple transits
  const grouped: Record<string, string[]> = {};
  for (const a of top) {
    const natalKey = planetToKey(a.natalPlanet);
    const tightness = a.orb < 1 ? "EXACT" : a.orb < 3 ? "strong" : "building";
    const line = `    ${a.transitPlanet} ${a.aspect} (orb ${a.orb.toFixed(1)}° — ${tightness})`;
    if (!grouped[natalKey]) grouped[natalKey] = [];
    grouped[natalKey].push(line);
  }

  const sections = Object.entries(grouped).map(([natal, lines]) => {
    const multi = lines.length > 1 ? ` ⚡ ${lines.length} TRANSITS — great for a multi-transit scene` : "";
    return `  natal ${natal}:${multi}\n${lines.join("\n")}`;
  });

  return `\n${label}:\n${sections.join("\n")}`;
}

// Format vantage tree data into a compact but rich text block for the AI
function formatVantageTrees(trees: any[]): string {
  if (!trees || trees.length === 0) return "";

  let output = "\n═══ DEEP CHART ANALYSIS (Vantage Tree System) ═══\n";
  output += "Use this data for specific, layered insights. Reference dispositor chains, house themes, and aspect patterns.\n";

  for (const tree of trees) {
    output += `\nCategory: ${tree.category} | Rising: ${tree.rising_sign}\n`;

    for (const v of tree.vantages) {
      const p = v.planet;
      output += `\n▸ ${p.planet.toUpperCase()} in ${p.sign} H${p.house}`;
      if (p.retrograde) output += " ℞";
      output += `\n  House themes: ${p.house_themes}`;
      if (p.decan) output += `\n  Decan ${p.decan.number} (${p.decan.sign})`;
      if (p.spark) output += `\n  Spark: ${p.spark.sign} "${p.spark.symbol}"`;
      if (p.fusion_cusp) output += `\n  Cusp fusion: H${p.fusion_cusp.from_house}↔H${p.fusion_cusp.to_house}`;

      // Aspects
      if (p.aspects && p.aspects.length > 0) {
        output += "\n  Aspects:";
        for (const a of p.aspects) {
          output += `\n    ${a.name} ${a.target} in ${a.target_sign} H${a.target_house} (${a.orb.toFixed(1)}° ${a.nature})`;
          if (a.forced) output += " [out-of-sign]";
        }
      }

      // Co-tenants
      if (v.co_tenants && v.co_tenants.length > 0) {
        output += `\n  Shares H${p.house} with: ${v.co_tenants.map((c: any) => `${c.planet} in ${c.sign}`).join(", ")}`;
      }

      // Backward trace (rulership reach)
      if (v.backward_trace?.source_houses?.length > 0) {
        output += "\n  Rules:";
        for (const sh of v.backward_trace.source_houses) {
          const planets = sh.planets_in_house?.map((pl: any) => pl.planet).join(", ") || "empty";
          output += `\n    H${sh.house} (${sh.sign_on_cusp}): ${planets}`;
          if (sh.retrograde_house) output += " [retro ruler]";
        }
      }

      // Forward trace (dispositor chain)
      if (v.forward_trace?.ruler_position) {
        const chain: string[] = [];
        let ft = v.forward_trace;
        while (ft && ft.ruler_position) {
          chain.push(`${ft.house_ruler} → ${ft.ruler_position.sign} H${ft.ruler_position.house}`);
          ft = ft.next;
        }
        if (chain.length > 0) {
          output += `\n  Dispositor: ${chain.join(" → ")}`;
        }
      }

      // Profection context
      if (v.profection_context) {
        const pc = v.profection_context;
        output += `\n  Profection year: ${pc.profection_year_sign} (lord: ${pc.year_time_lord})`;
        if (pc.profection_month_sign) {
          output += `, month: ${pc.profection_month_sign} (lord: ${pc.month_time_lord})`;
        }
        if (pc.is_year_lord) output += " ★ YEAR LORD";
        if (pc.is_month_lord) output += " ★ MONTH LORD";
      }

      // Activations
      if (v.activations && v.activations.length > 0) {
        output += `\n  Degree activations: ${v.activations.map((a: any) =>
          `${a.planet} (age ${a.activation_age}, ${a.distance_degrees.toFixed(1)}° away)`
        ).join(", ")}`;
      }
    }
  }

  output += "\n═══════════════════════════════════════════════════\n";
  return output;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { chartSummary, natalChart, natalAspects, vantageTrees, topic, customQuestion, name, birthDate, daysToToday } = await req.json();

    if (!chartSummary || !name) {
      return jsonResponse({ error: "Missing required fields" }, 400);
    }

    const isCustom = topic === "custom" && customQuestion;
    const topicDesc = isCustom ? customQuestion : (TOPIC_PROMPTS[topic] ?? "personal growth and self-discovery");
    const topicLabel = isCustom ? customQuestion : topicDesc;

    // Detect entity type from name — company charts use "CompanyName (Incorporation)" format
    const companyMatch = name.match(/^(.+?)\s*\((Incorporation|IPO|Founded|Launch|Listing|Merger|Rebrand)\)$/i);
    const isCompany = !!companyMatch;
    const entityName = companyMatch ? companyMatch[1].trim() : name;
    const entityEvent = companyMatch ? companyMatch[2] : null;

    // Detect if the question is temporal (asking about timing/when)
    const temporalPatterns = /\b(when|this month|this year|this week|soon|will i|what's coming|what is coming|timing|next|right now|lately|currently|upcoming|future|today|tomorrow|forecast|predict)\b/i;
    const isTemporal = isCustom ? temporalPatterns.test(customQuestion) : false;

    // ── Fetch real transit data from Swiss Ephemeris API ──
    let transitSection = "";
    let hasRealTransits = false;

    if (natalChart && SWISSEPH_API_KEY) {
      const today = dateOffset(0);
      const in1Month = dateOffset(30);
      const in3Months = dateOffset(90);

      // Fetch transits for 3 time windows in parallel
      const [nowTransits, monthTransits, quarterTransits] = await Promise.all([
        fetchTransits(natalChart, today),
        fetchTransits(natalChart, in1Month),
        fetchTransits(natalChart, in3Months),
      ]);

      const nowFormatted = formatTransitData(`CURRENT TRANSITS (${today})`, nowTransits.aspects);
      const monthFormatted = formatTransitData(`TRANSITS IN 1 MONTH (${in1Month})`, monthTransits.aspects);
      const quarterFormatted = formatTransitData(`TRANSITS IN 3 MONTHS (${in3Months})`, quarterTransits.aspects);

      if (nowTransits.aspects.length > 0 || monthTransits.aspects.length > 0 || quarterTransits.aspects.length > 0) {
        hasRealTransits = true;

        // Current transit planet positions
        const posLines = Object.entries(nowTransits.transitPositions)
          .map(([k, v]) => `  Transit ${k}: ${v}`)
          .join("\n");

        transitSection = `
═══ REAL TRANSIT DATA (from Swiss Ephemeris — astronomically precise) ═══
${posLines ? `\nCurrent transit positions:\n${posLines}` : ""}
${nowFormatted}${monthFormatted}${quarterFormatted}

IMPORTANT: Use ONLY these real transits for transit scenes. Do NOT invent transits.
Group transits by natal planet when possible — if Saturn AND Neptune both hit Venus, make ONE multi-transit scene
with transitPlanets: ["saturn", "neptune"] and natalTarget: "venus". This is more powerful and insightful.
For single transits, use transitPlanet (string). For multiple, use transitPlanets (array).
All planet keys must be lowercase: sun, moon, venus, mars, mercury, jupiter, saturn, uranus, neptune, pluto, northnode, chiron.
═══════════════════════════════════════════════════════════════════════════`;
      }
    }

    if (!hasRealTransits) {
      console.log("No real transit data available — AI will use general transit knowledge");
    }

    // Format vantage tree data
    const vantageSection = formatVantageTrees(vantageTrees);

    // Build entity-aware context
    const entityContext = isCompany
      ? `\nENTITY CONTEXT: This is a COMPANY chart for "${entityName}" (${entityEvent} chart). Interpret everything through the lens of the company, not a person.
- "Sun" = the company's core identity and brand
- "Moon" = the company's culture, internal morale, public sentiment
- "Mercury" = communications, marketing, tech, intellectual property
- "Venus" = brand appeal, customer loyalty, partnerships, design aesthetic
- "Mars" = competitive drive, execution speed, aggressive strategy
- "Jupiter" = expansion, market growth, international reach, luck
- "Saturn" = regulatory pressure, restructuring, long-term stability, debt
- "Uranus" = disruption, innovation, sudden pivots, tech breakthroughs
- "Neptune" = brand mystique, market illusions, creative vision, scandals
- "Pluto" = power dynamics, mergers, transformations, control struggles
- Houses represent: H1=brand identity, H2=revenue/assets, H3=communications/PR, H4=headquarters/culture, H5=products/creativity, H6=operations/employees, H7=partnerships/competitors, H8=investor money/debt/M&A, H9=international/legal, H10=market position/CEO, H11=community/shareholders, H12=hidden risks/R&D
- Say "${entityName}" not "you". Example: "${entityName}'s brand identity is going through a serious transformation right now."
- For transits: talk about what's happening to the COMPANY. "Saturn hitting ${entityName}'s Venus means partnerships and brand deals are getting tested."
`
      : '';

    const systemPrompt = `You're someone's smart friend who happens to know astrology really well. You're telling them about their chart like you're sitting across from them at a bar. Casual, direct, zero fluff.

Each scene zooms into ONE planet and tells ${isCompany ? `the listener something specific about ${entityName}` : 'them something specific about their life'}.
${entityContext}
DEPTH RULES:
- You have DEEP chart analysis data (vantage trees). USE IT. Don't just say "Venus in Libra." Reference the house themes, dispositor chains, and aspect patterns to give real, specific insights.
- Example: If Venus is in Libra H7, ruled by Venus itself (self-ruling), with a square to Pluto in H8, and the dispositor chain points to H10 through Saturn, say something like: "${isCompany ? `${entityName}'s partnerships have this intensity to them. Their brand is wrapped up in power dynamics and market pressure. They attract partners who force growth, not comfort.` : 'Your relationships have this intensity to them because your love nature is wrapped up in power dynamics and career pressure. You attract people who challenge you to grow, not people who keep things comfortable.'}"
- Weave in the CONNECTIONS between planets. If Mars rules the house Venus is in, mention what that means. If two planets share a house, talk about that tension or harmony.
- If profection data is available and a planet is the YEAR LORD or MONTH LORD, this is EXTRA important right now. Mention timing: "${isCompany ? `This year is really about ${entityName}'s Mars. Competitive energy is in charge.` : 'This year is really about your Mars. It\'s in charge.'}"
- If degree activations are close, weave that in naturally.

TONE RULES:
- Sound like a normal person. Not a mystical guru. Not a horoscope column. Just a friend who gets it.
- Keep it conversational. Contractions, short sentences, natural rhythm.
- 2-3 sentences per scene. Be specific and insightful, but don't lecture.
- Don't explain astrology mechanics. Just say what it means for ${isCompany ? `${entityName}'s business` : 'THEIR life'}. They'll feel it.
- Stay on topic: ${topicLabel}. Everything relates back to this.
- NO astrology jargon. No "trines" or "aspects" or "harmonious energy." Just describe what's actually happening.
- NEVER use hyphens or em dashes (— or -) in narrations. Use periods or commas instead. This is for TTS clarity.

SCENE TYPES — this is important:
- "natal" scenes: about who they ARE. Their permanent wiring. Set focusPlanet to the natal planet key. No transitPlanet/natalTarget needed.
- "transit" scenes: about what's HAPPENING now or coming soon. TWO sub-types:

  a) SINGLE-TRANSIT: One transiting planet hitting one natal planet.
     Set transitPlanet (e.g. "saturn"), natalTarget (e.g. "venus"), focusPlanet = natalTarget.
     Camera frames both planets and shows the aspect line.

  b) MULTI-TRANSIT (preferred when multiple transits hit the same natal planet or relate to the same theme):
     Multiple transiting planets are all affecting one natal planet at once.
     Set transitPlanets as an ARRAY (e.g. ["saturn", "neptune"]), natalTarget (e.g. "venus"), focusPlanet = natalTarget.
     Camera zooms into the natal planet and shows ALL transit lines converging on it. Very cinematic.
     Narration should weave together what each transit is doing: "Saturn is testing your Venus while Neptune dissolves your old ideals about love. You're being rebuilt from the inside out."

STRONGLY PREFER multi-transit scenes when the data supports it. If 2-3 transits are hitting the same natal planet, or 2-3 transits all relate to the topic, bundle them into one rich scene. This feels more insightful and real.

For transit scenes, just say what's happening: "Saturn's sitting on your Venus right now. Things feel heavier in love. Not bad, just more real."

SCENE MIX — depends on whether the question is TEMPORAL or GENERAL:
- TEMPORAL questions (contain words like "when", "this month", "this year", "soon", "will I", "what's coming", "timing", "next", "right now", "lately", "currently"): TRANSIT-HEAVY. 4-5 transit scenes, 1-2 natal scenes max. The user is asking about TIMING — give them transits. Start with 1 natal scene (context), then 4-5 transit scenes walking through what's happening now → next month → next 3 months, then close with a brief natal scene (anchor).
- GENERAL questions (about personality, tendencies, "who am I", "how do I", "what kind of"): NATAL-HEAVY. Start with 2-3 natal scenes, then 2-3 transit scenes, close with a natal scene.

Return ONLY valid JSON:
{
  "topic": "${topic}",
  "title": "Short title (3-5 words)",
  "intro": "One casual sentence. Like '${isCompany ? `Let's look at ${entityName}'s chart.` : `Alright, let's look at your chart.`}'",
  "scenes": [
    {
      "title": "2-3 word scene title",
      "narration": "2-3 sentences. Casual, specific, layered. Use the vantage tree connections for depth.",
      "focusPlanet": "planet_key (the natal planet — camera focuses here)",
      "transitPlanet": "planet_key or null (single-transit scenes only — the one moving planet)",
      "transitPlanets": ["planet_key", "..."] or null (multi-transit scenes — array of ALL transiting planets hitting this natal planet),
      "natalTarget": "planet_key or null (the natal planet being aspected)",
      "sceneType": "natal|transit",
      "transitDayOffset": number,
      "durationSeconds": 14,
      "mood": "calm|intense|joyful|reflective|transformative"
    }
  ],
  "outro": "One short closing line. Casual, not dramatic. Like 'That's your chart. Use what clicks.'"
}`;

    const planetGuide = isCustom
      ? "Pick the 5-6 planets most relevant to their question. Use your astrological judgment."
      : (TOPIC_PLANETS[topic] ?? TOPIC_PLANETS.growth);

    const userPrompt = `Journey for ${name} about: ${topicLabel}
${isTemporal ? "\n⏰ THIS IS A TEMPORAL/TIMING QUESTION — focus heavily on transits (4-5 transit scenes). The user wants to know WHEN and WHAT'S COMING, not just who they are.\n" : ""}
Chart overview:
${Object.entries(chartSummary).map(([k, v]) => `  ${k}: ${v}`).join("\n")}
${vantageSection}${transitSection}

Birth: ${birthDate ?? "unknown"}
Days to today: ${daysToToday}

Planet guide: ${planetGuide}

Create 5-6 scenes${isTemporal ? " (TRANSIT-HEAVY: 4-5 transit scenes, 1-2 natal max)" : ""}:
- USE THE VANTAGE TREE DATA for natal scenes. Reference dispositor chains, house themes, co-tenants, and aspect patterns to give deep, specific insights. Don't just read the surface placement.
- If a planet is marked as YEAR LORD or MONTH LORD in profection data, emphasize its current importance.
- For natal scenes (sceneType: "natal"): set transitDayOffset to 0, focusPlanet to the natal planet key. No transitPlanet/natalTarget needed.
- For transit scenes (sceneType: "transit"):${hasRealTransits ? " USE ONLY the real transits listed above." : ""} Set natalTarget and focusPlanet to the natal planet being hit.
  - If ONE transit hits it: set transitPlanet (string, e.g. "saturn").
  - If MULTIPLE transits hit the same natal planet (or relate to the same theme): set transitPlanets (array, e.g. ["saturn", "neptune"]). Weave them together in the narration.
  - Set transitDayOffset to ${daysToToday} (now), ${daysToToday + 30} (1 month), ${daysToToday + 90} (3 months) based on when the transit is happening.
- For multi-transit: just mention both naturally. "Saturn and Neptune are both on your Venus. Love's getting a reality check and a spiritual upgrade at the same time."
- focusPlanet/transitPlanet/natalTarget keys: sun, moon, venus, mars, mercury, jupiter, saturn, uranus, neptune, pluto, northnode, chiron
- Sound normal. "You're not great at X" / "This is a big deal for you right now" / "Yeah, that tracks."
- Weave in the deeper connections: dispositor chains, house rulerships, co-tenants. This is what makes it feel like a real reading, not a horoscope.`;

    const maxRetries = 3;
    let content = "";

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
          temperature: 0.8,
          max_tokens: 3500,
          stream: false,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        content = result.choices?.[0]?.message?.content || "";
        break;
      }

      const errorText = await response.text();
      console.error(`Grok journey error (attempt ${attempt + 1}):`, response.status, errorText);

      if ((response.status === 429 || response.status >= 500) && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      return jsonResponse({ error: "AI service unavailable" }, 502);
    }

    // Parse JSON from response (handle markdown code blocks)
    let parsed;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse journey JSON:", content);
      return jsonResponse({ error: "Failed to generate journey" }, 500);
    }

    // Validate structure
    if (!parsed.scenes || !Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
      return jsonResponse({ error: "Invalid journey structure" }, 500);
    }

    // Normalize planet keys in scene data
    for (const scene of parsed.scenes) {
      if (scene.focusPlanet) scene.focusPlanet = planetToKey(scene.focusPlanet);
      if (scene.transitPlanet) scene.transitPlanet = planetToKey(scene.transitPlanet);
      if (scene.natalTarget) scene.natalTarget = planetToKey(scene.natalTarget);
      if (Array.isArray(scene.transitPlanets)) {
        scene.transitPlanets = scene.transitPlanets.map((p: string) => planetToKey(p));
      }
      // If AI used transitPlanets with a single entry, also set transitPlanet for backward compat
      if (Array.isArray(scene.transitPlanets) && scene.transitPlanets.length === 1 && !scene.transitPlanet) {
        scene.transitPlanet = scene.transitPlanets[0];
      }
    }

    // Tag response with transit data source
    parsed._transitSource = hasRealTransits ? "swiss_ephemeris" : "ai_general";

    return jsonResponse(parsed);
  } catch (err) {
    console.error("Journey error:", err);
    return jsonResponse({ error: String(err) }, 500);
  }
});
