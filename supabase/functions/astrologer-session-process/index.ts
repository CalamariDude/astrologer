/**
 * astrologer-session-process — Stage 1: Merge audio chunks
 *
 * Auth required (host only). Downloads audio chunks in parallel,
 * concatenates them, uploads the merged file, cleans up chunks,
 * then invokes session-transcribe for stage 2.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PARALLEL_DOWNLOADS = 10;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let parsedSessionId: string | null = null;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { session_id } = await req.json();
    parsedSessionId = session_id;
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

    // Verify ownership
    const { data: session } = await supabase
      .from("astrologer_sessions")
      .select("*")
      .eq("id", session_id)
      .eq("host_id", user.id)
      .single();

    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Update status ──────────────────────────────────────
    await supabase
      .from("astrologer_sessions")
      .update({ status: "processing", audio_status: "merging" })
      .eq("id", session_id);

    // ── Get audio chunks ───────────────────────────────────
    const { data: chunks } = await supabase
      .from("session_audio_chunks")
      .select("*")
      .eq("session_id", session_id)
      .order("chunk_index", { ascending: true });

    if (!chunks || chunks.length === 0) {
      // No audio — skip to ready
      await supabase
        .from("astrologer_sessions")
        .update({ status: "ready", audio_status: "none" })
        .eq("id", session_id);

      return new Response(
        JSON.stringify({ success: true, message: "No audio to process" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Download chunks in parallel batches ─────────────────
    const chunkBuffers: (Uint8Array | null)[] = new Array(chunks.length).fill(null);

    for (let i = 0; i < chunks.length; i += PARALLEL_DOWNLOADS) {
      const batch = chunks.slice(i, i + PARALLEL_DOWNLOADS);
      const results = await Promise.allSettled(
        batch.map(async (chunk, batchIdx) => {
          const { data: fileData, error: dlError } = await supabase.storage
            .from("session-recordings")
            .download(chunk.storage_path);

          if (dlError || !fileData) {
            console.error(`Failed to download chunk ${chunk.chunk_index}:`, dlError);
            return null;
          }
          const buf = new Uint8Array(await fileData.arrayBuffer());
          chunkBuffers[i + batchIdx] = buf;
          return buf;
        })
      );
    }

    // Filter out failed downloads and concatenate
    const validBuffers = chunkBuffers.filter((b): b is Uint8Array => b !== null);
    const totalSize = validBuffers.reduce((sum, b) => sum + b.length, 0);

    if (totalSize === 0) {
      await supabase
        .from("astrologer_sessions")
        .update({ status: "ready", audio_status: "none" })
        .eq("id", session_id);

      return new Response(
        JSON.stringify({ success: true, message: "No audio data in chunks" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const merged = new Uint8Array(totalSize);
    let offset = 0;
    for (const buf of validBuffers) {
      merged.set(buf, offset);
      offset += buf.length;
    }

    // ── Upload merged file ─────────────────────────────────
    const mergedPath = `${session_id}/recording.webm`;
    const { error: uploadError } = await supabase.storage
      .from("session-recordings")
      .upload(mergedPath, merged, {
        contentType: "audio/webm",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Merged upload failed: ${uploadError.message}`);
    }

    // ── Update session with audio path ─────────────────────
    await supabase
      .from("astrologer_sessions")
      .update({
        audio_status: "transcribing",
        audio_storage_path: mergedPath,
      })
      .eq("id", session_id);

    // ── Cleanup chunk files ────────────────────────────────
    try {
      const chunkPaths = chunks.map((c: { storage_path: string }) => c.storage_path);
      await supabase.storage.from("session-recordings").remove(chunkPaths);
    } catch {
      // Non-critical
    }

    // ── Chain to Stage 2: Transcribe ───────────────────────
    const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/astrologer-session-transcribe`;
    fetch(fnUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ session_id }),
    }).catch((err) => console.error("Failed to invoke transcribe:", err));

    return new Response(
      JSON.stringify({ success: true, stage: "merge_complete", chunks: chunks.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Processing error:", err);

    try {
      if (parsedSessionId) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await supabase
          .from("astrologer_sessions")
          .update({ status: "failed", audio_status: "failed" })
          .eq("id", parsedSessionId);
      }
    } catch {}

    return new Response(
      JSON.stringify({ error: (err as Error).message || "Processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
