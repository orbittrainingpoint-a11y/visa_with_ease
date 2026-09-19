import { randomUUID } from 'node:crypto';
import { getDb } from './firestore.js';
import { listAllMessages, listMessagesForThread, saveMessage, type StoredMessage } from './appStore.js';
import type { ConsultantMessage, HealthStatus, MessagingService } from './types.js';

/**
 * Real consultant↔client messaging, shared by both mock and Firestore
 * `Services` (same "one implementation, branches internally" pattern as
 * push.ts/storage.ts) — there's nothing mode-specific here beyond what
 * appStore.ts's saveMessage/listMessagesForThread already handle.
 */

function threadIdFor(consultantId: string, clientUid: string): string {
  return `${consultantId}__${clientUid}`;
}

function toApi(m: StoredMessage): ConsultantMessage {
  return { ...m };
}

export function isMessagingConfigured(): HealthStatus {
  return getDb() !== null ? 'configured' : 'mock';
}

export const messagingService: MessagingService = {
  async sendMessage(input) {
    const threadId = threadIdFor(input.consultantId, input.clientUid);
    const message: StoredMessage = {
      id: randomUUID(),
      threadId,
      consultantId: input.consultantId,
      clientUid: input.clientUid,
      clientName: input.clientName,
      senderRole: input.senderRole,
      text: input.text,
      createdAt: new Date().toISOString()
    };
    await saveMessage(message);
    return toApi(message);
  },

  async listMessages(threadId) {
    const messages = await listMessagesForThread(threadId);
    return messages.map(toApi);
  },

  async listThreadsForConsultant() {
    const all = await listAllMessages();
    const latestByThread = new Map<string, StoredMessage>();
    for (const m of all) latestByThread.set(m.threadId, m);
    return [...latestByThread.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((m) => ({
        threadId: m.threadId,
        applicant: m.clientName,
        lastMessage: m.text,
        status: m.senderRole === 'consultant' ? 'Replied' : 'Awaiting reply'
      }));
  },

  async listThreadsForUser(uid) {
    const all = await listAllMessages();
    const latestByThread = new Map<string, StoredMessage>();
    for (const m of all) if (m.clientUid === uid) latestByThread.set(m.threadId, m);
    return [...latestByThread.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((m) => ({
        threadId: m.threadId,
        consultantId: m.consultantId,
        lastMessage: m.text,
        createdAt: m.createdAt,
        status: m.senderRole === 'consultant' ? 'New reply' : 'Awaiting reply'
      }));
  },

  health() {
    return isMessagingConfigured();
  }
};
