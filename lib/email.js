/**
 * File: lib/email.js
 * Purpose: Email sending utility via Nodemailer - sends OTP emails, supports SMTP configuration with fallback
 */
import nodemailer from "nodemailer";

const SMTP_HOST = process.env.EMAIL_HOST;
const SMTP_PORT = Number(process.env.EMAIL_PORT || 587);
const SMTP_USER = process.env.EMAIL_USER;
const SMTP_PASS = process.env.EMAIL_PASSWORD;
const FROM_ADDRESS = process.env.EMAIL_FROM || SMTP_USER || "no-reply@watchparty.local";

let transporter;

async function getTransporter() {
  if (transporter) return transporter;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    // No SMTP configured — we'll fallback to logging
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    secure: SMTP_PORT === 465, // true for 465, false for other ports
  });

  try {
    await transporter.verify();
    console.log("✅ Nodemailer transporter verified");
  } catch (err) {
    console.warn("⚠️ Nodemailer transporter verification failed:", err && err.message ? err.message : err);
  }

  return transporter;
}

export async function sendOtpEmail(to, message, subject = "Your WatchParty OTP") {
  const t = await getTransporter();

  if (!t) {
    // Fallback: still log the OTP so developers can test without SMTP
    console.log(`📧 (LOG ONLY) Email sent to ${to}: ${message}`);
    return { logged: true };
  }

  const mailOptions = {
    from: FROM_ADDRESS,
    to,
    subject,
    text: message,
    html: `<p>${message}</p>`,
  };

  try {
    const info = await t.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}: messageId=${info.messageId}`);
    return info;
  } catch (err) {
    console.error("Error sending email:", err && err.message ? err.message : err);
    throw err;
  }
}
