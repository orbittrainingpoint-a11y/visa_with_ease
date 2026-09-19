import { describe, expect, it, vi } from 'vitest';
import type { VisaApplication } from '@visaiq/contracts';
import {
  daysUntil,
  formatDateTime,
  greeting,
  greetingFor,
  initials,
  notifColor,
  relativeTripLabel,
  riskForAction,
  sourceFreshnessLabel,
  toCsv
} from '../../src/App';

describe('initials', () => {
  it('takes the first letter of up to two words, uppercased', () => {
    expect(initials('Sarah Mathew')).toBe('SM');
    expect(initials('cher')).toBe('C');
    expect(initials('Amelia Jane Roche')).toBe('AJ');
  });
});

describe('greeting', () => {
  it('picks morning/afternoon/evening based on the hour', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 8));
    expect(greeting()).toBe('Good morning');
    vi.setSystemTime(new Date(2026, 0, 1, 14));
    expect(greeting()).toBe('Good afternoon');
    vi.setSystemTime(new Date(2026, 0, 1, 20));
    expect(greeting()).toBe('Good evening');
    vi.useRealTimers();
  });
});

describe('daysUntil / relativeTripLabel', () => {
  it('computes real calendar-day differences, not fixed 24h blocks', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15, 23, 59)); // Jun 15, 2026 23:59 local
    expect(daysUntil('2026-06-16')).toBe(1);
    expect(daysUntil('2026-06-15')).toBe(0);
    expect(daysUntil('2026-06-10')).toBe(-5);
    vi.useRealTimers();
  });

  it('labels today/tomorrow/overdue/N days correctly', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15));
    expect(relativeTripLabel('2026-06-15')).toBe('today');
    expect(relativeTripLabel('2026-06-16')).toBe('tomorrow');
    expect(relativeTripLabel('2026-06-20')).toBe('5 days');
    expect(relativeTripLabel('2026-06-10')).toBe('5 days overdue');
    vi.useRealTimers();
  });
});

describe('sourceFreshnessLabel', () => {
  it('reports real elapsed and remaining time against the 24h cache policy', () => {
    const now = new Date('2026-06-15T12:00:00.000Z').getTime();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const label = sourceFreshnessLabel({
      fetchedAt: new Date(now - 2 * 3_600_000).toISOString(),
      expiresAt: new Date(now + 3 * 3_600_000).toISOString(),
      ageHours: 2
    });
    expect(label).toBe('Fetched 2h ago, expires in 3h under the 24h cache policy.');
    vi.useRealTimers();
  });

  it('never reports a negative expiry, even for an already-expired entry', () => {
    const now = Date.now();
    const label = sourceFreshnessLabel({
      fetchedAt: new Date(now - 30 * 3_600_000).toISOString(),
      expiresAt: new Date(now - 6 * 3_600_000).toISOString(),
      ageHours: 30
    });
    expect(label).toContain('expires in 0h');
  });
});

describe('formatDateTime', () => {
  it('formats a real ISO timestamp as a locale-aware medium date + short time', () => {
    const formatted = formatDateTime('2026-03-05T14:30:00.000Z');
    expect(formatted).toMatch(/2026/);
    expect(typeof formatted).toBe('string');
    expect(formatted.length).toBeGreaterThan(0);
  });
});

describe('notifColor', () => {
  it('maps known notification types to their real accent color', () => {
    expect(notifColor('audit')).toBe('#10B981');
    expect(notifColor('warning')).toBe('#F59E0B');
  });

  it('falls back to a neutral gray for an unknown type instead of throwing', () => {
    expect(notifColor('something-new')).toBe('#94A3B8');
  });
});

describe('riskForAction', () => {
  it('classifies destructive admin actions as high risk', () => {
    expect(riskForAction('SUSPEND_USER')).toBe('high');
    expect(riskForAction('DELETE_DOCUMENT')).toBe('high');
    expect(riskForAction('RESTORE_USER')).toBe('high');
  });

  it('classifies data-sensitive actions as medium risk', () => {
    expect(riskForAction('DATA_DELETION_REQUEST')).toBe('medium');
    expect(riskForAction('PROFILE_UPDATE')).toBe('medium');
  });

  it('classifies everything else as low risk', () => {
    expect(riskForAction('LOGIN')).toBe('low');
    expect(riskForAction('VIEW_USERS')).toBe('low');
  });
});

describe('toCsv', () => {
  it('joins headers and rows with commas and newlines', () => {
    expect(toCsv(['Name', 'Score'], [['Sarah', 94], ['Ali', 82]])).toBe('Name,Score\nSarah,94\nAli,82');
  });

  it('quotes and escapes fields containing commas, quotes, or newlines', () => {
    expect(toCsv(['Note'], [['contains, a comma']])).toBe('Note\n"contains, a comma"');
    expect(toCsv(['Note'], [['has "quotes" inside']])).toBe('Note\n"has ""quotes"" inside"');
    expect(toCsv(['Note'], [['multi\nline']])).toBe('Note\n"multi\nline"');
  });
});

describe('greetingFor', () => {
  const baseApp: VisaApplication = {
    id: 'app-1',
    refCode: 'REF-2026-000001',
    applicantName: 'Sarah Mathew',
    destinationCountry: 'France',
    destinationFlag: '🇫🇷',
    visaType: 'Schengen Tourist',
    status: 'in_progress',
    readinessScore: 60,
    documentsUploaded: 3,
    documentsRequired: 6,
    issuesCount: 2,
    intendedFrom: '2026-09-01'
  };

  it('tells the user how many documents are left and how many issues are open', () => {
    const msg = greetingFor(baseApp, 'Sarah');
    expect(msg.text).toContain('3 documents left to upload');
    expect(msg.text).toContain('2 open issues');
  });

  it('says all documents are uploaded but flags remaining issues', () => {
    const msg = greetingFor({ ...baseApp, documentsUploaded: 6, issuesCount: 1 }, 'Sarah');
    expect(msg.text).toContain('All documents are uploaded');
    expect(msg.text).toContain('1 issue still needs attention');
  });

  it('reports a fully clear application honestly, not a generic message', () => {
    const msg = greetingFor({ ...baseApp, documentsUploaded: 6, issuesCount: 0 }, 'Sarah');
    expect(msg.text).toContain('All documents are uploaded and no open issues remain.');
  });
});
