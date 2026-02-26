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

    // Use service role to update profile (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Use user's token to verify identity
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { session_id } = await req.json();
    if (!session_id) {
      return new Response(JSON.stringify({ error: "Missing session_id" }), {
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

    // Retrieve the checkout session from Stripe
    const session = await stripeGet(
      `checkout/sessions/${session_id}?expand[]=subscription`,
      stripeKey
    );

    console.log(`Verify: user=${user.id}, session=${session_id}, status=${session.status}, payment=${session.payment_status}`);

    // Verify this session belongs to this user
    const { data: profile } = await supabaseAdmin
      .from("astrologer_profiles")
      .select("stripe_customer_id, stripe_customer_id_test")
      .eq("id", user.id)
      .single();

    const expectedCustomerId = useTestMode
      ? profile?.stripe_customer_id_test
      : profile?.stripe_customer_id;

    if (session.customer !== expectedCustomerId) {
      // Also check metadata
      if (session.metadata?.supabase_user_id !== user.id) {
        return new Response(JSON.stringify({ error: "Session does not belong to user" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Only activate if payment was successful
    if (session.payment_status !== "paid" && session.status !== "complete") {
      return new Response(JSON.stringify({ error: "Payment not completed", status: session.status }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine plan from subscription
    let plan = "monthly";
    let subscriptionId: string | null = null;
    let expiresAt: string | null = null;

    const sub = session.subscription;
    if (sub && typeof sub === "object") {
      subscriptionId = sub.id;
      const interval = sub.items?.data?.[0]?.price?.recurring?.interval;
      plan = interval === "year" ? "annual" : "monthly";
      if (sub.current_period_end) {
        expiresAt = new Date(sub.current_period_end * 1000).toISOString();
      }
    } else if (typeof sub === "string") {
      subscriptionId = sub;
    }

    // Activate the subscription
    const update: Record<string, any> = {
      subscription_status: "active",
      subscription_plan: plan,
    };
    if (subscriptionId) update.stripe_subscription_id = subscriptionId;
    if (expiresAt) update.subscription_expires_at = expiresAt;

    const { error: updateError } = await supabaseAdmin
      .from("astrologer_profiles")
      .update(update)
      .eq("id", user.id);

    if (updateError) {
      console.error("Failed to activate:", updateError);
      throw new Error("Failed to activate subscription");
    }

    console.log(`Activated: user=${user.id}, plan=${plan}, subscription=${subscriptionId}`);

    return new Response(
      JSON.stringify({ success: true, plan, status: "active" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Verify error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
