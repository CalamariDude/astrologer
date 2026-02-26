import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const stripe = new Stripe(Deno.env.get("COSMOSIS_STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
      },
    });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get("COSMOSIS_STRIPE_WEBHOOK_SECRET")!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log(`Processing event: ${event.type}`);

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "customer.subscription.trial_will_end": {
        // Could send notification — for now just log
        console.log("Trial ending soon for:", event.data.object);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`Error processing ${event.type}:`, err);
    return new Response(`Processing error: ${err.message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  // Find user by stripe_customer_id
  const { data: profile, error: profileError } = await supabase
    .from("astrologer_profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (profileError || !profile) {
    // Try metadata fallback
    const userId = subscription.metadata?.supabase_user_id;
    if (!userId) {
      console.error("Cannot find user for customer:", customerId);
      return;
    }
    await updateProfile(userId, subscription);
    return;
  }

  await updateProfile(profile.id, subscription);
}

async function updateProfile(userId: string, subscription: Stripe.Subscription) {
  const status = mapStripeStatus(subscription.status);
  const plan = determinePlan(subscription);

  const update: Record<string, any> = {
    subscription_status: status,
    subscription_plan: plan,
    stripe_subscription_id: subscription.id,
  };

  if (subscription.trial_end) {
    update.trial_ends_at = new Date(subscription.trial_end * 1000).toISOString();
  }

  if (subscription.current_period_end) {
    update.subscription_expires_at = new Date(
      subscription.current_period_end * 1000
    ).toISOString();
  }

  const { error } = await supabase
    .from("astrologer_profiles")
    .update(update)
    .eq("id", userId);

  if (error) {
    console.error("Failed to update profile:", error);
  } else {
    console.log(`Updated user ${userId}: status=${status}, plan=${plan}`);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const { data: profile } = await supabase
    .from("astrologer_profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  const userId = profile?.id || subscription.metadata?.supabase_user_id;
  if (!userId) {
    console.error("Cannot find user for deleted subscription:", customerId);
    return;
  }

  const { error } = await supabase
    .from("astrologer_profiles")
    .update({
      subscription_status: "canceled",
      subscription_plan: null,
      stripe_subscription_id: null,
    })
    .eq("id", userId);

  if (error) {
    console.error("Failed to update canceled profile:", error);
  } else {
    console.log(`Canceled subscription for user ${userId}`);
  }
}

function mapStripeStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "canceled";
    default:
      return "free";
  }
}

function determinePlan(subscription: Stripe.Subscription): string | null {
  const item = subscription.items?.data?.[0];
  if (!item) return null;

  const interval = item.price?.recurring?.interval;
  if (interval === "year") return "annual";
  if (interval === "month") return "monthly";
  return "monthly";
}
