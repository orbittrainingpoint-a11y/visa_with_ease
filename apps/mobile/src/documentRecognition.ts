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
    const clean = line.replace(/[«(\[{]/g, '<');
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

function tokensOf(text: string): Set<string> {
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
