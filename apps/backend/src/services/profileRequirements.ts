// Turns the applicant's answers into their own checklist.
//
// The country's official requirements are the base. On top of that, each answer adds what that person actually
// needs: a sponsor brings a sponsor letter, a refusal brings the refusal letter, a student brings an enrolment
// letter, and so on. Nothing is shown as required that the answers don't call for, and every item says why it is
// asked for, so the client understands the list instead of just ticking it off.

import type { ApplicantProfile, Requirement, RequirementsResponse } from '@visaiq/contracts';

type Item = Requirement & { docType: string };

/** Which document type a base requirement is, from its title (the official lists are plain-language). */
export function docTypeOf(title: string): string {
  const t = title.toLowerCase();
  if (/passport/.test(t)) return 'passport';
  if (/bank|financ|statement|fund/.test(t)) return 'bank';
  if (/insurance/.test(t)) return 'insurance';
  if (/ticket|flight|hotel|accommodation|itinerary|reservation/.test(t)) return 'itinerary';
  if (/photo/.test(t)) return 'photo';
  if (/employ|job|salary/.test(t)) return 'employment';
  if (/sponsor/.test(t)) return 'sponsor';
  if (/business|company|trade|tax/.test(t)) return 'business';
  if (/enrol|student|admission|course/.test(t)) return 'study';
  return 'other';
}

function item(id: string, title: string, description: string, why: string, docType: string, sourceIds: string[]): Item {
  return { id, title, description, why, required: true, satisfied: false, sourceIds, docType };
}

/** The checklist for one applicant: the official base, adjusted by their answers. Pure and deterministic. */
export function requirementsForProfile(base: RequirementsResponse, profile?: ApplicantProfile | null): RequirementsResponse {
  const sources = base.sourceUrls.slice(0, 1).map((s) => s.id);
  const items: Item[] = base.requirements.map((r) => ({ ...r, docType: r.docType ?? docTypeOf(r.title) }));
  const has = (docType: string) => items.some((i) => i.docType === docType);
  // Skip an answer-driven item when the official list already asks for that kind of document (e.g. a bank
  // statement), so the same document is never listed twice. Sponsor, refusal and family items are always added.
  const ALREADY_IN_OFFICIAL_LIST = ['employment', 'bank', 'study', 'business'];
  const add = (i: Item) => {
    if (items.some((x) => x.id === i.id)) return;
    if (ALREADY_IN_OFFICIAL_LIST.includes(i.docType) && has(i.docType)) return;
    items.push(i);
  };
  if (!profile || Object.keys(profile).length === 0) return { ...base, requirements: items };

  // Work or income
  switch (profile.employmentStatus) {
    case 'employed':
      add(item('profile-employment-letter', 'Employment letter', 'On company letterhead, signed and dated within the last 30 days, with your role, salary and approved leave.', 'Shows you have a job to return to, so the officer can see why you will leave.', 'employment', sources));
      break;
    case 'self_employed':
      add(item('profile-business-registration', 'Business registration and tax returns', 'Trade licence or company registration, plus the last two years of tax returns or income statements.', 'Self-employed applicants prove income and ties through their business records.', 'business', sources));
      break;
    case 'student':
      add(item('profile-enrolment-letter', 'Enrolment letter', 'From your institution: your enrolment, course dates and fees paid.', 'Confirms you are a student who will go back to study.', 'study', sources));
      break;
    case 'unemployed':
    case 'homemaker':
      add(item('profile-funds-proof', 'Proof of funds for the trip', 'Bank statements for the last three months that show how the trip is paid for.', 'Without a job, the officer needs another clear source of money for the stay.', 'bank', sources));
      break;
    case 'retired':
      add(item('profile-pension', 'Pension statement', 'Your latest pension or retirement income statement.', 'Retirement income shows you can pay for the trip and have ties to home.', 'bank', sources));
      break;
  }

  // Purpose of the trip
  if (profile.purpose === 'business') add(item('profile-invitation-business', 'Invitation letter from the host company', 'On letterhead, with the purpose and dates of the visit.', 'Business visits need proof of the meeting or event.', 'business', sources));
  if (profile.purpose === 'family_visit') add(item('profile-host-invitation', 'Host invitation and host ID', 'Signed invitation from the family member you will stay with, with a copy of their residence ID.', 'The officer needs to know who you are staying with.', 'family', sources));
  if (profile.purpose === 'study') add(item('profile-admission', 'Admission letter and course details', 'Your offer or admission letter and the course timetable.', 'Confirms the reason for the trip is study.', 'study', sources));
  if (profile.purpose === 'medical') add(item('profile-medical-letter', 'Hospital appointment letter', 'Letter from the hospital with your appointment date and treatment plan.', 'Medical trips need proof of the treatment and its dates.', 'medical', sources));

  // Money from someone else
  if (profile.financialSponsor && profile.financialSponsor !== 'none' && profile.financialSponsor !== 'self') {
    add(item('profile-sponsor-letter', 'Sponsor letter and sponsor bank statements', 'A signed letter from the person or company paying for the trip, with their bank statements and ID.', 'Someone else is paying, so the officer must see who they are and that they can afford it.', 'sponsor', sources));
  }

  // Travel history
  if (profile.travelHistory === 'previously_refused') {
    add(item('profile-refusal-letter', 'Previous refusal letter and your explanation', 'The refusal letter from your earlier application and a written explanation of what has changed since.', 'A previous refusal is reviewed with this application. It has to be explained, not left out.', 'refusal', sources));
  }
  if (profile.travelHistory === 'overstayed') {
    add(item('profile-overstay-explanation', 'Written explanation of the earlier overstay', 'What happened, when it ended, and any supporting evidence.', 'Overstays are reviewed closely and must be disclosed.', 'refusal', sources));
  }

  // Family
  if (profile.familySituation === 'married' || profile.familySituation === 'with_children' || profile.familySituation === 'with_dependants') {
    add(item('profile-marriage-certificate', 'Marriage certificate', 'A certified copy.', 'Family ties at home support your plan to return.', 'family', sources));
  }
  if (profile.familySituation === 'with_children') {
    add(item('profile-children-birth', 'Birth certificates of your children', 'Certified copies, for each child travelling or staying at home.', 'Shows the family you are returning to.', 'family', sources));
  }

  // Age
  if (profile.age !== undefined && profile.age < 18) {
    add(item('profile-parental-consent', 'Parental consent letter', 'Signed by both parents or guardians, with copies of their IDs.', 'Applicants under 18 who travel without both parents need written consent.', 'consent', sources));
  }

  return { ...base, requirements: items };
}

/** The document types a client can be asked to upload for this applicant (required items only). */
export function requiredDocTypes(base: RequirementsResponse, profile?: ApplicantProfile | null): string[] {
  return requirementsForProfile(base, profile).requirements.filter((r) => r.required).map((r) => (r as Item).docType);
}
