import { sendEmail } from "./email.service.js";

export async function sendNotificationEmail({
  to,
  subject,
  message,
}: {
  to: string;
  subject: string;
  message: string;
}) {
  console.log(`\n================== EMAIL NOTIFICATION ==================`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Message: \n${message}`);
  console.log(`==========================================================\n`);

  // Attempt real SMTP delivery
  const result = await sendEmail({
    to,
    subject,
    text: message,
  });

  return result.success;
}

