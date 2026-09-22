import type { AuditResult, Finding } from '@visaiq/contracts';

// Real multimodal document analysis via Gemini — the model actually looks at
// the captured image/PDF (not just OCR text) and returns structured findings
// through Gemini's JSON response-schema mode, so parsing is reliable rather
// than regex-scraping free text out of a chat reply.

const GEMINI_VISION_TIMEOUT_MS = Number(process.env.GEMINI_VISION_TIMEOUT_MS ?? 20000);
const GEMINI_VISION_MODEL = process.env.GEMINI_VISION_MODEL ?? process.env.GEMINI_MODEL ?? 'gemini-3.6-flash';

export function isGeminiVisionConfigured(): boolean {
  return process.env.AI_MOCK !== 'true' && Boolean(process.env.GOOGLE_GEMINI_API_KEY);
}

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    documentTypeMatches: { type: 'BOOLEAN', description: 'Whether the image genuinely appears to be the claimed document type.' },
    score: { type: 'INTEGER', description: '0-100 readiness score for this single document.' },
    status: { type: 'STRING', enum: ['excellent', 'attention_needed', 'issues_to_fix'] },
    findings: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING', description: 'short kebab-case slug, e.g. "expiry-date-passed"' },
          severity: { type: 'STRING', enum: ['pass', 'info', 'warn', 'red_flag'] },
          title: { type: 'STRING' },
          description: { type: 'STRING' },
          confidence: { type: 'INTEGER', description: '0-100' }
        },
        required: ['id', 'severity', 'title', 'description', 'confidence']
      }
    }
  },
  required: ['documentTypeMatches', 'score', 'status', 'findings']
};

const SYSTEM_PROMPT = `You are a visa-document readiness checker for Visa With Ease. You are given one document image or PDF page, and the document type the applicant claims it is.

Look at the actual content of the file and assess it honestly:
- Does it genuinely look like the claimed document type? If not, say so plainly as a red_flag finding.
- Is it legible (not blurry, not cut off, all corners visible)?
- For a passport: is there a visible photo, a machine-readable zone, a name, nationality, and dates of birth/issue/expiry? Is the expiry date in the future? If you can identify the issuing country from visible design cues (national emblem/crest, cover text, script, colour) and it visibly conflicts with the nationality code printed in the machine-readable zone, add a warn finding stating exactly what you see and what the MRZ says — do not guess the issuing country if it isn't visually clear.
- For a bank statement: is there a visible account holder name, a balance figure, a statement period, and a bank name/letterhead?
- For an employment or reference letter: is there a letterhead, a stated salary or role, and a signature?
- For any other document type: check general legibility and whether it plausibly matches what was claimed.

Also look specifically for visible signs of digital editing or inconsistency — not to make a forgery ruling (you can't; you're not a forensic tool and must never claim to have "verified" authenticity), but to flag anything a human reviewer should look at more closely:
- Font, size, spacing, or alignment that's inconsistent between fields on the same document (e.g. one line looks like a different typeface or is oddly misaligned versus the rest).
- A photo region with different resolution, compression, lighting, or edge sharpness than the surrounding document — a sign it may have been pasted in.
- Visible artifacts of editing software (clone-stamp smudging, warped straight lines, mismatched color balance in one area).
- The image being a photo of a screen (moiré pattern, glare, visible pixel grid) rather than of a physical document, when a physical original would be expected.
If you see any of these, add a warn or red_flag finding describing exactly what looks inconsistent and where — be specific and concrete, never vague ("something seems off"). If you see none of these signs, do not invent one; it's fine and expected for most genuine documents to have nothing to flag here.

Never invent or guess a value you cannot actually see — if a field isn't visible or legible, say that in a finding instead of assuming it's present. This is an automated readiness and consistency check only, not a forensic authentication and not a consulate decision — do not claim to have "verified" the document is genuine, and do not claim to approve or reject a visa application.

Return findings as a short, specific list (3-6 items is typical). Score and status must be consistent with the findings you list.`;

interface GeminiVisionResult {
  documentTypeMatches: boolean;
  score: number;
  status: AuditResult['status'];
  findings: Finding[];
}

async function callGeminiVision(documentType: string, imageBase64: string, mimeType: string): Promise<GeminiVisionResult> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  const endpoint = process.env.GEMINI_API_URL
    ?? `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_VISION_MODEL}:generateContent?key=${apiKey ?? ''}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_VISION_TIMEOUT_MS);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{
          parts: [
            { text: `Claimed document type: "${documentType}". Analyze this file.` },
            { inline_data: { mime_type: mimeType, data: imageBase64 } }
          ]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.1
        }
      }),
      signal: controller.signal
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Gemini vision returned ${response.status}: ${body.slice(0, 300)}`);
    }
    const body = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join('') ?? '';
    if (!text) throw new Error('Gemini vision response had no text content');
    const parsed = JSON.parse(text) as GeminiVisionResult;
    if (typeof parsed.score !== 'number' || !Array.isArray(parsed.findings)) {
      throw new Error('Gemini vision response did not match the expected shape');
    }
    return parsed;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Returns a real AuditResult from Gemini's actual look at the document, or
 * null if Gemini isn't configured or the call failed — callers fall back to
 * the deterministic heuristic in documentAnalysis.ts rather than surfacing
 * a raw error or faking a result.
 */
export async function analyzeDocumentWithGemini(input: {
  documentId: string;
  documentType: string;
  imageBase64: string;
  mimeType: string;
}): Promise<AuditResult | null> {
  if (!isGeminiVisionConfigured()) return null;
  try {
    const result = await callGeminiVision(input.documentType, input.imageBase64, input.mimeType);
    const score = Math.max(0, Math.min(100, Math.round(result.score)));
    const findings: Finding[] = result.findings.map((f, i) => ({
      id: f.id || `gemini-finding-${i}`,
      severity: f.severity,
      title: f.title,
      description: f.description,
      confidence: Math.max(0, Math.min(100, Math.round(f.confidence)))
    }));
    if (!result.documentTypeMatches && !findings.some((f) => f.severity === 'red_flag')) {
      findings.unshift({
        id: 'document-type-mismatch',
        severity: 'red_flag',
        title: `Doesn't look like a ${input.documentType}`,
        description: 'The uploaded file does not appear to match the document type you selected. Double-check you picked the right file.',
        confidence: 80
      });
    }
    return {
      documentId: input.documentId,
      documentType: input.documentType,
      score,
      status: result.status,
      findings,
      generatedAt: new Date().toISOString()
    };
  } catch (err) {
    console.warn('Gemini document vision failed, falling back to heuristic analysis', err);
    return null;
  }
}
