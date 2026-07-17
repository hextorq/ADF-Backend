export async function sendNotificationEmail({
  to,
  subject,
  message,
}: {
  to: string;
  subject: string;
  message: string;
}) {
  // In a real application, this would integrate with SendGrid, SES, or SMTP.
  // For now, we mock the email sending.
  console.log(`\n================== EMAIL NOTIFICATION ==================`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Message: \n${message}`);
  console.log(`==========================================================\n`);
  return true;
}
