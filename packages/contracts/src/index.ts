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
  sourceIds: z.array(z.string())
});

export const requirementsResponseSchema = z.object({
  coverageStatus: z.enum(['supported', 'partial', 'unsupported']),
  requirements: z.array(requirementSchema),
  fees: z.string(),
  processingTime: z.string(),
  sourceUrls: z.array(z.object({ id: z.string(), label: z.string(), url: z.string() })),
  freshness: z.object({ fetchedAt: z.string(), expiresAt: z.string(), ageHours: z.number() })
});

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
  intendedFrom: z.string()
});

export const chatResponseSchema = z.object({
  reply: z.string(),
  suggestedActions: z.array(z.string()),
  escalate: z.boolean(),
  escalationReason: z.string().optional()
});

export const auditRequestSchema = z.object({
  applicationId: z.string().min(1),
  documentId: z.string().min(1)
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
  expiresAt: z.string().datetime()
});

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
export type VisaApplication = z.infer<typeof applicationSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
export type AuthSessionRequest = z.infer<typeof authSessionRequestSchema>;
export type AuthSessionResponse = z.infer<typeof authSessionResponseSchema>;
export type AuditRequest = z.infer<typeof auditRequestSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type BookingRequest = z.infer<typeof bookingRequestSchema>;
export type AccessGrantRequest = z.infer<typeof accessGrantRequestSchema>;
export type StandardError = z.infer<typeof standardErrorSchema>;
