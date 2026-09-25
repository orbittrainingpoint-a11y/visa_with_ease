// Curated knowledge base behind the chat: fixed, reviewed answers to the questions people ask most, plus the
// intents that are answered from the caller's own data ("what's the status of my Germany visa?", "I want to
// upload my documents"). Everything here is free and instant — the AI model is only called for what this
// cannot answer.

import type { ChatResponse, VisaApplication } from '@visaiq/contracts';

export interface FaqEntry {
  id: string;
  category: string;
  question: string;
  answer: string;
  /** Lower-case phrases; a message containing one of them points at this entry. */
  keywords: string[];
  /** Ids of entries worth asking next. */
  related: string[];
  actions?: string[];
  /** Offer a consultant alongside the answer (e.g. after a refusal). */
  escalate?: boolean;
}

export const FAQ_CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: 'start', label: 'Getting started', icon: 'rocket-outline' },
  { id: 'documents', label: 'Documents', icon: 'document-text-outline' },
  { id: 'money', label: 'Fees & money', icon: 'cash-outline' },
  { id: 'timing', label: 'Timing & status', icon: 'time-outline' },
  { id: 'experts', label: 'Consultants', icon: 'people-outline' },
  { id: 'privacy', label: 'Privacy & security', icon: 'lock-closed-outline' },
  { id: 'refusal', label: 'Refusals', icon: 'alert-circle-outline' },
];

export const FAQS: FaqEntry[] = [
  // ── Getting started
  { id: 'how-it-works', category: 'start', question: 'How does Visa With Ease work?',
    answer: 'Four steps: 1) Create an application with your destination and visa type. 2) Upload each required document — the AI checks it and lists anything to fix. 3) Watch your readiness score rise as gaps close. 4) Book a verified consultant for a final review before you submit at the embassy or visa centre.',
    keywords: ['how does this work', 'how it works', 'how does visa with ease', 'what is this app', 'what does this app do'], related: ['what-is-score', 'which-documents', 'need-consultant'] },
  { id: 'which-visa', category: 'start', question: 'Which visa type should I choose?',
    answer: 'Pick the type that matches the purpose of your trip: Tourist for holidays and family visits, Business for meetings and conferences, Student for study, Work for employment, Transit for a stop of under 24 hours. Choosing the wrong type is a common cause of refusal — if you are unsure, a 30-minute consultant session settles it.',
    keywords: ['which visa', 'what type of visa', 'visa type should', 'tourist or business', 'right visa'], related: ['need-consultant', 'which-documents'] },
  { id: 'what-is-score', category: 'start', question: 'What is the readiness score?',
    answer: 'Your readiness score (0–100) shows how complete and consistent your application is: it rises as required documents are uploaded and pass the AI checks, and drops when a document has problems. It is guidance, not a prediction — the embassy always makes the final decision.',
    keywords: ['readiness score', 'what is the score', 'what does the score', 'score mean', 'how is the score'], related: ['score-low', 'which-documents'] },
  { id: 'score-low', category: 'start', question: 'How do I raise my score?',
    answer: 'Open your application and fix the items marked “Needs attention” first — usually a missing document, an expired or short-validity passport, or a bank statement that does not show enough funds. Re-upload the corrected document and the score updates straight away.',
    keywords: ['raise my score', 'improve my score', 'increase my score', 'score is low', 'low score', 'better score'], related: ['what-is-score', 'which-documents', 'need-consultant'] },

  // ── Documents
  { id: 'which-documents', category: 'documents', question: 'Which documents do I need?',
    answer: 'Most visas need: a passport valid for 6+ months, a recent passport photo, bank statements (usually 3 months), an employment or student letter, travel medical insurance, and a flight and hotel reservation. The exact list depends on your destination — open Requirements for your country, or ask me to walk you through your own checklist.',
    keywords: ['which documents', 'what documents', 'documents do i need', 'documents required', 'required documents', 'document checklist', 'document list'], related: ['passport-validity', 'bank-statement', 'photo-spec'], actions: ['Upload my documents'] },
  { id: 'passport-validity', category: 'documents', question: 'How long must my passport be valid?',
    answer: 'Most countries want at least 6 months of validity beyond your return date, and at least 2 blank pages. Schengen countries require it to be valid 3 months beyond departure and issued within the last 10 years. If yours is close, renew it before applying.',
    keywords: ['passport valid', 'passport validity', 'passport expir', 'passport expire', 'blank pages', 'renew passport', 'passport renew'], related: ['photo-spec', 'which-documents'] },
  { id: 'photo-spec', category: 'documents', question: 'What are the passport-photo rules?',
    answer: 'Usually 35×45 mm (Schengen/UK) or 2×2 inch (US), taken in the last 6 months, plain light background, neutral expression, no glasses, full face square to the camera, no shadows. Take it against a white wall in daylight — the scanner will tell you if the light or framing is off.',
    keywords: ['photo size', 'photo rule', 'photo requirement', 'passport photo', 'biometric photo', 'photo spec', 'photo background'], related: ['passport-validity', 'which-documents'] },
  { id: 'bank-statement', category: 'documents', question: 'What should my bank statement show?',
    answer: 'The last 3 months, with your name, account number and the bank’s stamp or a digital verification, a steady balance (avoid a large sudden deposit — it looks like borrowed money) and enough to cover your stay. A rough guide is the daily amount for your destination multiplied by your days, plus a buffer.',
    keywords: ['bank statement', 'bank balance', 'how much money', 'funds', 'financial proof', 'proof of funds', 'savings', 'sufficient funds'], related: ['fees', 'employment-letter'] },
  { id: 'employment-letter', category: 'documents', question: 'What goes in an employment letter?',
    answer: 'On company letterhead, signed and dated within the last month: your name, job title, start date, salary, approved leave dates and a statement that you will return to your position. Students should provide an enrolment letter from the institution instead.',
    keywords: ['employment letter', 'employer letter', 'job letter', 'noc', 'no objection', 'enrolment letter', 'student letter', 'leave letter'], related: ['bank-statement', 'which-documents'] },
  { id: 'insurance', category: 'documents', question: 'Do I need travel insurance?',
    answer: 'For Schengen countries yes — medical cover of at least €30,000 valid in every Schengen state for the whole stay. Many other countries do not require it but consular officers like to see it. Buy it after your flights are fixed so the dates match exactly.',
    keywords: ['travel insurance', 'medical insurance', 'health insurance', 'insurance required', 'need insurance'], related: ['itinerary', 'which-documents'] },
  { id: 'itinerary', category: 'documents', question: 'Should I buy flights before the visa?',
    answer: 'No — do not buy non-refundable tickets before approval. Use a flight reservation and hotel booking that can be cancelled for free; the embassy only needs proof of your plan, and the dates must match your application exactly.',
    keywords: ['flight ticket', 'book flight', 'buy ticket', 'flight reservation', 'hotel booking', 'hotel reservation', 'itinerary', 'dummy ticket'], related: ['insurance', 'which-documents'] },
  { id: 'file-formats', category: 'documents', question: 'Which file formats can I upload?',
    answer: 'PDF, JPG, PNG and HEIC. Photos should be sharp, well lit and show all four corners of the page. You can also scan straight from the camera — the scanner auto-captures when the page is steady and in frame.',
    keywords: ['file format', 'which format', 'pdf or', 'jpg', 'upload format', 'file size', 'blurry', 'scan quality'], related: ['delete-docs', 'which-documents'] },

  // ── Money
  { id: 'fees', category: 'money', question: 'How much does a visa cost?',
    answer: 'Government visa fees vary by country and visa type — your Requirements page shows the current fee for your destination, plus any service-centre charge. Visa With Ease itself is free to start; consultant sessions are priced per session before you book.',
    keywords: ['visa fee', 'visa cost', 'how much does', 'embassy fee', 'application fee', 'service charge'], related: ['refund', 'need-consultant'] },
  { id: 'refund', category: 'money', question: 'Can I get a refund on a consultant session?',
    answer: 'You can cancel or reschedule a booking from the Bookings tab before the session starts. Embassy visa fees are never refundable once paid to the embassy, even if the visa is refused.',
    keywords: ['refund', 'cancel booking', 'cancel appointment', 'money back', 'reschedule'], related: ['need-consultant', 'fees'] },

  // ── Timing & status
  { id: 'processing-time', category: 'timing', question: 'How long does processing take?',
    answer: 'It depends on the country and the season: typically 2–6 weeks, longer at peak times. Your application’s Requirements page shows the typical processing time for your destination. Apply at least 8–10 weeks before you travel.',
    keywords: ['how long', 'processing time', 'how many days', 'when will i get', 'wait time', 'turnaround'], related: ['when-apply', 'status'] },
  { id: 'when-apply', category: 'timing', question: 'How early can I apply?',
    answer: 'Most embassies accept applications 3 months before travel (Schengen: up to 6 months). Start collecting documents 8–10 weeks ahead — the slowest parts are usually bank statements and employer letters.',
    keywords: ['how early', 'when should i apply', 'when to apply', 'earliest', 'how soon'], related: ['processing-time', 'which-documents'] },
  { id: 'status', category: 'timing', question: 'Can you track my visa at the embassy?',
    answer: 'I can show how ready your application is — score, documents uploaded and open issues — but I cannot see the embassy’s own decision. Once you have submitted, use the tracking number the embassy or visa centre gave you on their website. Ask “status of my Germany visa” and I will show your preparation status.',
    keywords: ['track my visa', 'embassy status', 'visa decision', 'track application', 'tracking number', 'visa approved'], related: ['processing-time', 'what-is-score'] },

  // ── Consultants
  { id: 'need-consultant', category: 'experts', question: 'Do I need a consultant?',
    answer: 'Not for a simple, well-documented tourist visa — the AI checks are usually enough. A consultant is worth it after a previous refusal, with self-employment or irregular income, a complex history, or when the time is short. You choose what to share and can revoke it any time.',
    keywords: ['need a consultant', 'do i need consultant', 'consultant worth', 'should i book', 'expert help', 'talk to an expert'], related: ['book-consultant', 'privacy-share'] },
  { id: 'book-consultant', category: 'experts', question: 'How do I book a consultant?',
    answer: 'Open Consultants, pick someone whose specialty matches your destination, choose a time slot, then choose exactly what to share and accept the data-sharing terms. Your booking appears in the Bookings tab, and the call opens from there 10 minutes before the start.',
    keywords: ['book a consultant', 'book consultant', 'book an appointment', 'make an appointment', 'schedule a call', 'video call', 'join call'], related: ['privacy-share', 'refund'] },
  { id: 'privacy-share', category: 'experts', question: 'What can a consultant see?',
    answer: 'Nothing until you press grant access and accept the terms. Then only the categories you ticked (profile, documents and passport details, findings, requirements, chat, contact) for 7 days. Original files are never shared, and every view is logged. You can revoke access at any time from Bookings.',
    keywords: ['consultant see', 'share my data', 'grant access', 'who can see', 'access my documents', 'revoke access'], related: ['data-safe', 'book-consultant'] },

  // ── Privacy
  { id: 'data-safe', category: 'privacy', question: 'Is my data safe?',
    answer: 'Documents are analysed for their findings and the original files are not kept. Your data is encrypted in transit, tied to your account only, and shared with a consultant only when you grant access. You can delete an application, or your whole account, at any time from settings.',
    keywords: ['is my data safe', 'data safe', 'my data', 'privacy', 'secure', 'gdpr', 'stored'], related: ['delete-docs', 'face-why'] },
  { id: 'delete-docs', category: 'privacy', question: 'How do I delete my data?',
    answer: 'Open an application and choose Delete application — it removes the application, its documents’ results, its bookings and any access you granted. To remove everything, delete your account from Profile → Account.',
    keywords: ['delete my', 'remove my data', 'delete account', 'delete application', 'erase'], related: ['data-safe', 'privacy-share'] },
  { id: 'face-why', category: 'privacy', question: 'Why is a face check needed?',
    answer: 'It proves the person applying is the passport holder: a short live check (blink, turn your head) is compared with your passport photo, and the “Face verified” badge appears with your match score. One face is locked to each account, so nobody else can analyse documents on your application.',
    keywords: ['face check', 'face verif', 'face id', 'liveness', 'selfie', 'why face', 'face verified'], related: ['data-safe', 'how-it-works'], actions: ['Verify my face'] },

  // ── Refusals
  { id: 'refused', category: 'refusal', question: 'My visa was refused. What now?',
    answer: 'Read the refusal letter for the reason code — most refusals are fixable: insufficient funds, unclear purpose or ties to home, or missing documents. You can usually reapply after correcting the problem, or appeal within the deadline stated in the letter. A consultant can review the letter with you.',
    keywords: ['visa refused', 'was refused', 'rejected', 'refusal', 'visa denied', 'reapply', 'appeal'], related: ['need-consultant', 'bank-statement'], actions: ['Find a consultant'], escalate: true },
];

const byId = new Map(FAQS.map((f) => [f.id, f]));

export function faqCatalog() {
  return {
    categories: FAQ_CATEGORIES,
    questions: FAQS.map((f) => ({ id: f.id, category: f.category, question: f.question })),
  };
}

export function getFaq(id: string): FaqEntry | undefined { return byId.get(id); }

function relatedOf(entry: FaqEntry) {
  return entry.related.map((id) => byId.get(id)).filter((f): f is FaqEntry => !!f).map((f) => ({ id: f.id, question: f.question }));
}

export function faqReply(entry: FaqEntry): ChatResponse {
  return {
    reply: entry.answer,
    suggestedActions: entry.actions ?? ['Upload my documents', 'Find a consultant'],
    escalate: !!entry.escalate,
    ...(entry.escalate ? { escalationReason: 'A refusal is worth a consultant review' } : {}),
    source: 'faq',
    related: relatedOf(entry),
  };
}

/** The best FAQ for a free-text message, or null. Needs a real phrase hit so it never hijacks a specific question. */
export function matchFaq(message: string): FaqEntry | null {
  const text = ` ${message.toLowerCase().replace(/[^a-z0-9€' ]+/g, ' ').replace(/\s+/g, ' ')} `;
  let best: { entry: FaqEntry; score: number } | null = null;
  for (const entry of FAQS) {
    // Exact tap on a suggested question.
    if (message.trim().toLowerCase() === entry.question.toLowerCase()) return entry;
    let score = 0;
    for (const k of entry.keywords) if (text.includes(` ${k}`) || text.includes(k + ' ') || text.includes(` ${k} `)) score += k.length;
    if (score > 0 && (!best || score > best.score)) best = { entry, score };
  }
  return best && best.score >= 8 ? best.entry : null;
}

// ── Intents answered from the caller's own data ───────────────────────────────

const STATUS_RE = /\b(status|progress|update|where (am i|are we)|how('s| is) (my|the))\b.*\b(visa|application)\b|\b(visa|application)\b.*\b(status|progress)\b|\bwhat('s| is) the status\b/i;
const UPLOAD_RE = /\b(upload|scan|submit|add|send|attach)\b.*\b(document|documents|docs|passport|bank|statement|letter|insurance|photo|papers?)\b|\bcheck (my )?(documents|docs|passport)\b|\bnext document\b|\bdocument(s)? (check|review)\b/i;

function countryIn(message: string, apps: VisaApplication[]): VisaApplication | null {
  const lower = message.toLowerCase();
  return apps.find((a) => lower.includes(a.destinationCountry.toLowerCase())) ?? null;
}

export function statusReply(message: string, apps: VisaApplication[]): ChatResponse | null {
  if (!STATUS_RE.test(message)) return null;
  if (apps.length === 0) {
    return { reply: 'You do not have a visa application yet. Start one with your destination and visa type, and I will track its status, documents and readiness score here.', suggestedActions: ['Start a new application'], escalate: false, source: 'application', related: relatedOf(byId.get('how-it-works')!) };
  }
  const named = countryIn(message, apps);
  // A named country with no matching application: say so rather than answering about a different one.
  const mentionsOther = !named && /\b(germany|france|italy|spain|uk|united kingdom|usa|united states|canada|australia|uae|japan|schengen|netherlands|singapore|turkey|switzerland|portugal|ireland|new zealand)\b/i.test(message);
  if (mentionsOther) {
    const have = apps.map((a) => `${a.destinationCountry} ${a.visaType}`).join(', ');
    return { reply: `I cannot find an application for that destination. Your applications: ${have}. Start a new one to track that visa.`, suggestedActions: ['Start a new application'], escalate: false, source: 'application' };
  }
  const list = named ? [named] : apps.slice(0, 3);
  const lines = list.map((a) => {
    const missing = Math.max(a.documentsRequired - a.documentsUploaded, 0);
    const next = missing > 0 ? `${missing} document${missing === 1 ? '' : 's'} still to upload` : 'all required documents uploaded';
    const issues = a.issuesCount > 0 ? `${a.issuesCount} open issue${a.issuesCount === 1 ? '' : 's'} to fix` : 'no open issues';
    return `${a.destinationCountry} ${a.visaType}: ${a.readinessScore}/100 ready — ${next}, ${issues}.`;
  });
  const anyMissing = list.some((a) => a.documentsUploaded < a.documentsRequired);
  return {
    reply: `${lines.join('\n')}\n\nThis is your preparation status. I cannot see the embassy’s decision — after you submit, track it with the number the embassy or visa centre gave you.`,
    suggestedActions: anyMissing ? ['Upload my documents', 'Find a consultant'] : ['Find a consultant'],
    escalate: false,
    source: 'application',
    related: relatedOf(byId.get('processing-time')!),
  };
}

export function uploadReply(message: string, apps: VisaApplication[]): ChatResponse | null {
  if (!UPLOAD_RE.test(message)) return null;
  if (apps.length === 0) {
    return { reply: 'Documents are checked against a specific visa application. Start one first, then I will ask for each document in turn.', suggestedActions: ['Start a new application'], escalate: false, source: 'application' };
  }
  return {
    reply: 'Sure — I will ask for your documents one at a time. Upload each one below; I check it in the background while you move on to the next.',
    suggestedActions: [],
    escalate: false,
    source: 'application',
    startDocumentFlow: true,
    related: relatedOf(byId.get('file-formats')!),
  };
}

/** Whether answering could need the caller's applications — lets the route skip a database read for plain FAQ/AI messages. */
export function needsApplications(message: string): boolean {
  return STATUS_RE.test(message) || UPLOAD_RE.test(message);
}

/** Everything this module can answer without the AI, in priority order. */
export function answerFromKnowledge(message: string, apps: VisaApplication[]): ChatResponse | null {
  return statusReply(message, apps) ?? uploadReply(message, apps) ?? (() => { const f = matchFaq(message); return f ? faqReply(f) : null; })();
}
