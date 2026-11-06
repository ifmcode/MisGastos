# TICKET-021 - Future: Email Verification on Signup

**Type:** Feature  
**Priority:** High  
**Status:** ⏳ Pending  
**Related:** PM-021; TICKET-020  
**Sprint:** Post-MVP  

## Description
Send a verification email when a user creates an email/password account and give the user a clear way to confirm the address or request another email.

## Requirements
- [ ] Call Firebase `sendEmailVerification` after a successful email/password registration
- [ ] Show a confirmation state with the registered email and a resend action
- [ ] Allow the user to refresh the verification status after opening the email
- [ ] Do not send verification emails to Google accounts, which are already verified
- [ ] Handle errors such as too many requests or network failures with inline feedback
- [ ] Define and document whether verification blocks private routes or only shows a persistent banner
- [ ] Preserve access for existing accounts created before this feature
- [ ] Add tests for the verification service, resend flow and status refresh

## Acceptance Criteria
- [ ] Registering with email and password sends a verification email
- [ ] The user sees a clear "verify your email" state after registration
- [ ] Resending the email works and respects Firebase rate limits
- [ ] Checking the status updates the UI once the address is verified
- [ ] Google sign-in does not trigger an unnecessary verification email
- [ ] The app does not lock existing accounts out without a recovery path
- [ ] The chosen gating policy is reflected in navigation and documented

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
