# Session Note: Inline Auth Errors (TICKET-020)

**Date:** 05/11/2026  
**Ticket:** TICKET-020 / PM-020  
**Status:** ✅ Done

## Summary

Login, registration, Google sign-in and password reset now report failures
inline instead of using `alert()`. Validation errors appear under the affected
input, action errors appear directly above the button that failed, and every
error clears when the user edits a field, toggles mode or retries.

## Architecture

| Layer | Files |
|---|---|
| Types | `features/auth/types/auth.types.ts` |
| Validation | `features/auth/schemas/login.schema.ts` |
| Error mapping | `features/auth/services/auth.errors.ts` |
| State | `features/auth/hooks/login-form-reducer.ts` |
| Request lifecycle | `features/auth/hooks/use-login-request.ts` |
| Hook | `features/auth/hooks/use-login-form.ts` |
| UI | `features/auth/components/auth-feedback.tsx`, `login-fields.tsx`, `login-actions.tsx`, `login-password-reset.tsx`, `login-screen.tsx` |
| Styles | `features/auth/styles/login.styles.ts` |
| Tests | `schemas/__tests__/login.schema.test.ts`, `services/__tests__/auth.errors.test.ts`, `services/__tests__/auth.service.test.ts`, `repositories/__tests__/firebase-auth.repository.test.ts`, `hooks/__tests__/login-form-reducer.test.ts` |

## Decisions

- **One reusable feedback component**: `AuthFeedback` supports `field` and
  `banner` variants plus error/success tones. It uses `accessibilityRole="alert"`
  and `accessibilityLiveRegion="polite"`. TICKET-021 can reuse it.
- **Pure form state**: a reducer owns fields, loading, field errors, email/Google
  action errors and password-reset feedback. This keeps the state transitions
  testable without rendering hooks.
- **Single-flight requests**: `useLoginRequest` guards duplicate submissions with
  a ref and dispatches the shared loading state. Buttons are also disabled.
- **Mapped Firebase messages**: `getAuthErrorMessage` translates known codes
  (invalid credentials, unknown email, email in use, weak password, rate limit,
  connection and Google popup errors) and falls back safely without exposing raw
  provider text.
- **Password reset is reachable**: the login mode now has a
  "¿Olvidaste tu contraseña?" action. Its success/failure message renders above
  it using the same component.
- **Theme-aware fields**: login inputs and feedback use `useFormTheme`, so
  borders, surfaces, text and error colours work in light and dark mode.
- **One auth persistence layer**: `lib/auth.ts` and its alert-based tests were
  removed. Login uses `AuthService`; Settings logs out through the same service.

## Verification

```powershell
npx tsc --noEmit
npx expo lint
npx jest --runInBand
```

All pass (49 suites, 257 tests).

## Pending

- Manual visual QA on a device and on web to confirm the new feedback spacing and
  password-reset link on narrow screens.
