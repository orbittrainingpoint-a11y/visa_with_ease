import type { RequirementsResponse } from '@visaiq/contracts';

// What an admin-managed country override looks like at rest: the visible
// requirements data plus who verified it against the official sources, and when.
export type RequirementsOverrideData = Omit<RequirementsResponse, 'freshness' | 'verification'> & {
  verifiedAt?: string | null;
  verifiedBy?: string | null;
};

/** Turns stored override data into the client-facing shape (adds `verification`, strips storage fields). */
export function toClientRequirements(data: RequirementsOverrideData): Omit<RequirementsResponse, 'freshness'> {
  const { verifiedAt, verifiedBy, ...rest } = data;
  return {
    ...rest,
    verification: verifiedAt
      ? { status: 'verified', verifiedAt, verifiedBy: verifiedBy ?? null }
      : { status: 'unverified', verifiedAt: null, verifiedBy: null }
  };
}
