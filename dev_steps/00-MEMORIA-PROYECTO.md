# MEMORIA DEL PROYECTO - MisGastos

> Documento vivo para continuar el desarrollo desde cualquier ordenador con Opencode/Claude. Actualizar tras cada hito importante.

## Estado actual
- Fecha inicio documentación: 27/10/2026
- Stack: Expo SDK 54, React Native 0.81.5, React 19.1.0, Expo Router 6, TypeScript 5.9, NativeWind 4, Firebase (Auth + Firestore), Jest 30
- Auth implementado (email/password + Google) con Firebase
- Rutas: tabs, login, modal
- Estructura actual: app/, components/, lib/, common/, hooks/, assets/

## Objetivo del proyecto
Crear una app híbrida entre "Gestor de gastos" (control personal de gastos/ingresos por cuentas/carteras) y "Splitwise" (gastos compartidos, grupos, saldos entre amigos).

**Visión:** Aplicación para llevar control de finanzas personales + compartidas, multi-cartera/multi-moneda, con historial, filtros, transferencias entre carteras y gestión de grupos/amigos con liquidaciones.

## Arquitectura objetivo
Ver `directrices/01-ARQUITECTURA-Y-SOLID.md`. Migración incremental a feature-first + capas (features/, shared/).

## Decisiones tomadas
- Sin subida de fotos inicialmente (más simple)
- Firebase como backend (Auth + Firestore). Evaluar reglas de seguridad después
- TypeScript estricto
- Tests con objetivo de cobertura >= 90% (ver código-tests)

## Cómo retomar
1. Leer este fichero + `dev_steps/01-ROADMAP.md`
2. Revisar `plan-implementacion/PLAN-MVP-Y-POSTMVP.md`
3. Consultar `tickets/` para tarea siguiente
4. Seguir `directrices/` para cualquier cambio
5. Documentar en `dev_steps/` tras cada sesión

## Historial de sesiones
| Fecha | Cambio | Notas |
|---|---|---|
| 22/10/2026 | Creación pautas iniciales | Generado `docs/ARQUITECTURA_FRONTEND_SOLID.md` |
| 27/10/2026 | Reorganización completa | Creación de carpetas dev_steps/tickets/directrices/codigo-tests/ui-references/plan-implementacion + memoria + directrices + plan + tickets iniciales |
| 27/10/2026 | Fusión archivos legacy | Archivadados `agent_memory.md`, `implementation_plan.md`, `task.md` en `dev_steps/ARCHIVO-OLD/`. Fusionados detalles útiles (divisa seleccionable, actualizar saldo al editar/borrar, toggle "Incluir en total", categorías con tipo). Añadidas capturas referencia Gestor gastos + Splitwise |
