// On-device "what am I looking at?" for the camera scanner. Pure functions on
// top of ML Kit's OCR/face output (no native imports here) so the same logic
// drives both the live auto-capture loop and the post-capture verdict, and
// can be exercised without a device.
//
// This is deliberately NOT a plain "text was found" check: a laptop wallpaper
// or a blank wall produces OCR noise too, and the old green tick on any text
// told people a non-document was fine. Here the frame has to actually look
// like the document type the user said they're uploading (MRZ lines / field
// labels for a passport, statement vocabulary for a bank statement, a face
// for a photo) — otherwise the verdict is an explicit "this isn't a ...".

export type DocKind = 'passport' | 'bank' | 'employment' | 'insurance' | 'itinerary' | 'photo' | 'other';
export type Recognised = DocKind | 'unknown';

export const DOC_KIND_LABEL: Record<DocKind, string> = {
  passport: 'passport bio page',
  bank: 'bank statement',
  employment: 'employment / student letter',
  insurance: 'travel insurance document',
  itinerary: 'flight / hotel reservation',
  photo: 'biometric photo',
  other: 'document',
};

export interface OcrLike {
  text: string;
  blocks?: Array<{ text: string; frame?: { left: number; top: number; width: number; height: number } }>;
}

export interface FaceLike {
  frame: { left: number; top: number; width: number; height: number };
}

export interface Recognition {
  kind: Recognised;
  /** How many distinct signals backed the chosen kind (MRZ counts as several). */
  score: number;
  mrzLines: number;
  hasFace: boolean;
  textLength: number;
  /** Fraction of the image covered by the recognised text's bounding box, 0-1. */
  coverage: number;
  signals: string[];
}

// Distinct phrases per document type. Each hit counts once regardless of how
// often it appears, so a long page repeating "balance" doesn't drown out the
// rest. Matching is against upper-cased, whitespace-collapsed text.
const KEYWORDS: Record<Exclude<DocKind, 'photo' | 'other'>, string[]> = {
  passport: [
    'PASSPORT', 'PASSEPORT', 'PASAPORTE', 'REISEPASS', 'PASSAPORTO', 'NATIONALITY', 'NATIONALITE', 'SURNAME',
    'GIVEN NAME', 'DATE OF BIRTH', 'PLACE OF BIRTH', 'DATE OF EXPIRY', 'DATE OF ISSUE', 'AUTHORITY', 'HOLDER',
    'DOCUMENT NO', 'PASSPORT NO', 'CODE OF ISSUING', 'REPUBLIC',
  ],
  bank: [
    'STATEMENT', 'ACCOUNT', 'BALANCE', 'DEBIT', 'CREDIT', 'WITHDRAWAL', 'DEPOSIT', 'TRANSACTION', 'IFSC', 'SWIFT',
    'IBAN', 'BRANCH', 'OPENING BALANCE', 'CLOSING BALANCE', 'NARRATION', 'CHEQUE', 'BANK',
  ],
  employment: [
    'EMPLOYMENT', 'EMPLOYEE', 'EMPLOYER', 'SALARY', 'DESIGNATION', 'DEPARTMENT', 'CERTIFY', 'TO WHOM IT MAY CONCERN',
    'HUMAN RESOURCE', 'JOINED', 'POSITION', 'ENROLLED', 'STUDENT', 'UNIVERSITY', 'COLLEGE', 'BONAFIDE',
  ],
  insurance: [
    'INSURANCE', 'POLICY', 'INSURED', 'COVERAGE', 'COVERED', 'PREMIUM', 'MEDICAL EXPENSES', 'REPATRIATION',
    'CERTIFICATE OF INSURANCE', 'SUM INSURED', 'BENEFICIARY', 'ASSISTANCE',
  ],
  itinerary: [
    'FLIGHT', 'PNR', 'BOOKING', 'RESERVATION', 'ITINERARY', 'DEPART', 'ARRIVE', 'BOARDING', 'CHECK-IN', 'CHECK IN',
    'CHECK-OUT', 'HOTEL', 'ROOM', 'GUEST', 'CONFIRMATION', 'AIRLINE', 'E-TICKET', 'TERMINAL',
  ],
};

// A kind needs at least this many distinct hits before it's believed.
const MIN_SCORE: Record<Exclude<DocKind, 'photo' | 'other'>, number> = {
  passport: 3, bank: 3, employment: 3, insurance: 3, itinerary: 3,
};

/**
 * Counts machine-readable-zone lines. ML Kit reads "<" inconsistently (as
 * "K", "C", "«" or "(") so this looks for the *shape* — a long unbroken run of
 * A-Z/0-9/filler characters with no spaces — rather than exact filler chars.
 */
export function countMrzLines(text: string): number {
  let count = 0;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.toUpperCase().replace(/\s+/g, '');
    if (line.length < 28 || line.length > 46) continue;
    const clean = line.replace(/[«»(\[{]/g, '<');
    if (!/^[A-Z0-9<]+$/.test(clean)) continue;
    const fillers = (clean.match(/</g) ?? []).length;
    const digits = (clean.match(/[0-9]/g) ?? []).length;
    // Line 1 of a passport MRZ is name-heavy with lots of "<" fillers; line 2
    // is digit-heavy with check digits. Either shape counts; a long plain
    // word or URL fails both.
    if (fillers >= 3 || (digits >= 6 && /[A-Z]/.test(clean))) count += 1;
  }
  return count;
}

function normalise(text: string): string {
  return text.toUpperCase().replace(/\s+/g, ' ');
}

function coverageOf(ocr: OcrLike, image?: { width: number; height: number }): number {
  if (!image || !image.width || !image.height) return 0;
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  for (const block of ocr.blocks ?? []) {
    const f = block.frame;
    if (!f || (block.text ?? '').trim().length < 3) continue;
    left = Math.min(left, f.left); top = Math.min(top, f.top);
    right = Math.max(right, f.left + f.width); bottom = Math.max(bottom, f.top + f.height);
  }
  if (!isFinite(left)) return 0;
  const area = (right - left) * (bottom - top);
  return Math.max(0, Math.min(1, area / (image.width * image.height)));
}

export function recognise(ocr: OcrLike | null, faces: FaceLike[] = [], image?: { width: number; height: number }): Recognition {
  const text = (ocr?.text ?? '').trim();
  const upper = normalise(text);
  const mrzLines = countMrzLines(text);
  const hasFace = faces.length > 0;
  const signals: string[] = [];

  const scores: Partial<Record<DocKind, number>> = {};
  (Object.keys(KEYWORDS) as Array<keyof typeof KEYWORDS>).forEach((kind) => {
    const hits = KEYWORDS[kind].filter((k) => upper.includes(k));
    scores[kind] = hits.length;
  });
  // The MRZ is the single strongest passport signal — two lines of it is
  // effectively conclusive, one is strong.
  if (mrzLines >= 2) { scores.passport = (scores.passport ?? 0) + 6; signals.push('machine-readable zone (2 lines)'); }
  else if (mrzLines === 1) { scores.passport = (scores.passport ?? 0) + 3; signals.push('machine-readable zone (partial)'); }
  if (hasFace) signals.push('face photo');

  let kind: Recognised = 'unknown';
  let best = 0;
  (Object.keys(KEYWORDS) as Array<keyof typeof KEYWORDS>).forEach((k) => {
    const s = scores[k] ?? 0;
    if (s >= MIN_SCORE[k] && s > best) { best = s; kind = k; }
  });
  if (kind === 'unknown' && hasFace && text.length < 120) { kind = 'photo'; best = 2; }
  if (kind !== 'unknown' && kind !== 'photo') {
    const hits = KEYWORDS[kind as keyof typeof KEYWORDS].filter((k) => upper.includes(k)).slice(0, 4);
    if (hits.length) signals.push(`matched "${hits.map((h) => h.toLowerCase()).join('", "')}"`);
  }

  return { kind, score: best, mrzLines, hasFace, textLength: text.length, coverage: coverageOf(ocr ?? { text: '' }, image), signals };
}

export type VerdictStatus = 'match' | 'mismatch' | 'unclear';

export interface Verdict {
  status: VerdictStatus;
  title: string;
  detail: string;
}

/** The post-capture answer to "is this what you said it is?" */
export function judge(claimed: DocKind, rec: Recognition): Verdict {
  const want = DOC_KIND_LABEL[claimed];
  const found = rec.kind === 'unknown' ? null : DOC_KIND_LABEL[rec.kind];

  if (claimed === 'other') {
    if (rec.textLength >= 40 || rec.hasFace) return { status: 'match', title: 'Document text found', detail: 'Readable text was found. The full AI check runs after upload.' };
    return { status: 'unclear', title: 'Nothing readable in this photo', detail: 'Retake with the document flat, well lit and filling the frame.' };
  }

  if (rec.kind === claimed) {
    const extra = rec.signals.length ? ` (${rec.signals.join(', ')})` : '';
    if (claimed === 'passport' && rec.mrzLines < 2) {
      return { status: 'unclear', title: 'Looks like a passport — bottom lines cut off', detail: 'Include the two lines of < characters at the bottom of the page, then retake.' };
    }
    return { status: 'match', title: `Recognised: ${want}`, detail: `This looks like the ${want}${extra}.` };
  }

  if (found) {
    return { status: 'mismatch', title: `This looks like a ${found}, not a ${want}`, detail: `Retake with the ${want}, or go back and pick "${DOC_KIND_LABEL[rec.kind as DocKind]}" as the document type.` };
  }

  if (rec.textLength < 15 && !rec.hasFace) {
    return { status: 'unclear', title: 'No document detected', detail: 'Nothing readable was found — the photo may be blurry, dark, or not of a document. Retake in good light.' };
  }
  if (claimed === 'photo') {
    return { status: 'mismatch', title: 'No face found', detail: 'A biometric photo needs your face clearly visible, front-on, on a plain background.' };
  }
  return {
    status: 'mismatch',
    title: `This doesn't look like a ${want}`,
    detail: claimed === 'passport'
      ? 'No passport fields or machine-readable lines were found. Photograph the printed bio page (photo + the two lines at the bottom), not a screen or other surface.'
      : `None of the usual ${want} wording was found. Make sure it's the right page and fully in frame.`,
  };
}

// ── Live auto-capture ───────────────────────────────────────────────────────

export interface Probe {
  /** This single frame already looks like a capturable document. */
  ready: boolean;
  hint: string;
  /** Tokens used to check that consecutive frames show the same thing. */
  tokens: Set<string>;
}

export function tokensOf(text: string): Set<string> {
  return new Set(text.toUpperCase().split(/[^A-Z0-9<]+/).filter((t) => t.length >= 3));
}

export function similarity(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  a.forEach((t) => { if (b.has(t)) shared += 1; });
  return shared / (a.size + b.size - shared);
}

/**
 * Judges one low-cost preview frame. `ready` is only true when the frame is
 * decisively the right kind of document AND fills enough of the picture —
 * the caller additionally requires consecutive frames to be stable before
 * firing the real capture, so a passing glance at the right thing doesn't
 * trigger a blurry shot.
 */
export function probeFrame(claimed: DocKind, ocr: OcrLike | null, faces: FaceLike[], image: { width: number; height: number }): Probe {
  const rec = recognise(ocr, faces, image);
  const tokens = tokensOf(ocr?.text ?? '');

  if (claimed === 'photo') {
    const face = faces[0]?.frame;
    if (!face) return { ready: false, hint: 'Face the camera — no face found yet', tokens };
    const widthShare = face.width / image.width;
    const cx = (face.left + face.width / 2) / image.width;
    if (widthShare < 0.22) return { ready: false, hint: 'Move closer', tokens };
    if (widthShare > 0.7) return { ready: false, hint: 'Move back a little', tokens };
    if (Math.abs(cx - 0.5) > 0.18) return { ready: false, hint: 'Centre your face in the frame', tokens };
    return { ready: true, hint: 'Hold still…', tokens };
  }

  if (rec.textLength < 15) return { ready: false, hint: 'Point the camera at the document — needs more light or a closer view', tokens };

  if (rec.kind !== 'unknown' && rec.kind !== 'photo' && claimed !== 'other' && rec.kind !== claimed) {
    return { ready: false, hint: `This looks like a ${DOC_KIND_LABEL[rec.kind]} — not a ${DOC_KIND_LABEL[claimed]}`, tokens };
  }

  const kindOk = claimed === 'other' ? rec.textLength >= 80 : rec.kind === claimed;
  if (!kindOk) {
    return { ready: false, hint: claimed === 'passport' ? 'Show the photo page: the photo and the two lines at the bottom' : `Show the ${DOC_KIND_LABEL[claimed]} clearly`, tokens };
  }
  if (claimed === 'passport' && rec.mrzLines < 2) return { ready: false, hint: 'Include the two lines of < at the bottom of the page', tokens };
  if (rec.coverage < 0.25) return { ready: false, hint: 'Move closer — fill the frame', tokens };
  return { ready: true, hint: 'Hold steady…', tokens };
}

// ── MRZ parsing (ICAO 9303 TD3 — passports) ─────────────────────────────────
// Reads the two 44-character lines into real fields and verifies every check
// digit, so a misread character is caught instead of trusted.

export interface MrzFields {
  documentType: string;
  issuingState: string;
  surname: string;
  givenNames: string;
  documentNumber: string;
  nationality: string;
  birthDate: string | null;   // ISO yyyy-mm-dd
  sex: string;
  expiryDate: string | null;  // ISO yyyy-mm-dd
}

export interface MrzResult {
  fields: MrzFields;
  /** true = check digit matched, false = mismatch (a character was misread), null = that part of the line was not readable. */
  checks: { documentNumber: boolean; birthDate: boolean; expiryDate: boolean; personalNumber: boolean | null; composite: boolean | null };
  /** The three check digits that guard the essential data all matched and nothing readable contradicted them. */
  valid: boolean;
}

const MRZ_WEIGHTS = [7, 3, 1];
function mrzValue(ch: string): number {
  if (ch === '<') return 0;
  if (ch >= '0' && ch <= '9') return ch.charCodeAt(0) - 48;
  if (ch >= 'A' && ch <= 'Z') return ch.charCodeAt(0) - 55;
  return 0;
}
function checkDigit(s: string): number {
  let sum = 0;
  for (let i = 0; i < s.length; i++) sum += mrzValue(s[i]) * MRZ_WEIGHTS[i % 3];
  return sum % 10;
}
// OCR confuses look-alike characters; inside numeric fields only digits are legal.
function toDigits(s: string): string {
  return s.replace(/[OQ]/g, '0').replace(/[IL]/g, '1').replace(/S/g, '5').replace(/Z/g, '2').replace(/B/g, '8').replace(/G/g, '6');
}
function isoFromYyMmDd(v: string, kind: 'birth' | 'expiry', now = new Date()): string | null {
  if (!/^\d{6}$/.test(v)) return null;
  const yy = Number(v.slice(0, 2)), mm = Number(v.slice(2, 4)), dd = Number(v.slice(4, 6));
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const currentYy = now.getFullYear() % 100;
  // A birth year that would be in the future is really last century; expiry years are always 20xx.
  const year = kind === 'expiry' ? 2000 + yy : (yy > currentYy ? 1900 + yy : 2000 + yy);
  return `${year}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

function cleanMrzLine(raw: string): string {
  return raw.toUpperCase().replace(/\s+/g, '').replace(/[«»(\[{]/g, '<').replace(/[^A-Z0-9<]/g, '');
}

// What device OCR really returns for an MRZ: long runs of "<" fillers are collapsed or
// dropped, and some are misread as "K" or "«". So the lines are matched by their
// leading fields (which OCR reads reliably) and padded back to full width, and any part
// that could not be read is reported as "not checked" instead of as a failure.
const MRZ_LINE2 = /^[A-Z0-9<]{9}[0-9OIBSZ<][A-Z<]{3}[0-9OIBSZ]{6}[0-9OIBSZ][MFX<][0-9OIBSZ]{6}[0-9OIBSZ]/;

/** Finds the two MRZ lines in OCR text and parses them; null when no passport MRZ is present. */
export function parsePassportMrz(text: string): MrzResult | null {
  const lines = text.split(/[\r\n]+/).map(cleanMrzLine).filter((l) => l.length >= 20);
  for (let i = 1; i < lines.length; i++) {
    const raw2 = lines[i];
    const raw1 = lines[i - 1];
    if (!MRZ_LINE2.test(raw2) || raw1[0] !== 'P') continue;
    const l2 = raw2.padEnd(44, '<').slice(0, 44);
    const num = l2.slice(0, 9);
    const nat = l2.slice(10, 13);
    const dob = toDigits(l2.slice(13, 19)), dobCd = toDigits(l2[19]);
    const sex = l2[20];
    const exp = toDigits(l2.slice(21, 27)), expCd = toDigits(l2[27]);
    const tailReadable = raw2.length >= 43;
    const pers = l2.slice(28, 42), persCd = l2[42] === '<' ? '0' : toDigits(l2[42]);
    const compCd = toDigits(l2[43]);
    const checks = {
      documentNumber: String(checkDigit(num)) === toDigits(l2[9]),
      birthDate: String(checkDigit(dob)) === dobCd,
      expiryDate: String(checkDigit(exp)) === expCd,
      // An all-filler personal number is legal and its check digit may be "<" or 0.
      personalNumber: !tailReadable ? null : /^<*$/.test(pers) ? (l2[42] === '<' || persCd === '0') : String(checkDigit(pers)) === persCd,
      composite: !tailReadable ? null : String(checkDigit(l2.slice(0, 10) + l2.slice(13, 20) + l2.slice(21, 43))) === compCd
    };
    // A given name's last letter followed by a run of fillers is often read as "…AK<<<":
    // drop that stray K when it follows a vowel (a real K-ending like "MARK" is untouched).
    const namePart = raw1.slice(5).replace(/([AEIOUY])K(<*)$/, (m, vowel: string, fill: string) => (fill.length >= 3 || fill.length === 0 ? vowel + fill : m));
    const [surnameRaw, givenRaw = ''] = namePart.split('<<');
    return {
      fields: {
        documentType: 'P',
        issuingState: raw1.slice(2, 5).replace(/</g, ''),
        surname: surnameRaw.replace(/</g, ' ').trim(),
        givenNames: givenRaw.replace(/</g, ' ').trim(),
        documentNumber: num.replace(/</g, ''),
        nationality: nat.replace(/</g, ''),
        birthDate: isoFromYyMmDd(dob, 'birth'),
        sex: sex === 'M' || sex === 'F' ? sex : 'X',
        expiryDate: isoFromYyMmDd(exp, 'expiry')
      },
      checks,
      valid: checks.documentNumber && checks.birthDate && checks.expiryDate && checks.personalNumber !== false && checks.composite !== false
    };
  }
  return null;
}

/** Whole months from `now` until the ISO date (negative once expired). */
export function monthsUntil(iso: string, now = new Date()): number {
  const d = new Date(iso + 'T00:00:00Z');
  return (d.getUTCFullYear() - now.getUTCFullYear()) * 12 + (d.getUTCMonth() - now.getUTCMonth()) - (d.getUTCDate() < now.getUTCDate() ? 1 : 0);
}

// ── Per-document guides (shown before scanning and before uploading) ────────

export interface DocGuide {
  title: string;
  intro: string;
  steps: string[];
  avoid: string[];
  frame: 'landscape' | 'portrait' | 'face';
}

export const DOC_GUIDES: Record<DocKind, DocGuide> = {
  passport: {
    title: 'Passport photo page',
    intro: 'Photograph the page with your photo and the two lines of < characters at the bottom.',
    steps: [
      'Open the passport flat to the photo page.',
      'Fit the whole page inside the frame — all four corners visible.',
      'Keep both < lines at the bottom inside the frame.',
      'Hold steady in good light — the scan captures by itself when everything is right.'
    ],
    avoid: ['Glare or flash reflections on the laminate', 'Fingers covering any text', 'A photo of a screen or a photocopy'],
    frame: 'landscape'
  },
  bank: {
    title: 'Bank statement',
    intro: 'Your latest statement covering the last 3 months.',
    steps: [
      'Show the bank name or letterhead, your name and the closing balance.',
      'Photograph one page at a time, flat, filling the frame.',
      'A PDF downloaded from your bank app is best — use “Browse files”.'
    ],
    avoid: ['Cropped edges or folded pages', 'Blurry or dark photos', 'Edited or re-typed statements'],
    frame: 'portrait'
  },
  employment: {
    title: 'Employment / student letter',
    intro: 'A signed letter from your employer or institution.',
    steps: [
      'Company letterhead with your name, role and joining date (and salary for an employment letter).',
      'Signature and date visible — ideally issued in the last 30 days.',
      'Include a contact for verification.'
    ],
    avoid: ['Unsigned or undated letters', 'Shadows across the text'],
    frame: 'portrait'
  },
  insurance: {
    title: 'Travel medical insurance',
    intro: 'The policy certificate for your whole trip.',
    steps: [
      'Your name and policy number visible.',
      'Cover dates must include your entire stay.',
      'Schengen visas need at least €30,000 medical cover — make sure the amount shows.'
    ],
    avoid: ['A payment receipt instead of the certificate', 'Cover dates that end before your return'],
    frame: 'portrait'
  },
  itinerary: {
    title: 'Flight & hotel reservation',
    intro: 'Bookings that show where you will be and when.',
    steps: [
      'Flight reservation with your name, route and dates.',
      'Hotel booking covering the whole stay, with the address.',
      'Booking reference visible on each.'
    ],
    avoid: ['Screenshots with the reference cut off', 'Dates that do not match your application'],
    frame: 'portrait'
  },
  photo: {
    title: 'Biometric photo',
    intro: 'A recent passport-style photo of your face.',
    steps: [
      'Face the camera straight on, centred in the oval.',
      'Plain light background with no shadows.',
      'Eyes open, neutral expression, nothing covering your face.'
    ],
    avoid: ['Glasses, hats or heavy filters', 'Group photos or side angles'],
    frame: 'face'
  },
  other: {
    title: 'Supporting document',
    intro: 'Any other document that supports your application.',
    steps: ['Fill the frame with the document.', 'Make sure all text is sharp and readable.', 'Include every page that matters, one at a time.'],
    avoid: ['Cropped edges', 'Glare or shadows'],
    frame: 'portrait'
  }
};

// ── Live requirement checklist ──────────────────────────────────────────────

export interface LiveCheck {
  id: string;
  label: string;
  ok: boolean;
  /** Not needed to auto-capture — shown as a bonus signal. */
  optional?: boolean;
  /** What to do when this check fails. */
  hint: string;
}

export function liveChecks(claimed: DocKind, rec: Recognition, faces: FaceLike[], image: { width: number; height: number }, mrz: MrzResult | null): LiveCheck[] {
  if (claimed === 'photo') {
    const f = faces[0]?.frame;
    const share = f ? f.width / image.width : 0;
    const cx = f ? (f.left + f.width / 2) / image.width : 0;
    return [
      { id: 'face', label: 'Face found', ok: !!f, hint: 'Face the camera — no face found yet' },
      { id: 'size', label: 'Right distance', ok: share >= 0.22 && share <= 0.7, hint: share > 0.7 ? 'Move back a little' : 'Move closer' },
      { id: 'centre', label: 'Centred', ok: !!f && Math.abs(cx - 0.5) <= 0.18, hint: 'Centre your face in the oval' }
    ];
  }
  const readable = rec.textLength >= (claimed === 'passport' ? 60 : 80);
  const isKind = claimed === 'other' ? readable : rec.kind === claimed;
  const checks: LiveCheck[] = [];
  if (claimed === 'passport') {
    checks.push(
      { id: 'page', label: 'Photo page in view', ok: isKind, hint: 'Show the photo page — the picture and the two lines at the bottom' },
      { id: 'mrz', label: 'Both < lines readable', ok: rec.mrzLines >= 2, hint: 'Bring the two lines of < at the bottom fully into the frame' },
      { id: 'fill', label: 'Fills the frame', ok: rec.coverage >= 0.25, hint: 'Move closer — fill the frame' },
      { id: 'face', label: 'Photo found', ok: faces.length > 0, optional: true, hint: 'Make sure your photo is visible' },
      { id: 'checksum', label: 'Data verified', ok: !!mrz?.valid, optional: true, hint: 'Hold steady so every character reads cleanly' }
    );
  } else {
    checks.push({ id: 'doc', label: claimed === 'other' ? 'Text readable' : 'Document recognised', ok: isKind, hint: claimed === 'other' ? 'Point at the document — more light or closer' : `Show the ${DOC_KIND_LABEL[claimed]} clearly` });
    if (claimed !== 'other') checks.push({ id: 'text', label: 'Text readable', ok: readable, hint: 'Text is too small or blurry — move closer, more light' });
    checks.push({ id: 'fill', label: 'Fills the frame', ok: rec.coverage >= 0.25, hint: 'Move closer — fill the frame' });
  }
  return checks;
}
