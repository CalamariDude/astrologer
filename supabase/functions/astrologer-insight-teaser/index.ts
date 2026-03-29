import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const XAI_API_KEY = Deno.env.get("XAI_API_KEY") || Deno.env.get("COSMOSIS_GROK_API_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { chart_summary, module_id, teaser_prompt } = await req.json();

    if (!chart_summary || !teaser_prompt) {
      return new Response(
        JSON.stringify({ error: "Missing chart_summary or teaser_prompt" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Build a compact chart description for the teaser
    const chartDescription = Object.entries(chart_summary.planets || {})
      .map(([name, p]: [string, any]) =>
        `${name}: ${p.sign}${p.house ? ` H${p.house}` : ""}${p.retrograde ? " (R)" : ""}`
      )
      .join(", ");

    const angles = chart_summary.angles
      ? `ASC: ${Math.floor((chart_summary.angles.ascendant || 0) / 30)} (${["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"][Math.floor((chart_summary.angles.ascendant || 0) / 30)]}), MC: ${["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"][Math.floor((chart_summary.angles.midheaven || 0) / 30)]}`
      : "";

    const userPrompt = `Chart data:
${chartDescription}
${angles}

Generate the teaser JSON.`;

    const maxRetries = 3;
    let content = "{}";

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
            { role: "system", content: teaser_prompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 300,
          stream: false,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        content = result.choices?.[0]?.message?.content || "{}";
        break;
      }

      const errText = await response.text();
      console.error(`Teaser generation error (attempt ${attempt + 1}/${maxRetries}):`, response.status, errText);

      if ((response.status === 429 || response.status >= 500) && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      throw new Error(`AI teaser error: ${response.status}`);
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    let teaser;
    try {
      teaser = JSON.parse(jsonStr);
    } catch {
      // Fallback teaser
      teaser = {
        archetype: "The Cosmic Mystery",
        teaser: "Your chart reveals a fascinating pattern that few people have.",
        trait1: "Deep Intuition",
        trait2: "Hidden Strength",
        trait3: "Magnetic Pull",
      };
    }

    return new Response(JSON.stringify(teaser), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Teaser error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
