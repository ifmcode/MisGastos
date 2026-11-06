# Project Memory - MisGastos

> Living document to continue development from any machine with OpenCode/Claude. Update after each milestone.

## Current State
- Date: 06/11/2026
- Stack: Expo SDK 54, React Native 0.81.5, React 19.1.0, Expo Router 6, TypeScript 5.9, NativeWind 4, Firebase (Auth + Firestore), Jest 30
- Auth implemented (email/password + Google) with inline field/action errors, mapped Firebase messages and password-reset feedback in the login screen
- Email verification implemented: unverified email/password accounts are blocked from private routes until they confirm the address; `/verify-email` shows the email, resend, manual refresh and controlled polling. Google accounts are never asked to verify
- Wallets MVP implemented: create/list, per-wallet balance, include-in-total, Firestore persistence
- Transactions MVP implemented: expenses/incomes, history with filters/sorting, atomic wallet balance updates
- Transfers MVP implemented: atomic moves between same-currency wallets, editable transfers and soft-delete with balance reversion
- Dashboard MVP implemented: global/per-wallet totals, wallet filter, recent transfers
- Categories implemented: user-defined expense/income categories with CRUD, lazy defaults, legacy transaction compatibility and inline creation from the transaction form
- Date picker UX implemented: quick Hoy/Ayer chips, an optional session-scoped "Último" chip in movement/transfer forms, native calendar picker and manual fallback across transaction/transfer forms and date filters
- Implementation plan reviewed on 03/11/2026: MVP, categories and date picker verified as done; future work tracked in TICKET-006..TICKET-024
- Recommended execution order documented in implementation plan §8 (04/11/2026). Offline-first is an architecture spike before groups and a full implementation phase; agent/skill specialization is tracked as a workflow epic
- Routes: tabs (dashboard, wallets, transactions, settings), login, verify-email, categories, modal
- Current structure: app/, components/, lib/, shared/, hooks/, assets/ + features/
- New structure: features/ (auth, wallets, transactions, transfers, dashboard, categories, settings, modal), shared/

## Goal
Build a hybrid app between a personal expense manager and Splitwise - personal finances + shared expenses with multi-wallet/multi-currency, history, filters, transfers between wallets, groups/friends with settlements.

## Architecture
See `docs/project/guidelines/architecture-and-solid.md`. Migrate incrementally to feature-first + layered architecture.

## Key Decisions
- No photo uploads initially (keep it simple)
- Firebase as backend (Auth + Firestore). Rules in `firestore.rules`; deployment pending
- Strict TypeScript
- Tests target coverage >= 90% (see testing guide)
- Money: decimal numbers rounded to 2 decimals (strict input validation), not integer cents, for MVP. Revisit when transactions/transfers are implemented
- Wallets persisted in the root `wallets` collection with `ownerId`; queried by owner and sorted client-side. Dashboard totals grouped by currency (no conversion in MVP)
- Transfers persisted in a dedicated root `transfers` collection with `ownerId`. Only same-currency wallets can be linked; balances update atomically with `runTransaction`. Transfers are editable and use soft delete (`deletedAt`) with atomic balance reversion; hard deletes are denied in rules
- Dashboard global totals only include wallets with `includeInTotal`; selecting a wallet always shows its real balance and flags whether it contributes to the global total
- Categories live in the root `categories` collection scoped by `ownerId`. Defaults are seeded lazily when the owner has none, using deterministic ids (`${ownerId}__${legacyId}`); deleting the last category re-seeds them on the next load. Deletion is hard and blocked while transactions use the category. Seeded defaults keep their old transaction ids in `legacyId`, and forms/filters resolve either id so existing movements are never rewritten. Category type is locked after creation. Transfers remain uncategorized.
- **Dates**: Shared date utilities live in `shared/utils/date.ts` (moved from the transactions feature) and calendar-grid helpers in `shared/utils/date-calendar.ts`. All date inputs use the shared `DateQuickSelector` (Hoy/Ayer chips, a calendar button contiguous to them, and manual fallback). Movement/transfer forms also show an `Último DD/MM` chip after a successful save in the current session; it is preselected for new records, hidden when it matches Hoy/Ayer and not shown in filters. The session value lives in `shared/utils/last-used-date-store.ts` (in memory, not persisted). iOS/Android use `@react-native-community/datetimepicker`; web uses a lightweight in-app calendar grid because that library has no web support.
- **Email verification**: unverified email/password accounts are blocked from private routes and redirected to `/verify-email`; Google and unknown-provider accounts keep access. The screen shows the registered email, an explicit resend (no automatic resend after failed logins), a manual refresh and controlled polling (10s, max 6). The first email is sent once after registration from the screen so errors render inline. Existing accounts can resend, verify or sign out. Provider detection uses Firebase `providerData`, with no Firestore migration. Auth state is shared through `AuthProvider`, which exposes `refreshUser` so `user.reload()` updates navigation.
- **Git**: Never commit automatically. Keep changes staged. Ask before creating a separate commit for unrelated changes.
- **Code size & composition**: Files target ≤150 lines, one component per file, one responsibility per function. Screens only orchestrate: header, list header, footers, states and modals are separate components; derived data lives in hooks/pure utils. Styles go to `features/<feature>/styles/<name>.styles.ts` (style files may exceed 150 lines) with shared tokens and reusable base+variant styles. See `docs/project/guidelines/architecture-and-solid.md` §5.1

## How to resume
1. Read this file + `docs/project/development-notes/roadmap.md`
2. Review `docs/project/implementation-plan/implementation-plan.md`
3. Check `docs/project/tickets/` for next task
4. Follow `docs/project/guidelines/` for all changes
5. Document in `docs/project/development-notes/` after each session

## Session History
| Date | Change | Notes |
|---|---|---|
| 22/10/2026 | Initial guidelines | Created `docs/ARQUITECTURA_FRONTEND_SOLID.md` |
| 27/10/2026 | Full reorganization | Created docs/project structure, guidelines, plan merging expense manager + Splitwise, tickets, testing guide, UI references |
| 27/10/2026 | Moved to unified docs/project | All docs under single folder, English naming, legacy files removed |
| 27/10/2026 | Feature-first auth migration | Created features/auth with repo/service/factory pattern |
| 27/10/2026 | Added UI references | Copied Gestor de gastos and Splitwise screenshots to ui-references |
| 28/10/2026 | Wallets MVP | Implemented features/wallets (repo/service/hooks/UI), Firestore persistence, tests, docs. Fixed remaining common→shared imports |
| 28/10/2026 | Removed Explore tab | Deleted the template route, feature, unused components/assets and `expo-web-browser` dependency |
| 29/10/2026 | Transactions MVP | Added expenses/incomes with balance updates, history, filters and sorting, new Movimientos tab, Firestore rules pending update |
| 29/10/2026 | Transfers and dashboard MVP | Added atomic same-currency transfers, dedicated `transfers` collection, dashboard totals/filter/recent transfers, tests and docs. Firestore rules deployment pending |
| 30/10/2026 | Transfer edition and soft delete | Added atomic edit and logical delete with balance reversion, edit/delete UI, `updatedAt`/`deletedAt` audit fields, tests and docs. Firestore rules deployment pending |
| 30/10/2026 | File size rules + dashboard split | Documented the ≤150-line/one-component/one-responsibility rules and styles-module convention. Split `dashboard-screen.tsx` (643 lines) into header, wallet filter chip/filters, section header, list header, loading/error/empty states, transfers section, transfer modal and a styles module; added `useDashboardOverview`, `useDashboardTransferForm`, `getDefaultTransferWallets`/`buildTransferFormValues` and tests. Firestore rules deployed |
| 01/11/2026 | Categories management | Added `features/categories` (model, Firestore repo, service, hooks, CRUD screen, shared form modal), categories route from Settings, dynamic transaction pickers/filters with legacy-id resolution, inline category creation from the transaction form, categories Firestore rules and tests. Firestore rules deployment pending |
| 02/11/2026 | Date picker UX | Added shared `DateQuickSelector` (Hoy/Ayer chips, calendar button at the right of the chips, native picker on mobile, in-app calendar on web, manual fallback) to transaction/transfer forms and both date filters. Moved date utilities to `shared/utils/date.ts`, added `shared/utils/date-calendar.ts` and tests |
| 03/11/2026 | Date picker follow-up | Calendar button moved next to the chips. Added a session-scoped `Último DD/MM` chip to movement/transfer forms, preselected for new records, updated after a successful save, hidden when it matches Hoy/Ayer and excluded from filters. Added `last-used-date-store`, date defaults and tests |
| 03/11/2026 | Implementation plan review | Verified done scope, documented partial implementations (dark mode, advanced search, profile) and created TICKET-006..TICKET-019 for profile, friends, groups, shared expenses, balances, settlements, group history, budgets, export, dark mode, advanced search, statistics, history grouping, wallet management and dashboard quick add |
| 03/11/2026 | Auth and movement UX tickets | Added TICKET-020 (inline auth errors), TICKET-021 (email verification on signup) and TICKET-022 (discoverable edit/delete actions). Edit/delete logic already exists for transactions and transfers; the ticket focuses on visibility and accessibility |
| 04/11/2026 | Execution order and platform epics | Added §8 to the implementation plan with the recommended phase order. Added TICKET-023 for offline-first and sync (design spike before groups, full implementation after the social slice) and TICKET-024 for project-specific agents and skills, including routing and permissions guidance |
| 05/11/2026 | Inline auth errors (Phase A) | Replaced auth alerts with reusable inline feedback, field validation and mapped Firebase messages. Added password-reset feedback, a pure login form reducer with single-flight requests, light/dark theming for login fields and tests. Removed `lib/auth.ts`; Settings logs out through `AuthService` |
| 06/11/2026 | Email verification (Phase A) | Added shared auth state via `AuthProvider`, verification service/repository methods, `/verify-email` with resend/manual refresh/controlled polling, private-route gating for unverified email/password accounts, Google bypass, profile recovery on email sign-in, tests and docs. Firebase console template setup pending |
