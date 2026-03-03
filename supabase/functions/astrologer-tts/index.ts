import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEEPGRAM_API_KEY = Deno.env.get("DEEPGRAM_API_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { text, model, speed } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: "Missing text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default to aura-2-luna-en — fitting for an astrology app
    const voice = model || "aura-2-luna-en";
    // Speed: 1.0 = normal, 1.2 = slightly faster, etc.
    const ttsSpeed = speed ?? 1.15;

    const response = await fetch(
      `https://api.deepgram.com/v1/speak?model=${voice}&encoding=mp3&speed=${ttsSpeed}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${DEEPGRAM_API_KEY}`,
        },
        body: JSON.stringify({ text }),
      },
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Deepgram TTS error:", response.status, err);
      return new Response(JSON.stringify({ error: "TTS failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream the audio back to the client
    const audioData = await response.arrayBuffer();

    return new Response(audioData, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("TTS error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
