# Test Guide and Coverage

## 1. Coverage Goal
**Target: >= 90% global coverage for business logic.**

Reason: app with financial logic (balances, transfers, split expenses). Errors are costly. 90% forces critical logic coverage without chasing 100%.

Metrics: statements, branches, functions and lines >= 90%.

**Scope (enforced by `jest.config.js`):**
- `features/*/services/**/*.ts`
- `features/*/repositories/**/*.ts`
- `features/*/schemas/**/*.ts`
- `features/*/utils/**/*.ts`
- `shared/lib/**/*.ts`
- `shared/services/**/*.ts`
- `shared/utils/**/*.ts`

**Excluded on purpose:** screens, components, hooks, styles, routes (`app/`), providers, contexts, constants, types, tests and `*.d.ts`. UI and orchestration are still worth testing case by case, but they do not gate the business-logic threshold until a React renderer is added.

## 2. Testing Stack
- Jest (configured)
- ts-jest
- @types/jest
- (Future) @testing-library/react-native, react-test-renderer

## 3. What to Test
| Type | Priority | Notes |
|---|---|---|
| **Services** (business rules) | CRITICAL | Balances, transfers, expense splitting, validations |
| **Utils** (pure) | CRITICAL | Calculations, formatters, validators |
| **Repositories** | HIGH | Mock Firestore/Auth |
| **Hooks** | HIGH | Orchestration logic (not in the current coverage gate) |
| **UI Components** | MEDIUM | Key cases, don't over-test styles (not in the current coverage gate) |
| **Feature integration** | HIGH | MVP flows |

## 4. Test Structure
```text
features/xxx/
├── services/
│   ├── xxxService.ts
│   └── __tests__/xxxService.test.ts
shared/utils/
├── money.ts
└── __tests__/money.test.ts

lib/__tests__/  # existing
```

## 5. package.json Scripts
Available:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --coverage --watchAll=false --runInBand"
  }
}
```

## 6. Jest Config
`jest.config.js` collects coverage only from business logic and enforces the threshold:
```js
collectCoverageFrom: [
  "features/*/services/**/*.ts",
  "features/*/repositories/**/*.ts",
  "features/*/schemas/**/*.ts",
  "features/*/utils/**/*.ts",
  "shared/lib/**/*.ts",
  "shared/services/**/*.ts",
  "shared/utils/**/*.ts",
  "!**/__tests__/**",
  "!**/*.d.ts",
  "!**/*.types.ts",
],
coverageThreshold: {
  global: {
    statements: 90,
    branches: 90,
    functions: 90,
    lines: 90,
  },
},
```

## 7. Best Practices
- AAA: Arrange, Act, Assert
- Descriptive tests
- Isolated mocks
- Test behavior, not implementation
- One concept per test
- Reusable test data

## 8. Coverage Verification
Run `npm run test:coverage` (or `npm run test:ci` in CI). Jest fails when any global business-logic metric drops below 90%.

## 9. Checklist
- [ ] Critical logic covered
- [ ] Edge cases (0, negative, insufficient balance)
- [ ] Errors handled
- [ ] Isolated mocks
- [ ] Coverage >= 90%
- [ ] Fast tests

## 10. Visual Checks
Use `docs/project/testing/dark-mode-visual-checks.md` for the light/dark
screenshots and computed-style results. Keep visual evidence in
`docs/project/testing/visual-checks/` when a ticket changes appearance.
