# [DONE] TICKET-020 - Future: Inline Auth Error Feedback

**Type:** Improvement  
**Priority:** High  
**Status:** ✅ Done  
**Related:** PM-020; TICKET-006, TICKET-021  
**Sprint:** Post-MVP  

## Description
Replace the native dialogs used by login, registration and Google sign-in with inline feedback shown next to the action that failed.

## Requirements
- [x] Remove `alert()` / `Alert.alert` from login, registration and Google sign-in error paths
- [x] Show a field error under the relevant input for missing or invalid values
- [x] Show a general error immediately above the button that triggered the action
- [x] Map Firebase error codes to clear Spanish messages instead of showing raw error text
- [x] Clear errors when the user edits a field, toggles mode or retries
- [x] Keep the loading state and prevent duplicate submissions
- [x] Show password-reset success and failure inline as well
- [x] Add tests for error mapping and the login-form state

## Acceptance Criteria
- [x] Submitting an empty login form shows an inline message, not a dialog
- [x] A wrong password or unknown email shows a friendly message above the email button
- [x] A Google sign-in failure shows the message above the Google button
- [x] Validation errors appear under the corresponding field
- [x] The error clears when the user starts correcting the input
- [x] The layout works in light and dark mode and on web/mobile

## Technical Notes
- `features/auth/hooks/use-login-form.ts` currently calls `alert()` for missing fields and imports the alert-based helpers from `lib/auth.ts`.
- `lib/auth.ts` catches Firebase errors and displays them with `alert()`. Move these flows to the `features/auth` service/repository and return typed results or errors instead of showing UI from the data layer.
- `LoginActions` owns the email and Google buttons; add an error slot above each one. `LoginFields` can receive per-field errors.
- Use `accessibilityRole="alert"` / `accessibilityLiveRegion="polite"` and the shared danger colour tokens.
- Keep a confirmation step for destructive actions such as deleting a movement. The movement and category flows use the shared in-app `ConfirmDialog` because `Alert.alert` is a no-op on web. This ticket only changes authentication feedback.

## Implementation Notes (05/11/2026)
- `features/auth/components/auth-feedback.tsx` is the reusable inline feedback
  component (`field` and `banner` variants, error/success tones, alert role and
  polite live region). TICKET-021 can reuse it for verification messages.
- `LoginFields` renders field errors under each input and uses the shared form
  theme, so inputs, borders and placeholder colours follow light/dark mode.
- `LoginActions` renders the general error slot directly above the email button
  and above the Google button.
- `LoginPasswordReset` adds the previously missing forgot-password action. Its
  success and failure feedback is shown inline above the action.
- `use-login-form.ts` now uses `AuthService` and a pure reducer
  (`hooks/login-form-reducer.ts`). Field edits clear the relevant error, mode
  changes clear all feedback, and retries clear previous errors. Requests are
  single-flight (`hooks/use-login-request.ts`) and the buttons stay disabled while
  loading.
- `features/auth/services/auth.errors.ts` maps Firebase Auth codes to Spanish
  messages and never exposes raw provider text.
- `lib/auth.ts` and its alert-based tests were removed. Settings now logs out
  through `AuthService`, so auth persistence lives only in the feature layer.

## Dependencies
- TICKET-021 (verification messages can reuse the same inline feedback component)
