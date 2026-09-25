// Google Meet links for consultant appointments, created through the Google Calendar API
// (an event with `conferenceData` makes Google generate the Meet room).
//
// Needs a Google account/Workspace that will "own" the calls, and an OAuth client for it:
//   GOOGLE_MEET_CLIENT_ID, GOOGLE_MEET_CLIENT_SECRET   — OAuth client (Calendar API enabled)
//   GOOGLE_MEET_REFRESH_TOKEN                          — refresh token for that account,
//                                                        scope https://www.googleapis.com/auth/calendar.events
//   GOOGLE_MEET_CALENDAR_ID                            — optional, defaults to "primary"
// Without them, isMeetConfigured() is false and callers report the provider as not connected
// instead of inventing a link.
//
// GOOGLE_OAUTH_URL / GOOGLE_CALENDAR_API_URL exist only so tests can point at a local fake.

export interface MeetingLink {
  provider: 'google_meet';
  url: string;
  eventId: string;
  createdAt: string;
}

export function isMeetConfigured(): boolean {
  return Boolean(process.env.GOOGLE_MEET_CLIENT_ID && process.env.GOOGLE_MEET_CLIENT_SECRET && process.env.GOOGLE_MEET_REFRESH_TOKEN);
}

async function accessToken(): Promise<string> {
  const res = await fetch(process.env.GOOGLE_OAUTH_URL ?? 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_MEET_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_MEET_CLIENT_SECRET ?? '',
      refresh_token: process.env.GOOGLE_MEET_REFRESH_TOKEN ?? '',
      grant_type: 'refresh_token'
    })
  });
  const body = (await res.json().catch(() => ({}))) as { access_token?: string; error_description?: string; error?: string };
  if (!res.ok || !body.access_token) throw new Error(`Google token request failed: ${body.error_description ?? body.error ?? res.status}`);
  return body.access_token;
}

/** Creates a calendar event with a Meet room. Throws if the provider is unconfigured or Google rejects it. */
export async function createMeetEvent(input: { summary: string; description?: string; startISO: string; durationMinutes: number; attendeeEmails: string[] }): Promise<MeetingLink> {
  if (!isMeetConfigured()) throw new Error('Google Meet is not configured');
  const token = await accessToken();
  const start = new Date(input.startISO);
  const end = new Date(start.getTime() + input.durationMinutes * 60_000);
  const calendarId = encodeURIComponent(process.env.GOOGLE_MEET_CALENDAR_ID ?? 'primary');
  const base = process.env.GOOGLE_CALENDAR_API_URL ?? 'https://www.googleapis.com/calendar/v3';
  const res = await fetch(`${base}/calendars/${calendarId}/events?conferenceDataVersion=1&sendUpdates=all`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({
      summary: input.summary,
      description: input.description,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      attendees: input.attendeeEmails.filter(Boolean).map((email) => ({ email })),
      conferenceData: { createRequest: { requestId: `vwe-${start.getTime()}-${Math.random().toString(36).slice(2, 8)}`, conferenceSolutionKey: { type: 'hangoutsMeet' } } }
    })
  });
  const body = (await res.json().catch(() => ({}))) as { id?: string; hangoutLink?: string; error?: { message?: string } };
  if (!res.ok || !body.hangoutLink || !body.id) throw new Error(`Google Calendar rejected the event: ${body.error?.message ?? res.status}`);
  return { provider: 'google_meet', url: body.hangoutLink, eventId: body.id, createdAt: new Date().toISOString() };
}

/** The window in which the call link is released: 10 minutes before the start until the session
 *  (plus a 30 minute grace) is over. Keeps a shared link from being used long before/after the slot. */
export function joinWindow(slotISO: string, durationMinutes: number): { opensAt: string; closesAt: string } {
  const start = new Date(slotISO).getTime();
  return { opensAt: new Date(start - 10 * 60_000).toISOString(), closesAt: new Date(start + (durationMinutes + 30) * 60_000).toISOString() };
}
