import { createFirebaseEmulatorServices } from './firebaseServices.js';
import { FirestoreRestClient, getFirebaseProjectId, getFirestoreEmulatorHost } from './firestoreRest.js';
import { createMockServices } from './mockServices.js';
import type { HealthStatus, Services } from './types.js';

export function createServices(): Services {
  const firestoreHost = getFirestoreEmulatorHost();
  if (firestoreHost) {
    return createFirebaseEmulatorServices(new FirestoreRestClient(firestoreHost, getFirebaseProjectId()));
  }

  return createMockServices();
}

export function providerHealth(envName: string): HealthStatus {
  return process.env[envName] ? 'configured' : 'mock';
}

export type { Services };
