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
- 🌍 **Internacionalización** español/inglés con selector en Ajustes y preferencia persistida.
- 🌗 **Soporte de tema claro/oscuro** según la preferencia del sistema o un ajuste manual.
- 🧩 **Componentes compartidos** reutilizados por carteras, movimientos, transferencias, categorías y dashboard: estados de carga/error/vacío, cabeceras y acciones de formulario, campos de importe/notas/fecha, modales page-sheet, tarjetas de fila y botón flotante.

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
├── features/               # Módulos por dominio (auth, profile, wallets, transactions, transfers, dashboard…)
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
├── docs/project/           # Documentación, guías, roadmap y notas de desarrollo
├── firestore.rules         # Reglas de seguridad de Firestore
├── app.json                # Configuración de Expo
└── global.css              # Entrada de Tailwind/NativeWind
```

La arquitectura sigue un enfoque **feature-first** con capas separadas para UI, lógica de
negocio y acceso a datos. Más detalles en
[`docs/project/guidelines/architecture-and-solid.md`](docs/project/guidelines/architecture-and-solid.md).

## 🚀 Empezando

### Requisitos

- Node.js 20 LTS o superior
- npm
- Un proyecto de Firebase con **Authentication** y **Cloud Firestore** habilitados

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

### Desplegar reglas de Firestore

```bash
npx firebase-tools deploy --only firestore:rules
```

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

## 🗺️ Roadmap

- [x] Autenticación
- [x] Carteras
- [x] Ingresos y gastos
- [x] Transferencias entre carteras
- [x] Dashboard
- [x] Estados, formularios y filas compartidas
- [x] Perfil y moneda preferida
- [ ] Amigos
- [ ] Grupos y gastos compartidos
- [ ] Liquidación de deudas

Consulta el roadmap completo en
[`docs/project/development-notes/roadmap.md`](docs/project/development-notes/roadmap.md).

## 📚 Documentación

- [Memoria del proyecto](docs/project/development-notes/project-memory.md)
- [Roadmap y alcance V1](docs/project/development-notes/roadmap.md)
- [Inventario de componentes compartidos](docs/project/development-notes/component-inventory.md)
- [Guías de arquitectura y SOLID](docs/project/guidelines/architecture-and-solid.md)
- [Guía de seguridad y validación](docs/project/guidelines/security-and-validation.md)

---

<div align="center">

Hecho con ☕ y TypeScript.

</div>
