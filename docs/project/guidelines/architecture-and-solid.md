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
- **Styles**: NativeWind preferred, StyleSheet if needed

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
