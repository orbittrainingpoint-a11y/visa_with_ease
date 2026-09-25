// One place that decides which features are "free" and which are "pro".
//
// TESTING MODE: PLAN_ENFORCED is false, so every feature is available to everyone and
// the tiers below only drive the small "PRO" labels. When the product is ready to sell,
// the switch is:
//   1. set PLAN_ENFORCED = true,
//   2. make `currentPlan` come from the signed-in user's real subscription,
//   3. adjust FEATURE_TIERS below to the final split.
// Every gated entry point already goes through `canUse`, so nothing else needs to change.

export type Tier = 'free' | 'pro';

export const PLAN_ENFORCED = false;

/** Until subscriptions exist there is nothing to read this from. */
export const currentPlan: Tier = 'free';

export type FeatureId =
  | 'upload' | 'analyze' | 'askAi' | 'newApplication' | 'requirements' | 'bookConsultant'
  | 'scoreCalculator' | 'faceVerify' | 'bankEstimator' | 'embassyFinder' | 'timeline'
  | 'compareCountries' | 'waiverChecker' | 'rejectionAnalyzer' | 'multiApplication'
  | 'pdfExport' | 'teamWorkspace';

/** Proposed split — core visa preparation is free; power tools and team features are pro. */
export const FEATURE_TIERS: Record<FeatureId, Tier> = {
  upload: 'free',
  analyze: 'free',
  askAi: 'free',
  newApplication: 'free',
  requirements: 'free',
  bookConsultant: 'free',
  embassyFinder: 'free',
  waiverChecker: 'free',
  scoreCalculator: 'pro',
  faceVerify: 'pro',
  bankEstimator: 'pro',
  timeline: 'pro',
  compareCountries: 'pro',
  rejectionAnalyzer: 'pro',
  multiApplication: 'pro',
  pdfExport: 'pro',
  teamWorkspace: 'pro',
};

export function tierOf(feature: FeatureId): Tier {
  return FEATURE_TIERS[feature];
}

/** Can the current user open this feature right now? Always true while PLAN_ENFORCED is off. */
export function canUse(feature: FeatureId, plan: Tier = currentPlan): boolean {
  if (!PLAN_ENFORCED) return true;
  return FEATURE_TIERS[feature] === 'free' || plan === 'pro';
}
