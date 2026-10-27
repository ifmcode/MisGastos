# Pautas de desarrollo Frontend - MisGastos (Arquitectura + SOLID)

> Documento guía para mantener coherencia, escalabilidad, testabilidad y mantenibilidad. Aplicable a React Native + Expo Router + TypeScript + NativeWind.

## 1. Objetivos
- Separación clara de responsabilidades
- Código testeable y reutilizable
- Dependencias invertidas y acopladas mínimamente
- Fácil extensión sin modificar lo existente (OCP)
- Tipado estricto con TypeScript
- Componentes pequeños y predecibles

## 2. Arquitectura propuesta (Feature-first + Clean/Layered)

Organizamos por **features** (dominio) y **capas** compartidas. Esto encaja bien con Expo Router (rutas) sin mezclar lógica de negocio con UI.

```text
src/ (o raíz)
├── app/                    # Rutas Expo Router (solo navegación/layouts)
├── features/               # Módulos por dominio (transacciones, presupuesto, auth, ...)
│   ├── auth/
│   │   ├── components/     # Componentes específicos del feature
│   │   ├── hooks/          # Hooks con lógica de UI/orquestación
│   │   ├── services/       # Lógica de negocio / casos de uso
│   │   ├── repositories/   # Acceso a datos (contratos + impl)
│   │   ├── store/          # Estado local/global del feature (opcional)
│   │   ├── types/          # Tipos del dominio
│   │   └── utils/          # Helpers puros del feature
├── shared/                 # Reutilizable transversal
│   ├── components/         # UI kit atómico/compuesto
│   │   ├── atoms/          # Button, Text, Input, Icon...
│   │   ├── molecules/      # FormGroup, CardHeader...
│   │   ├── organisms/      # Forms complejos, listas
│   │   └── templates/      # Layouts reutilizables
│   ├── hooks/              # Hooks genéricos (useDebounce, useForm...)
│   ├── lib/                # Configuraciones (firebase, storage, http)
│   ├── services/           # Servicios transversales (logger, analytics)
│   ├── utils/              # Helpers puramente matemáticos/lógicos
│   ├── constants/          # Constantes globales
│   ├── types/              # Tipos globales (Result<T>, etc.)
│   └── providers/          # Contextos globales
├── assets/                 # Imágenes, fuentes, etc.
└── tests/                  # Tests integrados/contratos (opcional)
```

> **Nota:** Hoy el proyecto ya tiene `app/`, `components/`, `lib/`, `common/`, `hooks/`. La migración puede ser incremental: ir creando `features/` y `shared/` sin romper lo existente.

## 2.1. Capas y responsabilidades

| Capa | Responsabilidad | Reglas |
|---|---|---|
| `app/` | Únicamente rutas, layouts, pantallas conectadas mínimas. | Sin lógica de negocio, sin llamadas directas a Firebase/AsyncStorage fuera de servicios. |
| `features/*/components` | Componentes visuales/orquestadores del feature. | Props tipadas, sin lógica de acceso a datos. Máximo presentacional u orquestador ligero. |
| `features/*/hooks` | Orquestación entre UI, servicios y estado. | Lógica de UI (loading, errores, validación local). No implementa detalles de infraestructura. |
| `features/*/services` | Casos de uso / reglas de negocio. | **Sin React**. Deben ser funciones/clases puras o con dependencias inyectadas. |
| `features/*/repositories` | Puente entre dominio y datos. | Define **interfaces (contratos)** y **implementaciones**. Aquí se decide qué fuente de datos usar. |
| `features/*/types` | Entidades, DTOs, value objects del dominio. | Tipado estricto. Evitar `any`. |
| `shared/components` | UI Kit reutilizable. | Sin conocimiento de features específicos. Presentacionales. |
| field logic, etc. | * | * |

## 3. Principios SOLID aplicados a Frontend

### S - Single Responsibility Principle (SRP)
- **Componentes**: Uno per archivo. Si tiene múltiples responsabilidades (fetch + formulario + lista), dividir.
- **Hooks**: Cada hook debe resolver a una única tarea (ej. `useAuth()` vs varios hooks separados).
- tag
- **Servicios**: Un servicio por agregado/caso de uso (ej. `TransactionService` no debería gestionar auth).

### O - Open/Closed Principle (OCP)
- **UI Kit**: Crear componentes base (`Button`, `Card`) extensibles mediante props (`variant`, `size`, `asChild`) instead of modificar código.
- **Repositorios**: Añadir nuevas implementación
- **### I - Interface Segregation Principle (ISP)
- **Contratos pequeños**: Interfaces de repositorio separadas. No obligar cliente (~) a implementar métodos
- **Props**: `interface Props>` segregadas. Preferir props individuales o pequeñas interfaces.

### D - Dependency Inersion Principle (DIP)
- **Inyecciones Dependencies**: Servicios/hooks deben depender de **interfaces** (`IAuthRepository`), not implementation. 
- **Config / Providers: use React Context or simple DI container concept (factory) to inject implementations (Firebase vs mocks) to testability.
- **app/lib** existing: keep config, but change to inject in services/repositories instead of importing config directly everywhere.

## 4. Patrones recomendados

| Pattern |
|------|---|
| **Repository Pattern** | Separar la fuente de datos (Firebase/AsyncStorage/REST) de reglas de negócio. |
| **Service Layer / Use Cases** | Reglas clave (calcular saldo, validar presupuesto) fuera de componentes/hook. |
| **Presentational & Container** | Presentational (UI Kit) vs oratory / hook connected (feature components). |
| **Compound Components** | Para componentes complejos (Accordion, Dialog). |
| **Render Props / Children as Function**: minimal (use hooks better). 
| **Custom Hooks** | Orchestration / behavior reuse. |
| **Factory / Module Augmentation**: only if strictly necessary. 

## tag 5. Guidelines de código

### 5.1 TypeScript
- `strict` enabled (already in tsconfig). `noImplicitAny`, strictNullChecks.
- Define `type` vs `interface`: `interface` for contracts, `type` for unions/tuples/complex
- Avoid `any`, use `unknown + narrowing`.
- Return types explícillos in services/hooks/functions.
- Zod/Joi can later, but for now strict typing.

### 5.2 React Native / Expo Router
- Screen components in `app/*` minimal: connect hooks only. 
- Avoid inline styles excessive; use NativeWind + shared components.
- Keys properly, FlatList for lists.
- Use expo-router's Link, router.push/replace appropriately.
- Platform specific (Platform.OS) only in shared/utils or specific components.

### 5.5.5.3 Components
- **Atomic design** in `shared/components`: atoms -> molecules -> organisms -> templates.
- Functional components only. 
- Props interface named `XProps`.
- Display name if necessary (not required in TSX).
- Children typed correctly, memoization (`React.memo`, `useCallback`, `useMemo') only when perf issues or reference stability needed.

### 5.4 Hooks
- `use` prefix.
- Custom hooks for logic outside JSX.
- Dependencies correctly in useEffect/useCallback.
- Combine multiple hooks in larger hooks.
- Not call custom hooks in loops/conditions.

### 5.2.5.5 Testing
- **Unit tests**: services, utils, repositories with mocks (jest).
- **Component tests**: @testing-library/react-native (if added later).
- **Integration tests**: feature flows. Clása 1 test per rule/case.
- mocks: define in `__mocks__` or `test-utils`.

## 6. Ejemplo práctico (Auth)
 
This shows DIP/Repository/Service applied:
 
```text
features/auth
├
│   \u251c\u2500\u2500 components
│   │   \u2514\u2500\u2500 LoginForm.tsx  (presentational, receives props)
├
│   \u251c\u2500\u2500 hooks
│   │   \u2514\u2500\u2500 useAuth.ts      (orchestrates service)
├
│   \u251c\u2500\u2500 services
│   │   \u2514\u2500\u2500 authService.ts (rules: email validation, session)
├
│   \u251c\u2500\u2500 repositories
│   │   \u2514\u2500\u2500 authRepository.ts (interface + FirebaseAuthRepository)
├
│   \u251c\u2500\u2500 types
│   │   \u2514\u10005&#x1111;&#x1002C;# user#&amp;#x1F4C4; User:...`}}}}} 
X});
"
```

## 7. Migración incremental
1. **Crear structure**: `features/`, `shared/` first (empty folders with README or just structure).
  2. **UI Kit move**: migrate existing `components/ui` and reusable to `shared/components`.
  3. **Feature extraction: move `lib/auth.ts` to `features/auth/` in repo+service layers.
  4. **Routes clean: `app/` only routing, use hooks/services from features.
  5. **Strict Lint: add rules (eslint/tsconfig) and enforce.
  6. **Tests: cover services first.

## 8. Checklist de código limpio
- [ ] Componente pequeño (&lt; 150-200 líneas) y con una función
- [ ] Sin llamadas directas a Firebase/AsyncStorage in components/hook outside repository
- [ ] Tipado completo, sin `any`
- [ ] Hooks personalizados para lógica
- [ ] Servicios/repositorios sin React import
- [ ] UI reutilizable en `shared/components`
- [ ] Props claramente definidas
- [ ] Tests unitarios for critical services
- [ ] Código modular, fácil to replace implementation

## 9. Referencias
# PR Title: 
# PR Body: https://
droid, etc, not needed.
# v1.0.0
</br>
</br>

Mi version actual structure - ejemplo rápido:
```text
MisGastos/
├── app/
├── components/
├── common/
├── lib/
├#%}
```

## 10. Acción inmediata
`mkdir -p features/{auth,transactions,budget} shared/{components,lib,utils,hooks,types,constants} docs`

## appendix
*Ignorar existing structure until fully migrated*; enforce new guidelines on new features.
</content>