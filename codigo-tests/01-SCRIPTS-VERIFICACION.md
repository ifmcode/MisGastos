# SCRIPTS PARA VERIFICACIÓN

## 1. Script cobertura (concepto)
Crear `codigo-tests/check-coverage.js` que ejecute jest con coverage y falle si < 90%.

```javascript
// codigo-tests/check-coverage.js (idea)
const { execSync } = require('child_process');
try {
  execSync('jest --coverage --watchAll=false --runInBand', { stdio: 'inherit' });
  // Parse coverage-summary.json si se quiere estricto
  process.exit(0);
} catch(e) {
  process.exit(1);
}
```

## 2. Comandos
```bash
npm run test:coverage  # Ver informe
npm run test:ci        # Para CI/local estricto
```

## 3. Recomendación umbral
**Umbral sugerido: 90% global**

Justificación: lógica financiera crítica. Si algún PR baja cobertura, justificar o añadir tests.

## 4. Excluir del coverage
Añadir a jest.config.js collectCoverageFrom:
```js
collectCoverageFrom: [
  '**/*.{ts,tsx}',
  '!**/*.d.ts',
  '!**/node_modules/**',
  '!**/.expo/**',
  '!**/app/**/layout.tsx', // layouts routing
  '!**/app/**/+html.tsx',
  '!**/assets/**',
  '!**/constants/**',
  '!**/types/**',
  '!**/__tests__/**',
  '!**/coverage/**'
]
```

(Ajustar según evolución)
