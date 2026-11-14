# [DONE] TICKET-006 - Future: Profile and Preferred Currency

**Type:** Feature  
**Priority:** Medium  
**Status:** ✅ Done (14/11/2026)  
**Related:** PM-001, PM-002  
**Sprint:** Post-MVP  

## Description
Allow users to review and edit their account data and choose a preferred currency used as the default for new wallets and summaries.

## Requirements
- [x] Show the account email and an editable display name in Settings
- [x] Persist profile changes in the user document (`users` collection with `uid` field)
- [x] Sync the display name with Firebase Auth (`updateProfile`) where possible
- [x] Add a preferred currency selector using the shared currency constants
- [x] Use the preferred currency as the default for new wallets and as a fallback when no currency is specified
- [x] Keep the categories shortcut and logout action in Settings
- [x] Validate the name (required, trimmed, max length) and the currency code
- [x] Add tests for the profile schema, mapper, service and currency defaults

## Acceptance Criteria
- [x] Editing the name updates Settings and the dashboard greeting
- [x] The preferred currency is remembered across sessions
- [x] The new wallet form preselects the preferred currency
- [x] Invalid values show field errors and are not persisted
- [x] Firestore rules allow only the owner to read and update the profile

## Technical Notes
- The current auth flow creates user documents with auto-generated ids and stores the Firebase uid in a `uid` field. Normalise this to `users/{uid}` or keep querying by `uid`, but never duplicate profile documents.
- Create `features/profile/` with `repositories/`, `services/`, `schemas/`, `hooks/` and `components/`.
- Auth persistence now lives only in `features/auth` after TICKET-020 removed the duplicate `lib/auth.ts`. Extend that single implementation for profile writes.
- Preferred currency is a default/display preference, not a conversion feature. Totals in different currencies must remain grouped by currency.
- Update `firestore.rules` so the profile is readable and writable only by its owner.

## Dependencies
- TICKET-002 (existing wallet currency selection)
- Shared currency constants

## Implemented
- Added `features/profile` with types, schema/validation codes, mapper, Firestore repository, service, factory, hooks, provider and components.
- Kept the existing `users` documents with auto-generated ids and the Firebase uid in `uid`, as agreed: the repository reads and updates by `uid` and only creates a document when none exists, so profiles are never duplicated.
- Added the protected `/profile` stack route. Settings shows the profile summary (display name and email) and opens the editable screen, while the categories shortcut, theme, language and logout action stay in Settings.
- Added `ProfileProvider` after `AuthProvider`. Settings, the profile screen, the dashboard greeting and the wallet form consume the same profile state, so a saved name updates every surface immediately and the preferred currency survives sessions through Firestore.
- Added display-name validation (required, trimmed, maximum 50 characters) and currency validation with the shared `CURRENCIES`/`isCurrencyCode` constants. Invalid values render field errors and never reach Firestore.
- Added the preferred-currency selector with the new shared `CurrencyChipSelector`, also reused by the wallet form.
- New wallets preselect the preferred currency through `createWalletFormValues`; `resolveCurrencyCode` and `DEFAULT_CURRENCY` provide the EUR fallback when no valid currency is specified. Dashboard totals remain grouped by each wallet's currency.
- Added a best-effort Firebase Auth sync through `IAuthRepository.updateDisplayName` (`updateProfile` + `refreshUser`). Firestore stays authoritative if the Auth update fails.
- Hardened `firestore.rules` for `users`: only the owner can read or update the profile, and `uid` cannot be reassigned.
- Added tests for the profile schema, mapper, repository, service, errors, defaults/factory, auth display-name sync, the new private route and wallet currency defaults. Verified 148 suites / 674 tests, 98.79% statements, 93.73% branches, 98.89% functions and 99.31% lines; `tsc`, lint, `check:copy` and the web export pass.
