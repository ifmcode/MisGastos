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
- 👛 **Carteras múltiples** con nombre, moneda, tipo, color, icono y saldo inicial. La creación vive solo en el botón flotante **+**, centrado en la pantalla, así que la cabecera no repite una acción duplicada. El formulario elige la moneda en la misma fila compacta **Moneda: EUR € · Cambiar** que los gastos compartidos, y la bloquea al editar una cartera existente.
- 👝 **Cartera principal automática**: cada cuenta recibe una única «Cartera principal» en su primera carga autenticada, tanto con email/contraseña como con Google, sin necesidad de abrir **Carteras** y sin bloquear la interfaz. Es una cartera normal: icono, color y tipo por defecto, incluida en el total y con saldo 0, con la moneda preferida del perfil (EUR si aún no hay perfil) y el nombre en el idioma activo en ese momento, que queda guardado y no se vuelve a traducir. Se puede renombrar, archivar y eliminar como cualquier otra. Las cuentas anteriores sin carteras la reciben en la siguiente carga y nunca se vuelve a crear: si borras todas las carteras, la cuenta se queda con cero carteras.
- ⚖️ **Inclusión en el total** configurable por cartera.
- 💸 **Ingresos y gastos** con actualización atómica del saldo de la cartera.
- 🧾 **Historial de movimientos** con filtros y ordenamiento.
- 🗓️ **Fecha sin escritura manual**: los formularios de movimientos, transferencias, gastos compartidos, gastos de grupo y liquidaciones, y los filtros de fechas, eligen el día con los chips **Hoy**/**Ayer** (y **Último** en movimientos y transferencias) o con el calendario, siempre fijo a la derecha de los chips. Una línea resume la selección con **Fecha seleccionada: DD/MM/AAAA** cuando el día no es rápido; un error de fecha ocupa ese mismo hueco.
- 🔁 **Transferencias entre carteras** de la misma moneda, con historial inmutable y detalle de cada transferencia con editar y eliminar.
- 🖲️ **Selector de cartera único**: los cinco campos de cartera (movimiento, origen y destino de una transferencia, gasto compartido con el registro en cartera en **Sí** y la cartera opcional de la liquidación) muestran un solo botón **Seleccionar cartera** que abre la lista en un diálogo de solo lectura. Al elegir, el botón muestra el icono de la cartera, su nombre, su moneda y, si está archivada, su etiqueta; al volver a abrirlo se puede cambiar. Ningún registro nuevo parte con cartera: **Guardar** siempre valida y muestra el error traducido de cartera obligatoria (origen o destino en las transferencias) en lugar de desactivar el botón, y el error desaparece en cuanto se elige una. El destino de una transferencia se vacía al cambiar el origen y permanece deshabilitado hasta que exista uno. En la liquidación, **Sin cartera** es la primera fila del diálogo y sigue siendo una opción válida (TICKET-065).
- 🏷️ **Selector de categoría único**: cada campo de categoría muestra un solo disparador con **Seleccionar categoría** cuando no hay ninguna y, al elegir, el icono y el nombre de la categoría con un chevron. El diálogo lista las categorías del tipo del movimiento, marca la seleccionada y, solo en movimientos, permite crear una nueva en línea; los gastos compartidos y las liquidaciones no crean. Ningún movimiento, gasto compartido ni ingreso de liquidación parte con categoría: cambiar el tipo de un movimiento limpia la categoría incompatible, el ingreso de la liquidación usa el mismo diálogo y una categoría de movimiento ausente muestra el error traducido, el aviso junto a las acciones y no escribe nada (TICKET-066).
- 📊 **Dashboard** con totales globales y por cartera agrupados por moneda, tres movimientos y tres transferencias recientes, detalle de movimientos y transferencias con editar y eliminar, acceso al historial completo y datos refrescados al volver a la pestaña.
- 👤 **Perfil y moneda preferida** en Ajustes: nombre visible editable y sincronizado con Firebase Auth, correo de la cuenta, moneda por defecto para las nuevas carteras y moneda provisional de los movimientos y transferencias nuevos, que ya no preseleccionan cartera (la moneda se toma de la cartera elegida, una edición conserva lo guardado y una transferencia mantiene origen y destino en la misma moneda), y el interruptor **Registrar los gastos compartidos en una cartera por defecto**, que solo se aplica a los gastos compartidos nuevos.
- 👥 **Social y solicitudes**: la pestaña **Social** reúne una fila de peticiones pendientes (solicitudes de amistad recibidas + enviadas e invitaciones de grupo recibidas, con contador visible solo cuando hay alguna) que abre `/social/requests`, un selector **Tus amigos** / **Tus grupos** (los grupos ya están activos, con invitaciones, detalle y gestión de miembros y un máximo de 20) y la lista de amigos con su saldo derivado (**Te debe** / **Le debes** / **En paz**). Tocar un amigo abre `/social/friends/[uid]`, que muestra nombre, correo, fecha de amistad, un saldo por cada moneda, permite eliminar la amistad con confirmación y muestra un historial unificado en el que se entremezclan por fecha los gastos compartidos y las liquidaciones, con cada fila clicable hacia su detalle. El historial se corta en la última liquidación que dejó la deuda a cero: lo anterior queda como saldado y oculto tras **Ver gastos anteriores** aunque se añadan gastos nuevos, y al desplegarlo aparece bajo el separador **Movimientos saldados**. La fila ya no elimina: solo navega. El botón flotante abre un menú con **Añadir amigo**, **Crear grupo** y **Unirse a grupo**; **Añadir amigo** lleva a `/social/add-friend`, donde viven la búsqueda por correo exacto y el envío de solicitudes, y **Unirse a grupo** abre `/social/groups/join` para entrar con el código de un grupo. El saldo se calcula a partir de los gastos compartidos activos y se agrupa por moneda, nunca se convierte ni se suma entre monedas. Tocar un gasto compartido abre `/social/expenses/[expenseId]`, un detalle de solo lectura con descripción, total, moneda, fecha, pagador, modo de reparto, la parte de cada participante y marcas de tiempo; el lápiz abre el formulario precargado y la papelera elimina con confirmación y vuelve al detalle del amigo ya refrescado; un gasto borrado o desconocido muestra el estado seguro de gasto ausente.
- 🤝 **Gastos compartidos 1:1** entre dos amigos, con reparto **igual o por importes fijos** y redondeo determinista que siempre suma el total exacto (el dominio mantiene además porcentaje y participaciones para la fase de grupos). Moneda por gasto en una fila compacta **Moneda: EUR € · Cambiar** (la acción abre un selector en diálogo; los gastos nuevos parten de la moneda preferida del perfil y las ediciones muestran la guardada), formulario en hoja con amigo, moneda, fecha, quién pagó y los campos de cada modo; en el reparto por importe, una línea viva bajo los participantes muestra `Total … · Falta: …`, **Completo** o `Sobra: …`, se recalcula en cada pulsación y solo informa: la validación de siempre decide si se puede guardar. Editar y eliminar (borrado lógico con historial). La lista vive en el detalle del amigo, no en la pestaña **Social**, y el FAB de ese detalle crea un gasto con el amigo ya seleccionado y bloqueado.
- 🏦 **Registro opcional en cartera de los gastos compartidos que pagas tú**: cuando pagas tú, el interruptor **¿Registrar el gasto en una cartera?** decide tu lado personal. Con **Sí** se muestran la cartera y la categoría (ambas obligatorias y solo con carteras activas de la misma moneda) y se crea o sincroniza en la misma transacción atómica **un único movimiento de gasto** en **Movimientos**; si no hay carteras activas en esa moneda, el formulario bloquea el guardado y te indica que crees una en **Carteras**. Con **No** el bloque desaparece, se limpian cartera y categoría, no se crea movimiento ni cambia ningún saldo y el gasto vive solo en el libro compartido. El estado del interruptor no se guarda: se deriva de la cartera o el movimiento enlazado, así que un gasto antiguo pagado por ti con movimiento aparece como **Sí** y uno sin movimiento como **No**, sin avisos que bloqueen la lectura o el guardado. Los gastos nuevos parten de la preferencia de Ajustes (**No** por defecto) y una edición siempre muestra su propio estado. La deuda con el amigo es idéntica con **Sí** o **No**. Cambiar el pagador al amigo revierte el saldo exactamente una vez, borra lógicamente el movimiento (que desaparece de **Movimientos**) y oculta el interruptor y el bloque. La categoría vinculada se elige explícitamente cuando el interruptor está en **Sí**: no se crea ni se aplica **Gastos compartidos** por defecto, el selector no la ofrece ni la preselecciona y el error de categoría se muestra bajo el campo. Si el guardado se bloquea (por ejemplo, una cartera de otra moneda o saldo insuficiente), el aviso junto a **Guardar** no duplica el mensaje del campo: muestra el error del servidor o un recordatorio de revisar los campos marcados. El movimiento conserva la etiqueta **Compartido**, abre `/social/expenses/[expenseId]` y no se edita ni borra desde **Movimientos**.
- ➕ **Menú de creación en Movimientos**: el botón flotante abre un único menú con **Nuevo movimiento**, **Gasto con amigo** y **Gasto de grupo**. La cabecera de la pestaña solo conserva los filtros, así que el FAB es la única forma de crear. **Gasto con amigo** reutiliza el mismo formulario de gasto compartido sin amigo preseleccionado (el campo es visible y obligatorio) y se deshabilita con un aviso que apunta a **Social** cuando no hay amistades aceptadas; mientras los amigos cargan o si falla la carga, el aviso es neutro y nunca afirma que no haya amigos. **Gasto de grupo** abre primero un selector de grupos y después el formulario del grupo elegido; se deshabilita con un aviso que apunta a **Social** cuando no hay grupos y permanece neutro mientras cargan o si falla la carga. Tras crear desde cualquier acción se refrescan la lista de movimientos y los saldos de las carteras.
- 👨‍👩‍👧 **Grupos**: crea un grupo con nombre, moneda por defecto (EUR, USD, GBP, JPY o CHF) y descripción opcional, e invita en el mismo paso a amigos aceptados. Cada invitado recibe una notificación in-app y decide en **Peticiones pendientes** (`/social/requests`), donde las invitaciones de grupo conviven con las solicitudes de amistad; hasta que acepta no es miembro, pero su plaza queda reservada. **Tus grupos** lista los grupos a los que perteneces con nombre, moneda por defecto, número de miembros y el resumen **En paz**, y cada fila abre `/social/groups/[groupId]`, con cabecera, hoja de detalles (descripción, moneda y miembros), lista de miembros e invitaciones pendientes. Solo el propietario edita nombre, descripción y moneda, invita a más amigos, cancela invitaciones pendientes y quita a un miembro con confirmación (nunca a sí mismo); volver a invitar reabre la misma invitación. El máximo es de 20 miembros, propietario incluido, y las invitaciones pendientes reservan su plaza. Cada grupo tiene un **código para unirse** de 8 caracteres, estable y visible para todos los miembros en **Detalles del grupo** con **Compartir código**, que se genera al crear el grupo y que un grupo antiguo crea desde esa hoja con **Generar código** (solo el propietario; el resto ve un aviso). Con ese código, cualquier persona autenticada entra desde **Unirse a grupo** en el FAB de Social, ve el nombre del grupo y envía una solicitud; una solicitud repetida, ya resuelta o de alguien que ya es miembro se rechaza con un mensaje claro y un código inválido no escribe nada. El propietario ve **Solicitudes para unirse** en el detalle, con contador, vacío y aceptar/rechazar por fila, y tanto la solicitud como el resultado le llegan por notificación in-app a cada interesado. Aceptar respeta el límite de 20 y una solicitud rechazada no se reabre. Los gastos de grupo ya están disponibles (TICKET-009): el detalle del grupo muestra la lista de gastos con fecha, descripción, quién pagó y tu parte, un FAB para añadirlos y un detalle de solo lectura con editar/eliminar para el propietario, el creador o quien pagó. Los saldos de grupo llegan en TICKET-010 y la salida del grupo, la expulsión con deuda saldada y la transferencia de propiedad en TICKET-068: hasta entonces el resumen de saldo se oculta cuando el grupo ya tiene gastos.
- 🧮 **Gastos de grupo**: cada gasto vive en `groupExpenses` con su propio `groupId`, importe en céntimos y **moneda por gasto** (el formulario parte de la moneda por defecto del grupo y nunca convierte). El formulario elige a los participantes (todos los miembros activos marcados por defecto, atajo **Todos**, solo los seleccionados reciben parte), permite que quién pagó quede fuera del reparto (paga por los demás) y ofrece los cuatro modos: **Igual**, **Porcentaje**, **Importe** y **Partes**. El reparto reutiliza el motor común con redondeo por mayor resto, así que las partes siempre suman el total exacto. Cualquier miembro activo crea; el propietario, el creador o quien pagó editan y eliminan con borrado lógico; el resto solo lee. La lista aparece en el detalle del grupo (más reciente primero, con carga, error, vacío y pull-to-refresh), el FAB añade un gasto y tocar una fila abre `/social/group-expenses/[expenseId]`, un detalle de solo lectura con participantes y sus partes. Un gasto que referencia a alguien que ya no está en el grupo queda en solo lectura (aviso incluido) y solo se puede eliminar. No toca carteras ni categorías personales; los saldos del grupo son TICKET-010.
- 🤝 **Liquidación de deudas 1:1 directa**: cualquiera de los dos amigos puede liquidar total o parcialmente la deuda sin confirmación del otro; el importe se limita a la deuda de la moneda elegida y la dirección se deriva del saldo (**Yo pago** / **Me paga**). El importe abre con la deuda completa de la moneda elegida y sigue editable: bajo el campo, una línea viva indica lo que falta (**Te faltan …**) o que con ese importe la deuda queda saldada, y el antiguo interruptor **Toda la deuda / Parte de la deuda** ya no existe. Si el acreedor ya enlazó un movimiento, el importe sigue bloqueado como hasta ahora. La fecha de la transferencia es opcional: por defecto hoy, admite días pasados y rechaza fechas futuras. Solo el acreedor puede enlazar opcionalmente una cartera de ingreso, en el momento o después desde la notificación; el otro amigo recibe una notificación in-app, la campana del dashboard muestra las no leídas y `/notifications` abre el detalle. El detalle del amigo integra cada liquidación como una fila más del historial unificado, junto a los gastos compartidos, y cuando la deuda queda saldada oculta todo el historial tras **Ver gastos anteriores**. El detalle de la liquidación permite editar y eliminar arriba a la derecha, y el ingreso enlazado aparece en **Movimientos** con la etiqueta **Liquidación**.
- 🤝 **Elección de la deuda por moneda antes de liquidar**: si la pareja debe dinero en dos o más monedas, **Liquidar deudas** abre primero una lista con una fila por moneda (código y símbolo, importe pendiente, **Yo pago** / **Me paga** y chevron). Elegir una abre el formulario fijado a esa moneda, con la deuda completa precargada, la divisa visible y sin selector de moneda dentro. Con una sola moneda el paso no aparece; si la moneda elegida deja de tener deuda mientras el formulario está abierto, se vuelve a preguntar y nunca se cambia de moneda en silencio. Volver desde el formulario regresa a la lista y volver desde la lista, al detalle del amigo; si la deuda desaparece con el paso abierto, se muestra **No hay deuda que liquidar.** (TICKET-064).
- 🔔 **Bandeja de notificaciones in-app**: `/notifications` abre en **Pendientes** con dos segmentos, **Pendientes** y **Vistas**, cada uno con su contador y su estado vacío; las filas muestran el icono del evento, el nombre del amigo, el importe y la moneda de las liquidaciones, la fecha relativa y el marcador de no leída en ambos segmentos. **Marcar todo como leído** solo aparece en **Pendientes** y solo cuando hay algo sin leer, y respeta los sellos de lectura ya existentes. Un aviso flotante de 4 segundos aparece en primer plano, uno cada vez y en orden de llegada, sin contador; se puede tocar o cerrar, nunca se muestra con la bandeja abierta y cerrarlo mueve la fila a **Vistas** sin marcarla leída. Al abrir una notificación se escriben los dos sellos y, al volver, regresas a la pantalla donde estabas: la bandeja si abriste una fila y la pantalla que interrumpió el aviso si lo tocaste. El acreedor ve **Recibir el dinero** al principio del detalle de la liquidación para elegir la cartera de ingreso opcional (también puede enlazarla o quitarla después), mientras que el deudor no ve ninguna fila de cartera de ingreso.
- 🌍 **Internacionalización** español/inglés con selector en Ajustes y preferencia persistida.
- 🌗 **Soporte de tema claro/oscuro** según la preferencia del sistema o un ajuste manual.
- 🧩 **Componentes compartidos** reutilizados por carteras, movimientos, transferencias, categorías, dashboard y Social: estados de carga/error/vacío, cabeceras y acciones de formulario, campos de importe/notas/fecha, modales page-sheet, tarjetas de fila, botón flotante centrado y el menú de acciones del FAB (`FabActionMenu`), que hoy usan los FAB de Social y de Movimientos.

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
├── features/               # Módulos por dominio (auth, profile, wallets, transactions, transfers, dashboard, categories, friends, groups, social, shared-expenses, group-expenses…)
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
- Android en Windows: **ninja 1.13.2** en `...\Android\Sdk\cmake\<versión>\bin`, porque el ninja que trae el SDK no supera las rutas de 260 caracteres ([detalles](docs/project/development-notes/session-notes/2026-11-15-android-dev-environment.md))

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
> [`2026-11-15-android-dev-environment.md`](docs/project/development-notes/session-notes/2026-11-15-android-dev-environment.md).

### Desplegar reglas de Firestore

```bash
npm run firebase-deploy:rules      # despliega firestore.rules
npm run firestore-update-rules     # inicia sesión en Firebase y luego despliega
```

> El despliegue es manual: cada cambio en `firestore.rules` debe publicarse desde una
> máquina con credenciales de Firebase. Las reglas de `publicProfiles`, `friendRequests`,
> `friendships` (TICKET-007), `sharedExpenses` (TICKET-009, subconjunto 1:1) y el enlace
> del gasto compartido con su movimiento en `sharedExpenses`/`transactions`
> (TICKET-044), la coherencia de enlace en `sharedExpenses` (TICKET-055, que
> sustituye la cartera obligatoria de TICKET-048), `groups`, `groupInvitations`,
> `groupCodes` y `groupJoinRequests` (TICKET-008 y TICKET-061, con el id namespaced
> por propietario y el `joinCode`), `groupExpenses` (TICKET-009, con una lectura
> del grupo por petición y los campos del gasto acotados), los tipos de notificación `group-invite`,
> `group-join-request`, `group-join-accepted` y `group-join-rejected`, y las de
> `settlements` y `notifications` (TICKET-046 y TICKET-047, con los dos sellos)
> todavía están **pendientes de despliegue**.

> Las funciones de `firestore.rules` usan el lenguaje de reglas de Firebase (derivado de
> CEL), no TypeScript: el cuerpo es un único `return` con una sola expresión, sin
> `if`/`else` ni un segundo `return`, y se ramifica con `? :`. Antes de desplegar,
> `npx firebase deploy --only firestore:rules --dry-run` valida la compilación sin publicar nada.

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

Estado actual (22/11/2026): **332 suites / 2030 tests**; la cobertura acotada a la
lógica de negocio está en **98,95 % de sentencias, 94,81 % de ramas, 98,56 % de
funciones y 99,51 % de líneas**, y `npm run check:copy` audita **315 archivos TSX**.

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
- [x] Registro opcional en cartera de los gastos compartidos pagados por mí, con preferencia en Ajustes
- [x] Menú de creación en Movimientos con gasto con amigo y gasto de grupo
- [x] Liquidación de deudas 1:1 con aplicación directa y notificaciones
- [x] Importe editable en la liquidación 1:1 con la deuda restante en vivo (TICKET-062)
- [x] Campos de fecha sin escritura manual y calendario fijo a la derecha (TICKET-063)
- [x] Elección de la deuda por moneda antes de liquidar (TICKET-064)
- [x] Selector de cartera único con **Seleccionar cartera**, sin preselección y con **Sin cartera** dentro del diálogo de la liquidación (TICKET-065)
- [x] Selector de categoría único con **Seleccionar categoría**, sin preselección y con categoría obligatoria (TICKET-066)
- [x] Historial unificado de gastos compartidos y liquidaciones en el detalle de amigo
- [x] Historial saldado plegado tras una liquidación completa, con separador al desplegarlo
- [x] Bandeja de notificaciones in-app con pestañas **Pendientes**/**Vistas** y aviso flotante
- [x] Moneda compacta con **Cambiar** y aviso de importe restante en el reparto por importe, con la moneda preferida del perfil como moneda provisional de los movimientos y transferencias nuevos
- [x] Cartera principal por defecto al crear la cuenta
- [x] Grupos con invitaciones, detalle y gestión de miembros
- [x] Gastos compartidos dentro de grupos
- [x] Código de grupo y solicitudes de unión (TICKET-061)
- [ ] Liquidación de deudas en grupos
- [ ] Gestión de miembros: salir, expulsión con deuda saldada y transferencia de propiedad (TICKET-068)
- [ ] Registrar opcionalmente el gasto de grupo en una cartera personal del pagador (TICKET-069)
- [ ] Gestionar las solicitudes para unirse a grupos desde Social (TICKET-070)
- [ ] Funcionamiento offline (arquitectura decidida: SQLite + cola de sincronización; implementación en la fase 7)
- [x] Especialización del flujo de desarrollo con agentes y skills de OpenCode
- [ ] Librería de componentes con Storybook
- [ ] Exportar los datos de la cuenta en JSON versionado, por cartera o completa y sin datos compartidos ni de grupo
- [ ] Notificaciones push con la app cerrada (**post-V1**)
- [ ] Importar los datos de la cuenta (**post-V1**)
- [ ] Copia de seguridad manual y restauración en Google Drive (**post-V1**)

Consulta el roadmap completo en
[`docs/project/development-notes/roadmap.md`](docs/project/development-notes/roadmap.md).

## 📚 Documentación

- [Memoria del proyecto](docs/project/development-notes/project-memory.md)
- [Roadmap y alcance V1](docs/project/development-notes/roadmap.md): orden de fases y tickets, alcance V1 y normas de orden. Es una guía de desarrollo, no un diario de implementación.
- [Notas de sesión](docs/project/development-notes/session-notes/): un fichero `YYYY-MM-DD-<slug>.md` por sesión, decisión o ADR con el detalle de implementación. Las notas con fecha se crean siempre aquí.
- [Inventario de componentes compartidos](docs/project/development-notes/component-inventory.md)
- [Arquitectura offline-first (diseño y ADR)](docs/project/development-notes/session-notes/2026-11-14-offline-first-architecture.md)
- [Amigos y solicitudes (TICKET-007)](docs/project/development-notes/session-notes/2026-11-15-friends-and-requests.md): modelo de datos, ciclo de vida de las solicitudes, reglas y límites actuales.
- [Gastos compartidos 1:1 (TICKET-009, subconjunto)](docs/project/development-notes/session-notes/2026-11-15-shared-expenses-1to1.md): modelo de datos, modos de reparto y redondeo, saldos por moneda, reglas y límites actuales.
- [Pestaña Social (TICKET-041, 16/11/2026)](docs/project/development-notes/session-notes/2026-11-16-social-tab.md): shell Social, rutas de alta de amigo y peticiones, contador de pendientes, `FabActionMenu` y el hueco temporal de gastos compartidos.
- [Detalle de amigo (TICKET-042, 16/11/2026)](docs/project/development-notes/session-notes/2026-11-16-friend-detail.md): ruta `/social/friends/[uid]`, saldos por moneda en la cabecera, lista filtrada de gastos 1:1, FAB con amigo bloqueado y semántica del borrado de amistad.
- [Detalle de gasto compartido (TICKET-043, 16/11/2026)](docs/project/development-notes/session-notes/2026-11-16-shared-expense-detail.md): ruta `/social/expenses/[expenseId]`, resolución viva del gasto, edición/borrado con retorno al detalle de amigo, estado seguro para gastos ausentes y bloque reservado del movimiento vinculado.
- [Cartera enlazada al gasto compartido (TICKET-044, 16/11/2026)](docs/project/development-notes/session-notes/2026-11-16-shared-expense-wallet-link.md): contrato de datos del enlace, reglas con `getAfter()`, transacción atómica detrás de `ILinkedMovementPort`, categoría **Gastos compartidos** bajo demanda (la creación implícita se eliminó en TICKET-051), etiqueta **Compartido** y límites conocidos.
- [Cartera obligatoria en gastos compartidos pagados por mí (TICKET-048, 17/11/2026)](docs/project/development-notes/session-notes/2026-11-17-mandatory-wallet-viewer-paid.md): cartera obligatoria al pagar, transiciones de pagador, aviso en gastos antiguos y regla de Firestore pendiente de despliegue. Sustituido por TICKET-055 (18/11/2026): el registro en cartera pasa a ser opcional y ese aviso ya no existe.
- [Aviso de guardado y categoría obligatoria en gastos compartidos (TICKET-049, TICKET-050 y TICKET-051, 17/11/2026)](docs/project/development-notes/session-notes/2026-11-17-shared-expense-save-feedback.md): la categoría del sistema **Gastos compartidos** desaparece del selector y de su valor por defecto, la categoría del movimiento vinculado es obligatoria y no se crea por defecto, la moneda de la cartera se valida antes de enviar y el error del servidor se muestra junto a **Guardar**.
- [Menú de creación en Movimientos (TICKET-045, 16/11/2026)](docs/project/development-notes/session-notes/2026-11-16-movements-create-menu.md): menú único del FAB, helper puro de acciones, estados de los amigos, `preselectFirstFriend`, refresco tras crear y accesibilidad de cada fila.
- [Portabilidad de datos y notificaciones (17/11/2026)](docs/project/development-notes/session-notes/2026-11-17-account-portability-and-notifications.md): modelo de estado de las notificaciones (**Pendientes**/**Vistas**, `seenAt`/`readAt` y aviso flotante), push fuera de V1 (TICKET-052), exportación en JSON versionado con selección de cartera (TICKET-013), importación con nombres editables y fuente aislada (TICKET-053) y copia manual en Google Drive (TICKET-054).
- [Refinamiento del formulario de gasto compartido (18/11/2026)](docs/project/development-notes/session-notes/2026-11-18-shared-expense-form-refinement.md): registro opcional en cartera con toggle, estado derivado y preferencia en el perfil (TICKET-055), moneda compacta con **Cambiar**, aviso de importe restante en el reparto por importe y moneda preferida por defecto en movimientos y transferencias nuevos (TICKET-056, implementados el 20/11/2026).
- [Liquidación de deudas 1:1 (TICKET-046, 18/11/2026)](docs/project/development-notes/session-notes/2026-11-18-friend-settlement.md): aplicación directa sin confirmación, ledger inverso para cancelar la deuda, cartera opcional del acreedor, edición/borrado condicionados, mensaje y colapso de gastos, bandeja mínima y reglas pendientes de despliegue.
- [Bandeja de notificaciones in-app (TICKET-047, 18/11/2026)](docs/project/development-notes/session-notes/2026-11-18-notification-inbox.md): dos sellos (`seenAt`/`readAt`), segmentos **Pendientes**/**Vistas**, aviso flotante de 4 segundos con cola silenciosa y supresión en la bandeja, vuelta al origen con `friendUid` como respaldo sin historial (TICKET-058), seguimiento de cartera del acreedor al principio del detalle y reglas pendientes de despliegue.
- [Historial unificado del detalle de amigo (TICKET-059, 19/11/2026)](docs/project/development-notes/session-notes/2026-11-19-friend-unified-timeline.md): gastos y liquidaciones entremezclados por fecha, filas con gutter de día, efecto `Prestaste`/`Pediste`, colapso conjunto al saldar la deuda y eliminación de las superficies anteriores.
- [Historial saldado tras una liquidación completa (TICKET-060, 19/11/2026)](docs/project/development-notes/session-notes/2026-11-19-settled-history-split.md): corte por la última liquidación que dejó la deuda a cero, botón **Ver gastos anteriores** persistente, separador **Movimientos saldados** y ciclos nuevos sin reabrir lo saldado.
- [Cartera principal automática (TICKET-057, 20/11/2026)](docs/project/development-notes/session-notes/2026-11-20-default-main-wallet.md): siembra en la primera carga autenticada con marcador en el perfil, flujo transaccional final, análisis de reglas (incluido el `get` denegado sobre un documento inexistente), resolución de moneda, límites aceptados y verificación.
- [Grupos e invitaciones (TICKET-008, 20/11/2026)](docs/project/development-notes/session-notes/2026-11-20-groups-and-invitations.md): modelo `groups`/`groupInvitations`, id namespaced por propietario, invitaciones con aceptar/rechazar, plazas reservadas, reglas con `getAfter`, notificación `group-invite`, detalle y gestión de miembros, límites y despliegue pendiente.
- [Código de grupo y solicitudes de unión (TICKET-061, 20/11/2026)](docs/project/development-notes/session-notes/2026-11-20-group-join-code.md): `joinCode` de 8 caracteres con proyección `groupCodes`, backfill perezoso del propietario, `groupJoinRequests` con estados terminales, aceptación transaccional con el límite de 20, notificaciones `group-join-request`/`group-join-accepted`/`group-join-rejected`, pantalla **Unirse a grupo**, reglas con `getAfter`, decisiones aceptadas y despliegue pendiente.
- [Gastos de grupo (TICKET-009, 21/11/2026)](docs/project/development-notes/session-notes/2026-11-21-group-expenses.md): colección raíz `groupExpenses`, moneda por gasto, motor de reparto con `minParticipants`, selección de participantes y pagador, permisos, ledger directo para TICKET-010, ruta de detalle, reglas con una lectura de grupo y el caso de participantes que ya no son miembros.
- [Importe editable en la liquidación (TICKET-062, 21/11/2026)](docs/project/development-notes/session-notes/2026-11-21-settlement-amount-section.md): sección única **Importe a liquidar** siempre editable, helper `getSettlementAmountState` con los estados restante/saldada/excedida, prefill de la deuda completa, bloqueo de TICKET-046, anuncio diferido en iOS del `AmountField` y contrato de reutilización para TICKET-010.
- [Campo de fecha sin escritura manual (TICKET-063, 21/11/2026)](docs/project/development-notes/session-notes/2026-11-21-date-field-without-input.md): selector compartido con chips y calendario fijo a la derecha, resumen derivado (`getDateFieldSummary`), handlers `selectDate` en los seis consumidores, filtros con rango vacío válido y limpieza de las claves `dateHelper`/`placeholder`.
- [Paso de elección de deuda en la liquidación (TICKET-064, 22/11/2026)](docs/project/development-notes/session-notes/2026-11-22-settlement-debt-step.md): decisión pura `resolveSettlementDebtStep` (0/1/2+ monedas y param `currency`), paso con una fila por moneda, push de la misma ruta con la moneda elegida, moneda inmutable dentro del formulario y contrato de reutilización para TICKET-010.
- [Selector de cartera único (TICKET-065, 22/11/2026)](docs/project/development-notes/session-notes/2026-11-22-single-wallet-picker.md): botón `WalletSelectButton` en los cinco campos de cartera, fila opcional `noneOption` (**Sin cartera**) en el diálogo, defaults sin preselección, validación al guardar y verificación.
- [Selector de categoría único (TICKET-066, 22/11/2026)](docs/project/development-notes/session-notes/2026-11-22-single-category-picker.md): `CategorySelectButton` compartido en los tres campos de categoría, diálogo nuevo de la liquidación, quita de los chips y de los defaults, `CATEGORY_REQUIRED` con aviso de error y resolución de `legacyId` en las tres formas de opción.
- [Decisiones de gastos de grupo y membresía (20/11/2026)](docs/project/development-notes/session-notes/2026-11-20-group-expenses-and-membership-decisions.md): saldo neto pagado − cuota, selección de participantes, simplificación de deudas con ajuste por grupo, permisos de edición, salida con deuda saldada y transferencia de propiedad.
- [Entorno de desarrollo Android (15/11/2026)](docs/project/development-notes/session-notes/2026-11-15-android-dev-environment.md): JDK 21 vía JBR, ninja 1.13.2 para rutas largas en Windows y development build en el emulador.
- [Guías de arquitectura y SOLID](docs/project/guidelines/architecture-and-solid.md)
- [Guía de seguridad y validación](docs/project/guidelines/security-and-validation.md)
- [Guía de agentes y skills (OpenCode)](docs/project/guidelines/agents-and-skills.md)

---

<div align="center">

Hecho con ☕ y TypeScript.

</div>
