type FirestoreValue =
  | { nullValue: null }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { timestampValue: string }
  | { stringValue: string }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields: Record<string, FirestoreValue> } };

interface FirestoreDocument {
  name: string;
  fields?: Record<string, FirestoreValue>;
}

function toFirestoreValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (typeof value === 'string') {
    return /^\d{4}-\d{2}-\d{2}T/.test(value) ? { timestampValue: value } : { stringValue: value };
  }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  if (typeof value === 'object') {
    return {
      mapValue: {
        fields: Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, toFirestoreValue(item)]))
      }
    };
  }
  return { stringValue: String(value) };
}

function fromFirestoreValue(value: FirestoreValue): unknown {
  if ('nullValue' in value) return null;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('stringValue' in value) return value.stringValue;
  if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(fromFirestoreValue);
  return Object.fromEntries(Object.entries(value.mapValue.fields ?? {}).map(([key, item]) => [key, fromFirestoreValue(item)]));
}

function fromFirestoreDocument<T>(doc: FirestoreDocument): T {
  return Object.fromEntries(Object.entries(doc.fields ?? {}).map(([key, value]) => [key, fromFirestoreValue(value)])) as T;
}

export class FirestoreRestClient {
  private readonly baseUrl: string;

  constructor(host: string, private readonly projectId: string) {
    this.baseUrl = `http://${host}/v1/projects/${projectId}/databases/(default)/documents`;
  }

  async health() {
    const response = await fetch(`${this.baseUrl}?pageSize=1`);
    return response.ok;
  }

  async list<T>(collection: string): Promise<T[]> {
    const response = await fetch(`${this.baseUrl}/${collection}`);
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`Firestore list failed for ${collection}: ${response.status}`);
    const body = (await response.json()) as { documents?: FirestoreDocument[] };
    return (body.documents ?? []).map(fromFirestoreDocument<T>);
  }

  async get<T>(collection: string, id: string): Promise<T | null> {
    const response = await fetch(`${this.baseUrl}/${collection}/${encodeURIComponent(id)}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Firestore get failed for ${collection}/${id}: ${response.status}`);
    return fromFirestoreDocument<T>((await response.json()) as FirestoreDocument);
  }

  async set<T extends Record<string, unknown>>(collection: string, id: string, value: T): Promise<T> {
    const response = await fetch(`${this.baseUrl}/${collection}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toFirestoreValue(item)])) })
    });
    if (!response.ok) throw new Error(`Firestore set failed for ${collection}/${id}: ${response.status}`);
    return fromFirestoreDocument<T>((await response.json()) as FirestoreDocument);
  }
}

export function getFirestoreEmulatorHost() {
  return process.env.FIRESTORE_EMULATOR_HOST;
}

export function getFirebaseProjectId() {
  return process.env.FIREBASE_PROJECT_ID ?? process.env.GCLOUD_PROJECT ?? 'visaiq-local';
}
