/**
 * astrologer-session-reconnect — Generate a fresh Daily.co host token
 *
 * Auth required (host only). Looks up the host's active session,
 * generates a new meeting token, returns session + credentials.
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

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the host's active session
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: session } = await serviceClient
      .from("astrologer_sessions")
      .select("*")
      .eq("host_id", user.id)
      .in("status", ["created", "live", "paused"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!session) {
      return new Response(
        JSON.stringify({ active: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check staleness (>2 hours since last heartbeat)
    const lastHb = session.host_last_heartbeat
      ? new Date(session.host_last_heartbeat).getTime()
      : new Date(session.created_at).getTime();

    if (Date.now() - lastHb > 2 * 60 * 60 * 1000) {
      await serviceClient
        .from("astrologer_sessions")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", session.id);
      return new Response(
        JSON.stringify({ active: false, expired: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate fresh host meeting token
    const dailyApiKey = Deno.env.get("DAILY_API_KEY");
    if (!dailyApiKey) {
      throw new Error("DAILY_API_KEY not configured");
    }

    const tokenRes = await fetch("https://api.daily.co/v1/meeting-tokens", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${dailyApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          room_name: session.daily_room_name,
          is_owner: true,
          user_name: session.host_display_name || "Host",
          exp: Math.floor(Date.now() / 1000) + 7200,
        },
      }),
    });

    if (!tokenRes.ok) {
      throw new Error("Failed to generate host token");
    }

    const { token: hostToken } = await tokenRes.json();

    return new Response(
      JSON.stringify({
        active: true,
        session_id: session.id,
        share_token: session.share_token,
        room_url: session.daily_room_url,
        host_token: hostToken,
        started_at: session.started_at || session.created_at,
        session,
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
