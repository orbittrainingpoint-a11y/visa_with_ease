// Passport machine-readable-zone (ICAO 9303 TD3) parsing, tolerant of real device OCR.
// Same logic as apps/mobile/src/documentRecognition.ts, so what a phone shows the user and what a
// consultant later sees (with consent) come from the same reading. Long runs of "<" fillers are often
// collapsed or misread on-device, so lines are matched by their leading fields and unreadable tails
// are reported as "not checked" rather than as a failure.

export interface PassportData {
  surname: string;
  givenNames: string;
  documentNumber: string;
  nationality: string;
  issuingState: string;
  birthDate: string | null;
  sex: string;
  expiryDate: string | null;
  /** true = every readable check digit matched. */
  checksumsValid: boolean;
}

const WEIGHTS = [7, 3, 1];
function value(ch: string): number {
  if (ch === '<') return 0;
  if (ch >= '0' && ch <= '9') return ch.charCodeAt(0) - 48;
  if (ch >= 'A' && ch <= 'Z') return ch.charCodeAt(0) - 55;
  return 0;
}
function checkDigit(s: string): number {
  let sum = 0;
  for (let i = 0; i < s.length; i++) sum += value(s[i]) * WEIGHTS[i % 3];
  return sum % 10;
}
function toDigits(s: string): string {
  return s.replace(/[OQ]/g, '0').replace(/[IL]/g, '1').replace(/S/g, '5').replace(/Z/g, '2').replace(/B/g, '8').replace(/G/g, '6');
}
function iso(v: string, kind: 'birth' | 'expiry', now = new Date()): string | null {
  if (!/^\d{6}$/.test(v)) return null;
  const yy = Number(v.slice(0, 2)), mm = Number(v.slice(2, 4)), dd = Number(v.slice(4, 6));
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const cur = now.getFullYear() % 100;
  const year = kind === 'expiry' ? 2000 + yy : (yy > cur ? 1900 + yy : 2000 + yy);
  return `${year}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}
function clean(raw: string): string {
  return raw.toUpperCase().replace(/\s+/g, '').replace(/[«»(\[{]/g, '<').replace(/[^A-Z0-9<]/g, '');
}
const LINE2 = /^[A-Z0-9<]{9}[0-9OIBSZ<][A-Z<]{3}[0-9OIBSZ]{6}[0-9OIBSZ][MFX<][0-9OIBSZ]{6}[0-9OIBSZ]/;

export function parsePassportData(text: string): PassportData | null {
  const lines = text.split(/[\r\n]+/).map(clean).filter((l) => l.length >= 20);
  for (let i = 1; i < lines.length; i++) {
    const raw2 = lines[i];
    const raw1 = lines[i - 1];
    if (!LINE2.test(raw2) || raw1[0] !== 'P') continue;
    const l2 = raw2.padEnd(44, '<').slice(0, 44);
    const num = l2.slice(0, 9);
    const dob = toDigits(l2.slice(13, 19));
    const exp = toDigits(l2.slice(21, 27));
    const tailReadable = raw2.length >= 43;
    const pers = l2.slice(28, 42);
    const persCd = l2[42] === '<' ? '0' : toDigits(l2[42]);
    const okNum = String(checkDigit(num)) === toDigits(l2[9]);
    const okDob = String(checkDigit(dob)) === toDigits(l2[19]);
    const okExp = String(checkDigit(exp)) === toDigits(l2[27]);
    const okPers = !tailReadable || (/^<*$/.test(pers) ? (l2[42] === '<' || persCd === '0') : String(checkDigit(pers)) === persCd);
    const okComp = !tailReadable || String(checkDigit(l2.slice(0, 10) + l2.slice(13, 20) + l2.slice(21, 43))) === toDigits(l2[43]);
    const namePart = raw1.slice(5).replace(/([AEIOUY])K(<*)$/, (m, vowel: string, fill: string) => (fill.length >= 3 || fill.length === 0 ? vowel + fill : m));
    const [surname, given = ''] = namePart.split('<<');
    const sex = l2[20];
    return {
      surname: surname.replace(/</g, ' ').trim(),
      givenNames: given.replace(/</g, ' ').trim(),
      documentNumber: num.replace(/</g, ''),
      nationality: l2.slice(10, 13).replace(/</g, ''),
      issuingState: raw1.slice(2, 5).replace(/</g, ''),
      birthDate: iso(dob, 'birth'),
      sex: sex === 'M' || sex === 'F' ? sex : 'X',
      expiryDate: iso(exp, 'expiry'),
      checksumsValid: okNum && okDob && okExp && okPers && okComp
    };
  }
  return null;
}
