import SibApiV3Sdk from "sib-api-v3-sdk";

const BREVO_KEY = process.env.BREVO_API_KEY;

let emailApi = null;

if (BREVO_KEY) {
  const client = SibApiV3Sdk.ApiClient.instance;
  client.authentications["api-key"].apiKey = BREVO_KEY;
  emailApi = new SibApiV3Sdk.TransactionalEmailsApi();
  console.log("✅ Brevo mailer configured");
} else {
  console.warn("⚠️  BREVO_API_KEY not set — emails will be logged to console instead of sent");
}

/**
 * Universal mail sender (NO SMTP, NO DNS)
 * Falls back to console.log when Brevo is not configured.
 */
export async function sendMail({ to, subject, html }) {
  if (!emailApi) {
    console.log("📧 [MAIL STUB] Would send email:");
    console.log(`   To:      ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body:    ${html?.slice(0, 120)}…`);
    return { messageId: "stub-" + Date.now() };
  }

  return emailApi.sendTransacEmail({
    sender: {
      name: "CARE System",
      email: "s.aniruddha3993@gmail.com", // ✅ verify this email in Brevo
    },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  });
}
