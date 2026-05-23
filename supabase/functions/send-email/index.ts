import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailPayload {
  to: string;
  to_name?: string;
  subject: string;
  html: string;
  text?: string;
  reply_to?: string;
  attachments?: Array<{ filename: string; content: string; encoding: string; contentType: string }>;
  template?: string;
  template_data?: Record<string, string>;
  log_type?: string;
  reference_id?: string;
}

function buildEmailTemplate(payload: EmailPayload, settings: Record<string, string>): string {
  const companyName = settings.company_name || "Altahany Wedding Services";
  const companyEmail = settings.company_email || "info@altahany.com";
  const companyPhone = settings.company_phone || "";
  const goldColor = "#F59E0B";

  const body = payload.html || (payload.text ? `<p>${payload.text}</p>` : "");

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${payload.subject}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; color: #333; direction: rtl; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #fff; }
    .header { background: #111; padding: 24px 32px; text-align: center; }
    .header-line { height: 3px; background: ${goldColor}; }
    .logo { font-size: 22px; color: #fff; font-weight: bold; letter-spacing: 2px; }
    .logo-sub { font-size: 11px; color: ${goldColor}; margin-top: 4px; }
    .content { padding: 32px; }
    .subject { font-size: 20px; font-weight: bold; color: #111; margin-bottom: 20px; }
    .body { font-size: 14px; line-height: 1.8; color: #444; }
    .divider { height: 1px; background: #eee; margin: 24px 0; }
    .footer { background: #111; padding: 20px 32px; text-align: center; }
    .footer p { font-size: 11px; color: #888; margin: 3px 0; }
    .footer a { color: ${goldColor}; text-decoration: none; }
    .badge { display: inline-block; background: ${goldColor}; color: #111; font-size: 11px; font-weight: bold; padding: 3px 10px; border-radius: 12px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">${companyName}</div>
      <div class="logo-sub">التهاني لخدمات الأفراح</div>
    </div>
    <div class="header-line"></div>
    <div class="content">
      <div class="subject">${payload.subject}</div>
      <div class="body">${body}</div>
      <div class="divider"></div>
      ${companyPhone ? `<p style="font-size:13px;color:#666;">للتواصل: <strong>${companyPhone}</strong></p>` : ""}
      <p style="font-size:13px;color:#666;margin-top:6px;">البريد الإلكتروني: <a href="mailto:${companyEmail}">${companyEmail}</a></p>
    </div>
    <div class="footer">
      <div class="badge">Altahany</div>
      <p style="margin-top:10px;">شكراً لثقتكم بخدمات التهاني</p>
      <p><a href="https://altahany.com">www.altahany.com</a></p>
      <p style="margin-top:8px;color:#555;font-size:10px;">Powered & Secured by Lekando</p>
    </div>
  </div>
</body>
</html>`;
}

async function sendViaSMTP(
  smtpHost: string,
  smtpPort: number,
  smtpUser: string,
  smtpPass: string,
  from: string,
  to: string,
  subject: string,
  html: string,
  text?: string,
): Promise<boolean> {
  // Use Mailersend/Resend-compatible REST API if available, otherwise fallback to fetch-based SMTP
  // Since Deno doesn't have native SMTP, we use the smtp npm package
  try {
    const { SMTPClient } = await import("npm:smtp-client@0.4.0");
    const client = new SMTPClient({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
    });
    await client.connect();
    await client.greet({ hostname: "altahany.com" });
    await client.authLogin({ username: smtpUser, password: smtpPass });
    await client.mail({ from });
    await client.rcpt({ to });
    await client.data(`From: ${from}\r\nTo: ${to}\r\nSubject: ${subject}\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${html}`);
    await client.quit();
    return true;
  } catch (smtpErr) {
    console.error("SMTP error:", smtpErr);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Load SMTP settings from database
    const { data: settingsRows } = await supabase.from("settings").select("key, value");
    const settings: Record<string, string> = {};
    if (settingsRows) {
      settingsRows.forEach((row: { key: string; value: string }) => {
        settings[row.key] = row.value;
      });
    }

    const smtpHost = settings.smtp_host || "smtp.hostinger.com";
    const smtpPort = parseInt(settings.smtp_port || "465");
    const smtpEmail = settings.smtp_email || "info@altahany.com";
    const smtpPassword = settings.smtp_password || "Altahany@2024";
    const fromName = settings.company_name || "Altahany";
    const fromAddress = `${fromName} <${smtpEmail}>`;

    const payload: EmailPayload = await req.json();

    if (!payload.to || !payload.subject) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: to, subject" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Build full email HTML with branded template
    const fullHtml = buildEmailTemplate(payload, settings);

    const sent = await sendViaSMTP(
      smtpHost,
      smtpPort,
      smtpEmail,
      smtpPassword,
      fromAddress,
      payload.to,
      payload.subject,
      fullHtml,
      payload.text,
    );

    // Log email attempt
    await supabase.from("email_logs").insert({
      to_email: payload.to,
      to_name: payload.to_name || null,
      subject: payload.subject,
      log_type: payload.log_type || "manual",
      reference_id: payload.reference_id || null,
      status: sent ? "sent" : "failed",
      sent_at: sent ? new Date().toISOString() : null,
      error_message: sent ? null : "SMTP delivery failed",
    }).catch(() => {/* non-fatal */});

    return new Response(
      JSON.stringify({ success: sent, message: sent ? "Email sent successfully" : "Email delivery failed" }),
      { status: sent ? 200 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("send-email error:", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
