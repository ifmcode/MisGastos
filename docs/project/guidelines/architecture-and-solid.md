# Guidelines: Architecture, SOLID, Structure

> Apply ALWAYS. Based on current project analysis + React Native/TypeScript best practices.

## 1. Philosophy
- **KISS**: Simple > Complex
- **YAGNI**: Don't implement until necessary
- **DRY**: Reuse but don't abstract prematurely
- **SOLID**: Guide design
- **Feature-first**: Group by domain, not by type

## 2. Target Structure
```text
MisGastos/
├── app/                    # Expo Router - ONLY routes/layouts/minimal screens
├── features/               # Domain modules
│   ├── auth/
│   ├── wallets/
│   ├── transactions/
│   ├── groups/
│   ├── friends/
│   └── profile/
├── shared/                 # Cross-cutting reusable
│   ├── components/         # UI Kit (atoms/molecules/organisms/templates)
│   ├── hooks/              # Reusable hooks
│   ├── lib/                # Config (firebase, storage)
│   ├── services/           # Cross-cutting services
│   ├── utils/              # Pure utils
│   ├── constants/          # Constants
│   ├── types/              # Global types
│   ├── schemas/            # Validation schemas
│   └── providers/          # Context providers
├── docs/project/           # All documentation
```

## 3. Layers per feature
| Folder | Purpose | Restrictions |
|---|---|---|
| `components/` | Feature-specific UI | Typed props. No business logic/direct Firebase |
| `hooks/` | Orchestration | Use services/repositories. Handle UI state |
| `services/` | Use cases/business rules | **NO React**. Pure or injected. Testable |
| `repositories/` | Data access | Interface + implementation. Isolate Firestore/AsyncStorage |
| `types/` | Entities/DTOs | Strict typing |
| `utils/` | Feature helpers | Prefer pure functions |
| `store/` | Complex state (optional) | Only if justified |

## 4. SOLID in Frontend
### S - Single Responsibility
- One component = one responsibility
- One service = one aggregate/use case
- One hook = one concern

### O - Open/Closed
- UI Kit extensible via props/variants
- Repositories interchangeable

### L - Liskov Substitution
- Implementations must respect interface contract

### I - Interface Segregation
- Small specific interfaces
- Segregated props

### D - Dependency Inversion
- Services depend on `IRepository`, not `firebase/*` directly
- Inject dependencies for testability

## 5. Practical Rules
- **Imports**: Use `@/` paths. **Named imports only**. Do not use `export { default } from ...` or `import X from ...` for re-exports. Always import the specific named export directly. Prefer explicit named exports from modules.
- **Commits**: **NEVER commit automatically**. Keep all changes staged with `git add`. Only commit when explicitly instructed by the user. If a new task/change should go in a separate commit, suggest it to the user.
- **Components**: Functional, `XProps` interface
- **Hooks**: `useXxx`, correct deps
- **No `any`**: Use `unknown` + type guards
- **Early returns**: Reduce nesting
- **Names**: Clear English names
- **Async**: try/catch, loading/error states
- **Lists**: FlatList with keyExtractor
- **Styles**: NativeWind preferred, StyleSheet if needed. See §5.1 for extraction.

### 5.1 File size & composition (HARD RULES)
- **Soft limit: 150 lines per file** (components, hooks, utils, services). If a file grows past it, split it before adding more behavior. If a split is not reasonable, document why in the PR/session note.
- **One component per file.** Each file exports a single component (plus its `Props` interface). Nested/auxiliary components go in their own file.
- **One responsibility per function.** A function either fetches, transforms, validates, or renders — not several at once. Side effects (e.g. `Alert`) live in small dedicated helpers.
- **Screens orchestrate, they don't render everything.** A screen wires hooks and state and composes extracted components: header, list header, section headers, footers, empty/loading/error states, modals.
- **Derived data goes to a hook or pure util**, not inline in the screen (`useXOverview`, `getXDefaults`).
- **Styles live in a dedicated file when a screen has more than a handful of styles**: `features/<feature>/styles/<name>.styles.ts`, exporting `<name>Styles` (a `StyleSheet.create`) plus a `palette`/token object. Style files MAY exceed 150 lines.
- **Reuse styles, don't duplicate:** base style + variants applied via arrays (`[styles.chip, selected && styles.chipSelected]`), shared tokens instead of repeated hex colors, and `flex`/`gap` layouts instead of magic margins.
- **No raw colors in components.** Import them from the styles module or `shared/constants`.

## 6. Incremental Migration
1. Create `features/` and `shared/` without deleting existing
2. Move reusable UI to `shared/components`
3. Extract auth to `features/auth` with repo+service
4. New features MUST use new structure
5. Refactor existing only when touched

## 7. Architecture Checklist
- [ ] Belongs to routes or feature?
- [ ] Business logic outside component?
- [ ] Data access via repository?
- [ ] Dependencies inverted if complex?
- [ ] Testable?
- [ ] Reusable or specific?
- [ ] File ≤150 lines and one component per file?
- [ ] Styles extracted to a styles module and reused (no duplicated colors)?
