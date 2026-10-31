# AGENTS.md

Instructions for AI agents (OpenCode, Claude, etc.) working on MisGastos.

## Read first
1. `docs/project/development-notes/project-memory.md`
2. `docs/project/guidelines/architecture-and-solid.md`
3. `docs/project/guidelines/security-and-validation.md`
4. `docs/project/testing/test-guide.md`

## Hard rules
- **File size**: soft limit of **150 lines** per `.ts`/`.tsx` file. Split before adding more behavior. Style files are exempt.
- **One component per file** (file = component + its `Props` interface).
- **One responsibility per function**: fetch, transform, validate or render — not several. UI side effects live in small dedicated helpers.
- **Screens orchestrate**: header, list header, section headers, footers, empty/loading/error states and modals are separate components. Derived data belongs to a hook or a pure util.
- **Styles**: when a screen has more than a handful of styles, move them to `features/<feature>/styles/<name>.styles.ts` exporting `<name>Styles` + a palette/token object. Reuse base style + variants (`[styles.chip, selected && styles.chipSelected]`), prefer `flex`/`gap` over magic margins, and never hardcode colors inside components.
- **Feature folders**: `components/`, `hooks/`, `services/`, `repositories/`, `schemas/`, `types/`, `utils/`, `styles/`.
- **Imports**: `@/` alias, named imports only, no default re-exports.
- **No `any`**: use `unknown` + type guards.
- **Commits**: never commit unless the user explicitly asks.
- **Tests**: colocated in `__tests__/`; services and utils are expected to be tested.

## Verification before finishing
```powershell
npx tsc --noEmit
npx expo lint
npx jest
```
