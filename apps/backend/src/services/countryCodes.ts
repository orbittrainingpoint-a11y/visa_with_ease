import countries from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json' with { type: 'json' };

countries.registerLocale(en);

// ICAO Doc 9303 nationality/issuing-state codes are ISO 3166-1 alpha-3 plus a
// documented set of exceptions for entities that aren't ISO-assigned
// countries (stateless/refugee travel documents, international
// organizations, provisional codes). A code outside both lists isn't
// necessarily wrong — it's just outside what we can resolve here.
const ICAO_NON_ISO_CODES: Record<string, string> = {
  UNK: 'Unknown / undetermined nationality',
  UNA: 'United Nations (laissez-passer, type A)',
  UNO: 'United Nations (laissez-passer, type O)',
  XXA: 'Stateless person (UNHCR convention travel document)',
  XXB: 'Refugee (UNHCR convention travel document)',
  XXC: 'Refugee (non-convention travel document)',
  XXX: 'Unspecified nationality',
  GBD: 'British Overseas Territories Citizen',
  GBN: 'British National (Overseas)',
  GBO: 'British Overseas Citizen',
  GBP: 'British Protected Person',
  GBS: 'British Subject',
  RKS: 'Kosovo (provisional code, not yet ISO-assigned)'
};

/**
 * Resolves an ICAO/MRZ 3-letter nationality or issuing-state code to a
 * human-readable name, or null if it's not found in either the ISO 3166-1
 * alpha-3 table or the documented ICAO non-ISO exceptions.
 */
export function resolveIcaoCountryCode(code: string): string | null {
  const normalized = code.toUpperCase().trim();
  if (ICAO_NON_ISO_CODES[normalized]) return ICAO_NON_ISO_CODES[normalized];
  return countries.getName(normalized, 'en') ?? null;
}
