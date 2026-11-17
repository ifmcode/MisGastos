# Phase 1 Foundation Closure (TICKET-038)

**Date:** 12/11/2026

## Goal
Close the three open Phase 1 items: common types, the base UI kit atoms and the 90% coverage target.

## Decisions
- **Common types:** `shared/types/common.types.ts` already exports `Result<T>`, `Nullable`, `Maybe`, `ID` and `BaseEntity`, and the feature layers consume it. No code change was needed.
- **Unused atoms:** `shared/components/atoms` (`button.tsx`, `input.tsx`, `text.tsx`, `index.ts`) had zero consumers and used raw hex colors plus NativeWind classes. The app's themed `StyleSheet` components are the established UI system, so keeping both would create a second design system. The atoms were removed and TICKET-037's atom item is marked as covered by TICKET-038.
- **Coverage scope:** the 90% gate measures business logic only. Screens, components, hooks, styles, routes, providers, contexts, constants and types are excluded because there is no React renderer in the Jest setup yet. The goal remains to add rendering tests later and widen the scope deliberately.

## Coverage Configuration
`jest.config.js`:
- `collectCoverageFrom`: `features/*/services`, `repositories`, `schemas`, `utils`, plus `shared/lib`, `shared/services` and `shared/utils`; excludes `__tests__`, `*.d.ts` and `*.types.ts`.
- `coverageThreshold.global`: 90 for statements, branches, functions and lines.
- Scripts: `test:watch`, `test:coverage`, `test:ci`.
- `coverage/` is ignored in git.

## Tests Added
41 suites / 167 tests, colocated in `__tests__` and split to stay under 150 lines:
- Transaction repository: Firestore utils, create/delete/update operations, repository read/delegation.
- Wallet repository: write operations, deletion guards, movement loading, delete helpers, repository get/delegation.
- Transfer repository: firestore utilities, create/delete/update guards and errors.
- Service factories, error messages, mutation mappers, transaction balance, transfer form derivations/validation, filters, wallet options/list/owner and schema runtime guards.

## Verification
```powershell
npx tsc --noEmit
npx expo lint
npx jest
npm run test:coverage
```

Scoped result: **99.08% statements, 94.13% branches, 98.96% functions, 99.57% lines** (129 suites / 591 tests).

## Follow-ups
- TICKET-037 still owns the shared-component extraction audit.
- UI/hook coverage stays out of the gate until `@testing-library/react-native` is introduced.
- Current Focus returns to TICKET-033 (dashboard recent transfers).
