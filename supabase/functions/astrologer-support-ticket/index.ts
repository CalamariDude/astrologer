import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPPORT_EMAIL = "zeineddine.jad@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, category, subject, message, systemInfo } = await req.json();

    if (!email || !message) {
      return new Response(
        JSON.stringify({ error: "Email and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build system info HTML
    const sysRows = systemInfo
      ? Object.entries(systemInfo)
          .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;font-weight:600;color:#666;white-space:nowrap">${k}</td><td style="padding:4px 0;color:#333">${v}</td></tr>`)
          .join("")
      : "";

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#0a0a0a;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
          <h1 style="margin:0;font-size:18px">Astrologer Support Ticket</h1>
        </div>
        <div style="border:1px solid #e5e5e5;border-top:none;border-radius:0 0 12px 12px;padding:24px">
          <table style="font-size:14px;margin-bottom:20px">
            <tr><td style="padding:4px 12px 4px 0;font-weight:600;color:#666">From</td><td>${email}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;font-weight:600;color:#666">Category</td><td>${category || "General"}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;font-weight:600;color:#666">Subject</td><td>${subject || "(no subject)"}</td></tr>
          </table>

          <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin-bottom:20px">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#999;margin-bottom:8px">Message</div>
            <div style="font-size:14px;line-height:1.6;color:#1a1a1a;white-space:pre-wrap">${message}</div>
          </div>

          ${sysRows ? `
          <details style="margin-top:16px">
            <summary style="font-size:12px;color:#999;cursor:pointer;margin-bottom:8px">System Information</summary>
            <table style="font-size:12px;width:100%">${sysRows}</table>
          </details>
          ` : ""}
        </div>
      </div>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Astrologer Support <hello@druzematch.app>",
        to: [SUPPORT_EMAIL],
        reply_to: email,
        subject: `[Astrologer] ${category || "Support"}: ${subject || message.slice(0, 60)}`,
        html,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Resend API error:", errText);
      return new Response(
        JSON.stringify({ error: "Failed to send ticket" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
