# Verification Scripts

## 1. Coverage Check Script
Create `docs/project/testing/check-coverage.js` concept:
```javascript
const { execSync } = require('child_process');
try {
  execSync('jest --coverage --watchAll=false --runInBand', { stdio: 'inherit' });
  process.exit(0);
} catch(e) {
  process.exit(1);
}
```

## 2. Commands
```bash
npm run test:coverage
npm run test:ci
```

## 3. Recommended Threshold
**90% global** - enforced for financial logic.

## 4. Coverage Exclusions
Add to jest.config.js collectCoverageFrom:
```js
collectCoverageFrom: [
  '**/*.{ts,tsx}',
  '!**/*.d.ts',
  '!**/node_modules/**',
  '!**/.expo/**',
  '!**/app/**/layout.tsx',
  '!**/app/**/+html.tsx',
  '!**/assets/**',
  '!**/constants/**',
  '!**/types/**',
  '!**/__tests__/**',
  '!**/coverage/**'
]
```
