import type { AuditResult, Finding } from '@visaiq/contracts';

// Real multimodal document analysis via xAI's Grok — same purpose and same
// AuditResult shape as geminiVision.ts, so documentAnalysis.ts can treat
// whichever real vision provider is configured interchangeably.
//
// IMPORTANT — unverified at the time this was written: the API key provided
// authenticates correctly against https://api.x.ai/v1/chat/completions
// (confirmed live: a plain-text request got a real, structured API response,
// not a network/auth/404 error) — but the *account* had no usable credits,
// so the actual image-analysis round trip below has never been exercised
// end to end. xAI's own docs and third-party references disagree on the
// exact vision request shape (some describe a newer /v1/responses endpoint
// with input_image/input_text parts; others describe this OpenAI-compatible
// /v1/chat/completions + image_url content parts, which is what every other
// OpenAI-compatible vision provider uses). This implementation uses the
// latter — the better-supported, more conventional shape, and the same
// endpoint already confirmed reachable — but until this account has credits
// and a real test image has been run through it, treat this file as
// implemented-but-not-yet-verified, the same honesty standard the rest of
// this app holds real vs. mock data to. See analyzeDocumentWithGrok's
// catch block: any failure here — including a genuinely wrong request
// shape — falls back to the heuristic, never a crash or a fabricated result.

const GROK_VISION_TIMEOUT_MS = Number(process.env.XAI_VISION_TIMEOUT_MS ?? 20000);
// grok-4 is what actually authenticated in the live connectivity test this
// was built against. xAI's docs also reference grok-4.3/grok-4.7 as
// vision-capable via a different endpoint — if grok-4 turns out not to
// accept image input once real testing is possible, this is the first
// thing to change (via XAI_VISION_MODEL, no code change needed).
const GROK_VISION_MODEL = process.env.XAI_VISION_MODEL ?? 'grok-4';

export function isGrokVisionConfigured(): boolean {
  return process.env.AI_MOCK !== 'true' && Boolean(process.env.XAI_API_KEY);
}

// xAI's chat completions endpoint is OpenAI-compatible, which (unlike
// Gemini's dedicated responseSchema field) typically only guarantees valid
// JSON via response_format, not a specific shape — so the exact schema is
// spelled out in the prompt itself as the real enforcement mechanism, with
// the code below still validating the parsed result before trusting it.
const SYSTEM_PROMPT = `You are a visa-document readiness checker for Visa With Ease. You are given one document image and the document type the applicant claims it is.

Look at the actual content of the file and assess it honestly:
- Does it genuinely look like the claimed document type? If not, say so plainly as a red_flag finding.
- Is it legible (not blurry, not cut off, all corners visible)?
- For a passport: is there a visible photo, a machine-readable zone, a name, nationality, and dates of birth/issue/expiry? Is the expiry date in the future? If you can identify the issuing country from visible design cues (national emblem/crest, cover text, script, colour) and it visibly conflicts with the nationality code printed in the machine-readable zone, add a warn finding stating exactly what you see and what the MRZ says — do not guess the issuing country if it isn't visually clear.
- For a bank statement: is there a visible account holder name, a balance figure, a statement period, and a bank name/letterhead?
- For an employment or reference letter: is there a letterhead, a stated salary or role, and a signature?
- For any other document type: check general legibility and whether it plausibly matches what was claimed.

Also look specifically for visible signs of digital editing or inconsistency — not to make a forgery ruling (you can't; you're not a forensic tool and must never claim to have "verified" authenticity), but to flag anything a human reviewer should look at more closely:
- Font, size, spacing, or alignment that's inconsistent between fields on the same document.
- A photo region with different resolution, compression, lighting, or edge sharpness than the surrounding document.
- Visible artifacts of editing software (clone-stamp smudging, warped straight lines, mismatched color balance).
- The image being a photo of a screen (moiré pattern, glare, visible pixel grid) rather than of a physical document.
If you see any of these, add a warn or red_flag finding describing exactly what looks inconsistent and where — be specific, never vague. If you see none, do not invent one.

Never invent or guess a value you cannot actually see. This is an automated readiness and consistency check only, not a forensic authentication and not a consulate decision — do not claim to have "verified" the document is genuine, and do not claim to approve or reject a visa application.

Respond with ONLY a single JSON object, no other text, matching exactly this shape:
{
  "documentTypeMatches": boolean,
  "score": integer 0-100,
  "status": "excellent" | "attention_needed" | "issues_to_fix",
  "findings": [
    { "id": "short-kebab-case-slug", "severity": "pass" | "info" | "warn" | "red_flag", "title": string, "description": string, "confidence": integer 0-100 }
  ]
}
Return 3-6 findings typically. Score and status must be consistent with the findings you list.`;

interface GrokVisionResult {
  documentTypeMatches: boolean;
  score: number;
  status: AuditResult['status'];
  findings: Finding[];
}

async function callGrokVision(documentType: string, imageBase64: string, mimeType: string): Promise<GrokVisionResult> {
  const apiKey = process.env.XAI_API_KEY;
  const endpoint = process.env.XAI_API_URL ?? 'https://api.x.ai/v1/chat/completions';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GROK_VISION_TIMEOUT_MS);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey ?? ''}` },
      body: JSON.stringify({
        model: GROK_VISION_MODEL,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: `Claimed document type: "${documentType}". Analyze this file.` },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
            ]
          }
        ]
      }),
      signal: controller.signal
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Grok vision returned ${response.status}: ${body.slice(0, 300)}`);
    }
    const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const text = body.choices?.[0]?.message?.content ?? '';
    if (!text) throw new Error('Grok vision response had no text content');
    const parsed = JSON.parse(text) as GrokVisionResult;
    if (typeof parsed.score !== 'number' || !Array.isArray(parsed.findings)) {
      throw new Error('Grok vision response did not match the expected shape');
    }
    return parsed;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Returns a real AuditResult from Grok's actual look at the document, or
 * null if Grok isn't configured or the call failed — callers fall back to
 * the next configured provider or the deterministic heuristic in
 * documentAnalysis.ts, never a raw error or a fabricated result.
 */
export async function analyzeDocumentWithGrok(input: {
  documentId: string;
  documentType: string;
  imageBase64: string;
  mimeType: string;
}): Promise<AuditResult | null> {
  if (!isGrokVisionConfigured()) return null;
  try {
    const result = await callGrokVision(input.documentType, input.imageBase64, input.mimeType);
    const score = Math.max(0, Math.min(100, Math.round(result.score)));
    const findings: Finding[] = result.findings.map((f, i) => ({
      id: f.id || `grok-finding-${i}`,
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
    console.warn('Grok document vision failed, falling back to next provider', err);
    return null;
  }
}
