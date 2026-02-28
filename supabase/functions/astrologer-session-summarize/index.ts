/**
 * astrologer-session-summarize — Stage 3: AI summary + finalize
 *
 * Called internally by session-transcribe (service role auth).
 * Summarizes transcript with Grok, generates chapter markers,
 * updates session to ready, and emails replay link.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let sessionId: string | null = null;

  try {
    const { session_id } = await req.json();
    sessionId = session_id;
    if (!session_id) {
      return new Response(JSON.stringify({ error: "session_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get session with transcript
    const { data: session } = await supabase
      .from("astrologer_sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (!session) {
      throw new Error("Session not found");
    }

    // ── Summarize with Grok ──────────────────────────────────
    let summary = "";
    let chapters: { title: string; timestamp_ms: number; description: string }[] = [];

    const xaiKey = Deno.env.get("XAI_API_KEY") || Deno.env.get("COSMOSIS_GROK_API_KEY");
    const transcript = session.transcript || "";
    const audioDurationMs = session.audio_duration_ms || 0;

    if (xaiKey && transcript) {
      try {
        const grokRes = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${xaiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "grok-4-1-fast",
            messages: [
              {
                role: "system",
                content: "You are an expert astrology session summarizer. Given a transcript of an astrology reading session, generate: (1) a concise summary of the key insights and themes discussed, (2) chapter markers as a JSON array. Respond in this exact JSON format: {\"summary\": \"...\", \"chapters\": [{\"title\": \"...\", \"timestamp_ms\": 0, \"description\": \"...\"}]}",
              },
              {
                role: "user",
                content: `Transcript of astrology session (duration: ${Math.round(audioDurationMs / 1000)}s):\n\n${transcript}`,
              },
            ],
            temperature: 0.3,
          }),
        });

        if (grokRes.ok) {
          const grokData = await grokRes.json();
          const content = grokData?.choices?.[0]?.message?.content || "";
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            summary = parsed.summary || "";
            chapters = parsed.chapters || [];
          }
        } else {
          console.error("Grok error:", await grokRes.text());
        }
      } catch (err) {
        console.error("Grok summarization failed:", err);
      }
    }

    // ── Finalize session ─────────────────────────────────────
    await supabase
      .from("astrologer_sessions")
      .update({
        status: "ready",
        audio_status: "ready",
        summary: summary || null,
        chapters: chapters.length > 0 ? chapters : [],
      })
      .eq("id", session_id);

    // ── Email replay link ────────────────────────────────────
    const replayUrl = `https://astrologer.app/session/${session.share_token}`;
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (resendKey) {
      const { data: hostProfile } = await supabase
        .from("astrologer_profiles")
        .select("email, display_name")
        .eq("id", session.host_id)
        .single();

      const hostName = hostProfile?.display_name || session.host_display_name || "Astrologer";
      const guestName = session.guest_display_name || "Guest";
      const durationMin = session.audio_duration_ms
        ? Math.round(session.audio_duration_ms / 60000)
        : session.total_duration_ms
          ? Math.round(session.total_duration_ms / 60000)
          : null;

      const chaptersHtml = chapters.length > 0
        ? `<table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:16px 0;">
            ${chapters.map((ch: { title: string; timestamp_ms: number; description: string }) => {
              const m = Math.floor(ch.timestamp_ms / 60000);
              const s = Math.floor((ch.timestamp_ms % 60000) / 1000);
              const ts = `${m}:${String(s).padStart(2, '0')}`;
              return `<tr>
                <td style="padding:6px 12px 6px 0;vertical-align:top;color:#8b5cf6;font-weight:600;font-size:13px;white-space:nowrap;">${ts}</td>
                <td style="padding:6px 0;vertical-align:top;">
                  <span style="font-weight:600;font-size:14px;color:#1a1a2e;">${ch.title}</span>
                  ${ch.description ? `<br/><span style="font-size:13px;color:#666;">${ch.description}</span>` : ''}
                </td>
              </tr>`;
            }).join('')}
          </table>`
        : '';

      const buildEmailHtml = (recipientName: string, isHost: boolean) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f5f3ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#7c3aed,#a78bfa);padding:28px 24px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">Your Session Recording is Ready</h1>
      </div>

      <div style="padding:24px;">
        <p style="margin:0 0 8px;font-size:15px;color:#374151;">Hi ${recipientName},</p>
        <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">
          ${isHost
            ? `Your astrology session <strong>${session.title}</strong> has been transcribed and summarized.`
            : `${hostName} has shared the recording of your astrology session <strong>${session.title}</strong> with you.`
          }
          ${durationMin ? ` (${durationMin} min)` : ''}
        </p>

        <!-- CTA -->
        <div style="text-align:center;margin:20px 0;">
          <a href="${replayUrl}" style="display:inline-block;background:#7c3aed;color:#ffffff;font-size:15px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">
            Watch Replay &rarr;
          </a>
        </div>

        ${summary ? `
        <!-- Summary -->
        <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:20px 0;">
          <h3 style="margin:0 0 8px;font-size:14px;color:#374151;font-weight:600;">Session Summary</h3>
          <p style="margin:0;font-size:13px;color:#4b5563;line-height:1.6;">${summary}</p>
        </div>
        ` : ''}

        ${chaptersHtml ? `
        <!-- Chapters -->
        <div style="margin:20px 0;">
          <h3 style="margin:0 0 8px;font-size:14px;color:#374151;font-weight:600;">Chapters</h3>
          ${chaptersHtml}
        </div>
        ` : ''}

        <p style="margin:20px 0 0;font-size:13px;color:#9ca3af;text-align:center;">
          You can revisit this recording anytime at the link above.
        </p>
      </div>
    </div>

    <p style="text-align:center;margin:16px 0 0;font-size:12px;color:#9ca3af;">
      Sent by Astrologer &middot; <a href="https://astrologer.app" style="color:#7c3aed;text-decoration:none;">astrologer.app</a>
    </p>
  </div>
</body>
</html>`;

      // Send to host
      if (hostProfile?.email) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Astrologer <noreply@astrologer.app>",
              to: hostProfile.email,
              subject: `Session recording ready: ${session.title}`,
              html: buildEmailHtml(hostName, true),
            }),
          });
        } catch (emailErr) {
          console.error("Host email send failed:", emailErr);
        }
      }

      // Send to guest (different wording)
      if (session.guest_email) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Astrologer <noreply@astrologer.app>",
              to: session.guest_email,
              subject: `Your astrology session recording: ${session.title}`,
              html: buildEmailHtml(guestName, false),
            }),
          });
        } catch (emailErr) {
          console.error("Guest email send failed:", emailErr);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        stage: "summarize_complete",
        summary_length: summary.length,
        chapter_count: chapters.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Summarization error:", err);

    try {
      if (sessionId) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await supabase
          .from("astrologer_sessions")
          .update({ status: "failed", audio_status: "failed" })
          .eq("id", sessionId);
      }
    } catch {}

    return new Response(
      JSON.stringify({ error: (err as Error).message || "Summarization failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
