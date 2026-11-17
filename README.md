<div align="center">

# 💸 MisGastos

**Tus finanzas personales, hoy. Compartidas mañana.**

Aplicación multiplataforma para gestionar carteras, ingresos, gastos y transferencias,
con la meta de incorporar gastos compartidos al estilo Splitwise.

[![Expo](https://img.shields.io/badge/Expo-58-000020?logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.88-61DAFB?logo=react&logoColor=white)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_%2B_Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![NativeWind](https://img.shields.io/badge/NativeWind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://www.nativewind.dev)
[![Jest](https://img.shields.io/badge/Jest-30-C21325?logo=jest&logoColor=white)](https://jestjs.io)

![Estado](https://img.shields.io/badge/estado-MVP_en_desarrollo-orange)

</div>

## 📖 Sobre el proyecto

**MisGastos** es una app de finanzas personales construida con **Expo** y **React Native**.
Permite organizar el dinero en varias carteras, registrar ingresos y gastos, transferir
saldo entre carteras y consultar el panorama general desde un dashboard.

El objetivo a futuro es evolucionar hacia una mezcla entre un gestor de gastos personal y
**Splitwise**: amigos, grupos, gastos compartidos y liquidación de deudas, sin perder la
simplicidad de uso.

## ✨ Características actuales

- 🔐 **Autenticación** con email/contraseña, registro, recuperación de contraseña y Google.
- 👛 **Carteras múltiples** con nombre, moneda, tipo, color, icono y saldo inicial.
- ⚖️ **Inclusión en el total** configurable por cartera.
- 💸 **Ingresos y gastos** con actualización atómica del saldo de la cartera.
- 🧾 **Historial de movimientos** con filtros y ordenamiento.
- 🔁 **Transferencias entre carteras** de la misma moneda, con historial inmutable y detalle de cada transferencia con editar y eliminar.
- 📊 **Dashboard** con totales globales y por cartera agrupados por moneda, tres movimientos y tres transferencias recientes, detalle de movimientos y transferencias con editar y eliminar, acceso al historial completo y datos refrescados al volver a la pestaña.
- 👤 **Perfil y moneda preferida** en Ajustes: nombre visible editable y sincronizado con Firebase Auth, correo de la cuenta y moneda por defecto para las nuevas carteras.
- 👥 **Social y solicitudes**: la pestaña **Social** reúne una fila de peticiones pendientes (recibidas + enviadas, con contador visible solo cuando hay alguna) que abre `/social/requests`, un selector **Tus amigos** / **Tus grupos** (los grupos muestran un estado *próximamente* sin acciones) y la lista de amigos con su saldo derivado (**Te debe** / **Le debes** / **En paz**). Tocar un amigo abre `/social/friends/[uid]`, que muestra nombre, correo, fecha de amistad, un saldo por cada moneda, permite eliminar la amistad con confirmación y lista los gastos compartidos de esa pareja. La fila ya no elimina: solo navega. El botón flotante abre el menú **Añadir amigo**, que lleva a `/social/add-friend`, donde viven la búsqueda por correo exacto y el envío de solicitudes. El saldo se calcula a partir de los gastos compartidos activos y se agrupa por moneda, nunca se convierte ni se suma entre monedas. Tocar un gasto compartido abre `/social/expenses/[expenseId]`, un detalle de solo lectura con descripción, total, moneda, fecha, pagador, modo de reparto, la parte de cada participante y marcas de tiempo; el lápiz abre el formulario precargado y la papelera elimina con confirmación y vuelve al detalle del amigo ya refrescado; un gasto borrado o desconocido muestra el estado seguro de gasto ausente.
- 🤝 **Gastos compartidos 1:1** entre dos amigos, con reparto **igual o por importes fijos** y redondeo determinista que siempre suma el total exacto (el dominio mantiene además porcentaje y participaciones para la fase de grupos). Moneda por gasto, formulario en hoja con amigo, moneda, fecha, quién pagó y los campos de cada modo; editar y eliminar (borrado lógico con historial). La lista vive en el detalle del amigo, no en la pestaña **Social**, y el FAB de ese detalle crea un gasto con el amigo ya seleccionado y bloqueado.
- 🏦 **Cartera enlazada al gasto compartido**: cuando paga el usuario, el formulario ofrece carteras activas de la misma moneda (o **Sin cartera**, que mantiene el comportamiento social) y, al elegir una, un selector de categoría que arranca en **Gastos compartidos** (se crea bajo demanda y nunca se pisa un nombre ya editado). El gasto escribe **un único movimiento de gasto** sincronizado en la misma transacción atómica: importe, fecha, descripción, categoría, cartera y pagador se propagan al editar, cambiar de pagador revierte o recrea el movimiento, y eliminar el gasto lo borra lógicamente y devuelve el saldo exactamente una vez. Ese movimiento muestra la etiqueta **Compartido**, abre `/social/expenses/[expenseId]` en vez del detalle personal y no se puede editar ni borrar desde **Movimientos**.
- ➕ **Menú de creación en Movimientos**: el botón flotante abre un único menú con **Nuevo movimiento**, **Gasto con amigo** y **Gasto de grupo** (deshabilitado con el aviso **Próximamente**). La cabecera de la pestaña solo conserva los filtros, así que el FAB es la única forma de crear. **Gasto con amigo** reutiliza el mismo formulario de gasto compartido sin amigo preseleccionado (el campo es visible y obligatorio) y se deshabilita con un aviso que apunta a **Social** cuando no hay amistades aceptadas; mientras los amigos cargan o si falla la carga, el aviso es neutro y nunca afirma que no haya amigos. Tras crear desde cualquier acción se refrescan la lista de movimientos y los saldos de las carteras.
- 🌍 **Internacionalización** español/inglés con selector en Ajustes y preferencia persistida.
- 🌗 **Soporte de tema claro/oscuro** según la preferencia del sistema o un ajuste manual.
- 🧩 **Componentes compartidos** reutilizados por carteras, movimientos, transferencias, categorías, dashboard y Social: estados de carga/error/vacío, cabeceras y acciones de formulario, campos de importe/notas/fecha, modales page-sheet, tarjetas de fila, botón flotante y el menú de acciones del FAB (`FabActionMenu`), que hoy usan los FAB de Social y de Movimientos.

## 🛠️ Stack tecnológico

| Área | Tecnología |
|---|---|
| Aplicación | Expo SDK 58 · React Native 0.88 · React 19.3 |
| Navegación | Expo Router 58 (rutas basadas en archivos) |
| Lenguaje | TypeScript 6.0 en modo estricto |
| UI | NativeWind 4 (Tailwind CSS) · React Navigation · Reanimated · Gesture Handler |
| Backend | Firebase Authentication + Cloud Firestore |
| Persistencia local | AsyncStorage |
| Testing | Jest 30 + ts-jest |
| Calidad | ESLint 9 + eslint-config-expo |

## 🏗️ Estructura del proyecto

```text
MisGastos/
├── app/                    # Rutas y layouts de Expo Router
├── features/               # Módulos por dominio (auth, profile, wallets, transactions, transfers, dashboard, categories, friends, social, shared-expenses…)
│   └── <feature>/
│       ├── components/     # UI específica del dominio
│       ├── hooks/          # Orquestación y estado de UI
│       ├── services/       # Reglas de negocio
│       ├── repositories/   # Acceso a datos (Firestore)
│       ├── schemas/        # Validación
│       └── types/          # Tipos del dominio
├── shared/                 # Código reutilizable
│   ├── components/         # UI compartida (estados, formularios, modales y filas)
│   ├── hooks/              # Hooks reutilizables
│   ├── constants/          # Tokens y constantes
│   ├── types/              # Tipos globales
│   └── utils/              # Utilidades puras
├── components/             # Componentes base de la app
├── hooks/                  # Hooks compartidos
├── lib/                    # Configuración de Firebase y autenticación
├── .opencode/              # Configuración de OpenCode: agentes y skills del proyecto
├── docs/project/           # Documentación, guías, roadmap y notas de desarrollo
├── firestore.rules         # Reglas de seguridad de Firestore
├── app.json                # Configuración de Expo
└── global.css              # Entrada de Tailwind/NativeWind
```

La arquitectura sigue un enfoque **feature-first** con capas separadas para UI, lógica de
negocio y acceso a datos. Más detalles en
[`docs/project/guidelines/architecture-and-solid.md`](docs/project/guidelines/architecture-and-solid.md).

El trabajo recurrente se delega a los agentes de `.opencode/agents/`, que cargan las skills
de `.opencode/skills/`. El agente principal anuncia en cada tarea qué agente y skills usa,
carga la skill correspondiente y delega en el especialista salvo en ediciones triviales. El
inventario de agentes, el ruteo por tipo de tarea y las restricciones de permisos están en
[`docs/project/guidelines/agents-and-skills.md`](docs/project/guidelines/agents-and-skills.md).

## 🚀 Empezando

### Requisitos

- Node.js 20 LTS o superior
- npm
- Un proyecto de Firebase con **Authentication** y **Cloud Firestore** habilitados
- Android: Android Studio con su JBR (**JDK 21**) apuntado por `JAVA_HOME`; Gradle 9.4.1 exige JDK 17 o superior
- Android en Windows: **ninja 1.13.2** en `...\Android\Sdk\cmake\<versión>\bin`, porque el ninja que trae el SDK no supera las rutas de 260 caracteres ([detalles](docs/project/development-notes/2026-11-15-android-dev-environment.md))

### Instalación

```bash
git clone git@github.com:ifmcode/MisGastos.git
cd MisGastos
npm install
```

### Variables de entorno

Crea un archivo `.env` en la raíz con las credenciales de tu app web de Firebase:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=tu_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=tu_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=tu_measurement_id
```

> Las variables con prefijo `EXPO_PUBLIC_` quedan expuestas en el bundle del cliente.
> La protección real de los datos vive en las reglas de Firestore.

### Ejecutar la app

```bash
npm start          # Servidor de desarrollo de Expo
npm run android    # Android
npm run ios        # iOS (requiere macOS)
npm run web        # Navegador
```

> En Android hace falta una **development build** (`npm run android` la compila e instala) y Metro
> sirviendo el JS en el puerto 8081; Expo Go no carga los módulos nativos. Flujo diario y
> diagnóstico del entorno en
> [`2026-11-15-android-dev-environment.md`](docs/project/development-notes/2026-11-15-android-dev-environment.md).

### Desplegar reglas de Firestore

```bash
npm run firebase-deploy:rules      # despliega firestore.rules
npm run firestore-update-rules     # inicia sesión en Firebase y luego despliega
```

> El despliegue es manual: cada cambio en `firestore.rules` debe publicarse desde una
> máquina con credenciales de Firebase. Las reglas de `publicProfiles`, `friendRequests`,
> `friendships` (TICKET-007), `sharedExpenses` (TICKET-009, subconjunto 1:1) y el enlace
> del gasto compartido con su movimiento en `sharedExpenses`/`transactions`
> (TICKET-044) todavía están **pendientes de despliegue**.

## 📜 Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Inicia el servidor de desarrollo de Expo. |
| `npm run android` | Abre la app en Android. |
| `npm run ios` | Abre la app en iOS. |
| `npm run web` | Abre la app en el navegador. |
| `npm run lint` | Ejecuta ESLint. |
| `npm test` | Ejecuta la suite de Jest. |
| `npm run test:coverage` | Ejecuta Jest y exige >= 90% en la lógica de negocio. |
| `npm run test:ci` | Ejecuta la cobertura una sola vez y en serie (CI). |
| `npm run check:copy` | Comprueba que todo el texto visible sale de las traducciones. |
| `npm run firebase-deploy:rules` | Despliega las reglas de Firestore. |
| `npm run firestore-update-rules` | Inicia sesión en Firebase y despliega las reglas. |

El flujo de agentes usa
`.opencode/skills/misgastos-feature/scripts/verify.ps1`, que encadena `tsc`, `lint`,
`jest` y `check:copy` y se detiene en el primer fallo
(`powershell -NoProfile -File .opencode/skills/misgastos-feature/scripts/verify.ps1`).

## 🧪 Testing y calidad

La lógica de negocio (servicios, repositorios, validaciones y utilidades) se prueba con
**Jest**. Los tests viven junto al código que prueban, dentro de carpetas `__tests__`.

```bash
npm test
npm run lint
```

La meta del proyecto es mantener una cobertura **≥ 90% en la lógica de negocio**
(servicios, repositorios, esquemas y utilidades). El umbral se comprueba con
`npm run test:coverage` y está configurado en `jest.config.js`; las pantallas,
componentes y hooks quedan fuera del umbral hasta incorporar un renderer de React.
Sigue las convenciones descritas en [`docs/project/guidelines/`](docs/project/guidelines).

Estado actual (16/11/2026): **208 suites / 1175 tests**; la cobertura acotada a la
lógica de negocio está en **99.07% de sentencias, 94.84% de ramas, 99.01% de
funciones y 99.49% de líneas**, y `npm run check:copy` audita **220 archivos TSX**.

## 🗺️ Roadmap

- [x] Autenticación
- [x] Carteras
- [x] Ingresos y gastos
- [x] Transferencias entre carteras
- [x] Dashboard
- [x] Estados, formularios y filas compartidas
- [x] Perfil y moneda preferida
- [x] Amigos
- [x] Gastos compartidos 1:1
- [x] Pestaña Social con peticiones y alta de amigo
- [x] Detalle de amigo con gastos compartidos
- [x] Detalle de gasto compartido y cartera enlazada
- [x] Menú de creación en Movimientos con gasto con amigo y gasto de grupo (próximamente)
- [ ] Liquidación de deudas 1:1 con confirmación y notificaciones
- [ ] Bandeja de notificaciones
- [ ] Grupos y gastos compartidos dentro de grupos
- [ ] Liquidación de deudas en grupos
- [ ] Funcionamiento offline (arquitectura decidida: SQLite + cola de sincronización; implementación en la fase 7)
- [x] Especialización del flujo de desarrollo con agentes y skills de OpenCode
- [ ] Librería de componentes con Storybook

Consulta el roadmap completo en
[`docs/project/development-notes/roadmap.md`](docs/project/development-notes/roadmap.md).

## 📚 Documentación

- [Memoria del proyecto](docs/project/development-notes/project-memory.md)
- [Roadmap y alcance V1](docs/project/development-notes/roadmap.md)
- [Inventario de componentes compartidos](docs/project/development-notes/component-inventory.md)
- [Arquitectura offline-first (diseño y ADR)](docs/project/development-notes/2026-11-14-offline-first-architecture.md)
- [Amigos y solicitudes (TICKET-007)](docs/project/development-notes/2026-11-15-friends-and-requests.md): modelo de datos, ciclo de vida de las solicitudes, reglas y límites actuales.
- [Gastos compartidos 1:1 (TICKET-009, subconjunto)](docs/project/development-notes/2026-11-15-shared-expenses-1to1.md): modelo de datos, modos de reparto y redondeo, saldos por moneda, reglas y límites actuales.
- [Pestaña Social (TICKET-041, 16/11/2026)](docs/project/development-notes/2026-11-16-social-tab.md): shell Social, rutas de alta de amigo y peticiones, contador de pendientes, `FabActionMenu` y el hueco temporal de gastos compartidos.
- [Detalle de amigo (TICKET-042, 16/11/2026)](docs/project/development-notes/2026-11-16-friend-detail.md): ruta `/social/friends/[uid]`, saldos por moneda en la cabecera, lista filtrada de gastos 1:1, FAB con amigo bloqueado y semántica del borrado de amistad.
- [Detalle de gasto compartido (TICKET-043, 16/11/2026)](docs/project/development-notes/2026-11-16-shared-expense-detail.md): ruta `/social/expenses/[expenseId]`, resolución viva del gasto, edición/borrado con retorno al detalle de amigo, estado seguro para gastos ausentes y bloque reservado del movimiento vinculado.
- [Cartera enlazada al gasto compartido (TICKET-044, 16/11/2026)](docs/project/development-notes/2026-11-16-shared-expense-wallet-link.md): contrato de datos del enlace, reglas con `getAfter()`, transacción atómica detrás de `ILinkedMovementPort`, categoría **Gastos compartidos** bajo demanda, etiqueta **Compartido** y límites conocidos.
- [Menú de creación en Movimientos (TICKET-045, 16/11/2026)](docs/project/development-notes/2026-11-16-movements-create-menu.md): menú único del FAB, helper puro de acciones, estados de los amigos, `preselectFirstFriend`, refresco tras crear y accesibilidad de cada fila.
- [Entorno de desarrollo Android (15/11/2026)](docs/project/development-notes/2026-11-15-android-dev-environment.md): JDK 21 vía JBR, ninja 1.13.2 para rutas largas en Windows y development build en el emulador.
- [Guías de arquitectura y SOLID](docs/project/guidelines/architecture-and-solid.md)
- [Guía de seguridad y validación](docs/project/guidelines/security-and-validation.md)
- [Guía de agentes y skills (OpenCode)](docs/project/guidelines/agents-and-skills.md)

---

<div align="center">

Hecho con ☕ y TypeScript.

</div>
