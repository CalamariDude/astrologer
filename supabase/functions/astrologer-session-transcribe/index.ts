/**
 * astrologer-session-transcribe — Stage 2: Deepgram transcription
 *
 * Called internally by session-process (service role auth).
 * Generates a signed URL for the merged audio file and sends it to
 * Deepgram's URL-based API (avoids uploading raw bytes).
 * Then chains to session-summarize for stage 3.
 */

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

  let sessionId: string | null = null;

  try {
    const { session_id } = await req.json();
    sessionId = session_id;
    if (!session_id) {
      return new Response(JSON.stringify({ error: "session_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get session
    const { data: session } = await supabase
      .from("astrologer_sessions")
      .select("id, audio_storage_path")
      .eq("id", session_id)
      .single();

    if (!session || !session.audio_storage_path) {
      throw new Error("Session or audio path not found");
    }

    // Generate signed URL for merged audio (1 hour expiry)
    const { data: signedUrlData, error: signError } = await supabase.storage
      .from("session-recordings")
      .createSignedUrl(session.audio_storage_path, 3600);

    if (signError || !signedUrlData?.signedUrl) {
      throw new Error(`Failed to create signed URL: ${signError?.message}`);
    }

    // Transcribe with Deepgram using URL-based API
    const deepgramKey = Deno.env.get("DEEPGRAM_API_KEY");
    let transcript = "";
    let audioDurationMs = 0;
    let utterances: { start_ms: number; end_ms: number; speaker: number; text: string }[] = [];

    if (deepgramKey) {
      const dgRes = await fetch(
        "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&paragraphs=true&diarize=true&utterances=true",
        {
          method: "POST",
          headers: {
            "Authorization": `Token ${deepgramKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: signedUrlData.signedUrl }),
        }
      );

      if (dgRes.ok) {
        const dgData = await dgRes.json();
        transcript = dgData?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
        audioDurationMs = Math.round((dgData?.metadata?.duration || 0) * 1000);

        // Extract utterances with speaker diarization
        const rawUtterances = dgData?.results?.utterances || [];
        utterances = rawUtterances.map((u: any) => ({
          start_ms: Math.round((u.start || 0) * 1000),
          end_ms: Math.round((u.end || 0) * 1000),
          speaker: u.speaker ?? 0,
          text: u.transcript || "",
        }));
      } else {
        const errText = await dgRes.text();
        console.error("Deepgram error:", errText);
        throw new Error(`Deepgram transcription failed: ${dgRes.status}`);
      }
    } else {
      console.warn("DEEPGRAM_API_KEY not set — skipping transcription");
    }

    // Update session with transcript data
    await supabase
      .from("astrologer_sessions")
      .update({
        audio_status: "summarizing",
        audio_duration_ms: audioDurationMs,
        transcript: transcript || null,
        utterances: utterances.length > 0 ? utterances : [],
      })
      .eq("id", session_id);

    // Chain to Stage 3: Summarize
    const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/astrologer-session-summarize`;
    fetch(fnUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ session_id }),
    }).catch((err) => console.error("Failed to invoke summarize:", err));

    return new Response(
      JSON.stringify({
        success: true,
        stage: "transcribe_complete",
        transcript_length: transcript.length,
        utterance_count: utterances.length,
        audio_duration_ms: audioDurationMs,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Transcription error:", err);

    try {
      if (sessionId) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await supabase
          .from("astrologer_sessions")
          .update({ status: "failed", audio_status: "failed" })
          .eq("id", sessionId);
      }
    } catch {}

    return new Response(
      JSON.stringify({ error: (err as Error).message || "Transcription failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
