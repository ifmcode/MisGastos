# DIRECTRICES: Arquitectura, SOLID, Estructura

> Aplicar SIEMPRE. Basado en análisis del proyecto actual + buenas prácticas React Native + TypeScript.

## 1. Filosofía
- **KISS**: Simple > Complejo
- **YAGNI**: No implementar hasta que sea necesario
- **DRY**: Reutilizar, pero no abstraer prematuramente
- **SOLID**: Guiar diseño
- **Feature-first**: Agrupar por dominio, no por tipo

## 2. Estructura objetivo
```text
MisGastos/
├── app/                    # Expo Router - SOLO rutas/layouts/pantallas mínimas
├── features/               # Dominio
│   ├── auth/               # Ya existe lógica, migrar
│   ├── wallets/            # Carteras
│   ├── transactions/       # Gastos/ingresos/transferencias
│   ├── groups/             # Grupos Splitwise-style
│   ├── friends/            # Amigos
│   └── profile/            # Perfil/config
├── shared/                 # Transversal
│   ├── components/         # UI Kit (atoms/molecules/organisms/templates)
│   ├── hooks/              # Hooks reutilizables
│   ├── lib/                # Config (firebase, storage) - compartir con features
│   ├── services/           # Servicios transversales
│   ├── utils/              # Utils puros
│   ├── constants/          # Constantes
│   ├── types/              # Tipos globales
│   ├── schemas/            # Validaciones (zod si se añade)
│   └── providers/          # Context providers
├── dev_steps/              # Memoria desarrollo
├── tickets/                # Tickets/JIRA-like
├── directrices/            # Estas directrices
├── codigo-tests/           # Guía tests + scripts verificación
├── ui-references/          # HTML de Stitch / referencias UI
└── plan-implementacion/    # Plan vivo
```

## 3. Capas por feature
| Carpeta | Propósito | Restricciones |
|---|---|---|
| `components/` | UI específica del feature | Props tipadas. Sin lógica negocio/directa Firebase |
| `hooks/` | Orquestación | Usa services/repositories. Maneja estado UI |
| `services/` | Casos de uso/reglas negocio | **SIN React**. Puro o inyectado. Testeable |
| `repositories/` | Acceso datos | Interface + implementación. Aísla Firestore/AsyncStorage |
| `types/` | Entidades/DTOs | Tipado estricto |
| `utils/` | Helpers específicos feature | Puros preferiblemente |
| `store/` | Estado complejo (opcional) | Solo si justificado |

## 4. SOLID aplicado
### S - Single Responsibility
- Un componente = una responsabilidad
- Un servicio = un agregado/caso de uso
- Un hook = una preocupación

### O - Open/Closed
- UI Kit extensible vía props/variants
- Repositorios intercambiables

### L - Liskov Substitution
- Implementaciones deben respetar contrato de interfaz

### I - Interface Segregation
- Interfaces pequeñas y específicas
- Props segregadas

### D - Dependency Inversion
- Servicios dependen de `IRepository`, no de `firebase/*` directamente
- Inyectar dependencias, facilitar mocks

## 5. Reglas prácticas
- **Imports**: Usar paths con `@/` (ya configurado)
- **Componentes**: Funcionales, `XProps` interface
- **Hooks**: `useXxx`, deps correctas
- **Sin `any`**: Usar `unknown` + type guards
- **Early returns**: Reducir anidamiento
- **Nombres claros**: Semánticos en inglés/español consistente con proyecto
- **Async**: try/catch, estados loading/error
- **Listas**: FlatList con keyExtractor
- **Estilos**: NativeWind preferido, StyleSheet si necesario

## 6. Migración incremental
1. Crear `features/` y `shared/` sin borrar actual
2. Mover UI reusable a `shared/components`
3. Extraer auth a `features/auth` con repo+service
4. Nuevas features SIEMPRE con nueva estructura
5. Refactorizar existente cuando se toque

## 7. Checklist arquitectura
- [ ] ¿Pertenece a app/routes o a feature?
- [ ] ¿Lógica negocio fuera de componente?
- [ ] ¿Acceso datos vía repository?
- [ ] ¿Dependencias invertidas si complejidad lo requiere?
- [ ] ¿Testeable?
- [ ] ¿Reutilizable o específico?
