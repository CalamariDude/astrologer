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

    // Verify paid subscription + get display name
    const { data: profile } = await supabase
      .from("astrologer_profiles")
      .select("subscription_status, display_name")
      .eq("id", user.id)
      .single();

    if (!profile || !["active", "trialing"].includes(profile.subscription_status || "")) {
      return new Response(JSON.stringify({ error: "Paid subscription required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { title, chart_snapshot, saved_chart_id } = await req.json();

    // Auto-end any stale active sessions for this host
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
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
