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

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return json({ error: "Unauthorized" }, 401);
    }

    // Admin check
    const { data: adminProfile } = await supabase
      .from("astrologer_profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!adminProfile?.is_admin) {
      return json({ error: "Unauthorized" }, 403);
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "list": {
        const { data, error } = await supabase
          .from("practitioners")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return json({ practitioners: data });
      }

      case "create": {
        const {
          display_name,
          headline,
          bio,
          photo_url,
          specialties,
          years_experience,
          hourly_rate_min,
          hourly_rate_max,
          booking_url,
          website_url,
          instagram_handle,
          twitter_handle,
          tiktok_handle,
          youtube_url,
          linktree_url,
          location,
          timezone,
          languages,
          offers_virtual,
          offers_in_person,
          is_featured,
          is_verified,
          sort_order,
          status,
        } = body;

        let slug = slugify(display_name);

        // Ensure unique slug
        const { data: existing } = await supabase
          .from("practitioners")
          .select("slug")
          .eq("slug", slug);
        if (existing && existing.length > 0) {
          slug = `${slug}-${Date.now().toString(36)}`;
        }

        const { data, error } = await supabase
          .from("practitioners")
          .insert({
            slug,
            display_name,
            headline,
            bio,
            photo_url,
            specialties: specialties || [],
            years_experience,
            hourly_rate_min,
            hourly_rate_max,
            booking_url,
            website_url,
            instagram_handle,
            twitter_handle,
            tiktok_handle,
            youtube_url,
            linktree_url,
            location,
            timezone,
            languages: languages || ["English"],
            offers_virtual: offers_virtual ?? true,
            offers_in_person: offers_in_person ?? false,
            is_featured: is_featured ?? false,
            is_verified: is_verified ?? false,
            sort_order: sort_order ?? 1000,
            status: status || "draft",
          })
          .select()
          .single();

        if (error) throw error;
        return json({ practitioner: data });
      }

      case "update": {
        const { id, ...updates } = body;
        if (!id) return json({ error: "Missing practitioner id" }, 400);

        // If display_name changed, optionally update slug
        if (updates.display_name) {
          const newSlug = slugify(updates.display_name);
          const { data: existing } = await supabase
            .from("practitioners")
            .select("slug, id")
            .eq("slug", newSlug);
          if (!existing || existing.length === 0 || existing[0].id === id) {
            updates.slug = newSlug;
          }
        }

        delete updates.action;
        const { data, error } = await supabase
          .from("practitioners")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return json({ practitioner: data });
      }

      case "delete": {
        const { id } = body;
        if (!id) return json({ error: "Missing practitioner id" }, 400);

        const { error } = await supabase
          .from("practitioners")
          .update({ status: "suspended" })
          .eq("id", id);

        if (error) throw error;
        return json({ success: true });
      }

      case "generate_claim_link": {
        const { id } = body;
        if (!id) return json({ error: "Missing practitioner id" }, 400);

        const { data, error } = await supabase
          .from("practitioners")
          .select("claim_token")
          .eq("id", id)
          .single();

        if (error) throw error;
        return json({
          claim_url: `https://astrologerapp.org/astrologers/claim/${data.claim_token}`,
        });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (error) {
    console.error("Error:", error);
    return json({ error: (error as Error).message || "Internal error" }, 500);
  }
});
