import { chatResponseSchema } from '@visaiq/contracts';
import type { ChatRequest, ChatResponse } from '@visaiq/contracts';
import type { AiProvider, HealthStatus } from './types.js';

type ProviderName = 'claude' | 'gemini';

interface ProviderConfig {
  name: ProviderName;
  apiKey?: string;
  endpoint: string;
  buildBody(input: ChatRequest): unknown;
  readReply(body: unknown): string | null;
}

const timeoutMs = Number(process.env.AI_TIMEOUT_MS ?? 6500);
const maxAttempts = Number(process.env.AI_RETRY_ATTEMPTS ?? 2);

const VISA_SYSTEM_PROMPT = `You are VisaIQ's visa guidance assistant. You help users with visa applications, passport requirements, embassy rules, document checklists, travel insurance, financial evidence, appointment booking, and related immigration topics.

Rules:
1. ONLY answer questions related to visas, travel documents, passports, immigration, embassy requirements, and related travel topics.
2. If asked about unrelated topics (recipes, sports, politics, coding, relationships, etc.), reply: "I can only help with visa and immigration questions. What visa question can I answer for you?"
3. Keep answers concise, actionable, and specific to the user's context.
4. For complex or urgent cases (overstay, appeal, rejection), recommend consulting a certified consultant.
5. Never guarantee visa approval outcomes.
6. Do not answer questions about other AI systems, your own architecture, or general knowledge outside travel/immigration.`;

function fallbackReply(input: ChatRequest): ChatResponse {
  const complexity = /appeal|rejected|overstay|human|consultant|urgent|7 days/i.test(input.message);
  return chatResponseSchema.parse({
    reply: complexity
      ? 'This looks complex or time-sensitive. I can map the likely document risks, but a verified consultant should review your exact case before submission.'
      : 'I checked your question against the current VisaIQ context. Focus on passport validity, financial proof, insurance, itinerary alignment and appointment timing.',
    suggestedActions: ['Review missing documents', 'Refresh official requirements', 'Find a consultant'],
    escalate: complexity,
    escalationReason: complexity ? 'Complexity or urgency threshold detected' : undefined
  });
}

const VISA_TOPIC_RE = /visa|passport|embassy|consulate|schengen|immigrat|travel doc|residency|permit|arrival|departure|biometric|overstay|appeal|refusal|bank statement|financial|insurance|invitation|sponsor|flight|hotel|itinerary|notariz|apostille|employment letter|work permit|study permit|tourist|business visa|transit/i;
const OFF_TOPIC_RE = /recipe|sport|cricket|football|basketball|music|movie|weather|programming|python|javascript|math|physics|chemistry|history|politics|stock|crypto|bitcoin|relationship|joke|poem|fiction/i;

function isOffTopic(message: string): boolean {
  if (VISA_TOPIC_RE.test(message)) return false;
  const words = message.trim().split(/\s+/).length;
  if (words <= 5) return false;
  return OFF_TOPIC_RE.test(message);
}

async function postWithTimeout(config: ProviderConfig, input: ChatRequest) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': config.apiKey ?? '',
        authorization: config.name === 'gemini' ? `Bearer ${config.apiKey}` : ''
      },
      body: JSON.stringify(config.buildBody(input)),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`${config.name} returned ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function callProvider(config: ProviderConfig, input: ChatRequest): Promise<ChatResponse> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const body = await postWithTimeout(config, input);
      const reply = config.readReply(body);
      if (!reply) throw new Error(`${config.name} response did not include text`);
      return chatResponseSchema.parse({
        reply,
        suggestedActions: ['Review requirements', 'Open application checklist', 'Find a consultant'],
        escalate: /consultant|urgent|risk|refusal|appeal/i.test(reply),
        escalationReason: /consultant|urgent|risk|refusal|appeal/i.test(reply) ? `${config.name} advised expert review` : undefined
      });
    } catch (err) {
      lastError = err;
    }
  }
  console.warn('AI provider failed, falling back to deterministic response', lastError);
  return fallbackReply(input);
}

const claudeConfig: ProviderConfig = {
  name: 'claude',
  apiKey: process.env.ANTHROPIC_API_KEY,
  endpoint: process.env.CLAUDE_API_URL ?? 'https://api.anthropic.com/v1/messages',
  buildBody: (input) => ({
    model: process.env.CLAUDE_MODEL ?? 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    system: VISA_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: input.message }]
  }),
  readReply: (body) => {
    const payload = body as { content?: Array<{ text?: string }> };
    return payload.content?.map((item) => item.text).filter(Boolean).join('\n') ?? null;
  }
};

const geminiConfig: ProviderConfig = {
  name: 'gemini',
  apiKey: process.env.GOOGLE_GEMINI_API_KEY,
  endpoint:
    process.env.GEMINI_API_URL ??
    `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL ?? 'gemini-1.5-flash'}:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY ?? ''}`,
  buildBody: (input) => ({
    systemInstruction: { parts: [{ text: VISA_SYSTEM_PROMPT }] },
    contents: [{ parts: [{ text: input.message }] }]
  }),
  readReply: (body) => {
    const payload = body as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    return payload.candidates?.[0]?.content?.parts?.map((item) => item.text).filter(Boolean).join('\n') ?? null;
  }
};

export function createAiProvider(): AiProvider {
  const configured = process.env.AI_MOCK === 'false' && (process.env.ANTHROPIC_API_KEY || process.env.GOOGLE_GEMINI_API_KEY);
  const health = (): HealthStatus => (configured ? 'configured' : 'mock');

  return {
    async chat(input) {
      // Reject off-topic queries before spending any AI tokens
      if (isOffTopic(input.message)) {
        return chatResponseSchema.parse({
          reply: "I can only help with visa and immigration questions — things like document requirements, embassy rules, application timelines, and travel eligibility. What visa question can I help you with?",
          suggestedActions: ['Review missing documents', 'Check visa requirements', 'Find a consultant'],
          escalate: false
        });
      }
      if (!configured) return fallbackReply(input);
      if (process.env.ANTHROPIC_API_KEY) return callProvider(claudeConfig, input);
      return callProvider(geminiConfig, input);
    },
    health
  };
}
