---
name: Jest Testing in MisGastos
description: Colocated Jest tests, fixtures, mocks and coverage rules for MisGastos business logic. Use when adding or changing services, repositories, schemas, utils or their tests, or when a coverage run fails.
---

# Jest testing in MisGastos

## Scope and gate

Coverage is enforced at **90%** for statements, branches, functions and lines,
but only for:

```text
features/*/{services,repositories,schemas,utils}/**/*.ts
shared/{lib,services,utils}/**/*.ts
```

Screens, components, hooks, styles, routes, providers, constants and types are
excluded on purpose (`jest.config.js`, `docs/project/testing/test-guide.md`).
Never lower the threshold to make a change pass, and never add code to the
exclusion list to hide an uncovered branch.

## Place and name tests

```text
features/<feature>/services/__tests__/<name>.service.test.ts
features/<feature>/repositories/__tests__/<name>.operation.test.ts
features/<feature>/utils/__tests__/<name>.test.ts
shared/utils/__tests__/<name>.test.ts
```

Helpers that are not tests live in `__tests__/` but must not end in `.test.ts`:
`*.fixtures.ts` (data), `*.fakes.ts` (in-memory implementations),
`*.test-helpers.ts` (builders). `testMatch` only runs `*.test.*`/`*.spec.*`.

## Conventions

- AAA (arrange/act/assert), one concept per test, descriptive `it` names.
- Mock at the boundary: `jest.mock("firebase/firestore")` for repositories, a
  fake repository implementing the interface for services. Never mock the module
  under test.
- Reset mocks in `beforeEach`; no shared mutable fixtures between tests.
- Assert domain error **codes** (`TRANSFER_INVALID`, `WALLET_NOT_OWNED`, …), not
  translated sentences.
- Cover the error branches explicitly: missing document, ownership mismatch,
  invalid amount, currency mismatch, insufficient balance, empty owner id,
  repeated delete.
- Money assertions use exact numbers (`toBe(-25.5)`), not approximate matchers.
- Test behavior through the public API; avoid asserting private helper calls.

## Commands

```bash
npx jest                      # full suite
npx jest features/wallets      # one feature
npm run test:coverage         # suite + 90% gate
npm run test:ci               # single run, in band (CI)
npm run test:watch            # local loop
```

## Triage

- Failure in `transaction-*.operation` or `transfer-*.operation`: check the balance
  helper expectations and the mocked `runTransaction` shape first.
- Coverage regression: read the uncovered lines in the report; add the missing
  branch test rather than an ignore comment.
- A test that needs a React renderer belongs to UI work: there is no renderer yet,
  so test the pure logic behind the component instead.
