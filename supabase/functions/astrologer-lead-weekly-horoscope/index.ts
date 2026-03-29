import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const CRON_SECRET = Deno.env.get("CRON_SECRET")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const XAI_API_KEY = Deno.env.get("XAI_API_KEY") || Deno.env.get("COSMOSIS_GROK_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ALL_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const SIGN_EMOJIS: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
  Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
  Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

const SIGN_DATE_RANGES: Record<string, string> = {
  Aries: "Mar 21 – Apr 19", Taurus: "Apr 20 – May 20",
  Gemini: "May 21 – Jun 20", Cancer: "Jun 21 – Jul 22",
  Leo: "Jul 23 – Aug 22", Virgo: "Aug 23 – Sep 22",
  Libra: "Sep 23 – Oct 22", Scorpio: "Oct 23 – Nov 21",
  Sagittarius: "Nov 22 – Dec 21", Capricorn: "Dec 22 – Jan 19",
  Aquarius: "Jan 20 – Feb 18", Pisces: "Feb 19 – Mar 20",
};

// ─── Helpers ────────────────────────────────────────────────────────

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekRange(): string {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(now)} – ${fmt(end)}`;
}

function getSunSign(birthDate: string): string | null {
  // birthDate format: "YYYY-MM-DD" or "MM/DD/YYYY" etc
  let month: number, day: number;
  if (birthDate.includes("-")) {
    const parts = birthDate.split("-");
    month = parseInt(parts[1]);
    day = parseInt(parts[2]);
  } else if (birthDate.includes("/")) {
    const parts = birthDate.split("/");
    month = parseInt(parts[0]);
    day = parseInt(parts[1]);
  } else {
    return null;
  }

  if (!month || !day || month < 1 || month > 12 || day < 1 || day > 31) return null;

  // Sun sign boundaries (approximate)
  const boundaries: [number, number, string][] = [
    [1, 20, "Capricorn"], [2, 19, "Aquarius"], [3, 20, "Pisces"],
    [4, 20, "Aries"], [5, 21, "Taurus"], [6, 21, "Gemini"],
    [7, 23, "Cancer"], [8, 23, "Leo"], [9, 23, "Virgo"],
    [10, 23, "Libra"], [11, 22, "Scorpio"], [12, 22, "Sagittarius"],
  ];

  // Find the sign: if day < boundary day for that month, use previous sign
  const idx = boundaries.findIndex(([m]) => m === month);
  if (idx === -1) return null;
  const [, boundaryDay, nextSign] = boundaries[idx];
  if (day >= boundaryDay) return nextSign;
  // Previous sign
  const prevIdx = (idx - 1 + 12) % 12;
  return boundaries[prevIdx][2];
}

function generateUnsubToken(identifier: string): string {
  const hmac = createHmac("sha256", CRON_SECRET);
  hmac.update(`lead:${identifier}`);
  return hmac.digest("hex") as string;
}

function verifyUnsubToken(identifier: string, token: string): boolean {
  return generateUnsubToken(identifier) === token;
}

// ─── Generate weekly sign horoscopes via Grok ───────────────────────

async function generateWeeklyHoroscopes(
  supabase: any,
  today: string
): Promise<Record<string, string>> {
  // Check cache in astrologer_sign_horoscopes
  const { data: existing } = await supabase
    .from("astrologer_sign_horoscopes")
    .select("sign, content")
    .eq("period", "weekly")
    .eq("horoscope_date", today);

  if (existing && existing.length === 12) {
    const map: Record<string, string> = {};
    for (const row of existing) map[row.sign] = row.content;
    return map;
  }

  const weekRange = getWeekRange();

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
          content: `You write engaging weekly zodiac horoscopes based on real planetary transits. No technical jargon — describe feelings, moods, themes, and energy. Warm, relatable, slightly mysterious tone. Each should feel personal and actionable.`,
        },
        {
          role: "user",
          content: `Write weekly horoscopes for all 12 zodiac signs for the week of ${weekRange} (starting ${today}).

For each sign write 3-4 sentences covering:
- The emotional/energetic theme of the week
- One specific opportunity or challenge to watch for
- A guiding insight or advice

Respond ONLY with JSON (no markdown, no code fences):
{ "Aries": "...", "Taurus": "...", "Gemini": "...", "Cancer": "...", "Leo": "...", "Virgo": "...", "Libra": "...", "Scorpio": "...", "Sagittarius": "...", "Capricorn": "...", "Aquarius": "...", "Pisces": "..." }`,
        },
      ],
    }),
  });

  if (!grokRes.ok) {
    console.error("Grok weekly horoscopes error:", await grokRes.text());
    return {};
  }

  const grokData = await grokRes.json();
  let raw = grokData.choices?.[0]?.message?.content || "";
  raw = raw.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();

  let parsed: Record<string, string>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error("Failed to parse weekly horoscopes:", raw);
    return {};
  }

  // Cache them
  const rows = ALL_SIGNS
    .filter((sign) => parsed[sign])
    .map((sign) => ({
      sign,
      period: "weekly",
      horoscope_date: today,
      content: parsed[sign],
    }));

  if (rows.length > 0) {
    await supabase
      .from("astrologer_sign_horoscopes")
      .upsert(rows, { onConflict: "sign,period,horoscope_date" });
  }

  return parsed;
}

// ─── Email HTML builder ─────────────────────────────────────────────

function buildLeadWeeklyEmailHtml(opts: {
  sign: string;
  content: string;
  weekRange: string;
  email: string;
  functionBaseUrl: string;
  name?: string;
}): string {
  const { sign, content, weekRange, email, functionBaseUrl, name } = opts;
  const emoji = SIGN_EMOJIS[sign] || "✨";
  const dateRange = SIGN_DATE_RANGES[sign] || "";
  const unsubToken = generateUnsubToken(email);
  const unsubscribeUrl = `${functionBaseUrl}/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken}`;

  const greeting = name ? `Hi ${name},` : "Hi there,";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<!--[if mso]><style>table,td{font-family:Arial,sans-serif;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${sign} weekly forecast: what the stars have in store for you this week &#847; &#847; &#847;
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Brand -->
        <tr><td style="padding-bottom:24px;text-align:center;">
          <span style="color:#6366f1;font-size:13px;font-weight:700;letter-spacing:3px;">ASTROLOGER</span>
        </td></tr>

        <!-- Card -->
        <tr><td style="background-color:#18181b;border-radius:16px;padding:32px 28px;">

          <!-- Week badge -->
          <p style="margin:0 0 6px;color:#a1a1aa;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;">WEEKLY HOROSCOPE</p>
          <p style="margin:0 0 16px;color:#71717a;font-size:13px;">${weekRange}</p>

          <!-- Sign header -->
          <h1 style="margin:0 0 8px;color:#ffffff;font-size:26px;font-weight:700;">
            ${emoji} ${sign}
          </h1>
          <p style="margin:0 0 20px;color:#71717a;font-size:13px;">${dateRange}</p>

          <!-- Greeting -->
          <p style="margin:0 0 16px;color:#d4d4d8;font-size:15px;">${greeting}</p>

          <!-- Divider -->
          <hr style="border:none;border-top:1px solid #27272a;margin:0 0 20px;">

          <!-- Horoscope content -->
          <p style="margin:0 0 24px;color:#e4e4e7;font-size:16px;line-height:1.7;">${content}</p>

          <!-- Divider -->
          <hr style="border:none;border-top:1px solid #27272a;margin:0 0 24px;">

          <!-- Upsell section -->
          <div style="background-color:#1e1b4b;border-radius:12px;padding:24px;text-align:center;">
            <p style="margin:0 0 4px;color:#c4b5fd;font-size:18px;font-weight:600;">Want daily readings?</p>
            <p style="margin:0 0 16px;color:#a5b4fc;font-size:14px;line-height:1.5;">
              Get a personalized daily energy reading based on your exact birth chart — not just your Sun sign.
            </p>
            <a href="https://astrologer.app/insight?utm_source=weekly_email&utm_medium=email&utm_campaign=lead_weekly"
               style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 32px;border-radius:10px;">
              Get Your Personal Reading
            </a>
          </div>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="margin:0 0 8px;color:#52525b;font-size:11px;">
            You're receiving this because you entered your birth details on Astrologer.
          </p>
          <p style="margin:0;">
            <a href="${unsubscribeUrl}" style="color:#52525b;font-size:11px;text-decoration:underline;">Unsubscribe</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildLeadUnsubscribePageHtml(): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Unsubscribed</title></head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="text-align:center;padding:40px;">
    <p style="color:#6366f1;font-size:13px;font-weight:700;letter-spacing:3px;margin-bottom:24px;">ASTROLOGER</p>
    <h1 style="color:#ffffff;font-size:22px;font-weight:600;margin-bottom:12px;">You've been unsubscribed</h1>
    <p style="color:#a1a1aa;font-size:15px;">You won't receive any more weekly horoscope emails.</p>
    <p style="color:#71717a;font-size:13px;margin-top:16px;">Changed your mind? Just visit <a href="https://astrologer.app/insight" style="color:#6366f1;">astrologer.app</a> to sign up again.</p>
  </div>
</body>
</html>`;
}

// ─── Main handler ───────────────────────────────────────────────────

serve(async (req) => {
  const url = new URL(req.url);
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const functionBaseUrl = `${SUPABASE_URL}/functions/v1/astrologer-lead-weekly-horoscope`;

  // ── Unsubscribe endpoint (GET) ─────────────────────────────────
  if (req.method === "GET" && url.pathname.endsWith("/unsubscribe")) {
    const email = url.searchParams.get("email");
    const token = url.searchParams.get("token");

    if (!email || !token || !verifyUnsubToken(email, token)) {
      return new Response("Invalid unsubscribe link.", {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }

    // Mark all rows for this email as unsubscribed
    await supabase
      .from("insight_leads")
      .update({ email_unsubscribed: true })
      .eq("email", email);

    return new Response(buildLeadUnsubscribePageHtml(), {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  }

  // ── Batch send (POST) ─────────────────────────────────────────
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  // Auth
  const cronSecret = req.headers.get("x-cron-secret");
  if (!cronSecret || cronSecret !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const today = getTodayDate();
  const weekRange = getWeekRange();

  // ── 1. Generate weekly sign horoscopes (cached if already generated) ──
  const signHoroscopes = await generateWeeklyHoroscopes(supabase, today);
  const signCount = Object.keys(signHoroscopes).length;
  console.log(`Generated/cached ${signCount} weekly sign horoscopes`);

  if (signCount === 0) {
    return new Response(JSON.stringify({ error: "Failed to generate horoscopes" }), { status: 500 });
  }

  // ── 2. Fetch all unique lead emails with birth data ──
  // Get distinct emails, preferring most recent entry (with birth_date)
  const { data: leads, error: queryErr } = await supabase
    .from("insight_leads")
    .select("email, birth_date, birth_location")
    .or("email_unsubscribed.is.null,email_unsubscribed.eq.false")
    .not("email", "is", null)
    .not("birth_date", "is", null)
    .order("created_at", { ascending: false });

  if (queryErr) {
    console.error("Query error:", queryErr);
    return new Response(JSON.stringify({ error: queryErr.message }), { status: 500 });
  }

  // Deduplicate by email (keep first = most recent)
  const seenEmails = new Set<string>();
  const uniqueLeads: { email: string; birth_date: string; name?: string }[] = [];
  for (const lead of leads || []) {
    const emailLower = lead.email.toLowerCase().trim();
    if (seenEmails.has(emailLower)) continue;
    seenEmails.add(emailLower);
    uniqueLeads.push({
      email: lead.email,
      birth_date: lead.birth_date,
    });
  }

  console.log(`Found ${uniqueLeads.length} unique lead emails with birth dates`);

  // ── 3. Also exclude emails that are registered astrologer_profiles ──
  // (They get their own horoscope from the batch function)
  const { data: registeredEmails } = await supabase
    .from("astrologer_profiles")
    .select("email")
    .not("email", "is", null);

  const registeredSet = new Set(
    (registeredEmails || []).map((r: any) => r.email.toLowerCase().trim())
  );

  const eligibleLeads = uniqueLeads.filter(
    (l) => !registeredSet.has(l.email.toLowerCase().trim())
  );

  console.log(`${eligibleLeads.length} leads eligible (excluded ${uniqueLeads.length - eligibleLeads.length} registered users)`);

  // ── 4. Send emails in batches ──
  let sent = 0;
  let skipped = 0;
  let errors = 0;
  const BATCH_SIZE = 50;

  for (let i = 0; i < eligibleLeads.length; i += BATCH_SIZE) {
    const batch = eligibleLeads.slice(i, i + BATCH_SIZE);

    const emailPayloads = batch
      .map((lead) => {
        const sunSign = getSunSign(lead.birth_date);
        if (!sunSign || !signHoroscopes[sunSign]) {
          skipped++;
          return null;
        }

        const emoji = SIGN_EMOJIS[sunSign] || "✨";
        const html = buildLeadWeeklyEmailHtml({
          sign: sunSign,
          content: signHoroscopes[sunSign],
          weekRange,
          email: lead.email,
          functionBaseUrl,
        });

        return {
          from: "Astrologer <horoscope@astrologerapp.org>",
          to: [lead.email],
          subject: `${emoji} ${sunSign} Weekly Horoscope — ${weekRange}`,
          html,
          tags: [
            { name: "campaign", value: "lead_weekly_horoscope" },
            { name: "sign", value: sunSign },
          ],
        };
      })
      .filter(Boolean);

    if (emailPayloads.length === 0) continue;

    // Use Resend batch API
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayloads),
    });

    if (res.ok) {
      const result = await res.json();
      sent += (result.data || emailPayloads).length;
      console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: sent ${emailPayloads.length}`);
    } else {
      const errText = await res.text();
      console.error(`Batch send error:`, errText);
      errors += emailPayloads.length;
    }

    // Slight delay between batches to respect rate limits
    if (i + BATCH_SIZE < eligibleLeads.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // ── 5. Log campaign ──
  await supabase.from("email_campaigns").insert({
    subject: `Weekly Lead Horoscope — ${weekRange}`,
    content: "Auto-generated weekly sign horoscopes for insight leads",
    audience: "insight_leads",
    campaign_name: "lead_weekly_horoscope",
    recipients_count: eligibleLeads.length,
    sent_count: sent,
    failed_count: errors,
  });

  return new Response(
    JSON.stringify({
      ok: true,
      date: today,
      week_range: weekRange,
      signs_generated: signCount,
      total_leads: uniqueLeads.length,
      eligible_leads: eligibleLeads.length,
      sent,
      skipped,
      errors,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
