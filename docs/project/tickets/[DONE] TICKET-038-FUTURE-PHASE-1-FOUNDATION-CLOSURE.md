# [DONE] TICKET-038 - Close Phase 1 Foundation: Atoms and Coverage Gate

**Type:** Refactor / Testing  
**Priority:** High  
**Status:** ✅ Done (12/11/2026)  
**Related:** PM-038; TICKET-037 (unused atoms item)  
**Sprint:** Phase 1 - Foundation  

## Description
Close the remaining Phase 1 (Foundation) items from the roadmap. The shared `Result<T>` / `Nullable` / `Maybe` / `ID` / `BaseEntity` types already exist and are consumed by the feature layers, so that item only needs verification. The unused `shared/components/atoms` must be resolved so the project keeps a single UI system, and the 90% coverage target must be configured and enforced for business logic.

Per the agreed scope, the coverage gate measures business logic only: `services`, `repositories`, `schemas`, feature `utils` and `shared` pure logic. Screens, components, hooks, styles, routes, types, constants, providers and contexts are excluded and documented in the test guide. The broader shared-component audit remains in TICKET-037 (phase 3.6).

## Requirements
- [x] Verify `shared/types/common.types.ts` (`Result<T>`, `Nullable`, `Maybe`, `ID`, `BaseEntity`) is present and imported by the feature layers
- [x] Resolve the unused `shared/components/atoms` (`button.tsx`, `input.tsx`, `text.tsx`, `index.ts`): they have no consumers and duplicate the themed button/input patterns, so remove them instead of keeping two competing systems
- [x] Confirm no imports or dead references to the removed atoms remain
- [x] Add `collectCoverageFrom` to `jest.config.js` scoped to business logic, excluding tests, types, screens, components, hooks, styles, routes, providers, contexts, constants and generated folders
- [x] Add a global `coverageThreshold` of 90 for statements, branches, functions and lines
- [x] Add `test:watch`, `test:coverage` and `test:ci` scripts
- [x] Add or extend tests until the scoped business logic reaches every 90% threshold
- [x] Document the coverage scope and exclusions in `docs/project/testing/test-guide.md`

## Acceptance Criteria
- [x] `shared/components/atoms` no longer exists and nothing imports it
- [x] `shared/types/common.types.ts` remains the single source for the common types and is still consumed by the features
- [x] `npm run test:coverage` enforces and passes the 90% global threshold for business logic
- [x] The coverage report excludes UI, hooks, styles and routes while covering services, repositories, schemas and utils
- [x] `npx tsc --noEmit`, `npx expo lint` and `npx jest` pass
- [x] Roadmap Phase 1 is fully ticked and documented

## Implemented
- Verified `shared/types/common.types.ts` and its consumers (`auth`, `categories`, `wallets`, `transactions`, `transfers`).
- Removed `shared/components/atoms` (`button.tsx`, `input.tsx`, `text.tsx`, `index.ts`). No imports or references remained; the app keeps its themed `StyleSheet` components as the single UI system. TICKET-037's atom item is marked as covered by this ticket.
- Added the business-logic `collectCoverageFrom` scope and the global 90% `coverageThreshold` to `jest.config.js`, plus `test:watch`, `test:coverage` and `test:ci` scripts.
- Added 41 test suites / 167 tests covering the previously untested transaction repositories and operations, wallet write/deletion/movement operations, transfer firestore utilities and operations, service factories, error mappers and remaining utils branches. Tests were split to keep every file under the 150-line limit.
- Current scoped coverage: **99.08% statements, 94.13% branches, 98.96% functions, 99.57% lines** across 129 suites / 591 tests.
- Ignored `coverage/` in `.gitignore` and documented the scope, exclusions and commands in `docs/project/testing/test-guide.md`.
- Verified with `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run test:coverage`.

## Technical Notes
- The atoms used raw hex colors and NativeWind classes while the rest of the app uses themed `StyleSheet` components, so adopting them would mean a second design system.
- The test guide already targets 90% for services, repositories and utils; this ticket makes that target executable and scoped to business logic.
- Coverage must not hide untested logic behind broad excludes: every file under `services`, `repositories`, `schemas`, `utils` and `shared` pure logic is in scope.
- Out of scope: TICKET-037 shared-component extraction, feature redesigns and i18n (TICKET-031).

## Dependencies
- Phase 1 roadmap items
- TICKET-037 owns the extraction audit and keeps its own atom decision history
