# Test Guide and Coverage

## 1. Coverage Goal
**Target: >= 90% global coverage**

Reason: app with financial logic (balances, transfers, split expenses). Errors are costly. 90% forces critical logic coverage without chasing 100%.

Metrics: statements, branches, functions, lines >= 90%.

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
| **Hooks** | HIGH | Orchestration logic |
| **UI Components** | MEDIUM | Key cases, don't over-test styles |
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
Add:
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
Ensure coverageThreshold:
```js
coverageThreshold: {
  global: {
    statements: 90,
    branches: 90,
    functions: 90,
    lines: 90
  }
}
```

Exclude from coverage: assets, route layouts, types, *.d.ts, __tests__, coverage

## 7. Best Practices
- AAA: Arrange, Act, Assert
- Descriptive tests
- Isolated mocks
- Test behavior, not implementation
- One concept per test
- Reusable test data

## 8. Coverage Verification
Run `npm run test:coverage`. If below 90%, fix before merge.

## 9. Checklist
- [ ] Critical logic covered
- [ ] Edge cases (0, negative, insufficient balance)
- [ ] Errors handled
- [ ] Isolated mocks
- [ ] Coverage >= 90%
- [ ] Fast tests
