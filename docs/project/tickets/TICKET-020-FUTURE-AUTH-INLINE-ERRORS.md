# TICKET-020 - Future: Inline Auth Error Feedback

**Type:** Improvement  
**Priority:** High  
**Status:** ⏳ Pending  
**Related:** PM-020; TICKET-006, TICKET-021  
**Sprint:** Post-MVP  

## Description
Replace the native dialogs used by login, registration and Google sign-in with inline feedback shown next to the action that failed.

## Requirements
- [ ] Remove `alert()` / `Alert.alert` from login, registration and Google sign-in error paths
- [ ] Show a field error under the relevant input for missing or invalid values
- [ ] Show a general error immediately above the button that triggered the action
- [ ] Map Firebase error codes to clear Spanish messages instead of showing raw error text
- [ ] Clear errors when the user edits a field, toggles mode or retries
- [ ] Keep the loading state and prevent duplicate submissions
- [ ] Show password-reset success and failure inline as well
- [ ] Add tests for error mapping and the login-form state

## Acceptance Criteria
- [ ] Submitting an empty login form shows an inline message, not a dialog
- [ ] A wrong password or unknown email shows a friendly message above the email button
- [ ] A Google sign-in failure shows the message above the Google button
- [ ] Validation errors appear under the corresponding field
- [ ] The error clears when the user starts correcting the input
- [ ] The layout works in light and dark mode and on web/mobile

## Technical Notes
- `features/auth/hooks/use-login-form.ts` currently calls `alert()` for missing fields and imports the alert-based helpers from `lib/auth.ts`.
- `lib/auth.ts` catches Firebase errors and displays them with `alert()`. Move these flows to the `features/auth` service/repository and return typed results or errors instead of showing UI from the data layer.
- `LoginActions` owns the email and Google buttons; add an error slot above each one. `LoginFields` can receive per-field errors.
- Use `accessibilityRole="alert"` / `accessibilityLiveRegion="polite"` and the shared danger colour tokens.
- Keep native confirmation dialogs for destructive actions such as deleting a movement. This ticket only changes authentication feedback.

## Dependencies
- TICKET-021 (verification messages can reuse the same inline feedback component)
