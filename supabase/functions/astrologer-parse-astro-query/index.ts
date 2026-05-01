import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const SYSTEM_PROMPT = `You convert short astrology timeline queries into JSON intents.
Output ONLY a single JSON object. No prose. No markdown.

Schema:
- {"kind":"sign_ingress","body":<Body>,"sign":<Sign>,"direction":"next"|"prev"}
- {"kind":"aspect","transit":<Body>,"aspect":<Aspect>,"target":<Body>,"scope":"transit_to_natal"|"sky","direction":"next"|"prev"}
- {"kind":"house_ingress","body":<Body>,"house":1-12,"direction":"next"|"prev"}
- {"kind":"retrograde","body":<Body>,"phase":"station_retrograde"|"station_direct"|"period","direction":"next"|"prev"}
- {"kind":"moon_phase","phase":"new"|"full"|"first_quarter"|"last_quarter","direction":"next"|"prev"}
- {"kind":"unsupported","reason":<short string>}

Body: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, NorthNode, SouthNode, Chiron, Ascendant, Midheaven
Sign: Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces
Aspect: conjunction, opposition, trine, square, sextile, quincunx, semisextile, semisquare, sesquiquadrate

Use scope="transit_to_natal" if the user says "my", "natal", or otherwise references their own chart. Otherwise scope="sky".
Default direction is "next" unless the query mentions "last", "previous", "past".

Examples:
"when is moon in scorpio next" -> {"kind":"sign_ingress","body":"Moon","sign":"Scorpio","direction":"next"}
"next saturn square my sun" -> {"kind":"aspect","transit":"Saturn","aspect":"square","target":"Sun","scope":"transit_to_natal","direction":"next"}
"when does mercury go retrograde" -> {"kind":"retrograde","body":"Mercury","phase":"station_retrograde","direction":"next"}
"next full moon" -> {"kind":"moon_phase","phase":"full","direction":"next"}
"when did jupiter last enter taurus" -> {"kind":"sign_ingress","body":"Jupiter","sign":"Taurus","direction":"prev"}
"venus trine jupiter" -> {"kind":"aspect","transit":"Venus","aspect":"trine","target":"Jupiter","scope":"sky","direction":"next"}
"will i find love" -> {"kind":"unsupported","reason":"Open-ended life question, not a timeline lookup."}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!GROQ_API_KEY) return jsonResponse({ error: "GROQ_API_KEY not configured" }, 500);

  let query: string;
  try {
    const body = await req.json();
    query = String(body?.query ?? "").trim();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }
  if (!query) return jsonResponse({ error: "query is required" }, 400);
  if (query.length > 300) return jsonResponse({ error: "query too long" }, 400);

  const groqRes = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      max_tokens: 200,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: query },
      ],
    }),
  });

  if (!groqRes.ok) {
    const text = await groqRes.text();
    return jsonResponse({ error: `Groq error ${groqRes.status}: ${text}` }, 502);
  }

  const data = await groqRes.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) return jsonResponse({ error: "Empty response from model" }, 502);

  let intent: unknown;
  try {
    intent = JSON.parse(content);
  } catch {
    return jsonResponse({ error: "Model did not return valid JSON", raw: content }, 502);
  }

  return jsonResponse({ intent });
});
