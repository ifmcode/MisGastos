---
name: MisGastos Feature Workflow
description: End-to-end workflow to add or change a MisGastos feature across folder layers, with the file-size, composition, copy and verification rules. Use when starting any feature, screen, service or repository change.
---

# MisGastos feature workflow

Use this when a ticket adds or changes behavior, not for a one-line typo.

## 1. Frame the ticket

1. Read `docs/project/development-notes/roadmap.md` **Current Focus**.
2. Read the active ticket in `docs/project/tickets/`. If a requirement is
   ambiguous, ask in Spanish before writing code.
3. Confirm the ticket is `🚧 In progress`; if not, `docs-writer` updates it.

## 2. Map the layers

| Layer | Folder | Owns | Does not |
|---|---|---|---|
| Route | `app/` | file-based route + guard | render the screen |
| Component | `features/<feature>/components/` | presentation, typed props | fetch data |
| Hook | `features/<feature>/hooks/` | state orchestration | business rules |
| Service | `features/<feature>/services/` | validation + use cases | import React or `firebase/*` |
| Repository | `features/<feature>/repositories/` | Firestore access, mappers, transactions | UI concerns |
| Schema | `features/<feature>/schemas/` | pure input validation | I/O |
| Util | `features/<feature>/utils/` | pure helpers | state |
| Styles | `features/<feature>/styles/` | `StyleSheet.create` + palette | logic |
| Shared | `shared/` | cross-feature UI, hooks, utils | feature palettes or copy |

Cross-feature reuse goes to `shared/` only when at least two features need it.

## 3. Build in this order

1. Types (`types/<name>.types.ts`) and schema.
2. Repository interface, then the Firestore implementation and mapper.
3. Service with stable error codes; no user-facing sentences.
4. Pure utils for derivations.
5. Hook that composes service calls and UI state.
6. Components: one per file, `Props` interface, styles module when more than a
   handful of styles.
7. Screen that only orchestrates; route stays thin.
8. Translation keys in `features/<feature>/locales/{es,en}.json` for every string.

## 4. Hard rules

- Soft limit 150 lines per `.ts`/`.tsx`; style files are exempt. Split before adding behavior.
- One component per file; one responsibility per function.
- `@/` alias, named imports only, no default re-exports, no `any`.
- No raw colours in components; reuse base style + variants.
- Screens never call Firebase directly and never navigate from child components.
- Do not create a new pattern when `features/transactions`, `features/transfers` or
  `shared/components` already solves it.

## 5. Verify

Run `scripts/verify.ps1` from the repository root (or the four commands in
`AGENTS.md`: `npx tsc --noEmit`, `npx expo lint`, `npx jest`, `npm run check:copy`).
Add or update colocated tests for services, schemas, repositories and utils.

## 6. Report

List changed files by layer, reused shared components, verification results, and
deviations from this workflow with their justification. Never commit unless the
user explicitly asks.
