import { auditResult } from '@visaiq/mock-data';
import type { AuditRequest, AuditResult } from '@visaiq/contracts';
import type { AuditQueue, HealthStatus } from './types.js';

const jobs = new Map<string, AuditResult>();

export function createRedisAuditQueue(): AuditQueue {
  const configured = Boolean(process.env.REDIS_URL || process.env.BULLMQ_ENABLED === 'true');
  const health = (): HealthStatus => (configured ? 'configured' : 'mock');

  return {
    async enqueueAudit(input: AuditRequest) {
      const result = {
        ...auditResult,
        documentId: input.documentId,
        generatedAt: new Date().toISOString()
      };
      jobs.set(input.documentId, result);
      return { jobId: `audit-${input.documentId}`, status: 'queued', result };
    },
    async getAuditResult(documentId) {
      return jobs.get(documentId) ?? { ...auditResult, documentId, generatedAt: new Date().toISOString() };
    },
    health
  };
}
