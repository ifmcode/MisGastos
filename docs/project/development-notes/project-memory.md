# Project Memory - MisGastos

> Living document to continue development from any machine with OpenCode/Claude. Update after each milestone.

## Current State
- Date: 30/10/2026
- Stack: Expo SDK 54, React Native 0.81.5, React 19.1.0, Expo Router 6, TypeScript 5.9, NativeWind 4, Firebase (Auth + Firestore), Jest 30
- Auth implemented (email/password + Google)
- Wallets MVP implemented: create/list, per-wallet balance, include-in-total, Firestore persistence
- Transactions MVP implemented: expenses/incomes, history with filters/sorting, atomic wallet balance updates
- Transfers MVP implemented: atomic moves between same-currency wallets, editable transfers and soft-delete with balance reversion
- Dashboard MVP implemented: global/per-wallet totals, wallet filter, recent transfers
- Routes: tabs (dashboard, wallets, transactions, settings), login, modal
- Current structure: app/, components/, lib/, shared/, hooks/, assets/ + features/
- New structure: features/ (auth, wallets, transactions, transfers, dashboard, settings, modal), shared/

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
