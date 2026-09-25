import { z } from 'zod';

export const visaContextSchema = z.object({
  nationalities: z.array(z.string().min(2)).min(1),
  residenceCountry: z.string().min(2),
  travelDocumentType: z.enum(['passport', 'refugee_document', 'other']),
  travelDocumentIssuer: z.string().min(2),
  destinationCountry: z.string().min(2),
  transitCountries: z.array(z.string()).default([]),
  visaCategory: z.enum(['tourist', 'business', 'study', 'work', 'family', 'other']),
  purpose: z.string().min(2),
  intendedFrom: z.string(),
  intendedTo: z.string(),
  language: z.string().default('en'),
  timezone: z.string().default('Asia/Dubai'),
  currency: z.string().default('USD')
});

export const findingSchema = z.object({
  id: z.string(),
  severity: z.enum(['pass', 'info', 'warn', 'red_flag']),
  title: z.string(),
  description: z.string(),
  confidence: z.number().min(0).max(100)
});

export const auditResultSchema = z.object({
  documentId: z.string(),
  documentType: z.string(),
  score: z.number().min(0).max(100),
  status: z.enum(['excellent', 'attention_needed', 'issues_to_fix']),
  findings: z.array(findingSchema),
  generatedAt: z.string()
});

export const requirementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  required: z.boolean(),
  satisfied: z.boolean(),
  sourceIds: z.array(z.string()),
  // Plain-language reason this is asked for / what happens without it. Optional:
  // clients fall back to an honest generic explanation pointing at the sources.
  why: z.string().max(600).optional()
});

// Whether a human at Visa With Ease has checked this country's data against
// the official sources listed with it, and when. Absent/'unverified' means the
// data is our best guidance but has NOT been confirmed against the official
// source — clients must say so rather than imply it was.
export const requirementsVerificationSchema = z.object({
  status: z.enum(['verified', 'unverified']),
  verifiedAt: z.string().nullable(),
  verifiedBy: z.string().nullable()
});

export const requirementsResponseSchema = z.object({
  coverageStatus: z.enum(['supported', 'partial', 'unsupported']),
  requirements: z.array(requirementSchema),
  fees: z.string(),
  processingTime: z.string(),
  sourceUrls: z.array(z.object({ id: z.string(), label: z.string(), url: z.string() })),
  freshness: z.object({ fetchedAt: z.string(), expiresAt: z.string(), ageHours: z.number() }),
  verification: requirementsVerificationSchema.optional()
});

// What a platform_admin submits from the web app's knowledge-base editor —
// everything in a RequirementsResponse except freshness, which the server
// always computes itself rather than trusting a client-supplied timestamp.
// `markVerified` is the admin's attestation that they checked this against the
// listed official sources just now; the server stamps the time and who did it.
export const requirementsOverrideSchema = requirementsResponseSchema
  .omit({ freshness: true, verification: true })
  .extend({ markVerified: z.boolean().optional() });

export const applicationSchema = z.object({
  id: z.string(),
  refCode: z.string(),
  applicantName: z.string(),
  destinationCountry: z.string(),
  destinationFlag: z.string(),
  visaType: z.string(),
  status: z.enum(['draft', 'in_progress', 'ready', 'submitted', 'approved', 'rejected']),
  readinessScore: z.number().min(0).max(100),
  documentsUploaded: z.number(),
  documentsRequired: z.number(),
  issuesCount: z.number(),
  intendedFrom: z.string(),
  nationality: z.string().optional(),
  residenceCountry: z.string().optional()
});

export const chatResponseSchema = z.object({
  reply: z.string(),
  suggestedActions: z.array(z.string()),
  escalate: z.boolean(),
  escalationReason: z.string().optional(),
  // True when this is the built-in basic answer because the AI model was
  // unavailable (out of credit, outage, not configured) — never presented as AI.
  degraded: z.boolean().optional(),
  // Where the answer came from: the curated FAQ knowledge base, the user's own application data, or the AI model.
  source: z.enum(['faq', 'application', 'ai']).optional(),
  // Follow-up questions the user is likely to want next (tap-to-ask chips).
  related: z.array(z.object({ id: z.string(), question: z.string() })).optional(),
  // The reply asks the user to upload documents right in the chat.
  startDocumentFlow: z.boolean().optional()
});

export const auditRequestSchema = z.object({
  applicationId: z.string().min(1),
  documentId: z.string().min(1),
  documentType: z.string().max(120).optional(),
  // Real on-device OCR output (Google ML Kit) for the captured/picked image,
  // when one is available. Absent for file types OCR can't run on (e.g. PDFs)
  // or when on-device text recognition failed — the audit treats that as a
  // real "couldn't verify automatically" signal rather than faking a result.
  extractedText: z.string().max(20000).optional(),
  // The actual captured/picked file, base64-encoded, so the backend can run
  // real multimodal AI analysis (Gemini) instead of relying on plain OCR
  // text alone. Optional — when absent, or when no AI provider is
  // configured, the server falls back to the extractedText-based heuristic.
  imageBase64: z.string().max(15_000_000).optional(),
  mimeType: z.string().max(60).optional()
});

export const chatRequestSchema = z.object({
  applicationId: z.string().optional(),
  message: z.string().trim().min(1).max(4000),
  visaContext: visaContextSchema.optional()
});

export const authSessionRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  remember: z.boolean().default(true)
});

export const authSessionResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    uid: z.string(),
    email: z.string().email(),
    name: z.string(),
    roles: z.array(z.string())
  }),
  expiresAt: z.string()
});

export const bookingRequestSchema = z.object({
  consultantId: z.string().min(1),
  applicationId: z.string().min(1),
  sessionType: z.string().min(1),
  slotISO: z.string().datetime().optional()
});

export const accessGrantRequestSchema = z.object({
  applicationId: z.string().min(1),
  consultantId: z.string().min(1),
  categories: z.array(z.enum(['profile', 'requirements', 'audit_findings', 'documents', 'ai_messages', 'contact'])).min(1),
  expiresAt: z.string().datetime(),
  // The client must actively accept the sharing terms — a consultant never gets access to anyone's
  // data by default, only through this explicit grant.
  acceptedTerms: z.literal(true, { errorMap: () => ({ message: 'You must accept the data-sharing terms to grant access' }) })
});

// Every field optional at every level — a PUT /profile call sends whichever
// section the user just edited, not the whole profile. Shape matches what
// the mobile/web clients actually send (apps/mobile/src/api.ts's
// UserProfile), not apps/backend/src/services/types.ts's older UserProfile
// interface, which drifted out of sync with real traffic (e.g. its
// travelHistory is a bare array; real clients send { trips, hasRejection }).
export const userProfilePatchSchema = z.object({
  personal: z.object({
    firstName: z.string().max(200).optional(),
    lastName: z.string().max(200).optional(),
    nationality: z.string().max(200).optional(),
    dateOfBirth: z.string().max(40).optional(),
    phone: z.string().max(40).optional(),
    gender: z.string().max(40).optional()
  }).strict().optional(),
  passport: z.object({
    passportNumber: z.string().max(50).optional(),
    issueDate: z.string().max(40).optional(),
    expiryDate: z.string().max(40).optional(),
    issuingCountry: z.string().max(200).optional()
  }).strict().optional(),
  employment: z.object({
    employer: z.string().max(300).optional(),
    jobTitle: z.string().max(300).optional(),
    annualIncomeUsd: z.union([z.string(), z.number()]).optional(),
    resumeUploaded: z.boolean().optional(),
    resumeFileName: z.string().max(300).optional()
  }).strict().optional(),
  financials: z.object({
    statements: z.array(z.object({ label: z.string().max(200), score: z.number() })).max(100).optional()
  }).strict().optional(),
  travelHistory: z.object({
    trips: z.array(z.object({ country: z.string().max(200), years: z.string().max(40), status: z.string().max(60) })).max(200).optional(),
    hasRejection: z.boolean().optional()
  }).strict().optional(),
  contacts: z.object({
    emergencyName: z.string().max(200).optional(),
    emergencyPhone: z.string().max(40).optional(),
    emergencyRelation: z.string().max(100).optional()
  }).strict().optional(),
  notificationPrefs: z.object({
    audit: z.boolean().optional(),
    requirements: z.boolean().optional(),
    booking: z.boolean().optional(),
    message: z.boolean().optional()
  }).strict().optional()
}).strict();

export const standardErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    traceId: z.string(),
    details: z.unknown().optional()
  })
});

export type VisaContext = z.infer<typeof visaContextSchema>;
export type Finding = z.infer<typeof findingSchema>;
export type AuditResult = z.infer<typeof auditResultSchema>;
export type Requirement = z.infer<typeof requirementSchema>;
export type RequirementsResponse = z.infer<typeof requirementsResponseSchema>;
export type RequirementsOverride = z.infer<typeof requirementsOverrideSchema>;
export type VisaApplication = z.infer<typeof applicationSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
export type AuthSessionRequest = z.infer<typeof authSessionRequestSchema>;
export type AuthSessionResponse = z.infer<typeof authSessionResponseSchema>;
export type AuditRequest = z.infer<typeof auditRequestSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type BookingRequest = z.infer<typeof bookingRequestSchema>;
export type AccessGrantRequest = z.infer<typeof accessGrantRequestSchema>;
export type UserProfilePatch = z.infer<typeof userProfilePatchSchema>;
export type StandardError = z.infer<typeof standardErrorSchema>;
