# GUÍA DE TESTS Y COBERTURA

## 1. Objetivo cobertura
**Objetivo recomendado: >= 90% de cobertura global**

Razón: app con lógica financiera (saldos, transferencias, división gastos). Errores costosos. 90% fuerza a cubrir lógica crítica sin obsesionarse con 100%.

Métricas a vigilar: statements, branches, functions, lines >= 90%.

## 2. Stack testing
- Jest (ya configurado)
- ts-jest
- @types/jest
- (Opcional futuro) @testing-library/react-native, react-test-renderer

## 3. Qué testear
| Tipo | Prioridad | Notas |
|---|---|---|
| **Services** (reglas negocio) | CRÍTICA | Saldos, transferencias, split gastos, validaciones |
| **Utils** puros | CRÍTICA | Cálculos, formatters, validadores |
| **Repositories** | ALTA | Con mocks Firestore/Auth |
| **Hooks** | ALTA | Lógica orquestación (con renderHook o mocks) |
| **Components UI** | MEDIA | Casos clave, no sobre-testear estilos |
| **Integración feature** | ALTA | Flujos MVP |

## 4. Estructura tests
```text
features/xxx/
├── services/
│   ├── xxxService.ts
│   └── __tests__/xxxService.test.ts  (o junto)
shared/utils/
├── money.ts
└── __tests__/money.test.ts

lib/__tests__/  # existente
```

## 5. Scripts package.json (añadir)
Añadir tras configurar:
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

## 6. Configuración Jest (revisar)
`jest.config.js` actual. Asegurar:
- preset: jest-expo o ts-jest según necesidad
- collectCoverageFrom: excluir assets, app/ rutas puras, types, *.d.ts
- coverageThreshold:
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

## 7. Buenas prácticas
- AAA: Arrange, Act, Assert
- Tests descriptivos: "should transfer amount between wallets"
- Mocks claros
- Sin tests de implementación, testear comportamiento
- Un concepto por test
- Datos de prueba reutilizables

## 8. Verificación cobertura
Usar `npm run test:coverage`. Si baja < 90, revisar antes de merge.
Crear script `codigo-tests/check-coverage.js` opcional para forzar check.

## 9. Checklist tests
- [ ] Lógica crítica cubierta
- [ ] Casos borde (0, negativos, insuficiente saldo)
- [ ] Errores manejados
- [ ] Mocks aislados
- [ ] Cobertura >= 90%
- [ ] Tests rápidos
