import { getDb } from './firestore.js';
import { createFirestoreServices } from './firestoreServices.js';
import { createMockServices } from './mockServices.js';
import type { HealthStatus, Services } from './types.js';

export function createServices(): Services {
  const db = getDb();
  if (db) return createFirestoreServices(db);
  return createMockServices();
}

export function providerHealth(envName: string): HealthStatus {
  return process.env[envName] ? 'configured' : 'mock';
}

export type { Services };
