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

    // Verify subscription tier + get display name and session usage
    const { data: profile } = await supabase
      .from("astrologer_profiles")
      .select("subscription_status, subscription_tier, display_name, sessions_used, sessions_reset_at")
      .eq("id", user.id)
      .single();

    const tier = profile?.subscription_tier || "lite";
    const TIER_SESSION_LIMITS: Record<string, number> = { lite: 0, astrologer: 5, professional: 20 };
    const sessionLimit = TIER_SESSION_LIMITS[tier] ?? 0;

    if (tier === "lite") {
      return new Response(JSON.stringify({ error: "Subscription required for live sessions" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { title, chart_snapshot, saved_chart_id, overage_confirmed } = await req.json();

    // Monthly reset check for sessions
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const sessionsResetAt = new Date(profile?.sessions_reset_at || "2000-01-01");
    let currentSessionsUsed = profile?.sessions_used || 0;

    if (sessionsResetAt < monthStart) {
      currentSessionsUsed = 0;
      await serviceClient
        .from("astrologer_profiles")
        .update({ sessions_used: 0, sessions_reset_at: monthStart.toISOString() })
        .eq("id", user.id);
    }

    // Check session limit (unless overage was already confirmed/paid)
    if (currentSessionsUsed >= sessionLimit && !overage_confirmed) {
      return new Response(JSON.stringify({
        error: "session_overage",
        sessions_used: currentSessionsUsed,
        sessions_limit: sessionLimit,
      }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auto-end any stale active sessions for this host
    await serviceClient
      .from("astrologer_sessions")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("host_id", user.id)
      .in("status", ["created", "live", "paused"]);

    // Create Daily.co room (audio+video, up to 10 participants, 2hr expiry)
    const dailyApiKey = Deno.env.get("DAILY_API_KEY");
    if (!dailyApiKey) {
      throw new Error("DAILY_API_KEY not configured");
    }

    const roomName = `session-${crypto.randomUUID().slice(0, 8)}`;
    const roomRes = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${dailyApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          max_participants: 10,
          enable_chat: false,
          enable_knocking: false,
          start_video_off: false,
          start_audio_off: false,
          exp: Math.floor(Date.now() / 1000) + 7200, // 2hr expiry
        },
      }),
    });

    if (!roomRes.ok) {
      const err = await roomRes.text();
      throw new Error(`Daily room creation failed: ${err}`);
    }

    const room = await roomRes.json();

    // Generate host meeting token
    const tokenRes = await fetch("https://api.daily.co/v1/meeting-tokens", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${dailyApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          is_owner: true,
          user_name: profile.display_name || "Host",
          exp: Math.floor(Date.now() / 1000) + 7200,
        },
      }),
    });

    if (!tokenRes.ok) {
      throw new Error("Failed to generate host token");
    }

    const { token: hostToken } = await tokenRes.json();

    // Insert session row
    const { data: session, error: insertError } = await supabase
      .from("astrologer_sessions")
      .insert({
        host_id: user.id,
        saved_chart_id: saved_chart_id || null,
        title: title || "Untitled Session",
        status: "created",
        chart_snapshot: chart_snapshot || {},
        daily_room_name: roomName,
        daily_room_url: room.url,
        host_display_name: profile.display_name || "Host",
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Session insert failed: ${insertError.message}`);
    }

    // Increment sessions_used
    await serviceClient
      .from("astrologer_profiles")
      .update({ sessions_used: currentSessionsUsed + 1 })
      .eq("id", user.id);

    return new Response(
      JSON.stringify({
        session_id: session.id,
        share_token: session.share_token,
        room_url: room.url,
        host_token: hostToken,
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
