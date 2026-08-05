# VisaIQ — Critical Issues, Bugs & Production Readiness

**Date:** 2026-08-05
**Scope:** Full audit of `apps/web`, `apps/mobile`, `apps/backend`, run via three independent read-only agents (one per app) plus manual verification and fixes for the highest-severity findings.

> ⚠️ **Verification caveat:** Node.js/npm/npx stopped resolving on this machine partway through this session (worked earlier in the same session, then vanished from PATH with no install found anywhere on C:\ or D:\). All fixes below were made by careful manual code review, not by running the type-checker, Playwright suite, or backend contract tests. **Run `pnpm -r typecheck`, `pnpm --filter @visaiq/backend test:all`, and `pnpm --filter @visaiq/web test:smoke` once Node.js is available again** before treating this as verified.

---

## 1. The AI chat guardrail — how "don't let people ask off-topic questions" actually works

This was already implemented in `apps/backend/src/services/aiProviders.ts` before this pass, and has been extended:

- **Topic scoping**: a system prompt (`VISA_SYSTEM_PROMPT_BASE`) instructs the model to only answer visa/immigration/travel-document questions and to refuse anything else with a fixed redirect line.
- **Pre-filter**: `isOffTopic()` regex-matches the incoming message before any AI call is made at all (saves tokens, and guarantees a deterministic refusal even in mock mode where no real LLM is called). Both the web (`WEB_CHAT_KB`/off-topic pattern) and mobile (`isOffTopicMessage`) clients also carry a client-side copy of this check for instant feedback.
- **Data source (new this pass)**: previously the assistant's only "knowledge" was the static system prompt — it never actually looked at the user's real application. Now `/chat`'s handler (`app.ts`) looks up the caller's own application via `services.applications.getApplication(applicationId, uid)` — **scoped to the caller, never another user's data** — and passes it into `aiProviders.ts` as `grounding`. The system prompt gets a `buildGroundingBlock()` appended listing the application's real destination, visa type, status, readiness score, documents uploaded, and travel date, with an explicit instruction: *"treat it as the authoritative source... do not invent documents, scores, or dates that aren't in that block."* The mock fallback reply (used whenever `AI_MOCK=true`, i.e. always today) also now uses this same real data instead of a generic canned line.
- **What "data source" means going forward**: today that data source is `services.applications` — an in-memory, per-user Map seeded only by what the user has actually created via `POST /applications`. In production this becomes whatever real database backs applications (Postgres/Firestore — see §2). No separate "knowledge base" or vector store is wired up; if you want the assistant to also answer from a live requirements database (e.g. actual embassy rules) rather than general LLM knowledge, that would mean also grounding on `services.requirements` the same way — not done here, listed as a follow-up in §4.
- **Web/mobile Chat screens were also hardcoded** to always claim "France Schengen application" regardless of what the user actually has — fixed on web (now pulls the real active application via `/applications` and shows real doc/issue counts); see §4 for the mobile equivalent (not yet done).

---

## 2. APIs and external services required for production

None of these are required to keep using the app in demo/mock mode — `AI_MOCK=true` and the in-memory stores work standalone. This table is what's needed to turn each mocked area into the real thing.

| Area | What's needed | Where it plugs in | Current state |
|---|---|---|---|
| **AI chat** | Anthropic API key (`ANTHROPIC_API_KEY`) or Google Gemini key (`GOOGLE_GEMINI_API_KEY`), plus `AI_MOCK=false` | `apps/backend/.env` | Mocked — deterministic canned replies |
| **Google Sign-In** | `GOOGLE_WEB_CLIENT_ID` (OAuth client, Google Cloud Console) | Already set in `.env`; mobile also needs the Android/iOS OAuth client IDs configured in the Google Sign-In native module | Web client ID present; verify mobile client IDs are real, not placeholders |
| **Payments** | Stripe (or similar) secret key + webhook signing secret | `POST /reports/:docId/unlock` (audit report unlock, $4.99), Pro tier ($19/mo), Pricing page tiers | **Not implemented at all** — no Stripe SDK, no env var. UI is now honest ("coming soon") instead of faking success (see §4) |
| **Transactional email** | SendGrid/SES API key + verified sender domain | `/auth/forgot-password`, `/auth/verify-email` (registration OTP), `/auth/2fa/send-code` | All three currently either no-op or return the OTP code directly in the API response body (fine for demo, unsafe/nonsensical for prod — a real login flow can't show you your own emailed code) |
| **SMS** (optional, only if you want SMS 2FA) | Twilio (or similar) | `/auth/2fa/send-code` could branch to SMS | Not implemented — email-only OTP today |
| **Persistent database** | Postgres, or Firestore in real (non-emulator) mode | Replaces every in-memory `Map`/`Set` in `mockServices.ts` and `app.ts`: user credentials, applications, access grants, webhooks, 2FA enrollment, audit log, notification read-state | Everything resets on server restart today. `apps/backend/src/services/firestoreRest.ts` + `firebaseServices.ts` already exist as a real Firestore-backed alternative — set `FIRESTORE_EMULATOR_HOST` (or point at real Firestore) to use it instead of the mock |
| **File/document storage** | Firebase Storage bucket (`FIREBASE_STORAGE_BUCKET`) or S3 | `POST /upload-slots` — currently returns a fake `/upload-stub/...` URL that nothing serves | Storage rules already exist at `firebase/storage.rules`; needs a real bucket + credentials |
| **Push notifications** | Firebase Cloud Messaging server key | `notifications.sendUserNotification` | Mocked — returns a fake `mock-fcm-...` message id |
| **Redis** (job queue) | `REDIS_URL` pointing at a real Redis instance, `BULLMQ_ENABLED=true` | Audit job queue | **Health check is a placebo today** — see §4. Setting the env var alone does nothing; `redisAuditQueue.ts` never actually connects to Redis, it's an in-memory Map regardless |
| **Embassy data** | A real per-country embassy-website scraper, or a licensed data feed | `embassyUpdater.ts` | Explicitly stubbed (`// TODO: Replace with real scraping logic`) — the "24h freshness" badges shown in the UI are not backed by any real refresh |
| **Exchange rates** | None needed | `/exchange-rates` | Already real — calls the free [Frankfurter API](https://frankfurter.app), no key required |
| **CORS** | Set `CORS_ORIGINS` explicitly to your real frontend origin(s) in every deployed environment | `apps/backend/.env` | Currently defaults to allow-all outside `NODE_ENV=production`, and fails closed (blocks everyone) if `CORS_ORIGINS` is unset **and** `NODE_ENV=production` — don't rely on the default in prod, set it explicitly |
| **JWT signing** | A real, secret, rotated `JWT_SECRET` | `apps/backend/.env` | Now required — see §3, the insecure unsigned-token fallback was removed this pass |

---

## 3. Fixed this pass — backend security

All of these were found by an independent security-focused audit agent and verified by hand before fixing.

| Severity | Issue | Fix |
|---|---|---|
| 🔴 Critical | **`/auth/session` never checked the password.** The schema required a password field, but the handler only read `email` — any string ≥6 chars for a known email logged you in as that user. | Added a real (in-memory) credential store with salted `scrypt` password hashing, seeded with the documented demo account (`sarah.mathew@example.com` / `demo1234`). `/auth/session` now verifies the password and returns 401 on mismatch; `/auth/register` stores a real hash and rejects duplicate emails (409). |
| 🔴 Critical | **Forgeable auth backdoor**, live regardless of `JWT_SECRET` being set. Any request with `Authorization: Bearer demo-token-<base64(email)>` or `Bearer google-token-<uid:email>` was accepted with zero signature verification — full account takeover by constructing the header yourself. | Removed both legacy branches entirely from `verifyIdToken`. `signToken()` now **throws** if `JWT_SECRET` isn't configured instead of silently issuing an unsigned token. `jwt.verify` now pins `algorithms: ['HS256']` (defense-in-depth against algorithm-confusion attacks). |
| 🟠 High | **IDOR: any user could revoke any other user's consultant access grant** (`DELETE /access-grants/:grantId` had no ownership check — and the mock service didn't even persist grants, so there was nothing to check against). | Added a real `grantStore` keyed by grant id, recording `grantedBy`. Revoke now checks the requester owns the grant and returns 404 otherwise. Applied to both the mock and Firestore-backed service implementations. |
| 🟡 Medium | **Cross-user notification state bleed.** `readNotificationIds` was a single global `Set` — marking the `'welcome'` notification read (the id every brand-new user gets) marked it read for *every* user on the server. | Scoped to a `Map<uid, Set<id>>`, one read-set per user. |
| 🟡 Medium | **Webhook listing used prefix matching, not exact ownership** (`key.startsWith(uid)` — a uid that's a prefix of another uid would leak that user's webhooks). | Changed to `key.startsWith(`${uid}-wh-`)`, matching the actual key format's delimiter. |
| 🟡 Medium | **2FA disable had no rate limit** (every other auth-sensitive endpoint does). | Added `authLimiter`. |
| 🟢 Low | **`/admin/embassy-updates` could hang forever** on a failed dynamic import — async handler with no try/catch and no error path, unlike every other route in the file. | Wrapped in try/catch, forwards to `next(err)`. |

---

## 4. Documented, not fixed — needs a deliberate decision, not a quick patch

These were flagged but deliberately **not** changed this pass, because a safe fix requires either a product decision or a larger refactor that risks breaking the current working demo flow.

### Backend
- **`/auth/demo` issues unauthenticated platform-admin tokens with no gating.** This is *intentional* today — it's how the four demo-login buttons on the web/mobile login screens work, and the whole product is currently positioned as a live demo/investor-facing build. **Before any real production launch, this endpoint (and the demo buttons that call it) must be removed or gated behind a build flag.** Do not ship it as-is.
- **2FA is not enforced at login.** Enabling it in Settings only gates a UI toggle — `/auth/session`, `/auth/google`, and `/auth/demo` never check `twoFactorEnabledUids`. Wiring this up properly means a two-step login flow (return a "2FA required" challenge instead of a token, then a second endpoint to submit the code) on **both** web and mobile login screens — a real UX feature, not a one-line fix. Flagging clearly rather than shipping a half-built version that could lock users out.
- **`upload-slots` doesn't verify the caller owns `applicationId`.** Path-traversal characters are now rejected (`applicationId`/`documentId` must match `[a-zA-Z0-9_-]+`), but a full ownership check was **not** added, because the demo application IDs the frontend references (`app-fr-2026` etc.) don't actually exist in any user's per-user store — the mock backend's `getAppsForUser` intentionally starts every new user with an empty list (comment: *"no pre-seeded demo apps"*). Adding a strict check today would 404 the existing, working upload demo flow. Fix once applications are persisted consistently (real DB, §2).
- **`GET /audit/:docId` has no ownership check** — any authenticated user can read any audit result if they guess/know a `docId`. Not fixed because `docId` isn't currently tied to an owning user anywhere in the mock audit-queue design; needs that association built first.
- **Firestore-emulator auth path (`firebaseServices.ts`) accepts any string as a valid uid** with zero cryptographic verification. Only reachable if `FIRESTORE_EMULATOR_HOST` is set, which it isn't in this deployment's `.env` — dormant, but do not point this mode at anything production-adjacent without fixing it first.
- **Health checks are placebos.** `redis`, and several Firestore-backed service `.health()` methods, return `'configured'` based only on an env var being *set*, not on actually pinging the service. A real outage would show as healthy. Low urgency in mock mode, but would mask real incidents in production.
- **Inconsistent input validation.** `/auth/register`, `/auth/google`, `/auth/forgot-password`, `/referrals/claim` use ad-hoc `req.body ?? {}` checks instead of the zod schemas (`validateBody`) used elsewhere (`/auth/session`, `/chat`, `/bookings`). Not exploitable today, but easy to regress silently — worth a follow-up pass to make it consistent.

### Web (`apps/web/src/App.tsx`)
- **`ApplicationDetail`'s "readiness findings" (Overview tab)** show two static hardcoded rows regardless of the actual application's real document/requirement state.
- **`AdminUsers` Suspend/Restore/View actions are toast-only** — no real mutation, the table never actually changes. Needs the `POST /admin/users/:uid/suspend` / `/restore` endpoints (which already exist server-side) wired up client-side.
- **`Analysis` page shows a hardcoded readiness score (79)** inconsistent with the real score (87) shown everywhere else for the same application.
- **`HrPortal`'s "Export usage CSV"** claims success via toast but generates no file.
- **`EcosystemPartners`'s "Claim offer"** implies a redirect ("Redirecting to X...") but never navigates anywhere.
- **`SettingsCard`'s "Configure"/"Review deletion flow" links** point to `#privacy`/`#preferences` anchors that don't exist on the page.
- **Several icon-only toggle buttons and the toast dismiss button** have no `aria-label` — screen readers announce them as unlabeled.
- **Onboarding "Create application"** has no required-field validation on destination/visa-type before submit.
- Several places still reference the hardcoded demo application id `app-fr-2026` directly (booking's access-grant call, upload flow, a couple of search-suggestion/activity-log entries) rather than the real active application — Chat and the two audit-report links were fixed this pass; the rest were left alone since they follow the same "backend doesn't persist demo IDs per user" constraint described above and touching them risks the same breakage.

### Mobile (`apps/mobile/App.tsx`)
- **Document upload/audit is entirely fake.** `api.ts` exports real `createUploadSlot`/`enqueueAudit` functions, but `UploadScreen`/`LiveAnalysisScreen` never call them — they just cycle local UI state and a fake animated score, and always route to the same hardcoded `docId: 'doc-passport'` regardless of what was actually captured. This is a substantial feature gap (the core "upload and get an AI audit" flow doesn't talk to the backend at all on mobile), not a quick fix.
- **Email verification screen is unreachable.** `VerifyEmailScreen` is fully built and calls the real API, but registration never navigates to it — `RegisterScreen` goes straight to onboarding.
- **Visa Waiver Checker never calls the real API** (`fetchVisaWaiver` exists, unused) — stuck on a hardcoded local rules table.
- **Six profile sub-forms have no input validation** (Personal, Passport, Employment, Contacts) — every "Save" button is unconditionally enabled, inconsistent with Register/NewApplication which do validate.
- **Console/Portal/Admin screens (`useApiData` hook)** fail silently to a blank screen on any error — no "failed to load / retry" messaging.
- **`Linking.openURL()` calls (six sites: tel/mailto/calendly links) have no `.catch()`** — an unhandled promise rejection if no matching app is installed.
- **Resume/bank-statement "uploads" in Profile are decorative** — local state only, lost on navigating away, no backend call.
- **Rejection Letter Analyzer is a local keyword dictionary**, not backend-connected, despite being labeled "AI-powered."

None of the mobile items above were fixed this pass beyond the five addressed in §5 below — they're real but each is either a genuine feature build (upload flow, email verification reachability) rather than a bug fix, or lower severity/cosmetic.

---

## 5. Fixed this pass — web & mobile

| App | Issue | Fix |
|---|---|---|
| Web | **Six unguarded `JSON.parse(localStorage...)` calls** (Dashboard, `useApi`, `postJson`, `NotificationsPanel` ×2, `VisaWaiverChecker`) with no try/catch — a corrupted/partial `visaiq.session` value in localStorage would crash the Dashboard (the default post-login page) to a blank white screen, or throw on every API call. | Consolidated into one safe `getStoredSession()`/`getStoredToken()` helper (mirroring the try/catch pattern `useStoredSession` already had), used at all six sites. |
| Web | **Chat page was 100% hardcoded** to "France Schengen", a fixed docs/issues/score display, and `applicationId: 'app-fr-2026'` sent to `/chat` regardless of the logged-in user's real application. | Now fetches the user's real active application (same pattern as Dashboard) and uses its real id, destination, visa type, doc counts, and issue count throughout — including in the offline fallback reply text. |
| Web | **Audit report "Back to application" link hardcoded to `/applications/app-fr-2026`**, and **`ApplicationDetail`'s audit fetch always requested `doc-passport`** regardless of which application was open. | `ApplicationDetail` now derives a per-application `docId`; navigating to the audit report passes the originating application id via router state, and the back-link uses it (falls back to the first demo application if the report was reached directly, e.g. a bookmarked URL). |
| Web | **"Unlock Full Report — $4.99" simulated a successful payment** with a `setTimeout`, while displaying "Secure payment" / "Instant access" badges — no charge, no API call, but framed as a completed transaction. | Now shows an honest "coming soon" toast, matching the Pricing page's existing honest pattern. Removed the fake unlocked state and its now-dead `unlocking` loading flag. |
| Mobile | **"Upgrade to Pro — $19/month" button wasn't wrapped in anything pressable** — tapping it did nothing. | Wrapped in a `Pressable` showing an honest "coming soon" alert (same reasoning as the web unlock fix — no payment processor is connected). |
| Mobile | **Settings → Privacy "Delete my data" / "Export my data" used `TaskRow`, a non-interactive component** — could never be tapped despite promising an action. | "Delete my data" now calls the real `POST /auth/delete-account` endpoint (added `deleteAccount()` to `api.ts`) with a destructive confirmation, matching the web Settings page's real delete flow. "Export my data" shows an honest "coming soon" alert — there is no export endpoint on the backend at all yet (see §2/§4). |
| Mobile | **Booking failures were silently converted into a fake "success."** Any backend error (network, validation, slot taken) was caught and replaced with a synthetic `bk-<timestamp>` booking, then the user was always shown the "Booking confirmed" screen — they'd believe they booked a consultant when nothing was recorded. | Now shows a real error alert on failure and stays on the booking screen instead of faking a confirmation. |
| Mobile | **Profile save failures were silently swallowed**, then the UI still closed the edit section as if the save succeeded — typed data (passport number, employment, etc.) was lost with no warning. | Now shows an error alert on failure and keeps the section open so the user's input isn't lost. |
| Mobile | **Notifications weren't tappable and were never marked read** — the unread badge count could never decrease no matter what the user did; `markNotificationRead` existed in `api.ts` but was never imported or called. | Notification rows are now `Pressable`; tapping an unread one updates local state immediately and calls the real mark-read endpoint in the background. |

---

## 6. Suggested next priorities

1. Decide the demo-endpoint story before any real launch (`/auth/demo`, the four demo login buttons) — gate or remove.
2. Pick a real database (Postgres or real Firestore) and migrate the in-memory stores — this unblocks the upload-ownership check, audit ownership check, and makes the demo/seed applications consistently available so AI chat grounding and the upload flow actually activate for the built-in demo accounts, not just newly-created applications.
3. Build the mobile upload→audit round trip for real (currently the single biggest functional gap between the two clients).
4. Wire Stripe once you're ready to actually charge for anything — right now every paid CTA in the app is honestly labeled "coming soon" rather than faking success, which is fine to ship as-is until then.
5. Re-run the full verification suite (`pnpm -r typecheck`, backend contract tests, Playwright) once Node.js is available on this machine again — nothing in this pass was machine-verified beyond manual review and the earlier-session baseline (136/136 Playwright, 90/90 backend contract tests, both passing before Node.js became unavailable).
