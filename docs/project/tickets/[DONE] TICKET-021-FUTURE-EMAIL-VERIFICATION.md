# [DONE] TICKET-021 - Future: Email Verification on Signup

**Type:** Feature  
**Priority:** High  
**Status:** ✅ Done
**Related:** PM-021; TICKET-020  
**Sprint:** Post-MVP  

## Description
Send a verification email when a user creates an email/password account and give the user a clear way to confirm the address or request another email.

## Requirements
- [x] Call Firebase `sendEmailVerification` after a successful email/password registration
- [x] Show a confirmation state with the registered email and a resend action
- [x] Allow the user to refresh the verification status after opening the email
- [x] Do not send verification emails to Google accounts, which are already verified
- [x] Handle errors such as too many requests or network failures with inline feedback
- [x] Define and document whether verification blocks private routes or only shows a persistent banner
- [x] Preserve access for existing accounts created before this feature
- [x] Add tests for the verification service, resend flow and status refresh

## Acceptance Criteria
- [x] Registering with email and password sends a verification email
- [x] The user sees a clear "verify your email" state after registration
- [x] Resending the email works and respects Firebase rate limits
- [x] Checking the status updates the UI once the address is verified
- [x] Google sign-in does not trigger an unnecessary verification email
- [x] The app does not lock existing accounts out without a recovery path
- [x] The chosen gating policy is reflected in navigation and documented

## Technical Notes
- Use `sendEmailVerification(user)` and `user.reload()` / `user.emailVerified` from Firebase Auth.
- `hooks/use-auth.ts` only subscribes to `onAuthStateChanged`; add a manual refresh or a controlled polling strategy after the user says they verified.
- `features/auth/repositories/firebase-auth.repository.ts` creates the auth user and the Firestore profile. If profile creation fails after the auth user exists, define how to retry or recover.
- Configure the verification email template and sender in the Firebase console.
- Coordinate the gating decision with `app/_layout.tsx`, which currently redirects only by authentication state.
- Reuse `features/auth/components/auth-feedback.tsx` from TICKET-020 for resend and verification errors.

## Open Questions
- Should unverified email/password users be blocked from private routes, or only shown a banner?
- Should the verification email be resent automatically after a failed login attempt?

## Implementation Notes (06/11/2026)
- **Decision:** unverified email/password users are blocked from private routes
  and redirected to `/verify-email`; Google and unknown-provider accounts keep
  access. Existing accounts can resend, refresh the status or sign out.
- **Decision:** the verification email is never resent automatically after a
  failed login. All resends are explicit and rate-limit errors are inline.
- `/verify-email` shows the registered address, a manual status check, a resend
  action and a sign-out recovery path. It polls `user.reload()` every 10 seconds
  for up to 6 attempts while visible.
- The first email is sent once after registration from the verification screen,
  so `auth/too-many-requests` and network errors appear inline. A session store
  prevents duplicate initial sends.
- `AuthProvider` now owns the shared `AuthUser` snapshot and exposes
  `refreshUser`, making verification updates visible to navigation.
- Registration keeps the session if Firestore profile creation fails; email
  sign-in repairs a missing profile on the next successful login.
- Google and email/password detection comes from Firebase `providerData`, with
  no Firestore migration.
- Manual Firebase console setup remains pending: email template, sender and
  authorized domains.
