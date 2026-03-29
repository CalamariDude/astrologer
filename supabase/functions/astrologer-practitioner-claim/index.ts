import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action, token } = body;

    if (!token) {
      return json({ error: "Missing claim token" }, 400);
    }

    switch (action) {
      case "verify_token": {
        const { data, error } = await supabase
          .from("practitioners")
          .select("id, display_name, headline, photo_url, specialties, is_claimed")
          .eq("claim_token", token)
          .single();

        if (error || !data) {
          return json({ error: "Invalid or expired claim link." }, 404);
        }

        if (data.is_claimed) {
          return json({ error: "This profile has already been claimed." }, 400);
        }

        return json({ practitioner: data });
      }

      case "claim": {
        // Auth check
        const authHeader = req.headers.get("Authorization");
        const authToken = authHeader?.replace("Bearer ", "");
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser(authToken);

        if (authError || !user) {
          return json({ error: "You must be signed in to claim a profile." }, 401);
        }

        // Verify token
        const { data: practitioner, error: fetchError } = await supabase
          .from("practitioners")
          .select("id, slug, is_claimed, user_id")
          .eq("claim_token", token)
          .single();

        if (fetchError || !practitioner) {
          return json({ error: "Invalid or expired claim link." }, 404);
        }

        if (practitioner.is_claimed) {
          return json({ error: "This profile has already been claimed." }, 400);
        }

        // Claim it
        const { error: updateError } = await supabase
          .from("practitioners")
          .update({
            user_id: user.id,
            is_claimed: true,
            claimed_at: new Date().toISOString(),
          })
          .eq("id", practitioner.id);

        if (updateError) throw updateError;

        return json({ success: true, slug: practitioner.slug });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (error) {
    console.error("Error:", error);
    return json({ error: (error as Error).message || "Internal error" }, 500);
  }
});
