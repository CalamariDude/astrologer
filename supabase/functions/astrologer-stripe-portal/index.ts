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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized", detail: authError?.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { return_url } = await req.json();

    const useTestMode = isTestModeFromHeaders(req);
    console.log(`Stripe portal: user=${user.id}, mode=${useTestMode ? 'TEST' : 'LIVE'}`);

    const stripeKey = useTestMode
      ? Deno.env.get("COSMOSIS_STRIPE_SECRET_KEY_TEST")
      : Deno.env.get("COSMOSIS_STRIPE_SECRET_KEY");

    if (!stripeKey) {
      throw new Error(`Missing Stripe secret key for ${useTestMode ? 'test' : 'live'} mode`);
    }

    // Get customer ID from profile
    const { data: profile } = await supabase
      .from("astrologer_profiles")
      .select("stripe_customer_id, stripe_customer_id_test")
      .eq("id", user.id)
      .single();

    const customerId = useTestMode
      ? profile?.stripe_customer_id_test
      : profile?.stripe_customer_id;

    if (!customerId) {
      return new Response(
        JSON.stringify({ error: "No subscription found" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const session = await stripePost("billing_portal/sessions", {
      customer: customerId,
      return_url: return_url || "https://astrologer.app",
    }, stripeKey);

    return new Response(
      JSON.stringify({ portal_url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Portal error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
