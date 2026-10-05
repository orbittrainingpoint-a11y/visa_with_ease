// Legal-compliance helpers: age gate (COPPA), upload rules (safe harbour / content restrictions), and the footer
// every outgoing email carries (CAN-SPAM: a working unsubscribe link and a physical postal address).
//
// Pure functions where possible, so the rules are unit-tested without a server.

import { createHmac, timingSafeEqual } from 'node:crypto';

// ── Age gate ─────────────────────────────────────────────────────────────────

/** Accounts for children under this age are never created (COPPA). Override with MIN_SIGNUP_AGE. */
export function minSignupAge(): number {
  const n = Number(process.env.MIN_SIGNUP_AGE ?? 13);
  return Number.isFinite(n) && n >= 13 ? n : 13;
}

/** Full years between a YYYY-MM-DD date of birth and `now`, or null when the date isn't a real past date. */
export function ageOn(dateOfBirth: unknown, now: Date = new Date()): number | null {
  if (typeof dateOfBirth !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return null;
  const [y, m, d] = dateOfBirth.split('-').map(Number);
  const dob = new Date(Date.UTC(y, m - 1, d));
  // Reject dates that rolled over (e.g. 2001-02-30) or are in the future, or implausibly old.
  if (dob.getUTCFullYear() !== y || dob.getUTCMonth() !== m - 1 || dob.getUTCDate() !== d) return null;
  if (dob.getTime() > now.getTime()) return null;
  let age = now.getUTCFullYear() - y;
  const birthdayPassed = now.getUTCMonth() > m - 1 || (now.getUTCMonth() === m - 1 && now.getUTCDate() >= d);
  if (!birthdayPassed) age -= 1;
  return age > 120 ? null : age;
}

/** What we keep about age: a band, never the date of birth itself (data minimisation). */
export type AgeBand = 'under_18' | '18_plus';
export function ageBandOf(age: number): AgeBand {
  return age >= 18 ? '18_plus' : 'under_18';
}

// ── Uploads ──────────────────────────────────────────────────────────────────

export const ALLOWED_UPLOAD_MIME = ['image/jpeg', 'image/png', 'image/heic', 'application/pdf'] as const;
/** 10 MB of real file content. Base64 is ~4/3 of that, so the encoded limit is checked against this. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function uploadProblem(mimeType: unknown, imageBase64: unknown): { status: number; code: string; message: string } | null {
  if (typeof mimeType !== 'string' || !(ALLOWED_UPLOAD_MIME as readonly string[]).includes(mimeType.toLowerCase())) {
    return { status: 415, code: 'UNSUPPORTED_FILE_TYPE', message: 'Upload a PDF, JPG, PNG or HEIC file.' };
  }
  if (typeof imageBase64 === 'string' && Math.floor((imageBase64.length * 3) / 4) > MAX_UPLOAD_BYTES) {
    return { status: 413, code: 'FILE_TOO_LARGE', message: 'That file is larger than 10 MB. Try a smaller or lower-resolution copy.' };
  }
  return null;
}

// ── Email footer, unsubscribe and postal address ─────────────────────────────

/** HMAC of the address, keyed with the server secret. Stops anyone from opting other people out. */
export function unsubscribeToken(email: string): string {
  const secret = process.env.JWT_SECRET ?? '';
  return createHmac('sha256', secret).update(email.trim().toLowerCase()).digest('base64url');
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = Buffer.from(unsubscribeToken(email));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function unsubscribeUrl(email: string): string {
  const base = process.env.PUBLIC_API_URL ?? process.env.FRONTEND_URL ?? 'http://localhost:3001';
  return `${base.replace(/\/$/, '')}/email/unsubscribe?e=${encodeURIComponent(email.trim().toLowerCase())}&t=${unsubscribeToken(email)}`;
}

/** The business postal address. Set COMPANY_POSTAL_ADDRESS in production — CAN-SPAM requires it on every email. */
export function postalAddress(): string | null {
  const v = process.env.COMPANY_POSTAL_ADDRESS?.trim();
  return v ? v : null;
}

/** Appends the required footer. Replaces any {{unsubscribe_link}} placeholder with this recipient's real link. */
export function withEmailFooter(to: string, html: string): string {
  const link = unsubscribeUrl(to);
  const address = postalAddress();
  const body = html.replace(/\{\{\s*unsubscribe_link\s*\}\}/g, link);
  const footer = `
    <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0 12px" />
    <div style="font-family:sans-serif;font-size:12px;color:#64748B;max-width:480px;margin:0 auto;padding:0 24px 24px;line-height:1.6">
      <p style="margin:0 0 6px">Visa With Ease${address ? ` · ${escapeHtml(address)}` : ''}</p>
      ${address ? '' : '<p style="margin:0 0 6px;color:#B45309">Postal address not configured.</p>'}
      <p style="margin:0">You received this email because you have a Visa With Ease account. <a href="${link}" style="color:#1A56DB">Unsubscribe from non-essential emails</a>.</p>
    </div>`;
  return body + footer;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}
