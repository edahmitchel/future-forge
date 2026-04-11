const nodemailer = require("nodemailer");

// We create the transporter lazily so it's ready after the async init
let transporter = null;

/**
 * Creates a transporter using Ethereal — a fake SMTP service for development.
 *
 * nodemailer.createTestAccount() contacts Ethereal's API and returns
 * a real (ephemeral) SMTP credential set. No sign-up required.
 *
 * After sending, use nodemailer.getTestMessageUrl(info) to get a
 * browser preview link for the sent email.
 */
const initMailer = async () => {
  // Generate a one-time throwaway Ethereal account
  const testAccount = await nodemailer.createTestAccount();

  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // TLS via STARTTLS
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  console.log("✓ Mailer ready (Ethereal SMTP)");
  console.log(`  Inbox preview: https://ethereal.email/messages`);
  console.log(`  Login: ${testAccount.user} / ${testAccount.pass}`);
};

/**
 * Send an email and log the Ethereal preview URL to the console.
 *
 * @param {object} options
 * @param {string} options.to       - Recipient email address
 * @param {string} options.subject  - Email subject line
 * @param {string} options.html     - HTML body
 * @param {string} [options.text]   - Plain text fallback
 */
const sendMail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    throw new Error("Mailer not initialised. Call initMailer() first.");
  }

  const info = await transporter.sendMail({
    from: '"Week 8 App" <no-reply@week8.dev>',
    to,
    subject,
    text,
    html,
  });

  // Ethereal captures the message and gives us a public preview URL
  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log(`\n📧 Email sent to: ${to}`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Preview: ${previewUrl}\n`);

  return { messageId: info.messageId, previewUrl };
};

module.exports = { initMailer, sendMail };
