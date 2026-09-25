// Device biometric lock: fingerprint / face unlock (whatever the phone has enrolled) that guards the app after
// sign-in. The choice is per account, so two people sharing a phone each have their own setting, and the
// biometric itself never leaves the phone — the OS only tells us "it was you".

import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'visaiq.biolock.v1';

interface Store {
  /** Accounts that turned the lock on. */
  enabled: string[];
  /** Accounts already offered the lock once (so we never nag). */
  asked: string[];
  /** Accounts that chose "later" on the first-time face check. */
  faceSkipped: string[];
}

async function read(): Promise<Store> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Store>) : {};
    return { enabled: parsed.enabled ?? [], asked: parsed.asked ?? [], faceSkipped: parsed.faceSkipped ?? [] };
  } catch {
    return { enabled: [], asked: [], faceSkipped: [] };
  }
}

async function write(store: Store) {
  try { await AsyncStorage.setItem(KEY, JSON.stringify(store)); } catch { /* storage unavailable — the choice just won't persist */ }
}

const withUid = (list: string[], uid: string, on: boolean) => (on ? [...new Set([...list, uid])] : list.filter((u) => u !== uid));

export interface BiometricSupport {
  available: boolean;
  /** "Fingerprint", "Face unlock", "Fingerprint or face"… — named after what the phone actually has enrolled. */
  label: string;
  fingerprint: boolean;
  face: boolean;
}

export async function getBiometricSupport(): Promise<BiometricSupport> {
  try {
    const [hasHw, enrolled] = await Promise.all([LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync()]);
    if (!hasHw || !enrolled) return { available: false, label: 'Biometrics', fingerprint: false, face: false };
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const fingerprint = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
    const face = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
    const label = fingerprint && face ? 'Fingerprint or face' : fingerprint ? 'Fingerprint' : face ? 'Face unlock' : 'Biometrics';
    return { available: true, label, fingerprint, face };
  } catch {
    return { available: false, label: 'Biometrics', fingerprint: false, face: false };
  }
}

export interface BiometricResult { ok: boolean; /** The user backed out (not a failure worth an error message). */ cancelled: boolean; error?: string }

export async function authenticateBiometric(promptMessage: string): Promise<BiometricResult> {
  try {
    const r = await LocalAuthentication.authenticateAsync({ promptMessage, cancelLabel: 'Cancel', fallbackLabel: 'Use phone PIN', disableDeviceFallback: false });
    if (r.success) return { ok: true, cancelled: false };
    const cancelled = r.error === 'user_cancel' || r.error === 'system_cancel' || r.error === 'app_cancel';
    return { ok: false, cancelled, error: r.error };
  } catch (e: any) {
    return { ok: false, cancelled: false, error: e?.message ?? 'unavailable' };
  }
}

export async function isLockEnabled(uid: string): Promise<boolean> { return (await read()).enabled.includes(uid); }
export async function setLockEnabled(uid: string, on: boolean): Promise<void> { const s = await read(); await write({ ...s, enabled: withUid(s.enabled, uid, on) }); }
export async function wasAsked(uid: string): Promise<boolean> { return (await read()).asked.includes(uid); }
export async function markAsked(uid: string): Promise<void> { const s = await read(); await write({ ...s, asked: withUid(s.asked, uid, true) }); }
export async function faceGateSkipped(uid: string): Promise<boolean> { return (await read()).faceSkipped.includes(uid); }
export async function markFaceGateSkipped(uid: string): Promise<void> { const s = await read(); await write({ ...s, faceSkipped: withUid(s.faceSkipped, uid, true) }); }
