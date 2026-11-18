# TICKET-054 - Google Drive Backup and Restore

**Type:** Feature  
**Priority:** Low  
**Status:** ⏳ Pending  
**Related:** TICKET-013, TICKET-053, TICKET-006  
**Sprint:** Post-V1

## Description
Let a signed-in user keep one copy of their account in their own Google Drive and restore it later, reusing the existing Google sign-in with an incremental consent for a Drive scope. The backup is the versioned JSON snapshot of TICKET-013 (wallets, movements, transfers, categories and settings), the restore runs through the TICKET-053 validation/preflight/confirmation pipeline, and the app keeps no server-side copy of the file. The backup is **manual and on demand**: one button in Settings creates it the first time and updates the same file afterwards. There is no scheduling and no backup history.

## Requirements
### Consent and access
- [ ] Reuse the existing Google sign-in and request the Drive scope incrementally, only when the user opens the backup section in Settings
- [ ] Prefer the `drive.appdata` scope and accept `drive.file` as the fallback, without asking for a broader Drive permission
- [ ] Keep the token out of long-lived plain storage: refresh it through the existing Google flow and never persist a permanent credential
- [ ] Offer a disconnect/revoke action that stops future backups and clears the local consent state, while the already uploaded file stays in the user's Drive

### Backup
- [ ] Upload the versioned JSON snapshot of the account (wallets, movements, transfers, categories and settings) to the user's Drive, excluding shared, group and friend data
- [ ] Store exactly one file per user, with a fixed name inside one app folder; the action creates the file when it does not exist and overwrites it when it does, so there is no backup history
- [ ] Add one **Crear/actualizar copia de seguridad** action in Settings that runs the upload on demand; do not schedule backups and do not run them automatically in the background
- [ ] Show the current backup state in Settings: **Sin copia** when it does not exist, or the last backup date, size and format version with the same action offered as **Actualizar copia**
- [ ] Keep the backup after sign-out: it belongs to the user's Drive, not to an app-owned account
- [ ] Handle failure, no-connection and quota states with clear copy and a retry

### Restore
- [ ] Run every restore through the TICKET-053 validation, preflight summary and explicit confirmation, and never overwrite account data silently
- [ ] Reject a backup whose `formatVersion` is newer or unsupported before writing anything, with a translated code

### Quality
- [ ] Keep es/en copy, dark mode and accessibility for the Settings backup section and every state, and pass `npm run check:copy`
- [ ] Add tests with fakes for the snapshot mapping, the fixed backup naming/overwrite and the restore validation
- [ ] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [ ] A signed-in user who grants the Drive consent taps **Crear/actualizar copia de seguridad** and the file appears in their own Google Drive
- [ ] Settings shows **Sin copia** before the first backup and the last backup date, size and format version afterwards
- [ ] Tapping the action again overwrites the same file instead of creating a second one, and no backup history appears
- [ ] No backup runs automatically: nothing is uploaded on app start, on sign-in or in the background
- [ ] Restoring the backup applies it only after the preflight confirmation, and the restored totals match the snapshot
- [ ] A backup from an incompatible `formatVersion` is rejected before any write, with a translated message
- [ ] Revoking access or disconnecting stops further backups with no orphan registration, and the existing file remains in the user's Drive
- [ ] Shared, group and friend data is never included in the backup
- [ ] No-connection, quota and failure states are handled with a clear message and a retry
- [ ] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Technical Notes
- **No backend and no service account:** the app talks to the Drive API with the user's own OAuth token, so the file lives in the user's Drive and the project never holds a copy. This is also the privacy argument shown in the copy.
- **One app folder per user:** backups go to a dedicated folder, and a fixed file name (`misgastos-account-v<formatVersion>.json`, updated in place) makes the state, the overwrite and the restore trivial without a history to paginate.
- **One format:** the backup is exactly the TICKET-013 snapshot, and the restore is the TICKET-053 pipeline. A second backup format or a second import path is not acceptable; any change to the snapshot must keep both directions working.
- **Token handling:** reuse the existing Google sign-in configuration; if native Google Sign-In cannot request the Drive scope, fall back to `expo-auth-session` + `expo-web-browser` for the incremental consent and record the decision.
- **Manual only:** the action is the only trigger. The ticket must not claim background delivery, automatic backups or a retention policy; a backup that is never tapped simply does not happen, and the Settings entry is the single place that shows its state.
- **Decision record:** `docs/project/development-notes/session-notes/2026-11-17-account-portability-and-notifications.md`.

## Validation Plan
- Grant the Drive consent from Settings and confirm the scope prompt appears only there; tap **Crear/actualizar copia de seguridad** and confirm the file in Google Drive.
- Tap the action a second time and confirm the same file is updated in place, Settings shows the new date/size and no second file appears.
- Confirm nothing is uploaded on app start, on sign-in or in the background, and that the state shows **Sin copia** until the user taps the action.
- Restore the backup on a clean account and confirm the preflight, the confirmation and the resulting totals.
- Point the restore at a backup with a newer `formatVersion` and confirm it is rejected before any write.
- Disconnect Drive access and confirm no further backups are attempted and the file stays in Drive.
- Simulate no-connection and a full Drive quota and confirm the messages and the retry.
- Confirm no shared, group or friend data appears in the uploaded file.
- Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`.

## Dependencies
- TICKET-013 account data export (the versioned JSON snapshot and its documented contract)
- TICKET-053 account data import (the validation, preflight and confirmed restore pipeline)
- TICKET-006 profile and preferred currency (account settings included in the snapshot)
- Google Drive scope availability on the existing Google sign-in configuration
