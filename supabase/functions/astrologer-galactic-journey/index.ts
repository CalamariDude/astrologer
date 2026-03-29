import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const XAI_API_KEY = Deno.env.get("XAI_API_KEY") || Deno.env.get("COSMOSIS_GROK_API_KEY")!;
const SWISSEPH_API_KEY = Deno.env.get("SWISSEPH_API_KEY") || "";
const SWISSEPH_API_URL = "https://druzematch.fly.dev";

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

// Normalize planet keys in a scene object
function normalizeScene(scene: any): any {
  if (scene.focusPlanet) scene.focusPlanet = planetToKey(scene.focusPlanet);
  if (scene.transitPlanet) scene.transitPlanet = planetToKey(scene.transitPlanet);
  if (scene.natalTarget) scene.natalTarget = planetToKey(scene.natalTarget);
  if (Array.isArray(scene.transitPlanets)) {
    scene.transitPlanets = scene.transitPlanets.map((p: string) => planetToKey(p));
  }
  if (Array.isArray(scene.transitPlanets) && scene.transitPlanets.length === 1 && !scene.transitPlanet) {
    scene.transitPlanet = scene.transitPlanets[0];
  }
  return scene;
}

// ── Planner: fast Grok call to assign scene topics without writing narrations ──
interface PlannedScene {
  index: number;
  focusPlanet: string;
  topic: string;
  sceneType: "natal" | "transit";
  mood: string;
  chartFactors: string;
  transitPlanet?: string;
  transitPlanets?: string[];
  natalTarget?: string;
  transitDayOffset?: number;
  title: string;
}

interface JourneyPlan {
  title: string;
  intro: string;
  outro: string;
  scenes: PlannedScene[];
}

async function planJourney(
  chartSummary: Record<string, string>,
  topicLabel: string,
  topic: string,
  transitSection: string,
  vantageSection: string,
  isTemporal: boolean,
  isCompany: boolean,
  entityName: string,
  name: string,
  birthDate: string,
  daysToToday: number,
  planetGuide: string,
  hasRealTransits: boolean,
): Promise<JourneyPlan> {
  const plannerPrompt = `You are a journey planner for an astrological reading app. Your job is to PLAN 25 scenes — assign which planet, topic, sceneType, and mood each scene covers. You do NOT write the narrations.

The reading is about: ${topicLabel}
${isTemporal ? "This is a TEMPORAL/TIMING question — heavy on transits." : "This is a GENERAL question — heavy on natal."}
${isCompany ? `This is a COMPANY chart for "${entityName}".` : ""}

Chart overview:
${Object.entries(chartSummary).map(([k, v]) => `  ${k}: ${v}`).join("\n")}
${vantageSection}${transitSection}

Birth: ${birthDate ?? "unknown"}
Days to today: ${daysToToday}
Planet guide: ${planetGuide}

SCENE MIX RULES — MANDATORY:
- Never place more than 2 transit scenes in a row. Alternate with natal scenes.
- Never place more than 3 natal scenes in a row.
- Each planet should appear as focusPlanet in at most 2 scenes.
- Scenes 0-2 (free teaser): 2 natal + 1 transit. Hook the user with personality accuracy.
- Scenes 3-8: alternate natal/transit, building depth.
- Scenes 9-16: mix freely, introduce timing themes gradually.
- Scenes 17-24: close with forward-looking scenes + one grounding natal scene at the end (scene 24).
- For transit scenes, vary the timeframe: some "right now" (transitDayOffset=${daysToToday}), some "coming weeks" (transitDayOffset=${daysToToday + 30}), some "next few months" (transitDayOffset=${daysToToday + 90}). Don't cluster all in one timeframe.
${isTemporal ? `- TRANSIT-HEAVY: 15-18 transit scenes, 7-10 natal.` : `- NATAL-HEAVY: 15-18 natal scenes, 7-10 transit.`}

For each scene, provide:
- index (0-24)
- focusPlanet (lowercase key: sun, moon, venus, mars, mercury, jupiter, saturn, uranus, neptune, pluto, northnode, chiron)
- topic: a 5-10 word description of what this scene should cover
- sceneType: "natal" or "transit"
- mood: "calm", "intense", "joyful", "reflective", or "transformative"
- chartFactors: which chart placements/aspects/houses to reference (e.g. "Venus in Aries H9 square Pluto, ruled by Mars in Scorpio H4")
- title: 2-3 word scene title
- For transit scenes: transitPlanet (string) or transitPlanets (array), natalTarget, transitDayOffset
${hasRealTransits ? "- USE ONLY the real transits listed above for transit scenes." : ""}

Also provide:
- title: overall journey title (3-5 words)
- intro: two warm sentences setting up the reading
- outro: 3-4 sentence summary tying themes together

Return ONLY valid JSON:
{
  "title": "...",
  "intro": "...",
  "outro": "...",
  "scenes": [{ index, focusPlanet, topic, sceneType, mood, chartFactors, title, transitPlanet?, transitPlanets?, natalTarget?, transitDayOffset? }, ...]
}`;

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "grok-4-1-fast",
      messages: [
        { role: "system", content: "You are a precise planning assistant. Return only valid JSON." },
        { role: "user", content: plannerPrompt },
      ],
      temperature: 0.3,
      max_tokens: 3000,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Planner API error: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content || "";

  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
  const plan = JSON.parse(jsonStr);

  if (!plan.scenes || !Array.isArray(plan.scenes) || plan.scenes.length < 20) {
    throw new Error(`Planner returned ${plan.scenes?.length ?? 0} scenes, need at least 20`);
  }

  return plan;
}

// ── Scene Writer: generate narrations for a batch of planned scenes ──
async function generateSceneBatch(
  plannedScenes: PlannedScene[],
  systemPrompt: string,
  chartSummary: Record<string, string>,
  vantageSection: string,
  transitSection: string,
  topicLabel: string,
  name: string,
): Promise<any[]> {
  const sceneDescriptions = plannedScenes.map(s => {
    let desc = `Scene ${s.index}: "${s.title}" — ${s.topic}
  focusPlanet: ${s.focusPlanet}, sceneType: ${s.sceneType}, mood: ${s.mood}
  chartFactors: ${s.chartFactors}`;
    if (s.sceneType === "transit") {
      if (s.transitPlanets) desc += `\n  transitPlanets: [${s.transitPlanets.join(", ")}], natalTarget: ${s.natalTarget}, transitDayOffset: ${s.transitDayOffset}`;
      else if (s.transitPlanet) desc += `\n  transitPlanet: ${s.transitPlanet}, natalTarget: ${s.natalTarget}, transitDayOffset: ${s.transitDayOffset}`;
    }
    return desc;
  }).join("\n\n");

  const writerPrompt = `Write the narrations for these ${plannedScenes.length} scenes. Journey for ${name} about: ${topicLabel}

Chart overview:
${Object.entries(chartSummary).map(([k, v]) => `  ${k}: ${v}`).join("\n")}
${vantageSection}${transitSection}

SCENES TO WRITE:
${sceneDescriptions}

For each scene, write the narration (4-6 sentences, one cohesive paragraph). Follow ALL the rules from the system prompt exactly.

Return ONLY a JSON array of scene objects:
[
  {
    "index": ${plannedScenes[0].index},
    "title": "${plannedScenes[0].title}",
    "narration": "4-6 sentences...",
    "focusPlanet": "${plannedScenes[0].focusPlanet}",
    "sceneType": "${plannedScenes[0].sceneType}",
    "mood": "${plannedScenes[0].mood}",
    "transitPlanet": "..." or null,
    "transitPlanets": [...] or null,
    "natalTarget": "..." or null,
    "transitDayOffset": number,
    "durationSeconds": 14
  },
  ...
]`;

  const maxRetries = 2;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
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
            { role: "user", content: writerPrompt },
          ],
          temperature: 0.8,
          max_tokens: Math.max(plannedScenes.length * 600, 2000),
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Writer batch error (attempt ${attempt + 1}):`, response.status, errorText);
        if ((response.status === 429 || response.status >= 500) && attempt < maxRetries - 1) {
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000 + Math.random() * 500));
          continue;
        }
        throw new Error(`Writer API error: ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || "";

      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      const scenes = JSON.parse(jsonStr);
      const scenesArray = Array.isArray(scenes) ? scenes : scenes.scenes ?? [];

      // Normalize and fill in planner data for any missing fields
      return scenesArray.map((s: any, i: number) => {
        const planned = plannedScenes[i];
        return normalizeScene({
          ...s,
          index: s.index ?? planned?.index ?? i,
          focusPlanet: s.focusPlanet ?? planned?.focusPlanet,
          sceneType: s.sceneType ?? planned?.sceneType ?? "natal",
          mood: s.mood ?? planned?.mood ?? "calm",
          title: s.title ?? planned?.title ?? `Scene ${i}`,
          transitPlanet: s.transitPlanet ?? planned?.transitPlanet ?? null,
          transitPlanets: s.transitPlanets ?? planned?.transitPlanets ?? null,
          natalTarget: s.natalTarget ?? planned?.natalTarget ?? null,
          transitDayOffset: s.transitDayOffset ?? planned?.transitDayOffset ?? 0,
          durationSeconds: s.durationSeconds ?? 14,
        });
      });
    } catch (err) {
      if (attempt < maxRetries - 1) {
        console.error(`Writer parse error (attempt ${attempt + 1}):`, err);
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      throw err;
    }
  }

  throw new Error("Writer batch failed after retries");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { chartSummary, natalChart, natalAspects, vantageTrees, topic, customQuestion, name, birthDate, daysToToday } = await req.json();

    if (!chartSummary || !name) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    const systemPrompt = `You're someone's smart friend who reads charts really well. You describe what you see in their chart as specific observations about their life. Each observation should be so specific that the person thinks "how did you know that?" The user will confirm or deny each one.

Each scene focuses on ONE planet/pattern and describes a hyper-specific behavior or pattern in their life.
${entityContext}
TOPIC OVERRIDE — THIS OVERRIDES EVERYTHING ELSE:
The customQuestion below contains SPECIFIC instructions about what each scene must cover.
Follow those instructions EXACTLY. Each scene must be about the topic described, not generic chart observations.
If the topic says "describe THE PARTNER", every scene describes the partner — not the user's personality.
If the topic says "name SPECIFIC TALENTS", every scene names a concrete talent — not vague personality traits.
Do NOT drift into generic "you are deep/intense/creative" observations. Stay laser-focused on the topic.

HOW TO CRAFT OBSERVATIONS — THIS IS CRITICAL:
You must combine MULTIPLE chart factors to paint a picture so specific it could only apply to this person. Use ALL of these:
1. The planet's SIGN (personality flavor)
2. The planet's HOUSE (life area)
3. The planet's ASPECTS (connections to other planets, especially tight ones)
4. The DISPOSITOR (what planet rules the sign, and where is THAT planet?)
5. CO-TENANTS (other planets in the same house)

EXAMPLE — Venus at 14° Aries in H9, square Pluto in H6, ruled by Mars in Scorpio H4:
GOOD: "The people you fall for tend to be from a completely different world than yours. Different background, different culture, maybe even a different country. And the attraction is never casual. It hits fast, goes deep immediately, and there's always this private intensity to it that nobody else sees. You probably have a pattern of keeping the most passionate parts of your relationships behind closed doors, almost like a secret life."

BAD: "You are adventurous in love and like travel."

ANOTHER EXAMPLE — Moon in Scorpio in H6, trine Saturn in Pisces H10:
GOOD: "When something is really bothering you, the people around you probably can't tell. Instead of talking about it, you throw yourself into work. You clean, you organize, you take on extra projects. The heavier things get emotionally, the more productive you become. Your boss probably loves you for it, but the people closest to you sometimes feel shut out because they can tell something's off but you won't say what."

BAD: "You process emotions through work and daily routines."

FORMAT EACH SCENE AS:
- ONE TOPIC PER SCENE. Each scene makes exactly ONE point about their life and elaborates on it fully.
- Do NOT cram multiple observations into one scene. If you have two insights, make two scenes.
- 4-6 FULL sentences, all about the SAME single observation, exploring it from different angles
- Each sentence must be at least 15 words long. NO short fragments like "Heart drives renewal" or "Bonds either consume or evolve you."
- Sentence 1: State the pattern clearly. Sentence 2-3: Give a concrete example of how this shows up day-to-day. Sentence 4-5: Explain WHY this happens or what it means for them. Sentence 6: The landing.
- The scene should read like ONE COHESIVE PARAGRAPH telling a mini-story, not a list of disconnected observations
- Each sentence should CONNECT to the one before it. Use transitions: "And because of that...", "The thing is...", "What makes this tricky is...", "So when..."
- NO questions. Just statements. The user will respond with "yes that's me" or "not really."

COHESION IS CRITICAL. Here is an example of what NOT to do vs what TO do:

BAD (choppy, disconnected, fragment-heavy):
"Your feelings surge intensely during romance, creativity, or time with kids, demanding private depth. You channel storms into hidden projects or passionate pursuits that remake you. Outward calm hides inner transformation tied to daily service. You protect joy with fierce loyalty. Bonds either consume or evolve you. Heart drives renewal."

GOOD (cohesive, flowing, each sentence builds on the last):
"When you fall for someone or get excited about a creative project, you don't do it halfway. You go all in, and the intensity of what you feel is something most people around you never fully see. You keep that side of yourself private, almost guarded, because letting someone into that part of you feels like handing them something they could break. The people who do get in tend to notice that you show love through fierce loyalty, through showing up when it counts, not through big romantic gestures. And if a relationship stops growing, if it starts to feel stagnant, you're the one who will either push it to evolve or walk away entirely. There's no in between for you."

Notice the difference: the GOOD version reads like someone TALKING to you. Each sentence flows into the next. It tells a STORY. The BAD version reads like a horoscope — disconnected keyword sentences that could apply to anyone.

TIMING RULES — CRITICAL:
- NEVER use specific dates, months, or years. No "November 2024", no "Spring 2025", no "by April."
- Instead use relative timing: "lately", "recently", "in the coming stretch", "this chapter of your life"

TONE RULES:
- Sound like a normal person telling a friend something they noticed. Warm, direct, no fluff.
- Write in complete, natural sentences that flow when read aloud. Each sentence should be a full thought, not a fragment.
- MINIMUM 15 words per sentence. If a sentence is shorter than that, combine it with the next one.
- The whole scene should feel like one flowing thought, not six separate bullet points disguised as prose.
- ZERO astrology jargon. No planet names, no sign names, no house numbers, no "trines", "squares", "aspects", "retrograde", "cosmic", "energy," "fine-tuning," "rewiring." NONE. Just plain human language about their actual life.
- Don't give advice. Just describe what you see. Let the accuracy speak for itself.
- NEVER use hyphens or em dashes. Use periods or commas instead. This is for TTS clarity.
- NEVER use compressed, keyword-heavy language. No "heart drives renewal", no "bonds consume or evolve you", no "storms channel into pursuits."
- Each sentence should describe a moment the person can picture from their real life.
- Use simple, everyday words. Write at a 6th-grade reading level. If there's a simpler word, use it. "Hard" instead of "arduous." "Drawn to" instead of "magnetically oriented toward." "Noticed" instead of "discerned." The reader should never have to re-read a sentence to understand it.

ABSOLUTE BAN — abstract noun chains that sound deep but mean nothing:
These are sentences where you string together abstract concepts without describing anything concrete. They sound poetic but the reader has NO IDEA what you actually mean.

BANNED examples (never write anything like these):
- "Home rituals evolve into global perspectives on surrender." (What does this MEAN? What ritual? What surrender?)
- "Crowds in retreats amplify your quiet knowing." (What knowing? What crowd? This is meaningless.)
- "Journeys fuel your boundless inner light." (This is a fortune cookie, not a reading.)
- "Faith grows through road trips where you debate ethics with fiery conviction among dreamers." (Too many abstract nouns crammed together.)
- "Study buddies push your limits, blending action plans with mystical trust." (What is "mystical trust"?)

THE TEST: After you write a sentence, ask yourself "Could the person ACT on this? Can they PICTURE a specific moment?" If not, rewrite it.

REWRITE the banned examples into real language:
- "Home rituals evolve into global perspectives on surrender" → "You started meditating or journaling at home, and over time it changed how you see the world. Things you used to stress about just don't bother you the same way anymore."
- "Crowds in retreats amplify your quiet knowing" → "When you're at a workshop or a group event, you tend to sit back and listen. But by the end, you usually walk away understanding something about yourself that nobody else pointed out."
- "Faith grows through road trips" → "Some of the moments that changed what you believe happened on trips. A conversation with a stranger, a place that felt different than anywhere you'd been before."

EVERY sentence you write must pass this test: if you read it to a friend, would they say "I know exactly what you mean" or would they say "what?"
- Stay on topic: ${topicLabel}. Every observation relates back to this.
- USE the chart data. If you see "venus: 14° Aries H9", that means Venus is in Aries in the 9th house. Use the HOUSE MEANINGS and SIGN QUALITIES to craft the observation.

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
     Narration should weave together the real life effects: "Relationships feel heavier and more real lately, while your old ideals about love are dissolving. You're being rebuilt from the inside out."

STRONGLY PREFER multi-transit scenes when the data supports it. If 2-3 transits are hitting the same natal planet, or 2-3 transits all relate to the topic, bundle them into one rich scene. This feels more insightful and real.

For transit scenes, lead with life experience, not planets: "Love's been feeling heavier lately, right? More real. Like the easy stuff got stripped away and now it's just the truth. That's not a bad thing. The relationships that survive this stretch are the ones worth keeping."`;

    const planetGuide = isCustom
      ? "Pick the 5-6 planets most relevant to their question. Use your astrological judgment."
      : (TOPIC_PLANETS[topic] ?? TOPIC_PLANETS.growth);

    // ── SSE Streaming Response ──
    const encoder = new TextEncoder();

    const clientStream = new ReadableStream({
      async start(controller) {
        try {
          // === Phase 1: Planner ===
          console.log("Phase 1: Planning journey...");
          let plan: JourneyPlan;
          try {
            plan = await planJourney(
              chartSummary, topicLabel, topic, transitSection, vantageSection,
              isTemporal, isCompany, entityName, name, birthDate ?? "unknown", daysToToday,
              planetGuide, hasRealTransits,
            );
          } catch (err) {
            console.error("Planner failed:", err);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Failed to plan journey" })}\n\n`));
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            controller.close();
            return;
          }

          // Ensure we have 25 scenes (pad if planner returned fewer)
          while (plan.scenes.length < 25) {
            const last = plan.scenes[plan.scenes.length - 1];
            plan.scenes.push({
              ...last,
              index: plan.scenes.length,
              title: `Insight ${plan.scenes.length + 1}`,
              topic: "additional personal insight",
            });
          }

          const totalScenes = plan.scenes.length;

          // Emit planned event
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            phase: "planned",
            title: plan.title,
            intro: plan.intro,
            outro: plan.outro,
            totalScenes,
          })}\n\n`));
          console.log(`Plan complete: "${plan.title}", ${totalScenes} scenes`);

          // === Phase 2: Batched scene generation ===
          // Batch 1: scenes 0-2 (free teaser — highest priority)
          // Batch 2: scenes 3-7 (first paid batch)
          // Batch 3: scenes 8-16 (middle section)
          // Batch 4: scenes 17-24 (final section)
          const batches = [
            plan.scenes.slice(0, 3),   // 0-2
            plan.scenes.slice(3, 8),   // 3-7
            plan.scenes.slice(8, 17),  // 8-16
            plan.scenes.slice(17, 25), // 17-24
          ];

          // Ordered emission buffer
          let nextToEmit = 0;
          const completedScenes: Map<number, any> = new Map();

          function emitReady() {
            while (completedScenes.has(nextToEmit)) {
              const scene = completedScenes.get(nextToEmit)!;
              completedScenes.delete(nextToEmit);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                phase: "scene",
                index: nextToEmit,
                scene,
              })}\n\n`));
              nextToEmit++;
            }
          }

          async function runBatch(batchScenes: PlannedScene[]): Promise<void> {
            try {
              const results = await generateSceneBatch(
                batchScenes, systemPrompt, chartSummary,
                vantageSection, transitSection, topicLabel, name,
              );

              for (let i = 0; i < results.length; i++) {
                const sceneIndex = batchScenes[i]?.index ?? i;
                completedScenes.set(sceneIndex, results[i]);
              }
              emitReady();
            } catch (err) {
              console.error("Batch generation failed:", err);
              // Emit placeholder scenes for failed batch
              for (const ps of batchScenes) {
                completedScenes.set(ps.index, normalizeScene({
                  index: ps.index,
                  title: ps.title,
                  narration: "This insight is being prepared for you. Please continue to the next card.",
                  focusPlanet: ps.focusPlanet,
                  sceneType: ps.sceneType,
                  mood: ps.mood,
                  transitPlanet: ps.transitPlanet ?? null,
                  transitPlanets: ps.transitPlanets ?? null,
                  natalTarget: ps.natalTarget ?? null,
                  transitDayOffset: ps.transitDayOffset ?? 0,
                  durationSeconds: 14,
                }));
              }
              emitReady();
            }
          }

          // Launch batch 1 and batch 2 concurrently (with 200ms stagger for batch 2)
          const batch1Promise = runBatch(batches[0]);
          const batch2Promise = new Promise<void>(resolve =>
            setTimeout(() => runBatch(batches[1]).then(resolve), 200)
          );

          // Wait for batch 1, then launch batch 3
          await batch1Promise;
          const batch3Promise = runBatch(batches[2]);

          // Wait for batch 2, then launch batch 4
          await batch2Promise;
          const batch4Promise = runBatch(batches[3]);

          // Wait for remaining batches
          await Promise.all([batch3Promise, batch4Promise]);

          // Emit any remaining buffered scenes
          emitReady();

          // === Phase 3: Complete ===
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            phase: "complete",
            _transitSource: hasRealTransits ? "swiss_ephemeris" : "ai_general",
          })}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();

        } catch (err) {
          console.error("Stream error:", err);
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`));
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            controller.close();
          } catch {
            // Controller already closed
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
    console.error("Journey error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
