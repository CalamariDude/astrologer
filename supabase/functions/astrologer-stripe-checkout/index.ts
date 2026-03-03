import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function isTestModeFromHeaders(req: Request): boolean {
  const origin = req.headers.get("origin") || "";
  const referer = req.headers.get("referer") || "";
  const testPatterns = ["localhost", "127.0.0.1", "192.168.", ".local", ":5173", ":3000"];
  return testPatterns.some(p => origin.includes(p) || referer.includes(p));
}

// ── Lightweight Stripe helpers using fetch (no SDK → no Deno polyfill issues) ──

async function stripePost(endpoint: string, body: Record<string, string>, apiKey: string) {
  const res = await fetch(`https://api.stripe.com/v1/${endpoint}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
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
    // Extract JWT token explicitly (more reliable than relying on global headers)
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

    // Pass token explicitly to getUser for reliability
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError?.message, "token prefix:", token.slice(0, 20));
      return new Response(JSON.stringify({ error: "Unauthorized", detail: authError?.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { plan, tier, success_url, cancel_url } = await req.json();

    // Detect test vs live mode from request origin
    const useTestMode = isTestModeFromHeaders(req);
    const selectedTier = tier || "professional"; // default for backward compat
    console.log(`Stripe checkout: user=${user.id}, plan=${plan}, tier=${selectedTier}, mode=${useTestMode ? 'TEST' : 'LIVE'}`);

    const stripeKey = useTestMode
      ? Deno.env.get("COSMOSIS_STRIPE_SECRET_KEY_TEST")
      : Deno.env.get("COSMOSIS_STRIPE_SECRET_KEY");

    if (!stripeKey) {
      throw new Error(`Missing Stripe secret key for ${useTestMode ? 'test' : 'live'} mode`);
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from("astrologer_profiles")
      .select("stripe_customer_id, stripe_customer_id_test, email")
      .eq("id", user.id)
      .single();

    // Use separate customer IDs for test vs live
    let customerId = useTestMode
      ? profile?.stripe_customer_id_test
      : profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripePost("customers", {
        email: user.email || profile?.email || "",
        "metadata[supabase_user_id]": user.id,
      }, stripeKey);
      customerId = customer.id;

      const updateField = useTestMode ? "stripe_customer_id_test" : "stripe_customer_id";
      await supabase
        .from("astrologer_profiles")
        .update({ [updateField]: customerId })
        .eq("id", user.id);
    }

    // Select price based on tier × plan × mode
    let priceId: string | undefined;
    if (selectedTier === "horoscope") {
      priceId = useTestMode
        ? (plan === "annual"
            ? Deno.env.get("COSMOSIS_STRIPE_HOROSCOPE_ANNUAL_PRICE_ID_TEST")
            : Deno.env.get("COSMOSIS_STRIPE_HOROSCOPE_MONTHLY_PRICE_ID_TEST"))
        : (plan === "annual"
            ? Deno.env.get("COSMOSIS_STRIPE_HOROSCOPE_ANNUAL_PRICE_ID")
            : Deno.env.get("COSMOSIS_STRIPE_HOROSCOPE_MONTHLY_PRICE_ID"));
    } else if (selectedTier === "astrologer") {
      priceId = useTestMode
        ? (plan === "annual"
            ? Deno.env.get("COSMOSIS_STRIPE_ASTROLOGER_ANNUAL_PRICE_ID_TEST")
            : Deno.env.get("COSMOSIS_STRIPE_ASTROLOGER_MONTHLY_PRICE_ID_TEST"))
        : (plan === "annual"
            ? Deno.env.get("COSMOSIS_STRIPE_ASTROLOGER_ANNUAL_PRICE_ID")
            : Deno.env.get("COSMOSIS_STRIPE_ASTROLOGER_MONTHLY_PRICE_ID"));
    } else {
      // professional (default)
      priceId = useTestMode
        ? (plan === "annual"
            ? Deno.env.get("COSMOSIS_STRIPE_ANNUAL_PRICE_ID_TEST")
            : Deno.env.get("COSMOSIS_STRIPE_MONTHLY_PRICE_ID_TEST"))
        : (plan === "annual"
            ? Deno.env.get("COSMOSIS_STRIPE_ANNUAL_PRICE_ID")
            : Deno.env.get("COSMOSIS_STRIPE_MONTHLY_PRICE_ID"));
    }

    if (!priceId) {
      throw new Error(`Missing price ID for ${selectedTier}/${plan} in ${useTestMode ? 'test' : 'live'} mode`);
    }

    // Create checkout session with promo code support
    const session = await stripePost("checkout/sessions", {
      customer: customerId!,
      mode: "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      allow_promotion_codes: "true",
      "subscription_data[metadata][supabase_user_id]": user.id,
      "subscription_data[metadata][tier]": selectedTier,
      success_url: success_url || "https://astrologer.app/subscription/success",
      cancel_url: cancel_url || "https://astrologer.app",
      "metadata[supabase_user_id]": user.id,
    }, stripeKey);

    return new Response(
      JSON.stringify({ checkout_url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Checkout error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
