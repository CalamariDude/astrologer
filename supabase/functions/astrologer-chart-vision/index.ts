import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const KNOWN_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const TARGET_PLANETS = ["Saturn", "Jupiter", "Sun", "Moon", "Ascendant"];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MODEL = "gpt-4.1-mini";

const SYSTEM_PROMPT = `You are an expert astrologer reading a birth chart image. Extract ONLY these 5 positions:

1. **Saturn** — symbol: ♄ (looks like an "h" with a cross, or "5" with a tail). ~29 year orbit.
2. **Jupiter** — symbol: ♃ (looks like a stylized "4"). ~12 year orbit.
3. **Sun** — symbol: ☉ (circle with a dot in the center). Most prominent body.
4. **Moon** — symbol: ☽ (crescent shape). Fastest moving body.
5. **Ascendant** — labeled "Asc" or "AC" on the LEFT side of the chart wheel (9 o'clock position). This is where the horizontal line meets the left edge of the zodiac ring.

HOW TO READ POSITIONS:
- If a data table/list is shown alongside the chart wheel, USE THE TABLE — it is far more precise.
- Each position has a sign (e.g. Scorpio) and a degree (0-29). Just the whole degree, no minutes needed.
- Example: "18°♏" means 18 degrees of Scorpio. If you see "18°♏24'", just report degree 18.
- "R" next to a planet means retrograde — still extract the position normally.
- The Ascendant is NOT a planet — it's the point on the left horizon of the chart.

Sign names (use exactly): Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces
Planet names (use exactly): Saturn, Jupiter, Sun, Moon, Ascendant

Return ONLY valid JSON, no other text:
{"positions": [{"planet": "Saturn", "degree": 24, "sign": "Pisces"}, {"planet": "Jupiter", "degree": 18, "sign": "Scorpio"}, {"planet": "Sun", "degree": 5, "sign": "Leo"}, {"planet": "Moon", "degree": 15, "sign": "Cancer"}, {"planet": "Ascendant", "degree": 10, "sign": "Virgo"}]}`;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const t0 = Date.now();
  console.log("[chart-vision] Request received");

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Sign in to use chart vision" }, 401);
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
        return jsonResponse({ error: "Auth failed" }, 401);
      }
    }
    console.log("[chart-vision] Auth OK +%dms", Date.now() - t0);

    const body = await req.json();
    const { image_base64 } = body;

    if (!image_base64 || typeof image_base64 !== "string") {
      return jsonResponse({ error: "Missing image_base64" }, 400);
    }

    const approxBytes = (image_base64.length * 3) / 4;
    if (approxBytes > MAX_IMAGE_SIZE) {
      return jsonResponse({ error: "Image too large (max 10MB)" }, 400);
    }

    // Single call for 5 key planets
    console.log("[chart-vision] Calling GPT-4.1-mini for 5 planets +%dms", Date.now() - t0);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: image_base64, detail: "high" } },
              { type: "text", text: "Read Saturn, Jupiter, Sun, Moon, and Ascendant from this birth chart. Return JSON only." },
            ],
          },
        ],
        temperature: 0,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[chart-vision] API error %d: %s", response.status, errText.slice(0, 300));
      return jsonResponse({ error: `AI vision error: ${response.status}` }, 502);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";
    console.log("[chart-vision] Response: %s +%dms", content.slice(0, 400), Date.now() - t0);

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[chart-vision] No JSON in response");
      return jsonResponse({ error: "Could not parse positions from image" }, 422);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed.positions)) {
      return jsonResponse({ error: "No positions array in response" }, 422);
    }

    const positions = parsed.positions
      .filter((p: any) =>
        TARGET_PLANETS.includes(p.planet) &&
        KNOWN_SIGNS.includes(p.sign) &&
        typeof p.degree === "number"
      )
      .map((p: any) => ({
        planet: p.planet,
        degree: Math.max(0, Math.min(29, Math.round(p.degree))),
        minute: 0,
        sign: p.sign,
      }));

    console.log("[chart-vision] Got %d/%d positions +%dms", positions.length, TARGET_PLANETS.length, Date.now() - t0);

    if (positions.length === 0) {
      return jsonResponse({ error: "No valid positions detected in the image" }, 422);
    }

    return jsonResponse({ positions });
  } catch (err) {
    console.error("[chart-vision] Error +%dms:", Date.now() - t0, err);
    return jsonResponse({ error: err.message || "Internal error" }, 500);
  }
});
