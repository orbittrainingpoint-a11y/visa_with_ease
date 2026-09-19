import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFS_KEY = 'visaiq.settings_prefs';

export interface SettingsPreferences {
  pushNotifications: boolean;
  emailDigest: boolean;
  tripReminders: boolean;
  biometricEnabled: boolean;
  // Carried forward from onboarding/first application so the user is never
  // asked for these again — nationality and country of residence rarely
  // change, unlike a per-application destination country.
  nationality: string;
  residenceCountry: string;
}

export const DEFAULT_PREFERENCES: SettingsPreferences = {
  pushNotifications: true,
  emailDigest: true,
  tripReminders: true,
  biometricEnabled: false,
  nationality: '',
  residenceCountry: '',
};

export async function loadPreferences(): Promise<SettingsPreferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } : { ...DEFAULT_PREFERENCES };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export async function savePreferences(patch: Partial<SettingsPreferences>): Promise<SettingsPreferences> {
  const current = await loadPreferences();
  const next = { ...current, ...patch };
  try {
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
  } catch { /* storage unavailable */ }
  return next;
}
