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
    // No auth required — guest may be anonymous
    const { share_token, display_name, email } = await req.json();

    if (!share_token) {
      return new Response(JSON.stringify({ error: "share_token required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to bypass RLS for guest access
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up session by share token
    const { data: session, error: lookupError } = await supabase
      .from("astrologer_sessions")
      .select("*")
      .eq("share_token", share_token)
      .single();

    if (lookupError || !session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify session is joinable
    if (!["created", "live", "paused"].includes(session.status)) {
      return new Response(
        JSON.stringify({ error: "Session is not currently live", status: session.status }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auto-end stale sessions (no heartbeat for >2 hours)
    const lastHb = session.host_last_heartbeat
      ? new Date(session.host_last_heartbeat).getTime()
      : new Date(session.created_at).getTime();
    if (Date.now() - lastHb > 2 * 60 * 60 * 1000) {
      await supabase
        .from("astrologer_sessions")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", session.id);
      return new Response(
        JSON.stringify({ error: "Session has expired", status: "ended" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate guest Daily.co meeting token
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
          is_owner: false,
          user_name: display_name || "Guest",
          exp: Math.floor(Date.now() / 1000) + 7200,
        },
      }),
    });

    if (!tokenRes.ok) {
      throw new Error("Failed to generate guest token");
    }

    const { token: guestToken } = await tokenRes.json();

    // Update session with guest info
    await supabase
      .from("astrologer_sessions")
      .update({
        guest_joined_at: new Date().toISOString(),
        guest_display_name: display_name || "Guest",
        ...(email ? { guest_email: email } : {}),
      })
      .eq("id", session.id);

    return new Response(
      JSON.stringify({
        session: {
          id: session.id,
          title: session.title,
          status: session.status,
          chart_snapshot: session.chart_snapshot,
          share_token: session.share_token,
        },
        room_url: session.daily_room_url,
        guest_token: guestToken,
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
