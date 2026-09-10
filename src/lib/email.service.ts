import nodemailer, { type Transporter } from "nodemailer";

export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface ContactNotificationData {
  fullName: string;
  email: string;
  affiliation?: string;
  subject: string;
  message: string;
  id?: string;
}

let cachedTransporter: Transporter | null = null;
let lastUsedPass: string | null = null;
let lastUsedUser: string | null = null;

export function getTransporter(): Transporter {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const secure = process.env.SMTP_SECURE === "false" ? false : port === 465;
  const user = process.env.SMTP_USER || "academicdevelopmentforum24@gmail.com";
  const pass = process.env.SMTP_PASS || "";


  if (!cachedTransporter || lastUsedPass !== pass || lastUsedUser !== user) {
    lastUsedPass = pass;
    lastUsedUser = user;
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false, // Prevents self-signed cert issues in diverse environments
      },
    });
  }
  return cachedTransporter;
}


/**
 * Verifies SMTP connectivity and credentials.
 */
export async function verifySmtp(): Promise<{ ok: boolean; message: string }> {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    return { ok: true, message: "SMTP connection established and verified successfully." };
  } catch (error: any) {
    const errMessage = error?.message || String(error);
    console.warn(`[SMTP Warning] SMTP verification failed: ${errMessage}`);
    if (errMessage.includes("535") || errMessage.includes("BadCredentials") || errMessage.includes("Username and Password not accepted")) {
      return {
        ok: false,
        message: "Gmail rejected the credentials. Note: Gmail typically requires a 16-character 'App Password' when 2FA is active on the Google account."
      };
    }
    return { ok: false, message: errMessage };
  }
}

/**
 * Sends a generic email using the configured SMTP transporter.
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const from = process.env.SMTP_FROM || `"Academic Development Forum" <${process.env.SMTP_USER || "academicdevelopmentforum24@gmail.com"}>`;

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
    });

    console.log(`[SMTP] Email sent successfully to ${options.to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.error(`[SMTP Error] Failed to send email to ${options.to}:`, errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Sends an email notification to ADF Admin / Editorial Office when someone submits the Contact Us form.
 */
export async function sendContactFormNotification(data: ContactNotificationData): Promise<{ success: boolean; error?: string }> {
  const adminReceiver = process.env.CONTACT_RECEIVER_EMAIL || process.env.SMTP_USER || "academicdevelopmentforum24@gmail.com";
  const now = new Date().toLocaleString("en-US", { timeZone: "UTC", dateStyle: "full", timeStyle: "medium" });

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f172a; color: #ffffff; padding: 24px; text-align: left; border-bottom: 3px solid #0284c7; }
    .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
    .header p { margin: 0; font-size: 13px; color: #94a3b8; }
    .content { padding: 24px; }
    .badge { display: inline-block; background: #e0f2fe; color: #0369a1; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; margin-bottom: 16px; }
    .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
    .meta-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    .meta-table td.label { width: 130px; font-weight: 600; color: #64748b; background: #f8fafc; }
    .meta-table td.value { color: #0f172a; word-break: break-word; }
    .message-box { background: #f8fafc; border-left: 4px solid #0284c7; padding: 16px; border-radius: 4px; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap; margin-top: 10px; }
    .footer { background: #f8fafc; padding: 16px 24px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; text-align: center; }
    .btn { display: inline-block; background: #0284c7; color: #ffffff !important; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 600; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Academic Development Forum</h1>
      <p>Official Website &bull; Contact Inquiry Notification</p>
    </div>
    <div class="content">
      <span class="badge">New Contact Inquiry</span>
      <h2 style="font-size: 16px; margin-top: 0; color: #0f172a;">${escapeHtml(data.subject)}</h2>
      
      <table class="meta-table">
        <tr>
          <td class="label">Sender Name:</td>
          <td class="value"><strong>${escapeHtml(data.fullName)}</strong></td>
        </tr>
        <tr>
          <td class="label">Sender Email:</td>
          <td class="value"><a href="mailto:${escapeHtml(data.email)}" style="color: #0284c7; text-decoration: none;">${escapeHtml(data.email)}</a></td>
        </tr>
        <tr>
          <td class="label">Affiliation:</td>
          <td class="value">${escapeHtml(data.affiliation || "None specified")}</td>
        </tr>
        <tr>
          <td class="label">Subject:</td>
          <td class="value">${escapeHtml(data.subject)}</td>
        </tr>
        <tr>
          <td class="label">Received (UTC):</td>
          <td class="value">${now}</td>
        </tr>
      </table>

      <div style="font-weight: 600; font-size: 13px; color: #475569; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Message Content:</div>
      <div class="message-box">${escapeHtml(data.message)}</div>

      <div style="text-align: center;">
        <a href="mailto:${escapeHtml(data.email)}?subject=Re: ${encodeURIComponent(data.subject)}" class="btn">
          Direct Reply to ${escapeHtml(data.fullName)}
        </a>
      </div>
    </div>
    <div class="footer">
      This message was automatically generated by the ADF Contact Us portal.<br>
      Academic Development Forum &bull; academicdevelopmentforum24@gmail.com
    </div>
  </div>
</body>
</html>
  `.trim();

  const plainText = `
Academic Development Forum - New Contact Form Inquiry
======================================================
Sender Name: ${data.fullName}
Sender Email: ${data.email}
Affiliation: ${data.affiliation || "None specified"}
Subject: ${data.subject}
Date: ${now}

Message:
--------
${data.message}

Reply-To: ${data.email}
======================================================
  `.trim();

  return await sendEmail({
    to: adminReceiver,
    replyTo: data.email, // Allows clicking reply to respond directly to the inquirer
    subject: `[ADF Contact] ${data.subject} - from ${data.fullName}`,
    text: plainText,
    html: htmlContent,
  });
}

/**
 * Sends an automated acknowledgment email to the person who contacted ADF.
 */
export async function sendContactAcknowledgment(data: ContactNotificationData): Promise<{ success: boolean; error?: string }> {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f172a; color: #ffffff; padding: 24px; text-align: left; border-bottom: 3px solid #0284c7; }
    .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 700; }
    .header p { margin: 0; font-size: 13px; color: #94a3b8; }
    .content { padding: 24px; line-height: 1.6; font-size: 14px; }
    .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 6px; margin: 16px 0; font-size: 13px; }
    .footer { background: #f8fafc; padding: 16px 24px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Academic Development Forum</h1>
      <p>Editorial & Publishing Office</p>
    </div>
    <div class="content">
      <p>Dear <strong>${escapeHtml(data.fullName)}</strong>,</p>
      <p>Thank you for reaching out to the <strong>Academic Development Forum (ADF)</strong>. We have successfully received your inquiry regarding <em>"${escapeHtml(data.subject)}"</em>.</p>
      <p>Our editorial and support team reviews all incoming inquiries promptly. You can expect a response within <strong>2 to 3 business days</strong>.</p>
      
      <div class="summary-box">
        <strong>Summary of your submission:</strong><br>
        <strong>Subject:</strong> ${escapeHtml(data.subject)}<br>
        <strong>Affiliation:</strong> ${escapeHtml(data.affiliation || "N/A")}<br>
        <strong>Message:</strong><br>
        <span style="color: #64748b;">${escapeHtml(data.message.slice(0, 300))}${data.message.length > 300 ? "..." : ""}</span>
      </div>

      <p>If you have urgent queries or follow-up documents, feel free to reply directly to this email or contact us at <a href="mailto:academicdevelopmentforum24@gmail.com" style="color: #0284c7;">academicdevelopmentforum24@gmail.com</a>.</p>

      <p style="margin-top: 24px;">Warm regards,<br>
      <strong>Editorial Office</strong><br>
      Academic Development Forum (ADF)</p>
    </div>
    <div class="footer">
      Academic Development Forum (ADF) &bull; Global Academic Publications & Editorial Forum
    </div>
  </div>
</body>
</html>
  `.trim();

  const plainText = `
Dear ${data.fullName},

Thank you for reaching out to the Academic Development Forum (ADF). We have received your inquiry regarding "${data.subject}".

Our team will review your message and respond within 2 to 3 business days.

Warm regards,
Editorial Office
Academic Development Forum (ADF)
academicdevelopmentforum24@gmail.com
  `.trim();

  return await sendEmail({
    to: data.email,
    subject: `Thank you for contacting ADF: ${data.subject}`,
    text: plainText,
    html: htmlContent,
  });
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
