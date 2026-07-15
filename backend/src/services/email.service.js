import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

// Falls back to logging emails when SMTP is not configured.
const isConfigured = Boolean(env.email.host && env.email.user && env.email.password);

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: env.email.host,
      port: env.email.port,
      secure: env.email.secure,
      auth: { user: env.email.user, pass: env.email.password },
    })
  : null;

const send = async ({ to, subject, html, text }) => {
  if (!transporter) {
    logger.info({ to, subject }, '[email:disabled] Would have sent email (configure SMTP_* env vars to enable)');
    return;
  }
  try {
    await transporter.sendMail({ from: env.email.from, to, subject, html, text });
  } catch (err) {
    logger.error({ err, to, subject }, 'Failed to send email');
  }
};

export const sendWelcomeEmail = (to, name) =>
  send({
    to,
    subject: 'Welcome to shortify 👋',
    html: `<p>Hi ${name},</p><p>Your shortify account has been created. Start shortening links from your dashboard.</p>`,
  });

export const sendAccountLockedEmail = (to, name, minutes) =>
  send({
    to,
    subject: 'Security alert: your shortify account was temporarily locked',
    html: `<p>Hi ${name},</p><p>We locked your account for ${minutes} minutes after several failed login attempts. If this wasn't you, consider changing your password once you regain access.</p>`,
  });

export const sendNewApiKeyEmail = (to, name, keyName) =>
  send({
    to,
    subject: 'A new API key was created on your shortify account',
    html: `<p>Hi ${name},</p><p>A new API key named "${keyName}" was just created for your account. If this wasn't you, revoke it immediately from your dashboard.</p>`,
  });
