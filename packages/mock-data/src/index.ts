import type { AuditResult, RequirementsResponse, VisaApplication, VisaContext } from '@visaiq/contracts';

export const sampleVisaContext: VisaContext = {
  nationalities: ['IN'],
  residenceCountry: 'AE',
  travelDocumentType: 'passport',
  travelDocumentIssuer: 'IN',
  destinationCountry: 'FR',
  transitCountries: [],
  visaCategory: 'tourist',
  purpose: 'Schengen holiday',
  intendedFrom: '2026-07-18',
  intendedTo: '2026-07-27',
  language: 'en',
  timezone: 'Asia/Dubai',
  currency: 'USD'
};

export const applications: VisaApplication[] = [
  {
    id: 'app-fr-2026',
    refCode: 'REF-2026-FR-482913-Q',
    applicantName: 'Sarah Mathew',
    destinationCountry: 'France',
    destinationFlag: '🇫🇷',
    visaType: 'Schengen Tourist',
    status: 'in_progress',
    readinessScore: 87,
    documentsUploaded: 4,
    documentsRequired: 6,
    issuesCount: 2,
    intendedFrom: '2026-07-18'
  },
  {
    id: 'app-uk-2026',
    refCode: 'REF-2026-UK-583104-Q',
    applicantName: 'Sarah Mathew',
    destinationCountry: 'United Kingdom',
    destinationFlag: '🇬🇧',
    visaType: 'Standard Visitor',
    status: 'draft',
    readinessScore: 42,
    documentsUploaded: 1,
    documentsRequired: 7,
    issuesCount: 5,
    intendedFrom: '2026-09-04'
  }
];

export const auditResult: AuditResult = {
  documentId: 'doc-passport',
  documentType: 'Passport',
  score: 94,
  status: 'excellent',
  generatedAt: '2026-06-03T14:30:00.000Z',
  findings: [
    {
      id: 'f-validity',
      severity: 'pass',
      title: 'Passport validity passes 6-month rule',
      description: 'The passport remains valid beyond the recommended Schengen travel window.',
      confidence: 98
    },
    {
      id: 'f-name',
      severity: 'info',
      title: 'Name matches uploaded bank statement',
      description: 'Minor spacing variation detected but normalized name comparison is consistent.',
      confidence: 92
    },
    {
      id: 'f-scan',
      severity: 'warn',
      title: 'Scan glare on lower right corner',
      description: 'Retake if embassy upload portal rejects image quality.',
      confidence: 81
    }
  ]
};

export const requirements: RequirementsResponse = {
  coverageStatus: 'supported',
  fees: 'EUR 80 + service fee',
  processingTime: '10-15 business days',
  freshness: {
    fetchedAt: '2026-06-03T12:00:00.000Z',
    expiresAt: '2026-06-04T12:00:00.000Z',
    ageHours: 6
  },
  sourceUrls: [
    { id: 'src-fr-consulate', label: 'France-Visas official portal', url: 'https://france-visas.gouv.fr/' },
    { id: 'src-vfs', label: 'Authorized visa centre guidance', url: 'https://visa.vfsglobal.com/' }
  ],
  requirements: [
    {
      id: 'req-passport',
      title: 'Valid passport',
      description: 'Issued within the last 10 years and valid at least 3 months after departure from Schengen.',
      required: true,
      satisfied: true,
      sourceIds: ['src-fr-consulate']
    },
    {
      id: 'req-bank',
      title: 'Recent bank statements',
      description: 'Three months of statements showing sufficient funds for the itinerary.',
      required: true,
      satisfied: true,
      sourceIds: ['src-fr-consulate']
    },
    {
      id: 'req-insurance',
      title: 'Travel medical insurance',
      description: 'Coverage of at least EUR 30,000 across the Schengen area.',
      required: true,
      satisfied: false,
      sourceIds: ['src-fr-consulate']
    },
    {
      id: 'req-itinerary',
      title: 'Flight and accommodation plan',
      description: 'Reservation details aligned with intended dates.',
      required: true,
      satisfied: false,
      sourceIds: ['src-vfs']
    }
  ]
};

// ── Country-wise visa requirements knowledge base ───────────────────────────
// Real per-destination data, not a single hardcoded dataset reused for every
// country — fees/processing times are consistent with the figures already
// shown elsewhere in the product (country comparison, embassy finder).
// Placeholder — the backend recomputes real freshness (fetchedAt/expiresAt/
// ageHours) at request time, the same way it already does for the default
// France dataset, so this static value is never actually shown to a user.
const PLACEHOLDER_FRESHNESS: RequirementsResponse['freshness'] = {
  fetchedAt: '2026-01-01T00:00:00.000Z', expiresAt: '2026-01-02T00:00:00.000Z', ageHours: 0
};
function freshRequirements(): RequirementsResponse['freshness'] {
  return PLACEHOLDER_FRESHNESS;
}

function req(id: string, title: string, description: string, sourceIds: string[], required = true): RequirementsResponse['requirements'][number] {
  return { id, title, description, required, satisfied: false, sourceIds };
}

export const REQUIREMENTS_BY_COUNTRY: Record<string, RequirementsResponse> = {
  'France': {
    coverageStatus: 'supported', fees: 'EUR 80 + VFS service fee', processingTime: '10-15 business days',
    freshness: freshRequirements(),
    sourceUrls: [{ id: 'src-fr', label: 'France-Visas official portal', url: 'https://france-visas.gouv.fr/' }, { id: 'src-vfs-fr', label: 'VFS Global France', url: 'https://visa.vfsglobal.com/' }],
    requirements: [
      req('req-fr-passport', 'Valid passport', 'Issued within the last 10 years, valid at least 3 months past departure from Schengen.', ['src-fr']),
      req('req-fr-bank', 'Bank statements (3 months)', 'Showing at least EUR 65/day of stay in stable, traceable funds.', ['src-fr']),
      req('req-fr-insurance', 'Travel medical insurance', 'Minimum EUR 30,000 coverage valid across the whole Schengen area.', ['src-fr']),
      req('req-fr-itinerary', 'Flight and accommodation plan', 'Round-trip reservation and lodging for every night of the stay.', ['src-vfs-fr']),
      req('req-fr-photo', 'Biometric photo', '35x45mm, plain light background, taken within the last 6 months.', ['src-vfs-fr']),
    ],
  },
  'United Kingdom': {
    coverageStatus: 'supported', fees: 'GBP 115', processingTime: '15-20 business days',
    freshness: freshRequirements(),
    sourceUrls: [{ id: 'src-uk', label: 'UK Government visas portal', url: 'https://www.gov.uk/check-uk-visa' }],
    requirements: [
      req('req-uk-passport', 'Valid passport', 'Valid for the full duration of the intended stay.', ['src-uk']),
      req('req-uk-bank', 'Bank statements (6 months)', 'Showing sufficient, stable funds to cover the trip without working.', ['src-uk']),
      req('req-uk-biometrics', 'Biometric enrolment', 'Fingerprints and photo captured at a visa application centre.', ['src-uk']),
      req('req-uk-ties', 'Evidence of ties to home country', 'Employment letter, property, or family ties showing intent to return.', ['src-uk']),
    ],
  },
  'United States': {
    coverageStatus: 'supported', fees: 'USD 185', processingTime: '30-60 business days',
    freshness: freshRequirements(),
    sourceUrls: [{ id: 'src-us', label: 'US Department of State — Visas', url: 'https://travel.state.gov/' }],
    requirements: [
      req('req-us-ds160', 'Completed DS-160 form', 'Online nonimmigrant visa application, confirmation page printed for the interview.', ['src-us']),
      req('req-us-passport', 'Valid passport', 'Valid for at least 6 months beyond the intended stay.', ['src-us']),
      req('req-us-photo', 'Visa photograph', '2x2 inch, taken within the last 6 months, meeting US photo requirements.', ['src-us']),
      req('req-us-interview', 'Consular interview', 'In-person interview at the embassy or consulate is required for most applicants.', ['src-us']),
      req('req-us-ties', 'Evidence of ties to home country', 'Employment, property, or family ties establishing non-immigrant intent.', ['src-us']),
    ],
  },
  'Canada': {
    coverageStatus: 'supported', fees: 'CAD 100', processingTime: '20-30 business days',
    freshness: freshRequirements(),
    sourceUrls: [{ id: 'src-ca', label: 'IRCC — Immigration, Refugees and Citizenship Canada', url: 'https://www.canada.ca/en/immigration-refugees-citizenship.html' }],
    requirements: [
      req('req-ca-passport', 'Valid passport', 'Valid for the duration of the planned stay in Canada.', ['src-ca']),
      req('req-ca-bank', 'Proof of funds', 'Bank statements showing enough funds for the trip and return.', ['src-ca']),
      req('req-ca-biometrics', 'Biometrics', 'Fingerprints and photo, valid for 10 years once given.', ['src-ca']),
      req('req-ca-purpose', 'Letter of explanation', 'Purpose of visit, ties to home country, and travel plans.', ['src-ca']),
    ],
  },
  'Australia': {
    coverageStatus: 'supported', fees: 'AUD 145', processingTime: '20-40 business days',
    freshness: freshRequirements(),
    sourceUrls: [{ id: 'src-au', label: 'Australian Department of Home Affairs', url: 'https://immi.homeaffairs.gov.au/' }],
    requirements: [
      req('req-au-passport', 'Valid passport', 'Machine-readable, valid for the intended stay.', ['src-au']),
      req('req-au-health', 'Health and character requirements', 'May include a medical exam depending on nationality and duration.', ['src-au']),
      req('req-au-bank', 'Evidence of funds', 'Sufficient funds for the stay and a return or onward ticket.', ['src-au']),
      req('req-au-itinerary', 'Travel itinerary', 'Flight and accommodation details for the visit.', ['src-au']),
    ],
  },
  'Germany': {
    coverageStatus: 'supported', fees: 'EUR 75', processingTime: '10-15 business days',
    freshness: freshRequirements(),
    sourceUrls: [{ id: 'src-de', label: 'German Missions in the UAE / Federal Foreign Office', url: 'https://www.auswaertiges-amt.de/' }],
    requirements: [
      req('req-de-passport', 'Valid passport', 'Issued within 10 years, valid 3+ months past departure from Schengen.', ['src-de']),
      req('req-de-bank', 'Proof of financial means', 'Bank statements or a formal sponsorship declaration (Verpflichtungserklärung).', ['src-de']),
      req('req-de-insurance', 'Schengen travel insurance', 'Minimum EUR 30,000 medical coverage.', ['src-de']),
      req('req-de-itinerary', 'Flight and hotel reservations', 'Covering every day of the intended stay.', ['src-de']),
    ],
  },
  'Japan': {
    coverageStatus: 'supported', fees: 'JPY 3,000 (single-entry)', processingTime: '5-10 business days',
    freshness: freshRequirements(),
    sourceUrls: [{ id: 'src-jp', label: 'Ministry of Foreign Affairs of Japan', url: 'https://www.mofa.go.jp/j_info/visit/visa/' }],
    requirements: [
      req('req-jp-passport', 'Valid passport', 'Valid for the duration of the intended stay.', ['src-jp']),
      req('req-jp-itinerary', 'Detailed travel itinerary', 'Day-by-day plan, often required with the application.', ['src-jp']),
      req('req-jp-bank', 'Proof of sufficient funds', 'Bank statement or sponsor\'s guarantee letter.', ['src-jp']),
    ],
  },
  'UAE': {
    coverageStatus: 'supported', fees: 'AED 350-1,100 depending on duration', processingTime: '3-5 business days',
    freshness: freshRequirements(),
    sourceUrls: [{ id: 'src-uae', label: 'UAE ICP — Federal Authority for Identity, Citizenship, Customs & Port Security', url: 'https://icp.gov.ae/' }],
    requirements: [
      req('req-uae-passport', 'Valid passport', 'Valid for at least 6 months from the date of entry.', ['src-uae']),
      req('req-uae-photo', 'Passport-size photograph', 'White background, taken within the last 6 months.', ['src-uae']),
      req('req-uae-ticket', 'Confirmed return ticket', 'Round-trip flight booking.', ['src-uae']),
      req('req-uae-hotel', 'Hotel booking or host sponsorship', 'Accommodation proof or an Emirates ID holder sponsor.', ['src-uae']),
    ],
  },
  'India': {
    coverageStatus: 'supported', fees: 'Varies by nationality — from USD 10 (e-Visa)', processingTime: '3-5 business days (e-Visa)',
    freshness: freshRequirements(),
    sourceUrls: [{ id: 'src-in', label: 'Indian Bureau of Immigration — e-Visa', url: 'https://indianvisaonline.gov.in/' }],
    requirements: [
      req('req-in-passport', 'Valid passport', 'At least 6 months validity with 2 blank pages.', ['src-in']),
      req('req-in-photo', 'Digital photograph', 'Recent, white background, meeting e-Visa photo specs.', ['src-in']),
      req('req-in-ticket', 'Proof of onward/return travel', 'Confirmed itinerary for the visit.', ['src-in']),
    ],
  },
  'Singapore': {
    coverageStatus: 'supported', fees: 'SGD 30', processingTime: '3-5 business days',
    freshness: freshRequirements(),
    sourceUrls: [{ id: 'src-sg', label: 'Immigration & Checkpoints Authority of Singapore', url: 'https://www.ica.gov.sg/' }],
    requirements: [
      req('req-sg-passport', 'Valid passport', 'At least 6 months validity from date of entry.', ['src-sg']),
      req('req-sg-form14a', 'Completed Form 14A', 'Visa application form, signed.', ['src-sg']),
      req('req-sg-bank', 'Proof of financial standing', 'Bank statements for the last 3-6 months.', ['src-sg']),
    ],
  },
  'Turkey': {
    coverageStatus: 'supported', fees: 'USD 60 (e-Visa, varies by nationality)', processingTime: 'Instant to 24 hours (e-Visa)',
    freshness: freshRequirements(),
    sourceUrls: [{ id: 'src-tr', label: 'Republic of Türkiye e-Visa portal', url: 'https://www.evisa.gov.tr/' }],
    requirements: [
      req('req-tr-passport', 'Valid passport', 'Valid for at least 6 months from arrival.', ['src-tr']),
      req('req-tr-ticket', 'Return ticket', 'Confirmed round-trip or onward travel.', ['src-tr']),
      req('req-tr-hotel', 'Accommodation proof', 'Hotel booking for the length of stay.', ['src-tr'], false),
    ],
  },
};

/** Falls back to the generic France dataset if the destination isn't in the knowledge base yet. */
export function getRequirementsForCountry(country?: string): RequirementsResponse {
  if (country && REQUIREMENTS_BY_COUNTRY[country]) return REQUIREMENTS_BY_COUNTRY[country];
  return requirements;
}
