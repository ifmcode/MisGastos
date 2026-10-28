# Project Memory - MisGastos

> Living document to continue development from any machine with OpenCode/Claude. Update after each milestone.

## Current State
- Date: 28/10/2026
- Stack: Expo SDK 54, React Native 0.81.5, React 19.1.0, Expo Router 6, TypeScript 5.9, NativeWind 4, Firebase (Auth + Firestore), Jest 30
- Auth implemented (email/password + Google)
- Wallets MVP implemented: create/list, per-wallet balance, include-in-total, Firestore persistence
- Routes: tabs (dashboard, wallets, settings), login, modal
- Current structure: app/, components/, lib/, shared/, hooks/, assets/ + features/
- New structure: features/ (auth, wallets, dashboard, settings, modal), shared/

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
- Wallets persisted at `users/{uid}/wallets` with `ownerId`; dashboard totals grouped by currency (no conversion in MVP)
- **Git**: Never commit automatically. Keep changes staged. Ask before creating a separate commit for unrelated changes.

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
