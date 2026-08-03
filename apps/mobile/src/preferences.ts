import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFS_KEY = 'visaiq.settings_prefs';

export interface SettingsPreferences {
  pushNotifications: boolean;
  emailDigest: boolean;
  tripReminders: boolean;
  biometricEnabled: boolean;
}

export const DEFAULT_PREFERENCES: SettingsPreferences = {
  pushNotifications: true,
  emailDigest: true,
  tripReminders: true,
  biometricEnabled: false,
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
