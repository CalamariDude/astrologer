import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { module_id, reading_text, technical_text, journey_data, birth_data, chart_data, module_title } = await req.json();

    if (!module_id || !reading_text) {
      return new Response(JSON.stringify({ error: "Missing module_id or reading_text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Check for existing reading for this user + module (idempotency)
    const { data: existing } = await adminSupabase
      .from("insight_readings")
      .select("id")
      .eq("user_id", user.id)
      .eq("module_id", module_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      return new Response(JSON.stringify({ reading_id: existing.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the purchase
    const { data: purchase } = await adminSupabase
      .from("insight_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("module_id", module_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Insert reading
    const { data: reading, error: insertError } = await adminSupabase
      .from("insight_readings")
      .insert({
        user_id: user.id,
        purchase_id: purchase?.id ?? null,
        module_id,
        reading_text,
        technical_text: technical_text ?? null,
        journey_data: journey_data ?? null,
        birth_data: birth_data ?? null,
        chart_data: chart_data ?? null,
        module_title: module_title ?? null,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to save reading" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark purchase as completed
    if (purchase) {
      await adminSupabase
        .from("insight_purchases")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", purchase.id);
    }

    return new Response(JSON.stringify({ reading_id: reading.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Save reading error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
