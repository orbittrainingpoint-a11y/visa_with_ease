// Scanning/upload guidance per document type and the "how to use" overview.
// Mirrors the mobile app's guides (apps/mobile/src/documentRecognition.ts + tour.ts)
// so both apps give the same advice.

export interface DocGuide {
  title: string;
  intro: string;
  steps: string[];
  avoid: string[];
}

export const DOC_GUIDES: Record<string, DocGuide> = {
  passport: {
    title: 'Passport photo page',
    intro: 'Photograph or scan the page with your photo and the two lines of < characters at the bottom.',
    steps: [
      'Open the passport flat to the photo page.',
      'Fit the whole page in the picture — all four corners visible.',
      'Keep both < lines at the bottom in the picture.',
      'Use good light; a scan or a sharp, straight-on photo works best.'
    ],
    avoid: ['Glare or flash reflections on the laminate', 'Fingers covering any text', 'A photo of a screen or a photocopy']
  },
  bank: {
    title: 'Bank statement',
    intro: 'Your latest statement covering the last 3 months.',
    steps: [
      'Show the bank name or letterhead, your name and the closing balance.',
      'A PDF downloaded from your bank app is best.',
      'For photos, capture one page at a time, flat, filling the frame.'
    ],
    avoid: ['Cropped edges or folded pages', 'Blurry or dark photos', 'Edited or re-typed statements']
  },
  employment: {
    title: 'Employment / student letter',
    intro: 'A signed letter from your employer or institution.',
    steps: [
      'Company letterhead with your name, role and joining date (and salary for an employment letter).',
      'Signature and date visible — ideally issued in the last 30 days.',
      'Include a contact for verification.'
    ],
    avoid: ['Unsigned or undated letters', 'Shadows across the text']
  },
  insurance: {
    title: 'Travel medical insurance',
    intro: 'The policy certificate for your whole trip.',
    steps: [
      'Your name and policy number visible.',
      'Cover dates must include your entire stay.',
      'Schengen visas need at least €30,000 medical cover — make sure the amount shows.'
    ],
    avoid: ['A payment receipt instead of the certificate', 'Cover dates that end before your return']
  },
  itinerary: {
    title: 'Flight & hotel reservation',
    intro: 'Bookings that show where you will be and when.',
    steps: [
      'Flight reservation with your name, route and dates.',
      'Hotel booking covering the whole stay, with the address.',
      'Booking reference visible on each.'
    ],
    avoid: ['Screenshots with the reference cut off', 'Dates that do not match your application']
  },
  photo: {
    title: 'Biometric photo',
    intro: 'A recent passport-style photo of your face.',
    steps: [
      'Face the camera straight on, centred.',
      'Plain light background with no shadows.',
      'Eyes open, neutral expression, nothing covering your face.'
    ],
    avoid: ['Glasses, hats or heavy filters', 'Group photos or side angles']
  },
  other: {
    title: 'Supporting document',
    intro: 'Any other document that supports your application.',
    steps: ['Fill the frame with the document.', 'Make sure all text is sharp and readable.', 'Include every page that matters, one at a time.'],
    avoid: ['Cropped edges', 'Glare or shadows']
  }
};

export const HOW_TO_SECTIONS: Array<{ title: string; items: string[] }> = [
  {
    title: 'Getting started',
    items: [
      'Create an application: Applications → New — choose destination and visa type.',
      'Read the requirements checklist and note anything marked required.',
      'Upload each document with the right document type selected.',
      'Open the audit report for each document, fix anything flagged, then upload again.',
      'Ask the assistant or book a consultant if you are unsure about anything.'
    ]
  },
  {
    title: 'What your score means',
    items: [
      '75 and above: strong — few or no issues found.',
      '50 to 74: needs work — fix the amber warnings.',
      'Below 50: major gaps — usually a missing, unreadable or wrong document.',
      'A requirement is only ticked once you upload a document that passed its check.',
      'The score measures readiness of your paperwork. It does not predict the embassy’s decision.'
    ]
  },
  {
    title: 'Requirements you can trust',
    items: [
      'Every requirement explains why it is needed and links to its official source.',
      'A green banner means our team verified the country against the official source on the date shown.',
      '“Not yet verified” means guidance only — always confirm on the official site.'
    ]
  },
  {
    title: 'Your privacy',
    items: [
      'Your original file is analysed and not retained afterwards — only the result is stored with your account.',
      'Consultants only see the document categories you approve, and you can revoke access.',
      'You can request deletion of your data from Settings.'
    ]
  }
];
