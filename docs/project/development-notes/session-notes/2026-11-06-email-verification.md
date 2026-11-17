# Session Note: Email Verification on Signup (TICKET-021)

**Date:** 06/11/2026  
**Ticket:** TICKET-021 / PM-021  
**Status:** ✅ Done

## Summary

Email/password accounts must confirm their address before entering private
routes. After registration the app opens a dedicated `/verify-email` screen with
the registered address, a manual "Ya verifiqué mi correo" action, a resend
action and a sign-out recovery path. Google accounts are never asked to verify.

## Gating policy

- **Unverified email/password accounts are blocked from private routes**
  (`(tabs)` and `categories`). They are redirected to `/verify-email`.
- **Google accounts and accounts with an unknown provider keep access.** The
  provider comes from Firebase `providerData`, so no Firestore migration is
  needed.
- **Existing accounts are not lost.** Accounts created before this feature are
  redirected to `/verify-email`, where they can resend the email, refresh the
  status or sign out. When they verify, navigation continues automatically.
- The policy lives in the pure `getAuthRedirect` util and is applied by
  `AuthNavigator`; `app/_layout.tsx` only wires the provider and the navigator.

## Decisions

- **Dedicated screen instead of an inline login state.** Registration signs the
  user in immediately, so the root navigator sends them to `/verify-email`.
- **No automatic resend after a failed login.** The user controls resends to
  avoid consuming Firebase rate limits. Errors such as `auth/too-many-requests`
  and network failures are shown inline through `AuthFeedback`.
- **First email after registration.** `AuthService.register` marks the new uid in
  a session store. The verification screen consumes that flag and sends the
  first email, so send failures are rendered on the screen where the user can
  retry. The flag is cleared after use and never sends twice.
- **Controlled polling.** While the screen is visible the app reloads the user
  every 10 seconds, up to 6 attempts. The manual button refreshes immediately.
  Polling stops when the address is verified or after the attempt limit.
- **Single snapshot for auth state.** `AuthProvider` maps Firebase users to
  `AuthUser`, exposes `refreshUser`, and every screen shares the same state
  through `useAuth`. This makes `user.reload()` updates visible to navigation.
- **Profile recovery.** Registration keeps the auth session even if creating the
  Firestore profile fails. Email sign-in now ensures the profile exists, so a
  missing document is repaired on the next successful sign-in.

## Architecture

| Layer | Files |
|---|---|
| Types | `features/auth/types/auth.types.ts` |
| Auth state | `features/auth/context/auth-context.ts`, `providers/auth-provider.tsx`, `hooks/use-auth.ts` |
| Routing policy | `features/auth/utils/auth-redirect.ts`, `components/auth-navigator.tsx`, `app/_layout.tsx` |
| Verification rules | `features/auth/utils/email-verification.ts`, `utils/auth-user.ts` |
| Session flag | `features/auth/utils/verification-email-store.ts` |
| Repository | `features/auth/repositories/auth.repository.ts`, `firebase-auth.repository.ts` |
| Service | `features/auth/services/email-verification.service.ts`, `services/auth.factory.ts` |
| State | `features/auth/hooks/email-verification-reducer.ts` |
| Hook | `features/auth/hooks/use-email-verification.ts`, `use-email-verification-service.ts` |
| UI | `features/auth/components/verify-email-screen.tsx`, `verify-email-header.tsx`, `verify-email-actions.tsx` |
| Route | `app/verify-email.tsx` |
| Styles | `features/auth/styles/verify-email.styles.ts` |

## Firebase console setup (manual, pending)

- Configure the verification email template and sender under
  **Authentication → Templates → Email address verification**.
- For web, confirm the authorized domains include the deployed app domain.
- The app uses the default `sendEmailVerification(user)` action URL; customize
  it in the console if the email should return to a specific page.

## Verification

```powershell
npx tsc --noEmit
npx expo lint
npx jest --runInBand
```

All pass (56 suites, 290 tests).

## Pending

- Manual QA on device and web: register, resend under rate limit, verify from the
  email link and confirm automatic navigation.
- Configure and test the real email template in the Firebase console.
