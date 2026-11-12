/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  // Only execute *.spec|test files; keeps __tests__ helpers out of the runner.
  testMatch: [
    "**/__tests__/**/*.test.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  // The 90% gate measures business logic only. Screens, components, hooks,
  // styles, routes, types, constants, providers and contexts are excluded on
  // purpose; see docs/project/testing/test-guide.md.
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
  coverageReporters: ["text", "lcov"],
};
