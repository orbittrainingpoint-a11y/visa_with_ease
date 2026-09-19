import { getMessaging } from 'firebase-admin/messaging';
import { getDb } from './firestore.js';
import { getDeviceTokensForUser, removeDeviceToken } from './appStore.js';

/**
 * Real push notifications via Firebase Cloud Messaging — same Firebase
 * project as Firestore/Storage, no separate vendor account needed. Degrades
 * honestly: no Firebase app configured, or no device token registered for
 * this user, both return a 'skipped' status rather than pretending to have
 * sent something.
 */

export function isPushConfigured(): boolean {
  return getDb() !== null;
}

export interface PushResult {
  messageId: string;
  status: 'sent' | 'skipped';
}

export async function sendPushToUser(input: { userId: string; title: string; body: string; data?: Record<string, string> }): Promise<PushResult> {
  if (!isPushConfigured()) {
    return { messageId: 'push-not-configured', status: 'skipped' };
  }
  const tokens = await getDeviceTokensForUser(input.userId);
  if (tokens.length === 0) {
    return { messageId: 'no-device-token', status: 'skipped' };
  }
  const messaging = getMessaging();
  let sentAny = false;
  let lastMessageId = '';
  for (const token of tokens) {
    try {
      lastMessageId = await messaging.send({
        token,
        notification: { title: input.title, body: input.body },
        data: input.data ?? {}
      });
      sentAny = true;
    } catch (err) {
      const code = (err as { code?: string }).code;
      // These specific codes mean the token is permanently dead (app
      // uninstalled, user revoked permission) — anything else (network
      // blip, quota) should NOT delete a token that might still be good.
      if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
        await removeDeviceToken(token);
      } else {
        console.warn('[push] send failed for one device token:', (err as Error).message);
      }
    }
  }
  return sentAny ? { messageId: lastMessageId, status: 'sent' } : { messageId: 'all-tokens-failed', status: 'skipped' };
}
