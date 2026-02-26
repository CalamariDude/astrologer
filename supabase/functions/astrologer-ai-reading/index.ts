import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const XAI_API_KEY = Deno.env.get("XAI_API_KEY") || Deno.env.get("COSMOSIS_GROK_API_KEY")!;
const FREE_AI_LIMIT = 3;
const PAID_AI_LIMIT = 1000;

// Helper: always return 200 with JSON body so supabase.functions.invoke can parse it
function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Sign in to use AI readings" });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      // Try with service role as fallback — extract JWT from header
      const jwt = authHeader.replace("Bearer ", "");
      const adminSupa = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data: { user: adminUser }, error: adminErr } = await adminSupa.auth.getUser(jwt);
      if (adminErr || !adminUser) {
        console.error("Auth failed both methods:", authError?.message, adminErr?.message);
        return jsonResponse({ error: `Auth failed: ${authError?.message || adminErr?.message || "unknown"}` });
      }
      // Use the admin-verified user
      var verifiedUser = adminUser;
    } else {
      var verifiedUser = user;
    }

    // Parse body after auth (matching other working edge functions)
    const body = await req.json();
    const { chartData, chartDataB, question, personName, personNameB, readingFocus } = body;

    if (!chartData) {
      return jsonResponse({ error: "Missing chart data" });
    }

    // Get user profile + usage (gracefully handle missing columns)
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Try with usage columns first, fall back to basic query
    let profile: any = null;
    const { data: fullProfile, error: profileErr } = await adminSupabase
      .from("astrologer_profiles")
      .select("subscription_status, trial_ends_at, ai_credits_used, ai_credits_reset_at")
      .eq("id", verifiedUser.id)
      .single();

    if (profileErr) {
      // Columns might not exist yet — try without them
      console.warn("Full profile query failed, trying basic:", profileErr.message);
      const { data: basicProfile } = await adminSupabase
        .from("astrologer_profiles")
        .select("subscription_status, trial_ends_at")
        .eq("id", verifiedUser.id)
        .single();
      profile = basicProfile ? { ...basicProfile, ai_credits_used: 0, ai_credits_reset_at: null } : null;
    } else {
      profile = fullProfile;
    }

    if (!profile) {
      // Auto-create profile if it doesn't exist
      await adminSupabase.from("astrologer_profiles").upsert({
        id: verifiedUser.id,
        subscription_status: "free",
      }, { onConflict: "id" });
      profile = { subscription_status: "free", trial_ends_at: null, ai_credits_used: 0, ai_credits_reset_at: null };
    }

    // Determine if paid
    const isPaid = profile.subscription_status === "active" ||
      (profile.subscription_status === "trialing" && profile.trial_ends_at && new Date(profile.trial_ends_at) > new Date());

    const limit = isPaid ? PAID_AI_LIMIT : FREE_AI_LIMIT;

    // Check if credits need monthly reset
    const resetAt = new Date(profile.ai_credits_reset_at || "2000-01-01");
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    let creditsUsed = profile.ai_credits_used || 0;
    if (resetAt < monthStart) {
      creditsUsed = 0;
      // Best-effort reset — don't block on missing columns
      try {
        await adminSupabase
          .from("astrologer_profiles")
          .update({ ai_credits_used: 0, ai_credits_reset_at: monthStart.toISOString() })
          .eq("id", verifiedUser.id);
      } catch { /* columns may not exist yet */ }
    }

    // Check limit
    if (creditsUsed >= limit) {
      return jsonResponse({
        error: "credit_limit",
        message: isPaid
          ? `You've used all ${PAID_AI_LIMIT} AI readings this month. Credits reset on the 1st.`
          : `Free accounts get ${FREE_AI_LIMIT} AI readings per month. Upgrade to Pro for ${PAID_AI_LIMIT}/month.`,
        credits_used: creditsUsed,
        credits_limit: limit,
      });
    }

    // Build the prompt
    const systemPrompt = `You are an expert astrologer providing personalized chart readings. You combine traditional and modern astrological techniques. Be insightful, warm, and specific — reference actual placements, aspects, and house positions from the chart data provided. Avoid generic horoscope-style language. Keep responses concise but meaningful (2-4 paragraphs). Use plain language, not jargon, but you can mention technical placements in parentheses.`;

    // Determine which chart(s) to read based on readingFocus
    const focus = readingFocus || (chartDataB ? "synastry" : "personA");
    let chartSummary: string;
    let userMessage: string;

    if (focus === "synastry" && chartDataB) {
      const summaryA = formatChartForAI(chartData);
      const summaryB = formatChartForAI(chartDataB);
      chartSummary = `${personName || "Person A"}'s Chart:\n${summaryA}\n\n${personNameB || "Person B"}'s Chart:\n${summaryB}`;
      userMessage = question
        ? `Here are the charts for ${personName || "Person A"} and ${personNameB || "Person B"} (synastry):\n\n${chartSummary}\n\nThe user asks: ${question}`
        : `Here are the charts for ${personName || "Person A"} and ${personNameB || "Person B"} (synastry):\n\n${chartSummary}\n\nProvide a synastry reading analyzing the compatibility, key connections, challenges, and overall dynamics between these two people.`;
    } else if (focus === "personB" && chartDataB) {
      chartSummary = formatChartForAI(chartDataB);
      const name = personNameB || "Person B";
      userMessage = question
        ? `Here is ${name}'s natal chart data:\n\n${chartSummary}\n\nThe user asks: ${question}`
        : `Here is ${name}'s natal chart data:\n\n${chartSummary}\n\nProvide a comprehensive reading of this chart, highlighting the most notable patterns, strengths, challenges, and themes.`;
    } else {
      chartSummary = formatChartForAI(chartData);
      const name = personName || "the person";
      userMessage = question
        ? `Here is ${name}'s natal chart data:\n\n${chartSummary}\n\nThe user asks: ${question}`
        : `Here is ${name}'s natal chart data:\n\n${chartSummary}\n\nProvide a comprehensive reading of this chart, highlighting the most notable patterns, strengths, challenges, and themes.`;
    }

    // Call xAI API
    const aiResponse = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-3-fast",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("xAI API error:", aiResponse.status, errText);
      return jsonResponse({ error: `AI service error (${aiResponse.status}). Please try again.` });
    }

    const aiData = await aiResponse.json();
    const reading = aiData.choices?.[0]?.message?.content || "Unable to generate reading.";

    // Increment usage (best-effort)
    try {
      await adminSupabase
        .from("astrologer_profiles")
        .update({ ai_credits_used: creditsUsed + 1 })
        .eq("id", verifiedUser.id);
    } catch { /* columns may not exist yet */ }

    return jsonResponse({
      reading,
      chartSummary,
      credits_used: creditsUsed + 1,
      credits_limit: limit,
    });
  } catch (err) {
    console.error("Error:", err);
    return jsonResponse({ error: err.message || "Internal error" });
  }
});

// Format chart data into readable text for AI
function formatChartForAI(chartData: any): string {
  const lines: string[] = [];
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

  if (chartData.planets) {
    lines.push("Planetary Positions:");
    for (const [planet, data] of Object.entries(chartData.planets) as [string, any][]) {
      const sign = data.sign || "Unknown";
      const deg = data.degree ?? Math.floor(data.longitude % 30);
      const house = data.house ? ` (House ${data.house})` : "";
      const retro = data.retrograde ? " R" : "";
      lines.push(`  ${planet}: ${deg}° ${sign}${house}${retro}`);
    }
  }

  if (chartData.houses) {
    lines.push("\nHouse Cusps:");
    for (const [house, degree] of Object.entries(chartData.houses) as [string, any][]) {
      const signIndex = Math.floor((degree as number) / 30);
      const sign = signs[signIndex] || "Unknown";
      const deg = Math.floor((degree as number) % 30);
      lines.push(`  House ${house}: ${deg}° ${sign}`);
    }
  }

  if (chartData.angles) {
    lines.push("\nAngles:");
    if (chartData.angles.ascendant != null) {
      const asc = chartData.angles.ascendant;
      lines.push(`  Ascendant: ${Math.floor(asc % 30)}° ${signs[Math.floor(asc / 30)]}`);
    }
    if (chartData.angles.midheaven != null) {
      const mc = chartData.angles.midheaven;
      lines.push(`  Midheaven: ${Math.floor(mc % 30)}° ${signs[Math.floor(mc / 30)]}`);
    }
  }

  return lines.join("\n");
}
