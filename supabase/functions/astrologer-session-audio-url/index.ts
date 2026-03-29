import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // No auth required — public replay links
    const { share_token } = await req.json();

    if (!share_token) {
      return new Response(JSON.stringify({ error: "share_token required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up session
    const { data: session } = await supabase
      .from("astrologer_sessions")
      .select("id, status, audio_storage_path, audio_duration_ms")
      .eq("share_token", share_token)
      .single();

    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!session.audio_storage_path) {
      // No merged audio file yet — check if still processing
      if (["processing", "ended"].includes(session.status)) {
        return new Response(
          JSON.stringify({ error: "Audio is still processing", status: session.status, processing: true }),
          { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "No audio recording available" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate signed URL (1hr)
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from("session-recordings")
      .createSignedUrl(session.audio_storage_path, 3600);

    if (urlError || !signedUrl) {
      throw new Error(`Failed to create signed URL: ${urlError?.message}`);
    }

    return new Response(
      JSON.stringify({
        audio_url: signedUrl.signedUrl,
        duration_ms: session.audio_duration_ms,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
