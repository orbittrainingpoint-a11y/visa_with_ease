import nodemailer, { type Transporter } from 'nodemailer';

/**
 * Real email delivery via Gmail SMTP. Falls back to `null` (never throws)
 * when SMTP_USER/SMTP_PASS aren't configured, so local/demo mode keeps
 * working exactly as before — callers check `isEmailConfigured()` and fall
 * back to their existing dev-mode behavior (e.g. returning the code in the
 * API response) when this is false, rather than silently pretending to send.
 */
let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    transporter = null;
    return transporter;
  }
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
  return transporter;
}

export function isEmailConfigured(): boolean {
  return getTransporter() !== null;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const t = getTransporter();
  if (!t) return false;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await t.sendMail({ from: `"Visa With Ease" <${from}>`, to, subject, html });
  return true;
}

function codeEmailHtml(heading: string, code: string, context: string): string {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#0B1F4B">${heading}</h2>
      <p style="color:#334155">${context}</p>
      <div style="font-size:32px;font-weight:900;letter-spacing:8px;background:#F1F5F9;padding:16px;border-radius:12px;text-align:center;color:#0B1F4B">${code}</div>
      <p style="color:#94A3B8;font-size:12px;margin-top:24px">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
}

export async function sendVerificationEmail(to: string, code: string): Promise<boolean> {
  return sendEmail(to, 'Verify your Visa With Ease account', codeEmailHtml(
    'Verify your email', code, 'Enter this code to verify your Visa With Ease account.'
  ));
}

export async function send2faCodeEmail(to: string, code: string): Promise<boolean> {
  return sendEmail(to, 'Your Visa With Ease sign-in code', codeEmailHtml(
    'Your sign-in code', code, 'Enter this code to complete two-factor sign-in.'
  ));
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
  return sendEmail(to, 'Reset your Visa With Ease password', `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#0B1F4B">Reset your password</h2>
      <p style="color:#334155">We received a request to reset your password. Click the button below to choose a new one.</p>
      <a href="${resetUrl}" style="display:inline-block;background:#1A56DB;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0">Reset password</a>
      <p style="color:#94A3B8;font-size:12px;margin-top:24px">This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>
    </div>
  `);
}
