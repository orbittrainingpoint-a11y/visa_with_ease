import type { AuditRequest, AuditResult, Finding } from '@visaiq/contracts';
import { analyzeDocumentWithGemini } from './geminiVision.js';
import { resolveIcaoCountryCode } from './countryCodes.js';

// Two real analysis paths, in priority order:
//  1. Gemini multimodal — the model actually looks at the captured image/PDF
//     when one was sent and an API key is configured. Real structured
//     extraction, not text pattern-matching.
//  2. The heuristic below — deterministic checks against the on-device OCR
//     text (Google ML Kit) the mobile app already extracted. This is the
//     fallback when no image was sent or Gemini is unavailable/misconfigured
//     — never a fake canned result regardless of which path runs.
export async function analyzeDocument(input: AuditRequest): Promise<AuditResult> {
  if (input.imageBase64 && input.mimeType) {
    const geminiResult = await analyzeDocumentWithGemini({
      documentId: input.documentId,
      documentType: input.documentType ?? 'Document',
      imageBase64: input.imageBase64,
      mimeType: input.mimeType
    });
    if (geminiResult) return geminiResult;
  }
  return analyzeDocumentHeuristic(input);
}

const DATE_RE = /\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})\b/g;
const PASSPORT_KEYWORDS = /PASSPORT|REPUBLIC|NATIONALITY|SURNAME|GIVEN NAME|DATE OF BIRTH|PLACE OF BIRTH|AUTHORITY/i;
const BANK_KEYWORDS = /BALANCE|STATEMENT|ACCOUNT|TRANSACTION|DEPOSIT|WITHDRAWAL|SORT CODE|IBAN|SWIFT/i;
const LETTER_KEYWORDS = /DEAR|SINCERELY|EMPLOYER|SALARY|EMPLOYMENT|TO WHOM IT MAY CONCERN/i;

function parseDate(day: string, month: string, year: string): Date | null {
  const y = year.length === 2 ? 2000 + Number(year) : Number(year);
  const d = Number(day), m = Number(month);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  return Number.isNaN(date.getTime()) ? null : date;
}

function findLatestDate(text: string): Date | null {
  let latest: Date | null = null;
  for (const match of text.matchAll(DATE_RE)) {
    const d = parseDate(match[1], match[2], match[3]);
    if (d && (!latest || d > latest)) latest = d;
  }
  return latest;
}

// Real authenticity signal, not a heuristic guess: ICAO Doc 9303 defines a
// mod-10 check digit for several fields in a passport's machine-readable
// zone. Recomputing them from the OCR'd text and comparing against what's
// printed is a deterministic, well-documented forgery/tamper/typo detector —
// the same math passport readers and border-control systems use.
function mrzCharValue(c: string): number {
  if (c === '<') return 0;
  if (c >= '0' && c <= '9') return c.charCodeAt(0) - 48;
  if (c >= 'A' && c <= 'Z') return c.charCodeAt(0) - 55; // A=10 .. Z=35
  return 0;
}

function mrzCheckDigit(field: string): number {
  const weights = [7, 3, 1];
  let sum = 0;
  for (let i = 0; i < field.length; i++) sum += mrzCharValue(field[i]) * weights[i % 3];
  return sum % 10;
}

interface MrzVerification {
  allValid: boolean;
  failedFields: string[];
  nationalityCode: string;
}

// TD3 (passport) line 2 is exactly 44 chars:
// passportNumber(9) check(1) nationality(3) dob(6) check(1) sex(1) expiry(6) check(1) personalNumber(14) check(1) finalCheck(1)
function verifyPassportMrz(text: string): MrzVerification | null {
  const lines = text.split(/\r?\n/).map(l => l.toUpperCase().replace(/[^A-Z0-9<]/g, ''));
  for (const raw of lines) {
    if (raw.length < 43 || raw.length > 45) continue;
    const line = raw.length === 44 ? raw : raw.length > 44 ? raw.slice(0, 44) : raw.padEnd(44, '<');
    const passportNumber = line.slice(0, 9);
    const passportCheck = line[9];
    const nationalityCode = line.slice(10, 13);
    const dob = line.slice(13, 19);
    const dobCheck = line[19];
    const expiry = line.slice(21, 27);
    const expiryCheck = line[27];
    const personalNumber = line.slice(28, 42);
    const personalCheck = line[42];
    const finalCheck = line[43];
    // Only treat this as an MRZ data line if the date fields are plausible —
    // otherwise this is likely line 1 (names) or unrelated OCR noise, and
    // reporting a "checksum failure" against it would be a false alarm.
    if (!/^[0-9]{6}$/.test(dob) || !/^[0-9]{6}$/.test(expiry)) continue;

    const failedFields: string[] = [];
    if (String(mrzCheckDigit(passportNumber)) !== passportCheck) failedFields.push('passport number');
    if (String(mrzCheckDigit(dob)) !== dobCheck) failedFields.push('date of birth');
    if (String(mrzCheckDigit(expiry)) !== expiryCheck) failedFields.push('expiry date');
    if (personalCheck !== '<' && /^[0-9<]{14}$/.test(personalNumber) && String(mrzCheckDigit(personalNumber)) !== personalCheck) {
      failedFields.push('personal number');
    }
    const composite = passportNumber + passportCheck + dob + dobCheck + expiry + expiryCheck + personalNumber + personalCheck;
    if (String(mrzCheckDigit(composite)) !== finalCheck) failedFields.push('composite check digit');

    return { allValid: failedFields.length === 0, failedFields, nationalityCode };
  }
  return null; // no line shaped like real MRZ data — say nothing, rather than guess
}

function analyzeDocumentHeuristic(input: AuditRequest): AuditResult {
  const text = (input.extractedText ?? '').trim();
  const docType = input.documentType ?? 'Document';
  const findings: Finding[] = [];
  let score = 0;

  if (text.length < 15) {
    findings.push({
      id: 'ocr-unavailable',
      severity: 'red_flag',
      title: 'Automated text extraction unavailable',
      description: 'On-device OCR could not read enough text from this file to run an automated check (common for PDFs or very low-quality scans). A consultant should review it manually before you rely on it.',
      confidence: 95
    });
    return {
      documentId: input.documentId,
      documentType: docType,
      score: 20,
      status: 'issues_to_fix',
      findings,
      generatedAt: new Date().toISOString()
    };
  }

  // Text density — a real, longer capture reads as more complete than a
  // clipped or partially-obscured one.
  if (text.length >= 200) {
    findings.push({ id: 'text-density', severity: 'pass', title: 'Document text is dense and readable', description: `Extracted ${text.length} characters of text — the scan captured a substantial amount of content.`, confidence: 88 });
    score += 30;
  } else if (text.length >= 60) {
    findings.push({ id: 'text-density', severity: 'info', title: 'Document text is partially readable', description: `Extracted ${text.length} characters — this may be a partial capture. Consider retaking with the full document in frame.`, confidence: 70 });
    score += 18;
  } else {
    findings.push({ id: 'text-density', severity: 'warn', title: 'Limited text detected', description: `Only ${text.length} characters were extracted. Retake in better lighting with the whole document visible.`, confidence: 60 });
    score += 8;
  }

  // Document-type-specific keyword and structure checks.
  const type = docType.toLowerCase();
  if (type.includes('passport')) {
    // Real authenticity check, not a loose shape-match: this recomputes the
    // MRZ's own ICAO check digits from the OCR'd text and requires the date
    // fields to be plausible 6-digit numbers in the right position — now
    // the ONLY signal that gates "MRZ detected" below, after a real bug
    // found in production: the previous loose regex (any 20-44-character
    // run of A-Z0-9<) matched incidental OCR noise in a photo that wasn't
    // a document at all (confirmed: a photo of a laptop wallpaper scored
    // 55/100 with "MRZ detected, 75% confidence"). Tying the "detected"
    // claim to this same strict parser eliminates that false-positive path
    // instead of just tightening the regex further.
    const mrzCheck = verifyPassportMrz(text);
    if (mrzCheck) {
      findings.push({ id: 'mrz-detected', severity: 'pass', title: 'Machine-readable zone detected', description: 'A passport-style machine-readable line pattern was found in the scan, consistent with a passport photo page.', confidence: 75 });
      score += 25;
      if (mrzCheck.allValid) {
        findings.push({ id: 'mrz-checksum-valid', severity: 'pass', title: 'MRZ check digits verified', description: 'The machine-readable zone\'s built-in check digits (passport number, date of birth, expiry date, and the composite check) all match — this is the same validation passport readers perform and is strong evidence the data was not altered after issuance.', confidence: 97 });
        score += 20;
      } else {
        findings.push({ id: 'mrz-checksum-mismatch', severity: 'red_flag', title: 'MRZ check digit mismatch', description: `The machine-readable zone's built-in check digit${mrzCheck.failedFields.length !== 1 ? 's' : ''} for ${mrzCheck.failedFields.join(', ')} did not match the printed value. This can happen from an OCR misread on a low-quality scan, but it is also the standard way passport readers detect an altered document — a consultant should review the physical passport before relying on this scan.`, confidence: 90 });
        score -= 25;
      }
      // Cross-check the MRZ's declared nationality against the real
      // ICAO/ISO 3166-1 country-code table — informational only (never
      // affects score), since a code we can't resolve isn't necessarily
      // wrong (some travel-document categories use non-ISO codes).
      const countryName = resolveIcaoCountryCode(mrzCheck.nationalityCode);
      if (countryName) {
        findings.push({ id: 'mrz-nationality', severity: 'info', title: `Issuing/nationality code: ${countryName}`, description: `The machine-readable zone declares nationality code "${mrzCheck.nationalityCode}", which matches ${countryName} in the ICAO/ISO 3166-1 reference list.`, confidence: 90 });
      } else {
        findings.push({ id: 'mrz-nationality-unresolved', severity: 'info', title: 'Nationality code not in reference list', description: `The machine-readable zone's nationality code "${mrzCheck.nationalityCode}" was not found in our ICAO/ISO 3166-1 reference list. This may still be valid — some travel-document categories (stateless, refugee, international organization) use codes outside the standard country list — but it's worth a manual check if the code looks like a typo or OCR misread.`, confidence: 40 });
      }
    } else if (PASSPORT_KEYWORDS.test(text)) {
      findings.push({ id: 'passport-keywords', severity: 'info', title: 'Passport-related fields found', description: 'Recognizable passport field labels were found, though the machine-readable zone line was not clearly captured.', confidence: 65 });
      score += 15;
    } else {
      findings.push({ id: 'passport-mismatch', severity: 'warn', title: "Doesn't look like a passport page", description: 'None of the expected passport page markers (MRZ line, "Nationality", "Date of Birth", etc.) were found in the extracted text. Confirm you scanned the photo page.', confidence: 55 });
    }
  } else if (type.includes('bank') || type.includes('financial')) {
    if (BANK_KEYWORDS.test(text)) {
      findings.push({ id: 'bank-keywords', severity: 'pass', title: 'Bank statement fields found', description: 'Recognizable statement terminology (balance, account, transactions) was found in the scan.', confidence: 70 });
      score += 25;
    } else {
      findings.push({ id: 'bank-mismatch', severity: 'warn', title: "Doesn't look like a bank statement", description: 'Expected bank-statement terminology was not found. Confirm this is the right document.', confidence: 50 });
    }
  } else if (type.includes('letter') || type.includes('employ')) {
    if (LETTER_KEYWORDS.test(text)) {
      findings.push({ id: 'letter-keywords', severity: 'pass', title: 'Employment/reference letter fields found', description: 'Language typical of an employment or reference letter was found in the scan.', confidence: 65 });
      score += 20;
    } else {
      findings.push({ id: 'letter-mismatch', severity: 'info', title: 'Letter content not clearly identified', description: 'Typical letter phrasing was not detected — this is a soft check and may be a false negative for unusual formats.', confidence: 40 });
      score += 10;
    }
  } else {
    score += 15;
  }

  // Date sanity check — flag the most recent date found in case it reads as
  // already expired. This is a best-effort text scan, not field-level
  // extraction, and is disclosed as such.
  const latestDate = findLatestDate(text);
  if (latestDate) {
    const now = new Date();
    if (latestDate.getTime() < now.getTime()) {
      findings.push({
        id: 'date-in-past',
        severity: 'warn',
        title: 'A date in this document has already passed',
        description: `The most recent date found in the scan (${latestDate.toISOString().slice(0, 10)}) is in the past. If this is an expiry date, confirm the document is still valid.`,
        confidence: 45
      });
    } else {
      findings.push({ id: 'date-future', severity: 'pass', title: 'Dates in the document are current', description: `The most recent date found (${latestDate.toISOString().slice(0, 10)}) has not passed.`, confidence: 45 });
      score += 10;
    }
  }

  score = Math.max(0, Math.min(100, score));
  const status: AuditResult['status'] = score >= 80 ? 'excellent' : score >= 55 ? 'attention_needed' : 'issues_to_fix';

  return {
    documentId: input.documentId,
    documentType: docType,
    score,
    status,
    findings,
    generatedAt: new Date().toISOString()
  };
}
