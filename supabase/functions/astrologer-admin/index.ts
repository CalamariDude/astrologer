import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Branded marketing email template ──
function buildMarketingEmail(subject: string, content: string, preheader: string, ctaText?: string, ctaUrl?: string): string {
  // Convert markdown-ish content to HTML paragraphs
  const htmlContent = content
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => `<p style="margin:0 0 16px;color:#3d3152;font-size:16px;line-height:1.7;">${p.trim().replace(/\n/g, '<br>')}</p>`)
    .join('');

  const ctaBlock = ctaText && ctaUrl ? `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px auto;">
      <tr>
        <td style="border-radius:12px;background:linear-gradient(135deg,#8b6cc1 0%,#c06c84 50%,#d4a574 100%);">
          <a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;font-family:'Inter',Helvetica,Arial,sans-serif;letter-spacing:0.02em;">${ctaText}</a>
        </td>
      </tr>
    </table>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${subject}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f8f6fa;font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>` : ''}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8f6fa;">
<tr><td style="padding:40px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;margin:0 auto;">

  <!-- Header -->
  <tr><td style="text-align:center;padding-bottom:32px;">
    <span style="font-size:13px;letter-spacing:0.2em;text-transform:uppercase;color:#9a8daa;font-weight:500;">ASTROLOGER</span>
  </td></tr>

  <!-- Card -->
  <tr><td style="background:#ffffff;border-radius:16px;padding:40px 36px;box-shadow:0 1px 3px rgba(0,0,0,0.04);">

    ${htmlContent}
    ${ctaBlock}

  </td></tr>

  <!-- Footer -->
  <tr><td style="text-align:center;padding:32px 16px 0;">
    <p style="margin:0 0 8px;color:#b8afc4;font-size:12px;">
      <a href="https://astrologerapp.org" style="color:#9a8daa;text-decoration:none;">astrologerapp.org</a>
    </p>
    <p style="margin:0;color:#d0c9da;font-size:11px;line-height:1.5;">
      You're receiving this because you used Astrologer.<br>
      <a href="mailto:unsubscribe@astrologerapp.org?subject=unsubscribe" style="color:#b8afc4;text-decoration:underline;">Unsubscribe</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── Lightweight Stripe helpers using fetch ──

async function stripeGet(endpoint: string, apiKey: string) {
  const res = await fetch(`https://api.stripe.com/v1/${endpoint}`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${apiKey}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Stripe GET ${endpoint} failed`);
  return data;
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
  if (!res.ok) throw new Error(data?.error?.message || `Stripe POST ${endpoint} failed`);
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    // Full key (sk_live_) for admin ops; fall back to restricted key
    const stripeFullKey = Deno.env.get("COSMOSIS_STRIPE_FULL_KEY");
    const stripeKey = stripeFullKey || Deno.env.get("COSMOSIS_STRIPE_SECRET_KEY") || Deno.env.get("COSMOSIS_STRIPE_SECRET_KEY_TEST");
    const stripeTestKey = Deno.env.get("COSMOSIS_STRIPE_SECRET_KEY_TEST");

    if (!stripeKey) throw new Error("No Stripe secret key configured");

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: adminProfile } = await supabase
      .from("astrologer_profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!adminProfile?.is_admin) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;
    const json = (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    switch (action) {
      // ── Overview stats ──
      case "overview": {
        const { data: allProfiles } = await supabase
          .from("astrologer_profiles")
          .select("id, subscription_status, subscription_plan, trial_ends_at, subscription_expires_at, created_at, stripe_customer_id, ai_credits_used, relocated_used");

        const profiles = allProfiles || [];
        const { count: chartCount } = await supabase.from("saved_charts").select("id", { count: "exact", head: true });

        // Session aggregates
        const { data: allSessions } = await supabase
          .from("astrologer_sessions")
          .select("id, status, audio_status, audio_duration_ms, guest_joined_at, transcript, created_at");
        const sessions = allSessions || [];

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const totalRecordingMs = sessions.reduce((s, ses) => s + (ses.audio_duration_ms || 0), 0);

        const stats = {
          total_users: profiles.length,
          active: profiles.filter(p => p.subscription_status === "active").length,
          trialing: profiles.filter(p => p.subscription_status === "trialing").length,
          free: profiles.filter(p => p.subscription_status === "free" || !p.subscription_status).length,
          signups_30d: profiles.filter(p => new Date(p.created_at) > thirtyDaysAgo).length,
          signups_7d: profiles.filter(p => new Date(p.created_at) > sevenDaysAgo).length,
          monthly: profiles.filter(p => p.subscription_plan === "monthly").length,
          annual: profiles.filter(p => p.subscription_plan === "annual").length,
          total_charts: chartCount || 0,
          total_ai_used: profiles.reduce((s, p) => s + (p.ai_credits_used || 0), 0),
          total_relocated_used: profiles.reduce((s, p) => s + (p.relocated_used || 0), 0),
          // Session stats
          total_sessions: sessions.length,
          sessions_7d: sessions.filter(s => new Date(s.created_at) > sevenDaysAgo).length,
          sessions_30d: sessions.filter(s => new Date(s.created_at) > thirtyDaysAgo).length,
          sessions_live: sessions.filter(s => s.status === "live").length,
          sessions_ready: sessions.filter(s => s.status === "ready").length,
          sessions_failed: sessions.filter(s => s.status === "failed").length,
          sessions_with_guests: sessions.filter(s => !!s.guest_joined_at).length,
          sessions_with_transcripts: sessions.filter(s => !!s.transcript).length,
          total_recording_hours: Math.round(totalRecordingMs / 3600000 * 10) / 10,
        };

        return json({ stats });
      }

      // ── List users (with full data) ──
      case "list_users": {
        const { data: allProfiles } = await supabase
          .from("astrologer_profiles")
          .select("*")
          .order("created_at", { ascending: false });

        const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const emailMap = new Map<string, { email: string; created_at: string; last_sign_in_at: string | null }>();
        for (const u of authUsers?.users || []) {
          emailMap.set(u.id, {
            email: u.email || "",
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at || null,
          });
        }

        // Get chart counts per user
        const { data: chartCounts } = await supabase.rpc("admin_chart_counts_stub").select("*").limit(0);
        // Fallback: count charts per user via saved_charts
        const { data: allCharts } = await supabase.from("saved_charts").select("user_id");
        const chartCountMap = new Map<string, number>();
        for (const c of allCharts || []) {
          chartCountMap.set(c.user_id, (chartCountMap.get(c.user_id) || 0) + 1);
        }

        const users = (allProfiles || []).map(p => ({
          ...p,
          email: emailMap.get(p.id)?.email || "unknown",
          last_sign_in_at: emailMap.get(p.id)?.last_sign_in_at || null,
          auth_created_at: emailMap.get(p.id)?.created_at || null,
          saved_charts_count: chartCountMap.get(p.id) || 0,
        }));

        return json({ users });
      }

      // ── Get single user detail ──
      case "get_user": {
        if (!body.user_id) return json({ error: "Missing user_id" }, 400);

        const { data: profile } = await supabase
          .from("astrologer_profiles")
          .select("*")
          .eq("id", body.user_id)
          .single();
        if (!profile) return json({ error: "User not found" }, 404);

        const { data: { users: authList } } = await supabase.auth.admin.listUsers({ perPage: 1 });
        const { data: authUser } = await supabase.auth.admin.getUserById(body.user_id);

        const { data: charts } = await supabase
          .from("saved_charts")
          .select("id, name, chart_type, created_at")
          .eq("user_id", body.user_id)
          .order("created_at", { ascending: false });

        return json({
          user: {
            ...profile,
            email: authUser?.user?.email || "unknown",
            last_sign_in_at: authUser?.user?.last_sign_in_at || null,
            saved_charts: charts || [],
          },
        });
      }

      // ── Update user profile ──
      case "update_user": {
        if (!body.user_id) return json({ error: "Missing user_id" }, 400);
        if (!body.updates || typeof body.updates !== "object") return json({ error: "Missing updates" }, 400);

        // Only allow safe fields to be updated
        const allowed = [
          "subscription_status", "subscription_plan", "subscription_tier", "trial_ends_at",
          "subscription_expires_at", "ai_credits_used", "ai_credits_reset_at",
          "relocated_used", "relocated_reset_at", "is_admin",
          "sessions_used", "transcriptions_used",
        ];
        const updates: Record<string, unknown> = {};
        for (const key of allowed) {
          if (key in body.updates) updates[key] = body.updates[key];
        }

        if (Object.keys(updates).length === 0) return json({ error: "No valid fields to update" }, 400);

        // Prevent admin from removing their own admin status
        if ("is_admin" in updates && body.user_id === user.id && updates.is_admin === false) {
          return json({ error: "Cannot remove your own admin status" }, 400);
        }

        const { error } = await supabase
          .from("astrologer_profiles")
          .update(updates)
          .eq("id", body.user_id);

        if (error) throw new Error(error.message);
        return json({ success: true });
      }

      // ── Add credits to user ──
      case "add_credits": {
        if (!body.user_id) return json({ error: "Missing user_id" }, 400);
        if (!body.credit_type) return json({ error: "Missing credit_type (ai or relocated)" }, 400);
        if (typeof body.amount !== "number") return json({ error: "Missing amount" }, 400);

        const col = body.credit_type === "ai" ? "ai_credits_used" : "relocated_used";

        // Get current value
        const { data: cur } = await supabase
          .from("astrologer_profiles")
          .select(col)
          .eq("id", body.user_id)
          .single();
        if (!cur) return json({ error: "User not found" }, 404);

        // Subtract the amount from used (giving credits = lowering used count)
        const newVal = Math.max(0, (cur[col] || 0) - body.amount);
        const { error } = await supabase
          .from("astrologer_profiles")
          .update({ [col]: newVal })
          .eq("id", body.user_id);

        if (error) throw new Error(error.message);
        return json({ success: true, [col]: newVal });
      }

      // ── Reset user credits ──
      case "reset_credits": {
        if (!body.user_id) return json({ error: "Missing user_id" }, 400);

        const resetDate = new Date();
        resetDate.setDate(1);
        resetDate.setHours(0, 0, 0, 0);

        const { error } = await supabase
          .from("astrologer_profiles")
          .update({
            ai_credits_used: 0,
            ai_credits_reset_at: resetDate.toISOString(),
            relocated_used: 0,
            relocated_reset_at: resetDate.toISOString(),
          })
          .eq("id", body.user_id);

        if (error) throw new Error(error.message);
        return json({ success: true });
      }

      // ── Delete user account ──
      case "delete_user": {
        if (!body.user_id) return json({ error: "Missing user_id" }, 400);
        if (body.user_id === user.id) return json({ error: "Cannot delete yourself" }, 400);

        // Delete profile (cascade will handle saved_charts)
        const { error: profileError } = await supabase
          .from("astrologer_profiles")
          .delete()
          .eq("id", body.user_id);

        if (profileError) throw new Error(profileError.message);

        // Delete auth user
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(body.user_id);
        if (authDeleteError) throw new Error(authDeleteError.message);

        return json({ success: true });
      }

      // ── Cancel subscription ──
      case "cancel_subscription": {
        if (!body.user_id) return json({ error: "Missing user_id" }, 400);

        const { data: profile } = await supabase
          .from("astrologer_profiles")
          .select("stripe_subscription_id")
          .eq("id", body.user_id)
          .single();

        // Cancel in Stripe if there's a subscription
        if (profile?.stripe_subscription_id) {
          try {
            await stripePost(`subscriptions/${profile.stripe_subscription_id}`, { cancel_at_period_end: "true" }, stripeKey);
          } catch (e: any) {
            console.error("Stripe cancel error:", e.message);
          }
        }

        // Update local profile
        const { error } = await supabase
          .from("astrologer_profiles")
          .update({
            subscription_status: "canceled",
            subscription_plan: null,
          })
          .eq("id", body.user_id);

        if (error) throw new Error(error.message);
        return json({ success: true });
      }

      // ── Grant subscription ──
      case "grant_subscription": {
        if (!body.user_id) return json({ error: "Missing user_id" }, 400);
        if (!body.plan) return json({ error: "Missing plan (monthly or annual)" }, 400);
        if (!body.months) return json({ error: "Missing months" }, 400);

        const grantTier = body.tier || "professional";
        if (!["horoscope", "astrologer", "professional"].includes(grantTier)) {
          return json({ error: "Invalid tier (horoscope, astrologer, or professional)" }, 400);
        }

        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + body.months);

        const { error } = await supabase
          .from("astrologer_profiles")
          .update({
            subscription_status: "active",
            subscription_plan: body.plan,
            subscription_tier: grantTier,
            subscription_expires_at: expiresAt.toISOString(),
          })
          .eq("id", body.user_id);

        if (error) throw new Error(error.message);
        return json({ success: true, tier: grantTier, expires_at: expiresAt.toISOString() });
      }

      // ── Promo codes ──
      case "list_promo_codes": {
        const data = await stripeGet("promotion_codes?limit=100&expand[]=data.coupon", stripeKey);
        return json({ promo_codes: data.data || [] });
      }

      case "create_full_promo": {
        if (!body.code) return json({ error: "Missing code" }, 400);
        if (!body.percent_off && !body.amount_off) return json({ error: "Missing discount" }, 400);

        // Step 1: Create coupon
        const couponParams: Record<string, string> = {
          duration: body.duration || "once",
        };
        if (body.name) {
          couponParams.name = body.name;
        } else {
          const disc = body.percent_off ? `${body.percent_off}% off` : `$${((body.amount_off || 0) / 100).toFixed(2)} off`;
          const dur = body.duration === "once" ? "one-time" : body.duration === "forever" ? "forever" : `${body.duration_in_months || 1}mo`;
          couponParams.name = `${disc} ${dur} (${body.code.toUpperCase()})`;
        }
        if (body.percent_off) couponParams.percent_off = String(body.percent_off);
        if (body.amount_off) {
          couponParams.amount_off = String(body.amount_off);
          couponParams.currency = body.currency || "usd";
        }
        if (body.duration === "repeating" && body.duration_in_months) {
          couponParams.duration_in_months = String(body.duration_in_months);
        }

        // Helper to create coupon + promo code on a given Stripe key
        async function createCouponAndPromo(key: string) {
          const c = await stripePost("coupons", couponParams, key);
          const form = `promotion[type]=coupon&promotion[coupon]=${encodeURIComponent(c.id)}&code=${encodeURIComponent(body.code.toUpperCase())}${body.max_redemptions ? `&max_redemptions=${body.max_redemptions}` : ""}`;
          const res = await fetch("https://api.stripe.com/v1/promotion_codes", {
            method: "POST",
            headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
            body: form,
          });
          const p = await res.json();
          if (!res.ok) throw new Error(p?.error?.message || "Promo code creation failed");
          return { coupon: c, promo_code: p };
        }

        // Create in live mode
        const liveResult = await createCouponAndPromo(stripeKey);

        // Also create in test mode so promo codes work on localhost
        if (stripeTestKey && stripeTestKey !== stripeKey) {
          try {
            await createCouponAndPromo(stripeTestKey);
          } catch (e: any) {
            console.error("Test mode promo creation failed (non-critical):", e.message);
          }
        }

        return json(liveResult);
      }

      case "deactivate_promo_code": {
        if (!body.promo_code_id) return json({ error: "Missing promo_code_id" }, 400);
        const result = await stripePost(`promotion_codes/${body.promo_code_id}`, { active: "false" }, stripeKey);
        return json({ promo_code: result });
      }

      // ── Send email broadcast ──
      case "send_broadcast": {
        const resendKey = Deno.env.get("RESEND_API_KEY");
        if (!resendKey) return json({ error: "RESEND_API_KEY not configured" }, 500);
        if (!body.subject || !body.html) return json({ error: "Missing subject or html" }, 400);

        const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const emails = (authUsers?.users || [])
          .map(u => u.email)
          .filter((e): e is string => !!e);

        if (emails.length === 0) return json({ error: "No users to email" }, 400);

        const batches = [];
        for (let i = 0; i < emails.length; i += 100) {
          batches.push(emails.slice(i, i + 100));
        }

        let sent = 0;
        for (const batch of batches) {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: body.from || "Astrologer <noreply@astrologer.app>",
              bcc: batch,
              subject: body.subject,
              html: body.html,
            }),
          });
          if (res.ok) sent += batch.length;
        }

        return json({ sent, total: emails.length });
      }

      // ── PostHog Analytics ──
      case "posthog_analytics": {
        const phKey = Deno.env.get("POSTHOG_PERSONAL_API_KEY");
        const phProject = Deno.env.get("POSTHOG_PROJECT_ID");
        const phHost = Deno.env.get("POSTHOG_HOST") || "https://us.i.posthog.com";
        if (!phKey || !phProject) return json({ error: "PostHog API key or project ID not configured" }, 500);

        const phQuery = async (hogql: string) => {
          const res = await fetch(`${phHost}/api/projects/${phProject}/query/`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${phKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: { kind: "HogQLQuery", query: hogql } }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.detail || data?.error || "PostHog query failed");
          return data;
        };

        const subAction = body.sub_action;

        if (subAction === "feature_usage") {
          const days = body.days || 30;
          const result = await phQuery(`
            SELECT event, count() as count
            FROM events
            WHERE timestamp > now() - toIntervalDay(${days})
              AND event NOT LIKE '$%'
            GROUP BY event
            ORDER BY count DESC
          `);
          return json({ rows: result.results || [], columns: result.columns || [] });
        }

        if (subAction === "daily_active") {
          const days = body.days || 30;
          const result = await phQuery(`
            SELECT toDate(timestamp) as day, count(DISTINCT distinct_id) as users
            FROM events
            WHERE timestamp > now() - toIntervalDay(${days})
            GROUP BY day
            ORDER BY day
          `);
          return json({ rows: result.results || [], columns: result.columns || [] });
        }

        if (subAction === "dashboard") {
          // Single round-trip for the admin analytics tab
          const days = body.days || 30;
          try {
            const features = await phQuery(`
              SELECT event, count() as total, count(DISTINCT distinct_id) as unique_users
              FROM events
              WHERE timestamp > now() - toIntervalDay(${days})
                AND event NOT LIKE '$%'
              GROUP BY event
              ORDER BY unique_users DESC
              LIMIT 20
            `);
            // Small delay to avoid PostHog concurrency limit
            await new Promise(r => setTimeout(r, 500));
            const dau = await phQuery(`
              SELECT toDate(timestamp) as day, count(DISTINCT distinct_id) as users
              FROM events
              WHERE timestamp > now() - toIntervalDay(${days})
              GROUP BY day
              ORDER BY day
            `);
            return json({
              features: { rows: features.results || [], columns: features.columns || [] },
              dau: { rows: dau.results || [], columns: dau.columns || [] },
            });
          } catch (e) {
            console.error("PostHog dashboard query error:", e);
            throw e;
          }
        }

        if (subAction === "user_events") {
          if (!body.user_id) return json({ error: "Missing user_id" }, 400);
          const days = body.days || 90;
          const result = await phQuery(`
            SELECT event, count() as count, max(timestamp) as last_used
            FROM events
            WHERE distinct_id = '${body.user_id}'
              AND timestamp > now() - toIntervalDay(${days})
              AND event NOT LIKE '$%'
            GROUP BY event
            ORDER BY count DESC
          `);
          return json({ rows: result.results || [], columns: result.columns || [] });
        }

        if (subAction === "user_sessions") {
          if (!body.user_id) return json({ error: "Missing user_id" }, 400);
          const days = body.days || 30;
          const result = await phQuery(`
            SELECT toDate(timestamp) as day, count() as events,
                   min(timestamp) as first_event, max(timestamp) as last_event,
                   dateDiff('second', min(timestamp), max(timestamp)) as session_seconds
            FROM events
            WHERE distinct_id = '${body.user_id}'
              AND timestamp > now() - toIntervalDay(${days})
            GROUP BY day
            ORDER BY day DESC
          `);
          return json({ rows: result.results || [], columns: result.columns || [] });
        }

        if (subAction === "top_features") {
          const days = body.days || 30;
          const result = await phQuery(`
            SELECT event, count() as total, count(DISTINCT distinct_id) as unique_users
            FROM events
            WHERE timestamp > now() - toIntervalDay(${days})
              AND event NOT LIKE '$%'
            GROUP BY event
            ORDER BY unique_users DESC
            LIMIT 20
          `);
          return json({ rows: result.results || [], columns: result.columns || [] });
        }

        return json({ error: `Unknown sub_action: ${subAction}` }, 400);
      }

      // ── List sessions ──
      case "list_sessions": {
        const { data: sessions } = await supabase
          .from("astrologer_sessions")
          .select("id, host_id, title, status, share_token, started_at, ended_at, total_duration_ms, guest_display_name, guest_email, created_at, chart_snapshot, audio_status, audio_duration_ms, transcript, summary")
          .order("created_at", { ascending: false })
          .limit(500);

        const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const emailMap = new Map<string, string>();
        for (const u of authUsers?.users || []) {
          emailMap.set(u.id, u.email || "");
        }

        const { data: profiles } = await supabase
          .from("astrologer_profiles")
          .select("id, display_name");
        const nameMap = new Map<string, string>();
        for (const p of profiles || []) {
          nameMap.set(p.id, p.display_name || "");
        }

        const enriched = (sessions || []).map(s => {
          // Extract person names from chart_snapshot
          const snap = s.chart_snapshot as any;
          const personA = snap?.personA?.name || snap?.person_a_name || "";
          const personB = snap?.personB?.name || snap?.person_b_name || "";
          return {
            ...s,
            chart_snapshot: undefined,
            transcript: undefined,
            summary: undefined,
            host_email: emailMap.get(s.host_id) || "",
            host_name: nameMap.get(s.host_id) || "",
            chart_person_a: personA,
            chart_person_b: personB,
            has_transcript: !!s.transcript,
            has_summary: !!s.summary,
          };
        });

        return json({ sessions: enriched });
      }

      // ── List charts ──
      case "list_charts": {
        const { data: charts } = await supabase
          .from("saved_charts")
          .select("id, user_id, name, chart_type, person_a_name, person_a_date, person_b_name, person_b_date, created_at")
          .order("created_at", { ascending: false })
          .limit(500);

        const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const emailMap = new Map<string, string>();
        for (const u of authUsers?.users || []) {
          emailMap.set(u.id, u.email || "");
        }

        const { data: profiles } = await supabase
          .from("astrologer_profiles")
          .select("id, display_name");
        const nameMap = new Map<string, string>();
        for (const p of profiles || []) {
          nameMap.set(p.id, p.display_name || "");
        }

        const enriched = (charts || []).map(c => ({
          ...c,
          owner_email: emailMap.get(c.user_id) || "",
          owner_name: nameMap.get(c.user_id) || "",
        }));

        return json({ charts: enriched });
      }

      // ── Marketing Email System ──

      case "marketing_audiences": {
        // Fetch audience counts for targeting
        const { count: allLeads } = await supabase.from("insight_leads").select("*", { count: "exact", head: true });
        const { count: allUsers } = await supabase.from("astrologer_profiles").select("*", { count: "exact", head: true });

        // Module-specific lead counts
        const { data: moduleCounts } = await supabase.rpc("insight_leads_by_module") as any;
        // If RPC doesn't exist, fallback
        let modules: Record<string, number> = {};
        if (moduleCounts) {
          for (const m of moduleCounts) modules[m.module_id] = m.count;
        }

        // Unique lead emails (not already registered users)
        const { count: uniqueLeads } = await supabase
          .from("insight_leads")
          .select("email", { count: "exact", head: true });

        return json({
          audiences: {
            all_users: allUsers || 0,
            all_leads: allLeads || 0,
            unique_leads: uniqueLeads || 0,
            by_module: modules,
          },
        });
      }

      case "marketing_send_history": {
        const { data: history } = await supabase
          .from("email_campaigns")
          .select("*")
          .order("sent_at", { ascending: false })
          .limit(50);
        return json({ campaigns: history || [] });
      }

      case "send_marketing_email": {
        const resendKey = Deno.env.get("RESEND_API_KEY");
        if (!resendKey) return json({ error: "RESEND_API_KEY not configured" }, 500);
        if (!body.subject || !body.content) return json({ error: "Missing subject or content" }, 400);

        const audience: string = body.audience || "all_users"; // all_users, all_leads, lead_module:<id>
        let emails: string[] = [];

        if (audience === "all_users") {
          const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
          emails = (authUsers?.users || []).map(u => u.email).filter((e): e is string => !!e);
        } else if (audience === "all_leads") {
          const { data: leads } = await supabase
            .from("insight_leads")
            .select("email")
            .order("created_at", { ascending: false });
          const unique = new Set((leads || []).map(l => l.email).filter(Boolean));
          emails = [...unique];
        } else if (audience.startsWith("lead_module:")) {
          const moduleId = audience.replace("lead_module:", "");
          const { data: leads } = await supabase
            .from("insight_leads")
            .select("email")
            .eq("module_id", moduleId);
          const unique = new Set((leads || []).map(l => l.email).filter(Boolean));
          emails = [...unique];
        } else if (audience === "paid_users") {
          const { data: profiles } = await supabase
            .from("astrologer_profiles")
            .select("id")
            .in("subscription_status", ["active", "trialing"]);
          if (profiles && profiles.length > 0) {
            const ids = profiles.map(p => p.id);
            const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
            emails = (authUsers?.users || [])
              .filter(u => ids.includes(u.id))
              .map(u => u.email)
              .filter((e): e is string => !!e);
          }
        } else if (audience === "free_users") {
          const { data: profiles } = await supabase
            .from("astrologer_profiles")
            .select("id")
            .or("subscription_status.is.null,subscription_status.eq.expired,subscription_status.eq.canceled");
          if (profiles && profiles.length > 0) {
            const ids = profiles.map(p => p.id);
            const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
            emails = (authUsers?.users || [])
              .filter(u => ids.includes(u.id))
              .map(u => u.email)
              .filter((e): e is string => !!e);
          }
        }

        if (emails.length === 0) return json({ error: "No recipients found for this audience" }, 400);

        // Build branded HTML email
        const brandedHtml = buildMarketingEmail(body.subject, body.content, body.preheader || "", body.cta_text, body.cta_url);

        // Send in batches via Resend (individual sends for tracking)
        const batchSize = 50;
        let sent = 0;
        let failed = 0;
        const resendIds: string[] = [];

        for (let i = 0; i < emails.length; i += batchSize) {
          const batch = emails.slice(i, i + batchSize);
          // Use Resend batch API for individual tracking
          const batchPayload = batch.map(email => ({
            from: body.from || "Astrologer <hello@astrologerapp.org>",
            to: [email],
            subject: body.subject,
            html: brandedHtml,
            headers: {
              "List-Unsubscribe": `<mailto:unsubscribe@astrologerapp.org?subject=unsubscribe>`,
            },
            tags: [
              { name: "campaign", value: body.campaign_name || "manual" },
              { name: "audience", value: audience },
            ],
          }));

          const res = await fetch("https://api.resend.com/emails/batch", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(batchPayload),
          });

          if (res.ok) {
            const result = await res.json();
            sent += batch.length;
            if (Array.isArray(result.data)) {
              for (const r of result.data) if (r.id) resendIds.push(r.id);
            }
          } else {
            failed += batch.length;
          }
        }

        // Save campaign record
        await supabase.from("email_campaigns").insert({
          subject: body.subject,
          content: body.content,
          preheader: body.preheader || null,
          cta_text: body.cta_text || null,
          cta_url: body.cta_url || null,
          audience,
          campaign_name: body.campaign_name || "manual",
          recipients_count: emails.length,
          sent_count: sent,
          failed_count: failed,
          resend_ids: resendIds.slice(0, 100), // store first 100 for tracking
        });

        return json({ sent, failed, total: emails.length });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (error: any) {
    console.error("astrologer-admin error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
