import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'visaiq.offline_cache';

interface CacheData {
  applications?: unknown[];
  requirements?: unknown;
  notifications?: unknown[];
  lastUpdated?: string;
  count: number;
}

export async function saveToCache(key: keyof Omit<CacheData, 'count' | 'lastUpdated'>, data: unknown): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    const cache: CacheData = raw ? JSON.parse(raw) : { count: 0 };
    (cache as unknown as Record<string, unknown>)[key] = data;
    cache.lastUpdated = new Date().toISOString();
    cache.count = Object.keys(cache).filter(k => !['count', 'lastUpdated'].includes(k)).length;
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch { /* storage unavailable */ }
}

export async function loadFromCache<T>(key: keyof Omit<CacheData, 'count' | 'lastUpdated'>): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw) as CacheData;
    return (cache[key] as T) ?? null;
  } catch { return null; }
}

export async function getCacheSnapshot(): Promise<CacheData> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : { count: 0 };
  } catch { return { count: 0 }; }
}

export async function clearCache(): Promise<void> {
  try { await AsyncStorage.removeItem(CACHE_KEY); } catch { /* storage unavailable */ }
}
