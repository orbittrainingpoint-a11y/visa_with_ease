import type { AuditRequest, AuditResult } from '@visaiq/contracts';
import type { AuditQueue, HealthStatus } from './types.js';
import { analyzeDocument } from './documentAnalysis.js';

const jobs = new Map<string, AuditResult>();

export function createRedisAuditQueue(): AuditQueue {
  const configured = Boolean(process.env.REDIS_URL || process.env.BULLMQ_ENABLED === 'true');
  const health = (): HealthStatus => (configured ? 'configured' : 'mock');

  return {
    async enqueueAudit(input: AuditRequest) {
      const result = await analyzeDocument(input);
      jobs.set(input.documentId, result);
      return { jobId: `audit-${input.documentId}`, status: 'queued', result };
    },
    async getAuditResult(documentId) {
      return jobs.get(documentId) ?? await analyzeDocument({ applicationId: '', documentId });
    },
    async getAuditResultsByIds(documentIds) {
      return documentIds.map(id => jobs.get(id)).filter((r): r is AuditResult => r !== undefined);
    },
    health
  };
}
