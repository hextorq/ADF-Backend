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
  const pass = (process.env.SMTP_PASS || "frms gmws gxyt bwhy").replace(/^["']|["']$/g, "").trim();


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


export interface AbstractEmailData {
  authorName: string;
  email: string;
  submissionId: string;
  abstractTitle: string;
  researchAreaName: string;
  paymentRef: string;
}

/**
 * Sends an email confirming payment received and abstract acceptance.
 */
export async function sendAbstractAcceptanceEmail(data: AbstractEmailData): Promise<{ success: boolean; error?: string }> {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; color: #0f172a; }
    .card { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #cbd5e1; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #002147 0%, #083363 100%); color: #ffffff; padding: 28px 24px; text-align: left; border-bottom: 4px solid #0d9488; }
    .header h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 700; color: #ffffff; }
    .header p { margin: 0; font-size: 13px; color: #99f6e4; font-weight: 500; }
    .content { padding: 28px 24px; line-height: 1.6; font-size: 14px; }
    .status-badge { display: inline-block; background: #dcfce7; color: #166534; font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 9999px; margin-bottom: 16px; border: 1px solid #bbf7d0; }
    .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 18px 0; font-size: 13px; }
    .meta-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; }
    .meta-row:last-child { border-bottom: none; }
    .meta-label { color: #64748b; font-weight: 600; }
    .meta-val { color: #0f172a; font-weight: 600; text-align: right; }
    .highlight-box { background: #f0fdfa; border-left: 4px solid #0d9488; padding: 14px 16px; border-radius: 4px; margin: 18px 0; font-size: 13.5px; color: #134e4a; }
    .footer { background: #f8fafc; padding: 18px 24px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Academic Development Forum</h1>
      <p>Interdisciplinary Horizons &bull; Multidisciplinary E-Book of Abstracts 2026</p>
    </div>
    <div class="content">
      <span class="status-badge">&check; Payment Received &amp; Abstract Accepted</span>
      
      <p>Dear <strong>${escapeHtml(data.authorName)}</strong>,</p>
      
      <p>Greetings from the <strong>Academic Development Forum (ADF)</strong>! We are very happy to collaborate with you.</p>
      
      <p>We are delighted to confirm that your <strong>payment has been received successfully</strong> and your research abstract has been <strong>ACCEPTED</strong> for publication in our upcoming international multidisciplinary volume:</p>
      
      <div class="highlight-box">
        <strong>Book Volume:</strong> Interdisciplinary Horizons: Emerging Trends in Research, Innovation, and Sustainable Development<br>
        <strong>Publication:</strong> Multidisciplinary E-Book with assigned ISBN &amp; DOI<br>
        <strong>Publisher:</strong> Academic Development Forum (ADF)
      </div>

      <div class="meta-box">
        <div class="meta-row">
          <span class="meta-label">Tracking ID:</span>
          <span class="meta-val" style="color: #002147; font-family: monospace;">${escapeHtml(data.submissionId)}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Author Name:</span>
          <span class="meta-val">${escapeHtml(data.authorName)}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Abstract Title:</span>
          <span class="meta-val" style="max-width: 350px;">${escapeHtml(data.abstractTitle)}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Research Track:</span>
          <span class="meta-val">${escapeHtml(data.researchAreaName)}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Payment Status:</span>
          <span class="meta-val" style="color: #166534;">Payment Received &amp; Verified (₹50)</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Payment / UTR Ref:</span>
          <span class="meta-val" style="font-family: monospace;">${escapeHtml(data.paymentRef)}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Review Status:</span>
          <span class="meta-val" style="color: #0d9488;">Accepted for Publication</span>
        </div>
      </div>

      <p><strong>Next Steps &amp; Benefits:</strong></p>
      <ul style="padding-left: 20px; color: #334155; font-size: 13px;">
        <li>Your abstract will be professionally indexed and formatted into the official compendium.</li>
        <li>An individual verifiable <strong>e-Certificate</strong> and a <strong>complimentary digital e-book copy</strong> will be emailed to you upon official release.</li>
        <li>DOI registration will be linked to the published e-book on the official website.</li>
      </ul>

      <p>If you have any questions or require revisions, feel free to contact us at <a href="mailto:academicdevelopmentforum24@gmail.com" style="color: #0d9488; font-weight: 600;">academicdevelopmentforum24@gmail.com</a> or WhatsApp at <strong>+91 75023 98680</strong>.</p>

      <p style="margin-top: 24px;">Warm regards and congratulations,<br>
      <strong>Editorial &amp; Publication Board</strong><br>
      Academic Development Forum (ADF)<br>
      <a href="https://www.adf.ijeae.com" style="color: #002147; font-size: 12px;">www.adf.ijeae.com</a></p>
    </div>
    <div class="footer">
      Academic Development Forum &bull; Encouraging Research &bull; Connecting Disciplines &bull; Inspiring Innovation
    </div>
  </div>
</body>
</html>
  `.trim();

  const plainText = `
Academic Development Forum (ADF)
Payment Received & Abstract Accepted Confirmation
======================================================
Dear ${data.authorName},

Greetings from Academic Development Forum (ADF)! We are happy to collaborate with you.

We are pleased to inform you that your payment has been received successfully and your abstract has been ACCEPTED for publication in:
"Interdisciplinary Horizons: Emerging Trends in Research, Innovation, and Sustainable Development"
(Multidisciplinary E-Book with ISBN & DOI assignment).

Submission Details:
- Tracking ID: ${data.submissionId}
- Author Name: ${data.authorName}
- Abstract Title: ${data.abstractTitle}
- Research Track: ${data.researchAreaName}
- Payment Status: Payment Received & Verified (₹50)
- Payment / UTR Reference: ${data.paymentRef}
- Review Status: Accepted for Publication

Benefits Included:
1. Publication in multidisciplinary e-book
2. ISBN and DOI registration
3. Individual verifiable e-Certificate
4. Free digital copy of the published volume

Contact & Support:
Email: academicdevelopmentforum24@gmail.com
WhatsApp: +91 75023 98680
Official Website: https://www.adf.ijeae.com

Warm regards and congratulations,
Editorial & Publication Board
Academic Development Forum (ADF)
======================================================
  `.trim();

  return await sendEmail({
    to: data.email,
    subject: `[ADF Accepted] Payment Received & Abstract Accepted: "${data.abstractTitle}" [ID: ${data.submissionId}]`,
    text: plainText,
    html: htmlContent,
  });
}
