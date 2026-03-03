import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const CRON_SECRET = Deno.env.get("CRON_SECRET")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const XAI_API_KEY = Deno.env.get("XAI_API_KEY") || Deno.env.get("COSMOSIS_GROK_API_KEY")!;
const SWISSEPH_API_URL = "https://druzematch.fly.dev";
const SWISSEPH_API_KEY = Deno.env.get("SWISSEPH_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const PAID_TIERS = ["horoscope", "astrologer", "professional"];
const ALL_SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

// ─── Helpers ────────────────────────────────────────────────────────

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getSign(longitude: number): string {
  return ALL_SIGNS[Math.floor(longitude / 30)];
}

function getHouseWSS(longitude: number, ascendant: number): number {
  const offset = ((longitude - ascendant) % 360 + 360) % 360;
  return Math.floor(offset / 30) + 1;
}

function getDecan(longitude: number): number {
  return Math.floor((longitude % 30) / 10) + 1;
}

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

function generateUnsubToken(userId: string): string {
  const hmac = createHmac("sha256", CRON_SECRET);
  hmac.update(userId);
  return hmac.digest("hex") as string;
}

function verifyUnsubToken(userId: string, token: string): boolean {
  return generateUnsubToken(userId) === token;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function isMonday(): boolean {
  return new Date().getDay() === 1;
}

function isFirstOfMonth(): boolean {
  return new Date().getDate() === 1;
}

// ─── Generate sign horoscopes (daily + weekly on Monday + monthly on 1st) ──

async function generateSignHoroscopes(
  supabase: any,
  today: string
): Promise<Record<string, string>> {
  // Check if daily sign horoscopes already exist for today
  const { data: existing } = await supabase
    .from("astrologer_sign_horoscopes")
    .select("sign, content")
    .eq("period", "daily")
    .eq("horoscope_date", today);

  if (existing && existing.length === 12) {
    const map: Record<string, string> = {};
    for (const row of existing) map[row.sign] = row.content;
    return map;
  }

  // Generate all 12 daily sign horoscopes in one Grok call
  const periods: string[] = ["daily"];
  if (isMonday()) periods.push("weekly");
  if (isFirstOfMonth()) periods.push("monthly");

  const periodInstructions = periods.map(p => {
    if (p === "daily") return "DAILY: One sentence per sign about today's energy.";
    if (p === "weekly") return "WEEKLY: 2-3 sentences per sign about this week's major themes and transits.";
    return "MONTHLY: 3-4 sentences per sign about this month's big picture — major transits, turning points, opportunities.";
  }).join("\n");

  const grokRes = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${XAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-4-1-fast",
      temperature: 0.7,
      max_tokens: 3000,
      messages: [
        {
          role: "system",
          content: `You write zodiac sign horoscopes based on real current transits. No astrological jargon — describe feelings, moods, and energy. Warm, direct tone.`,
        },
        {
          role: "user",
          content: `Write horoscopes for all 12 zodiac signs for ${today}.

${periodInstructions}

Respond ONLY with JSON (no markdown, no code fences):
{
  ${periods.map(p => `"${p}": { "Aries": "...", "Taurus": "...", "Gemini": "...", "Cancer": "...", "Leo": "...", "Virgo": "...", "Libra": "...", "Scorpio": "...", "Sagittarius": "...", "Capricorn": "...", "Aquarius": "...", "Pisces": "..." }`).join(",\n  ")}
}`,
        },
      ],
    }),
  });

  if (!grokRes.ok) {
    console.error("Grok sign horoscopes error:", await grokRes.text());
    return {};
  }

  const grokData = await grokRes.json();
  let raw = grokData.choices?.[0]?.message?.content || "";
  raw = raw.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();

  let parsed: Record<string, Record<string, string>>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error("Failed to parse sign horoscopes:", raw);
    return {};
  }

  // Upsert all sign horoscopes
  const rows: { sign: string; period: string; horoscope_date: string; content: string }[] = [];
  for (const period of periods) {
    const signMap = parsed[period];
    if (!signMap) continue;
    for (const sign of ALL_SIGNS) {
      if (signMap[sign]) {
        rows.push({ sign, period, horoscope_date: today, content: signMap[sign] });
      }
    }
  }

  if (rows.length > 0) {
    await supabase
      .from("astrologer_sign_horoscopes")
      .upsert(rows, { onConflict: "sign,period,horoscope_date" });
  }

  // Return daily map for email use
  const dailyMap: Record<string, string> = {};
  const daily = parsed["daily"] || {};
  for (const sign of ALL_SIGNS) {
    if (daily[sign]) dailyMap[sign] = daily[sign];
  }
  return dailyMap;
}

// ─── Email HTML builders ────────────────────────────────────────────

function buildEmailFooter(userId: string, functionBaseUrl: string): string {
  const unsubToken = generateUnsubToken(userId);
  const unsubscribeUrl = `${functionBaseUrl}/unsubscribe?uid=${userId}&token=${unsubToken}`;
  return `
        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="margin:0;">
            <a href="https://astrologer.app/settings#notifications" style="color:#6366f1;font-size:12px;text-decoration:underline;">Manage email preferences</a>
          </p>
          <p style="margin:8px 0 0;">
            <a href="${unsubscribeUrl}" style="color:#52525b;font-size:11px;text-decoration:underline;">Unsubscribe</a>
          </p>
        </td></tr>`;
}

function buildHoroscopeEmailHtml(opts: {
  date: string;
  natalSnapshot: { sun: string; moon: string; rising: string | null; name: string };
  content: string;
  question: string;
  userId: string;
  functionBaseUrl: string;
}): string {
  const { date, natalSnapshot, content, question, userId, functionBaseUrl } = opts;
  const badge = [natalSnapshot.sun, natalSnapshot.moon, natalSnapshot.rising].filter(Boolean).join(" · ");
  const formattedDate = formatDate(date);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <!-- Brand -->
        <tr><td style="padding-bottom:24px;text-align:center;">
          <span style="color:#6366f1;font-size:13px;font-weight:700;letter-spacing:3px;">ASTROLOGER</span>
        </td></tr>
        <!-- Card -->
        <tr><td style="background-color:#18181b;border-radius:16px;padding:32px 28px;">
          <!-- Date -->
          <p style="margin:0 0 6px;color:#a1a1aa;font-size:13px;text-transform:uppercase;letter-spacing:1px;">${formattedDate}</p>
          <!-- Name -->
          <h1 style="margin:0 0 16px;color:#ffffff;font-size:22px;font-weight:600;">Good morning${natalSnapshot.name ? ", " + natalSnapshot.name : ""}</h1>
          <!-- Natal badge -->
          <div style="display:inline-block;background-color:#1e1b4b;border-radius:8px;padding:8px 14px;margin-bottom:20px;">
            <span style="color:#a5b4fc;font-size:13px;font-weight:500;">${badge}</span>
          </div>
          <!-- Divider -->
          <hr style="border:none;border-top:1px solid #27272a;margin:20px 0;">
          <!-- Horoscope -->
          <p style="margin:0 0 20px;color:#e4e4e7;font-size:16px;line-height:1.65;">${content}</p>
          <!-- Question -->
          <p style="margin:0 0 24px;color:#c4b5fd;font-size:16px;font-style:italic;line-height:1.5;">${question}</p>
          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="https://astrologer.app/dashboard" style="display:inline-block;background-color:#6366f1;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 28px;border-radius:10px;">Open Dashboard</a>
          </td></tr></table>
        </td></tr>
        ${buildEmailFooter(userId, functionBaseUrl)}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildGenericHoroscopeEmailHtml(opts: {
  date: string;
  sign: string;
  content: string;
  userId: string;
  functionBaseUrl: string;
  name?: string;
}): string {
  const { date, sign, content, userId, functionBaseUrl, name } = opts;
  const formattedDate = formatDate(date);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <!-- Brand -->
        <tr><td style="padding-bottom:24px;text-align:center;">
          <span style="color:#6366f1;font-size:13px;font-weight:700;letter-spacing:3px;">ASTROLOGER</span>
        </td></tr>
        <!-- Card -->
        <tr><td style="background-color:#18181b;border-radius:16px;padding:32px 28px;">
          <!-- Date -->
          <p style="margin:0 0 6px;color:#a1a1aa;font-size:13px;text-transform:uppercase;letter-spacing:1px;">${formattedDate}</p>
          <!-- Name -->
          <h1 style="margin:0 0 16px;color:#ffffff;font-size:22px;font-weight:600;">${sign}${name ? ` — ${name}` : ""}</h1>
          <!-- Horoscope -->
          <p style="margin:0 0 24px;color:#e4e4e7;font-size:16px;line-height:1.65;">${content}</p>
          <!-- Divider -->
          <hr style="border:none;border-top:1px solid #27272a;margin:0 0 24px;">
          <!-- Upgrade CTA -->
          <p style="margin:0 0 16px;color:#a1a1aa;font-size:14px;">Want a reading based on your exact birth chart?</p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="https://astrologer.app/dashboard?upgrade=horoscope" style="display:inline-block;background-color:#6366f1;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 28px;border-radius:10px;">Upgrade to Personal Horoscope</a>
          </td></tr></table>
        </td></tr>
        ${buildEmailFooter(userId, functionBaseUrl)}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildUnsubscribePageHtml(): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Unsubscribed</title></head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="text-align:center;padding:40px;">
    <p style="color:#6366f1;font-size:13px;font-weight:700;letter-spacing:3px;margin-bottom:24px;">ASTROLOGER</p>
    <h1 style="color:#ffffff;font-size:22px;font-weight:600;margin-bottom:12px;">You've been unsubscribed</h1>
    <p style="color:#a1a1aa;font-size:15px;">You won't receive any more daily horoscope emails.</p>
    <p style="margin-top:24px;"><a href="https://astrologer.app/settings#notifications" style="color:#6366f1;font-size:14px;text-decoration:underline;">Re-enable in settings</a></p>
  </div>
</body>
</html>`;
}

// ─── Horoscope generation (same logic as astrologer-daily-horoscope) ─

async function generateHoroscope(
  natalChart: any,
  savedChart: any,
  today: string
): Promise<{ content: string; question: string; natalSnapshot: any } | null> {
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
    console.error("Transit API error:", await transitRes.text());
    return null;
  }

  const transitData = await transitRes.json();
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

  const sunSign = planets.sun?.sign || getSign(planets.sun?.longitude || 0);
  const moonSign = planets.moon?.sign || getSign(planets.moon?.longitude || 0);
  let risingSign = "unknown";
  if (natalChart?.houses?.length > 0) {
    risingSign = getSign(natalChart.houses[0]);
  } else if (natalChart?.ascendant) {
    risingSign = getSign(natalChart.ascendant);
  }

  const natalSnapshot = {
    sun: `${sunSign} Sun`,
    moon: `${moonSign} Moon`,
    rising: risingSign !== "unknown" ? `${risingSign} Rising` : null,
    name: savedChart.person_a_name,
  };

  const systemPrompt = `You write one-paragraph daily energy readings rooted in precise chart data.

Your job: describe what today's transits likely FEEL LIKE for this specific person — the impulses, moods, pulls, and currents running through their day. Be specific to their chart. Name the feelings, not the planets.

End with a single catalyzing question that helps them lean into the energy that's most in their favor today. The question should feel like it unlocks something — not a journal prompt, but a "what if you..." that points them toward their highest move.

RULES:
- Zero astrological jargon (no planet names, sign names, house numbers, aspect names)
- One flowing paragraph, 3-4 sentences max
- Then one short catalyzing question
- Warm, direct, interesting — like a perceptive friend who happens to see energy patterns`;

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
{"content": "the paragraph", "question": "the catalyzing question"}`;

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
    console.error("Grok API error:", await grokRes.text());
    return null;
  }

  const grokData = await grokRes.json();
  let raw = grokData.choices?.[0]?.message?.content || "";
  raw = raw.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();

  try {
    const parsed = JSON.parse(raw);
    return { content: parsed.content, question: parsed.question, natalSnapshot };
  } catch {
    console.error("Failed to parse Grok response:", raw);
    return null;
  }
}

// ─── Send email via Resend ──────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Astrologer <horoscope@astrologerapp.org>",
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    console.error(`Resend error for ${to}:`, await res.text());
    return false;
  }
  return true;
}

// ─── Main handler ───────────────────────────────────────────────────

serve(async (req) => {
  const url = new URL(req.url);

  // ── Unsubscribe endpoint (GET) ─────────────────────────────────
  if (req.method === "GET" && url.pathname.endsWith("/unsubscribe")) {
    const userId = url.searchParams.get("uid");
    const token = url.searchParams.get("token");
    if (!userId || !token || !verifyUnsubToken(userId, token)) {
      return new Response("Invalid unsubscribe link.", { status: 400, headers: { "Content-Type": "text/html" } });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await supabase
      .from("astrologer_profiles")
      .update({ email_unsubscribed: true })
      .eq("id", userId);

    return new Response(buildUnsubscribePageHtml(), {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  }

  // ── Batch send (POST) ─────────────────────────────────────────
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  // Auth via cron secret
  const cronSecret = req.headers.get("x-cron-secret");
  if (!cronSecret || cronSecret !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const today = getTodayDate();
  const functionBaseUrl = `${SUPABASE_URL}/functions/v1/astrologer-email-horoscope-batch`;

  // ── 0. Generate 12 sign horoscopes (daily + weekly/monthly if applicable) ──
  const signHoroscopes = await generateSignHoroscopes(supabase, today);
  console.log(`Generated ${Object.keys(signHoroscopes).length} sign horoscopes`);

  // ── 1. Query ALL eligible users (not just trial + paid) ──────
  const { data: eligibleUsers, error: queryErr } = await supabase
    .from("astrologer_profiles")
    .select("id, email, subscription_tier, created_at, display_name")
    .or("last_horoscope_email_at.is.null,last_horoscope_email_at.lt." + today)
    .eq("email_unsubscribed", false)
    .not("email", "is", null);

  if (queryErr) {
    console.error("Query error:", queryErr);
    return new Response(JSON.stringify({ error: queryErr.message }), { status: 500 });
  }

  let personalSent = 0;
  let genericSent = 0;
  let skipped = 0;
  let errors = 0;

  for (const user of eligibleUsers || []) {
    try {
      const isPaid = PAID_TIERS.includes(user.subscription_tier);
      const accountAgeDays = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24);
      const isFreeTrial = !isPaid && accountAgeDays < 7;
      const hasPersonalAccess = isPaid || isFreeTrial;

      if (hasPersonalAccess) {
        // ── Personal horoscope email ──
        const { data: savedChart } = await supabase
          .from("saved_charts")
          .select("person_a_name, person_a_date, person_a_time, person_a_location, person_a_lat, person_a_lng, person_a_chart")
          .eq("user_id", user.id)
          .eq("chart_type", "natal")
          .order("created_at", { ascending: true })
          .limit(1)
          .single();

        if (!savedChart) {
          skipped++;
          continue;
        }

        const natalChart = savedChart.person_a_chart;

        // Check cache first
        const { data: cached } = await supabase
          .from("astrologer_horoscopes")
          .select("content, transit_summary, natal_snapshot")
          .eq("user_id", user.id)
          .eq("horoscope_date", today)
          .eq("topic", "daily")
          .maybeSingle();

        let content: string;
        let question: string;
        let natalSnapshot: any;

        if (cached) {
          content = cached.content;
          question = cached.transit_summary?.question || "";
          natalSnapshot = cached.natal_snapshot;
        } else {
          const result = await generateHoroscope(natalChart, savedChart, today);
          if (!result) {
            errors++;
            continue;
          }
          content = result.content;
          question = result.question;
          natalSnapshot = result.natalSnapshot;

          await supabase
            .from("astrologer_horoscopes")
            .upsert({
              user_id: user.id,
              topic: "daily",
              horoscope_date: today,
              content,
              transit_summary: { question },
              natal_snapshot: natalSnapshot,
            }, { onConflict: "user_id,topic,horoscope_date" });
        }

        const html = buildHoroscopeEmailHtml({
          date: today,
          natalSnapshot,
          content,
          question,
          userId: user.id,
          functionBaseUrl,
        });

        const ok = await sendEmail(user.email, `Your energy reading for ${formatDate(today)}`, html);
        if (ok) {
          await supabase
            .from("astrologer_profiles")
            .update({ last_horoscope_email_at: new Date().toISOString() })
            .eq("id", user.id);
          personalSent++;
        } else {
          errors++;
        }
      } else {
        // ── Generic sign horoscope email (free past trial) ──
        // Look up user's sun sign from their saved chart
        const { data: savedChart } = await supabase
          .from("saved_charts")
          .select("person_a_name, person_a_chart")
          .eq("user_id", user.id)
          .eq("chart_type", "natal")
          .order("created_at", { ascending: true })
          .limit(1)
          .single();

        if (!savedChart?.person_a_chart?.planets?.sun) {
          skipped++;
          continue;
        }

        const sunLong = savedChart.person_a_chart.planets.sun.longitude || 0;
        const sunSign = savedChart.person_a_chart.planets.sun.sign || getSign(sunLong);
        const genericContent = signHoroscopes[sunSign];

        if (!genericContent) {
          skipped++;
          continue;
        }

        const html = buildGenericHoroscopeEmailHtml({
          date: today,
          sign: sunSign,
          content: genericContent,
          userId: user.id,
          functionBaseUrl,
          name: savedChart.person_a_name || user.display_name || "",
        });

        const ok = await sendEmail(user.email, `${sunSign} — ${formatDate(today)}`, html);
        if (ok) {
          await supabase
            .from("astrologer_profiles")
            .update({ last_horoscope_email_at: new Date().toISOString() })
            .eq("id", user.id);
          genericSent++;
        } else {
          errors++;
        }
      }
    } catch (err: any) {
      console.error(`Error processing user ${user.id}:`, err.message);
      errors++;
    }
  }

  return new Response(JSON.stringify({
    ok: true,
    date: today,
    sign_horoscopes_generated: Object.keys(signHoroscopes).length,
    horoscopes: { personal_sent: personalSent, generic_sent: genericSent, skipped, errors },
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
