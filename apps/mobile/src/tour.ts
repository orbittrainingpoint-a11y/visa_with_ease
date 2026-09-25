import AsyncStorage from '@react-native-async-storage/async-storage';

// Content for the first-run "Take a tour" walkthrough and the How-to screen.
// Every claim here describes something the app really does today.

export type TourTarget = 'newApp' | 'requirements' | 'upload' | 'chat' | 'consultants' | 'howTo';

export interface TourStep {
  icon: string;
  title: string;
  body: string;
  action?: { label: string; target: TourTarget };
}

export const TOUR_STEPS: TourStep[] = [
  {
    icon: 'compass-outline',
    title: 'Welcome to Visa With Ease',
    body: 'Know exactly what your visa needs before you apply. This one-minute tour shows how it works — you can replay it any time from Profile.',
  },
  {
    icon: 'add-circle-outline',
    title: 'Start an application',
    body: 'Open the Apps tab and tap New. Pick your destination and visa type, and Visa With Ease builds your personal checklist and readiness score.',
    action: { label: 'Start an application', target: 'newApp' },
  },
  {
    icon: 'list-outline',
    title: 'Your requirements checklist',
    body: 'Every requirement explains why it is needed and links to the official source. A green banner means our team verified it against that source; otherwise treat it as guidance and confirm on the official site.',
    action: { label: 'See requirements', target: 'requirements' },
  },
  {
    icon: 'scan-outline',
    title: 'Scan or upload documents',
    body: 'Choose the document type first and you get a step-by-step guide. The camera reads the page live, ticks each requirement as it is met, and captures automatically. Passports are read and checked — expiry date and data checksums included.',
    action: { label: 'Try the scanner', target: 'upload' },
  },
  {
    icon: 'speedometer-outline',
    title: 'Understand your score',
    body: 'Each document gets a 0–100 readiness score with findings: red is serious, amber is a warning, green passed. Fix what is flagged, rescan, and your application score rises. It is a readiness check — not a visa decision.',
  },
  {
    icon: 'chatbubbles-outline',
    title: 'Ask the assistant',
    body: 'Ask about your own application. “What’s my score?” and “How do I apply?” are answered instantly from your data. Always confirm important points with the official embassy.',
    action: { label: 'Open chat', target: 'chat' },
  },
  {
    icon: 'people-outline',
    title: 'Talk to an expert',
    body: 'Book a verified consultant when your case is complex. You choose exactly which document categories they can see, and you can revoke access afterwards.',
    action: { label: 'Browse consultants', target: 'consultants' },
  },
  {
    icon: 'help-buoy-outline',
    title: 'Need this again?',
    body: 'Profile → “How to use Visa With Ease” keeps every guide — including the scanning guide for each document — one tap away.',
    action: { label: 'Open the guide', target: 'howTo' },
  },
];

export const HOW_TO_SECTIONS: Array<{ title: string; icon: string; items: string[] }> = [
  {
    title: 'Getting started',
    icon: 'rocket-outline',
    items: [
      'Create an application: Apps tab → New → choose destination and visa type.',
      'Read the requirements checklist and note anything marked required.',
      'Scan or upload each document. The scanner checks it as you go.',
      'Open the audit report for each document, fix anything flagged, then rescan.',
      'Ask the assistant or book a consultant if you are unsure about anything.',
    ],
  },
  {
    icon: 'camera-outline',
    title: 'Scanning tips',
    items: [
      'Good light and a flat surface matter more than anything else.',
      'Fill the frame — all four corners of the page inside the guide.',
      'Wait for every check on screen to tick; the photo is taken automatically.',
      'Turn Auto off if you would rather press the shutter yourself.',
      'Glare, fingers over text and photos of screens are the most common reasons a scan fails.',
    ],
  },
  {
    icon: 'speedometer-outline',
    title: 'What your score means',
    items: [
      '75 and above: strong — few or no issues found.',
      '50 to 74: needs work — fix the amber warnings.',
      'Below 50: major gaps — usually a missing, unreadable or wrong document.',
      'A requirement is only ticked once you upload a document that passed its check.',
      'The score measures readiness of your paperwork. It does not predict the embassy’s decision.',
    ],
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Your privacy',
    items: [
      'Documents are checked on your phone first; the file is only uploaded when you confirm.',
      'Consultants only see the document categories you approve, and you can revoke access.',
      'You can request deletion of your data from Profile → Privacy and access.',
    ],
  },
];

const TOUR_KEY = 'visaiq.tourSeen.v1';

export async function hasSeenTour(): Promise<boolean> {
  try { return (await AsyncStorage.getItem(TOUR_KEY)) === 'yes'; } catch { return true; }
}
export async function markTourSeen(): Promise<void> {
  try { await AsyncStorage.setItem(TOUR_KEY, 'yes'); } catch { /* the tour may simply show again next launch */ }
}
