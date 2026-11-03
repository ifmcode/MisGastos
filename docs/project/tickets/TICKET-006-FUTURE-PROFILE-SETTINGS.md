# TICKET-006 - Future: Profile and Preferred Currency

**Type:** Feature  
**Priority:** Medium  
**Status:** ⏳ Pending  
**Related:** PM-001, PM-002  
**Sprint:** Post-MVP  

## Description
Allow users to review and edit their account data and choose a preferred currency used as the default for new wallets and summaries.

## Requirements
- [ ] Show the account email and an editable display name in Settings
- [ ] Persist profile changes in the user document (`users` collection with `uid` field)
- [ ] Sync the display name with Firebase Auth (`updateProfile`) where possible
- [ ] Add a preferred currency selector using the shared currency constants
- [ ] Use the preferred currency as the default for new wallets and as a fallback when no currency is specified
- [ ] Keep the categories shortcut and logout action in Settings
- [ ] Validate the name (required, trimmed, max length) and the currency code
- [ ] Add tests for the profile schema, mapper, service and currency defaults

## Acceptance Criteria
- [ ] Editing the name updates Settings and the dashboard greeting
- [ ] The preferred currency is remembered across sessions
- [ ] The new wallet form preselects the preferred currency
- [ ] Invalid values show field errors and are not persisted
- [ ] Firestore rules allow only the owner to read and update the profile

## Technical Notes
- The current auth flow creates user documents with auto-generated ids and stores the Firebase uid in a `uid` field. Normalise this to `users/{uid}` or keep querying by `uid`, but never duplicate profile documents.
- Create `features/profile/` with `repositories/`, `services/`, `schemas/`, `hooks/` and `components/`.
- `lib/auth.ts` and `features/auth/repositories/firebase-auth.repository.ts` currently duplicate auth persistence logic. Reuse one implementation before adding profile writes.
- Preferred currency is a default/display preference, not a conversion feature. Totals in different currencies must remain grouped by currency.
- Update `firestore.rules` so the profile is readable and writable only by its owner.

## Dependencies
- TICKET-002 (existing wallet currency selection)
- Shared currency constants
