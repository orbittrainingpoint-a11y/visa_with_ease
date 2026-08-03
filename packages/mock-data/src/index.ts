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
