import { randomUUID } from 'crypto';

export interface EmbassyRecord {
  country: string;
  city: string;
  phone?: string;
  website?: string;
  lastUpdated: string;
  source: 'official' | 'scraped' | 'manual';
}

const updateLog: Array<{ runId: string; startedAt: string; status: string; message: string }> = [];

async function scrapeEmbassyData(): Promise<void> {
  const runId = randomUUID();
  const startedAt = new Date().toISOString();
  // TODO: Replace with real scraping logic per embassy website
  // For now, log that a refresh was attempted
  updateLog.unshift({ runId, startedAt, status: 'noop', message: 'Embassy data refresh scheduled — real scraper not yet implemented. Integrate per-country embassy website crawlers here.' });
  if (updateLog.length > 50) updateLog.length = 50;
  console.info(`[embassyUpdater] run ${runId} — ${new Date().toISOString()}`);
}

let _timer: ReturnType<typeof setInterval> | null = null;

export function startEmbassyUpdater(intervalHours = 24) {
  if (_timer) return; // already running
  void scrapeEmbassyData(); // run immediately on start
  _timer = setInterval(() => void scrapeEmbassyData(), intervalHours * 60 * 60 * 1000);
}

export function getUpdateLog() {
  return updateLog;
}
