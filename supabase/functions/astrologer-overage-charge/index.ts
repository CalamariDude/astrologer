/**
 * astrologer-overage-charge — Per-use overage billing
 *
 * Charges $0.99 (with transcript) or $0.33 (without) for sessions
 * over the monthly limit. Uses the customer's default payment method.
 */

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

async function stripeGet(endpoint: string, apiKey: string) {
  const res = await fetch(`https://api.stripe.com/v1/${endpoint}`, {
    headers: { "Authorization": `Bearer ${apiKey}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Stripe GET ${endpoint} failed: ${res.status}`);
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
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type, with_transcript } = await req.json();

    if (type !== "session") {
      return new Response(JSON.stringify({ error: "Invalid overage type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const useTestMode = isTestModeFromHeaders(req);
    const stripeKey = useTestMode
      ? Deno.env.get("COSMOSIS_STRIPE_SECRET_KEY_TEST")
      : Deno.env.get("COSMOSIS_STRIPE_SECRET_KEY");

    if (!stripeKey) {
      throw new Error(`Missing Stripe key for ${useTestMode ? 'test' : 'live'} mode`);
    }

    // Get customer ID
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: profile } = await adminSupabase
      .from("astrologer_profiles")
      .select("stripe_customer_id, stripe_customer_id_test")
      .eq("id", user.id)
      .single();

    const customerId = useTestMode
      ? profile?.stripe_customer_id_test
      : profile?.stripe_customer_id;

    if (!customerId) {
      return new Response(JSON.stringify({
        error: "no_payment_method",
        message: "No payment method on file. Please update your billing in account settings.",
      }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get default payment method from Stripe customer
    const customer = await stripeGet(`customers/${customerId}`, stripeKey);
    const paymentMethodId = customer.invoice_settings?.default_payment_method
      || customer.default_source;

    if (!paymentMethodId) {
      return new Response(JSON.stringify({
        error: "no_payment_method",
        message: "No default payment method found. Please update your billing.",
      }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Charge: $0.99 with transcript, $0.33 without
    const amountCents = with_transcript ? "99" : "33";
    const description = with_transcript
      ? "Session overage (with transcription)"
      : "Session overage (audio only)";

    const paymentIntent = await stripePost("payment_intents", {
      amount: amountCents,
      currency: "usd",
      customer: customerId,
      payment_method: paymentMethodId,
      confirm: "true",
      off_session: "true",
      description,
      "metadata[user_id]": user.id,
      "metadata[type]": "session_overage",
      "metadata[with_transcript]": with_transcript ? "true" : "false",
    }, stripeKey);

    if (paymentIntent.status === "succeeded") {
      return new Response(JSON.stringify({ success: true, payment_intent_id: paymentIntent.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      error: "payment_failed",
      message: "Payment could not be completed. Please update your payment method.",
      status: paymentIntent.status,
    }), {
      status: 402,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Overage charge error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Charge failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
