import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const userId = user.id;

    // 1. Delete session audio files from storage
    const { data: sessions } = await supabase
      .from("astrologer_sessions")
      .select("id")
      .eq("host_id", userId);

    if (sessions && sessions.length > 0) {
      for (const session of sessions) {
        const { data: chunks } = await supabase
          .from("session_audio_chunks")
          .select("storage_path")
          .eq("session_id", session.id);

        if (chunks && chunks.length > 0) {
          const paths = chunks.map((c) => c.storage_path).filter(Boolean);
          if (paths.length > 0) {
            await supabase.storage.from("session-recordings").remove(paths);
          }
        }

        // Also remove merged audio if it exists
        const mergedPath = `${userId}/${session.id}/merged.webm`;
        await supabase.storage.from("session-recordings").remove([mergedPath]);
      }
    }

    // 2. Delete saved chart data from storage (if any)
    // Charts are in the database, cascade handles them

    // 3. Delete profile — cascade handles saved_charts, sessions, events, chunks
    const { error: profileError } = await supabase
      .from("astrologer_profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      throw new Error(`Failed to delete profile: ${profileError.message}`);
    }

    // 4. Delete the auth user
    const { error: authDeleteError } =
      await supabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      throw new Error(`Failed to delete auth user: ${authDeleteError.message}`);
    }

    return json({ success: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
});
