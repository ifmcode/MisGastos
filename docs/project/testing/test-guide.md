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

## 8.1 Copy Audit
Run `npm run check:copy` before finishing any UI change. The script parses TSX with the TypeScript compiler and fails on literal JSX text or copy-bearing literal props (`accessibilityLabel`, `accessibilityHint`, `placeholder`, `title`, `message`, `label`, `helperText`, `confirmLabel`, `cancelLabel`). User data and technical values are intentionally excluded.

Translation tests also enforce `es`/`en` key parity and the missing-key fallback; see `shared/i18n/__tests__/resources.test.ts`.

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

## 11. Offline and Sync Manual Checklist

Run this on a device with `EXPO_PUBLIC_OFFLINE_FIRST=true` and the current
`firestore.rules` deployed (the `appliedMutations` contract and the
`transactions`/`transfers` `get`/`list` split).

1. **Cache cold start**: open Wallets, Movements and Transfers online once, then
   enable airplane mode and open each list. They render the saved data and the
   header sync icon reports the offline state.
2. **Offline writes**: create an expense, an income and a transfer; edit one and
   delete another. The derived balance changes immediately and the header sync
   icon shows the pending badge.
3. **Restart**: kill the app, relaunch it offline, and confirm the same rows,
   pending count and balances.
4. **Exactly-once**: disable airplane mode; the queue drains (or press
   **Reintentar ahora**). In the Firebase console each document has the client
   id, `revision` is bumped once and there is exactly one
   `appliedMutations/{uid}__{mutationId}` per mutation. Pushing again does not
   duplicate money.
5. **Transient failure**: turn airplane mode on and off during a push; the queue
   pauses and resumes with backoff, and no row is lost.
6. **Permanent failure**: force a `permission-denied` (for example by testing a
   build against rules that deny the write); the row stays `failed` until
   **Reintentar ahora**, which requeues it.
7. **Two-device conflicts**: on device A, edit offline; on device B, edit or
   delete the same record; reconnect A. Open the conflict from `/sync`, check
   **Tu cambio** vs **Cambio de otro dispositivo** and resolve with each option
   in separate runs. Balances and history must match the decision.
8. **Wallet unavailable / insufficient funds**: remove or empty the wallet on
   another device while a movement/transfer is pending; the conflict explains
   the cause and only discards on an explicit choice.
9. **UI**: header sync icon in Inicio, Carteras, Movimientos and Social,
   Settings **Sincronización**, `/sync` and the conflict sheet in light and dark
   mode, Spanish and English, with the screen reader. The old bottom strip must
   not appear on any route.
10. **No regression online**: with the flag off, creating, editing and deleting
    movements and transfers behaves exactly as before.

## 12. Dev log overlay and the custom entry

React Native's LogBox notification is white in this app's dark theme and, in
bridgeless development builds, it only shows **Open debugger to view warnings.**
with unreadable text. LogBox is not themeable through a public API, so the
project **replaces its notifications with a themed in-app overlay**:

- `lib/dev-logbox.ts` is imported from the root `index.js` (the `package.json`
  **main**, which then imports `expo-router/entry`). It calls
  `LogBox.ignoreAllLogs(true)` and wraps `console.warn`/`console.error` before
  the first render, so startup warnings are captured too.
- `lib/dev-log.store.ts` keeps at most three deduplicated entries, filters the
  known noise (Firestore offline messages and the React Native
  `SafeAreaView`/`ImageBackground` deprecations triggered by NativeWind),
  auto-dismisses after 8 seconds and exposes the store to React.
- `DevLogOverlay` (mounted in `app/_layout.tsx`, next to the navigator) renders
  each entry as a warning/error card using the app theme, with the message and a
  close action. The full message also stays in the Metro console.
- The trade-off is deliberate: the standard LogBox list and its white cards are
  hidden. Fatal errors still reach the console/Metro.
- To silence new known noise, add its substring to `IGNORED_PATTERNS`. Every
  other message is shown and readable; do not remove the custom entry.
