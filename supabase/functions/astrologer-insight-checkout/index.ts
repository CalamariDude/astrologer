import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isTestModeFromHeaders(req: Request): boolean {
  const origin = req.headers.get("origin") || "";
  const referer = req.headers.get("referer") || "";
  const testPatterns = ["localhost", "127.0.0.1", "192.168.", ".local", ":5173", ":3000"];
  return testPatterns.some((p) => origin.includes(p) || referer.includes(p));
}

async function stripePost(endpoint: string, body: Record<string, string>, apiKey: string) {
  const res = await fetch(`https://api.stripe.com/v1/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Stripe ${endpoint} failed: ${res.status}`);
  }
  return data;
}

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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { module_id, birth_data, success_url, cancel_url, price_cents } = await req.json();

    if (!module_id) {
      return new Response(JSON.stringify({ error: "Missing module_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const useTestMode = isTestModeFromHeaders(req);
    console.log(`Insight checkout: user=${user.id}, module=${module_id}, mode=${useTestMode ? "TEST" : "LIVE"}`);

    const stripeKey = useTestMode
      ? Deno.env.get("COSMOSIS_STRIPE_SECRET_KEY_TEST")
      : Deno.env.get("COSMOSIS_STRIPE_SECRET_KEY");

    if (!stripeKey) {
      throw new Error(`Missing Stripe secret key for ${useTestMode ? "test" : "live"} mode`);
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from("astrologer_profiles")
      .select("stripe_customer_id, stripe_customer_id_test, email")
      .eq("id", user.id)
      .single();

    let customerId = useTestMode
      ? profile?.stripe_customer_id_test
      : profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripePost(
        "customers",
        {
          email: user.email || profile?.email || "",
          "metadata[supabase_user_id]": user.id,
        },
        stripeKey,
      );
      customerId = customer.id;

      const adminSupabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const updateField = useTestMode ? "stripe_customer_id_test" : "stripe_customer_id";
      await adminSupabase
        .from("astrologer_profiles")
        .update({ [updateField]: customerId })
        .eq("id", user.id);
    }

    // Use the insight price ID from env, or create a one-time $9.99 price
    const priceId = useTestMode
      ? Deno.env.get("COSMOSIS_STRIPE_INSIGHT_PRICE_ID_TEST")
      : Deno.env.get("COSMOSIS_STRIPE_INSIGHT_PRICE_ID");

    // Module name mapping for the checkout description
    const moduleNames: Record<string, string> = {
      "future-partner": "Your Future Partner Reading",
      "hidden-talent": "Your Hidden Talent Reading",
      "money-blueprint": "Your Money Blueprint Reading",
      "career-path": "Your Ideal Career Reading",
      "life-purpose": "Your Life Purpose Reading",
      "shadow-self": "Your Shadow Self Reading",
      "compatibility": "Compatibility Reading",
    };

    const sessionParams: Record<string, string> = {
      customer: customerId!,
      mode: "payment",
      "line_items[0][quantity]": "1",
      "metadata[supabase_user_id]": user.id,
      "metadata[module_id]": module_id,
      "metadata[type]": "insight_reading",
      success_url: success_url || `https://astrologer.app/insight/${module_id}?session_id={CHECKOUT_SESSION_ID}&module=${module_id}`,
      cancel_url: cancel_url || `https://astrologer.app/insight/${module_id}`,
    };

    if (priceId) {
      sessionParams["line_items[0][price]"] = priceId;
    } else {
      // Create price inline if no price ID configured
      sessionParams["line_items[0][price_data][currency]"] = "usd";
      sessionParams["line_items[0][price_data][unit_amount]"] = String(price_cents || 999);
      sessionParams["line_items[0][price_data][product_data][name]"] =
        moduleNames[module_id] || "Cosmic Insight Reading";
      sessionParams["line_items[0][price_data][product_data][description]"] =
        "A personalized astrological reading based on your birth chart";
    }

    // Store birth data in metadata for later retrieval
    if (birth_data) {
      sessionParams["metadata[birth_date]"] = birth_data.date || "";
      sessionParams["metadata[birth_time]"] = birth_data.time || "";
      sessionParams["metadata[birth_lat]"] = String(birth_data.lat || "");
      sessionParams["metadata[birth_lng]"] = String(birth_data.lng || "");
    }

    const session = await stripePost("checkout/sessions", sessionParams, stripeKey);

    // Record the purchase attempt
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    await adminSupabase.from("insight_purchases").insert({
      user_id: user.id,
      module_id,
      stripe_session_id: session.id,
      status: "pending",
      birth_data: birth_data || null,
    });

    return new Response(JSON.stringify({ checkout_url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Insight checkout error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
