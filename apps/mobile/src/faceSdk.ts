// Thin, defensive wrapper over FaceAISDK (@faceaisdk/react-native-face-sdk).
//
// The SDK is a native module that only works on a physical phone. Everything here is safe to call
// anywhere: when the module isn't present (emulator, unsupported device) `faceSdkAvailable()` is false and
// callers show an honest "needs a real phone" message instead of crashing.
//
// Licence: the SDK is proprietary — free for evaluation, a commercial licence is required for production
// (see the package's LICENSE). Confirm licensing before shipping this feature to real users.

import { Platform } from 'react-native';
import type { FaceResult } from '@faceaisdk/react-native-face-sdk';

type FaceModule = typeof import('@faceaisdk/react-native-face-sdk');
let cached: FaceModule | null | undefined;

function load(): FaceModule | null {
  if (cached === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      cached = require('@faceaisdk/react-native-face-sdk') as FaceModule;
    } catch {
      cached = null;
    }
  }
  return cached;
}

/** Android emulators can't run the SDK's native engine (and it can crash them), so they are reported as unsupported. */
function looksLikeEmulator(): boolean {
  if (Platform.OS !== 'android') return false;
  const c = Platform.constants as { Model?: string; Fingerprint?: string; Brand?: string };
  const text = `${c.Model ?? ''} ${c.Fingerprint ?? ''}`.toLowerCase();
  return /sdk_gphone|emulator|generic|goldfish|ranchu|vbox|x86_64/.test(text);
}

export function faceSdkAvailable(): boolean {
  if (looksLikeEmulator()) return false;
  const m = load();
  try { return !!m && m.isFaceAIModuleAvailable(); } catch { return false; }
}

function sdk(): FaceModule {
  const m = load();
  if (!m || !faceSdkAvailable()) throw new Error('The face verification engine is not available on this device.');
  return m;
}

/** Scores may come back 0-1 or 0-100 depending on the build; everything downstream uses 0-1. */
export const norm = (n: number) => (n > 1 ? n / 100 : n);

export const passportFaceId = (uid: string) => `passport-${uid}`;
export const accountFaceId = (uid: string) => `account-${uid}`;

/** Registers the face cropped from the passport photo as the reference to match the live face against. */
export async function enrolPassportFace(uid: string, base64Jpeg: string): Promise<FaceResult> {
  return sdk().addFaceByImage(passportFaceId(uid), base64Jpeg);
}

export interface LiveCheck { similarity: number; liveness: number; faceFeature: string; message: string; ok: boolean }

/**
 * Live check against an enrolled face: the SDK asks the person to perform several head/face motions
 * (blink, mouth, nod, turn — like a bank app) and returns a similarity and a liveness score.
 */
export async function liveVerify(faceId: string, thresholds: { similarity: number; liveness: number }): Promise<LiveCheck> {
  const r = await sdk().faceVerify(faceId, {
    threshold: thresholds.similarity,
    livenessType: 1,          // motion-based liveness
    motionTypes: '1,2,3,4,5',
    steps: 3,                 // three different motions — covers several face angles
    timeout: 12,
    allowMultiFaces: false,   // more than one person in frame is a failure
  });
  const similarity = norm(r.similarity);
  const liveness = norm(r.liveness);
  return { similarity, liveness, faceFeature: r.faceFeature, message: r.message, ok: similarity >= thresholds.similarity && liveness >= thresholds.liveness };
}

/** Captures the live face with the SDK camera, for when the verify result did not include a template. */
export async function captureAccountFace(uid: string): Promise<FaceResult> {
  return sdk().addFaceBySDKCamera(accountFaceId(uid), { mode: 1, showConfirm: false });
}

export async function loadAccountTemplate(uid: string, template: string): Promise<void> {
  const existing = await sdk().getFaceFeature(accountFaceId(uid));
  if (existing.faceFeature) return;
  await sdk().insertFaceFeature(accountFaceId(uid), template);
}

/** Removes the passport-photo reference once matching is done: it is only needed for the comparison. */
export async function forgetPassportFace(uid: string): Promise<void> {
  try { await sdk().deleteFaceFeature(passportFaceId(uid)); } catch { /* best effort */ }
}
