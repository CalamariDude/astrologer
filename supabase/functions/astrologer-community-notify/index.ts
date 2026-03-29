/**
 * Edge function: Send email notifications for community activity.
 * Called via database webhook or cron to batch-send pending notification emails.
 *
 * Checks user preferences (notify_email_community) before sending.
 * Uses email_notification_log for debouncing (max 1 email per user per 15 min).
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface NotificationRow {
  id: string;
  recipient_id: string;
  actor_id: string;
  type: string;
  post_id: string | null;
  comment_id: string | null;
  created_at: string;
}

function notifLabel(type: string): string {
  switch (type) {
    case 'post_like': return 'liked your post';
    case 'comment_like': return 'liked your comment';
    case 'post_comment': return 'commented on your post';
    case 'comment_reply': return 'replied to your comment';
    case 'new_follower': return 'started following you';
    default: return 'interacted with your content';
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Find unread notifications from the last hour that haven't been emailed
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: notifications, error: nErr } = await supabase
      .from('community_notifications')
      .select('*')
      .eq('is_read', false)
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false })
      .limit(200);

    if (nErr) throw nErr;
    if (!notifications?.length) {
      return new Response(JSON.stringify({ sent: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Group by recipient
    const byRecipient = new Map<string, NotificationRow[]>();
    for (const n of notifications) {
      const list = byRecipient.get(n.recipient_id) || [];
      list.push(n);
      byRecipient.set(n.recipient_id, list);
    }

    const recipientIds = [...byRecipient.keys()];

    // Check which users have email notifications enabled
    const { data: profiles } = await supabase
      .from('astrologer_profiles')
      .select('id, notify_email_community')
      .in('id', recipientIds)
      .eq('notify_email_community', true);

    const emailEnabledIds = new Set((profiles || []).map(p => p.id));

    // Check debounce: skip users who received a community email in the last 15 min
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: recentLogs } = await supabase
      .from('email_notification_log')
      .select('recipient_id')
      .eq('notification_type', 'community_activity')
      .gte('sent_at', fifteenMinAgo)
      .in('recipient_id', recipientIds);

    const recentlySent = new Set((recentLogs || []).map(l => l.recipient_id));

    // Get user emails
    let sentCount = 0;
    for (const [recipientId, notifs] of byRecipient) {
      if (!emailEnabledIds.has(recipientId) || recentlySent.has(recipientId)) continue;

      // Get user email from auth
      const { data: authUser } = await supabase.auth.admin.getUserById(recipientId);
      if (!authUser?.user?.email) continue;

      // Get actor names
      const actorIds = [...new Set(notifs.map(n => n.actor_id))];
      const { data: actors } = await supabase
        .from('astrologer_profiles')
        .select('id, display_name')
        .in('id', actorIds);
      const actorNames: Record<string, string> = {};
      for (const a of (actors || [])) {
        actorNames[a.id] = a.display_name || 'Someone';
      }

      // Build email
      const items = notifs.slice(0, 10).map(n => {
        const name = actorNames[n.actor_id] || 'Someone';
        return `<li style="margin-bottom:8px;color:#374151;">${name} ${notifLabel(n.type)}</li>`;
      });

      const moreText = notifs.length > 10 ? `<p style="color:#6b7280;font-size:14px;">...and ${notifs.length - 10} more</p>` : '';

      const html = `
        <div style="font-family:system-ui,-apple-system,sans-serif;max-width:500px;margin:0 auto;padding:24px;">
          <h2 style="color:#111827;font-size:18px;margin-bottom:16px;">New activity on your posts</h2>
          <ul style="list-style:none;padding:0;margin:0 0 16px 0;font-size:14px;">
            ${items.join('')}
          </ul>
          ${moreText}
          <a href="https://astrologerapp.org/community" style="display:inline-block;background:#6366f1;color:white;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:500;">View in Community</a>
          <p style="margin-top:24px;font-size:12px;color:#9ca3af;">
            You can manage notification preferences in your <a href="https://astrologerapp.org/settings" style="color:#6366f1;">settings</a>.
          </p>
        </div>
      `;

      // Send via Resend
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Astrologer <charts@astrologerapp.org>",
          to: [authUser.user.email],
          subject: `${notifs.length} new notification${notifs.length > 1 ? 's' : ''} on Astrologer`,
          html,
        }),
      });

      if (res.ok) {
        sentCount++;
        // Log to prevent re-sending
        await supabase.from('email_notification_log').insert({
          recipient_id: recipientId,
          notification_type: 'community_activity',
          metadata: { count: notifs.length },
        });
      }
    }

    return new Response(
      JSON.stringify({ sent: sentCount, total_recipients: byRecipient.size }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
