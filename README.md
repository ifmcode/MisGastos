<div align="center">

# 💸 MisGastos

**Tus finanzas personales, hoy. Compartidas mañana.**

Aplicación multiplataforma para gestionar carteras, ingresos, gastos y transferencias,
con la meta de incorporar gastos compartidos al estilo Splitwise.

[![Expo](https://img.shields.io/badge/Expo-54-000020?logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react&logoColor=white)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
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
- 🔁 **Transferencias entre carteras** de la misma moneda, con historial inmutable.
- 📊 **Dashboard** con totales globales y por cartera, agrupados por moneda.
- 🌗 **Soporte de tema claro/oscuro** según la preferencia del sistema (en pulido).

## 🛠️ Stack tecnológico

| Área | Tecnología |
|---|---|
| Aplicación | Expo SDK 54 · React Native 0.81 · React 19 |
| Navegación | Expo Router 6 (rutas basadas en archivos) |
| Lenguaje | TypeScript 5.9 en modo estricto |
| UI | NativeWind 4 (Tailwind CSS) · React Navigation · Reanimated · Gesture Handler |
| Backend | Firebase Authentication + Cloud Firestore |
| Persistencia local | AsyncStorage |
| Testing | Jest 30 + ts-jest |
| Calidad | ESLint 9 + eslint-config-expo |

## 🏗️ Estructura del proyecto

```text
MisGastos/
├── app/                    # Rutas y layouts de Expo Router
├── features/               # Módulos por dominio (auth, wallets, transactions, transfers, dashboard…)
│   └── <feature>/
│       ├── components/     # UI específica del dominio
│       ├── hooks/          # Orquestación y estado de UI
│       ├── services/       # Reglas de negocio
│       ├── repositories/   # Acceso a datos (Firestore)
│       ├── schemas/        # Validación
│       └── types/          # Tipos del dominio
├── shared/                 # Código reutilizable (componentes, constantes, tipos, utils…)
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

## 🧪 Testing y calidad

La lógica de negocio (servicios, repositorios, validaciones y utilidades) se prueba con
**Jest**. Los tests viven junto al código que prueban, dentro de carpetas `__tests__`.

```bash
npm test
npm run lint
```

La meta del proyecto es mantener una cobertura **≥ 90%** en la lógica de negocio y seguir
las convenciones descritas en [`docs/project/guidelines/`](docs/project/guidelines).

## 🗺️ Roadmap

- [x] Autenticación
- [x] Carteras
- [x] Ingresos y gastos
- [x] Transferencias entre carteras
- [x] Dashboard
- [ ] Perfil y ajustes
- [ ] Amigos
- [ ] Grupos y gastos compartidos
- [ ] Liquidación de deudas

Consulta el roadmap completo en
[`docs/project/development-notes/roadmap.md`](docs/project/development-notes/roadmap.md).

## 📚 Documentación

- [Memoria del proyecto](docs/project/development-notes/project-memory.md)
- [Roadmap](docs/project/development-notes/roadmap.md)
- [Plan de implementación](docs/project/implementation-plan/implementation-plan.md)
- [Guías de arquitectura y SOLID](docs/project/guidelines/architecture-and-solid.md)
- [Guía de seguridad y validación](docs/project/guidelines/security-and-validation.md)

---

<div align="center">

Hecho con ☕ y TypeScript.

</div>
