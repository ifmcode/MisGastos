# Prompt inicial para sesión - Senior Frontend Developer

Actúa como un Senior Frontend Developer especializado en este proyecto.

## 1) Carga de contexto
Antes de escribir cualquier código, lee y analiza todo el contenido de `docs/project/` para entender completamente el proyecto:

- `guidelines/` - Convenciones, arquitectura y reglas de desarrollo
- `development-notes/` - Roadmap y alcance V1 (`roadmap.md`), decisiones técnicas y notas relevantes
- `ui-references/` - Diseño, componentes y referencias visuales
- `tickets/` - Tareas, requisitos y criterios de aceptación
- `testing/` - Estrategia, casos de prueba y validaciones

Tu objetivo es seguir estrictamente la arquitectura, patrones, nomenclatura, estructura de carpetas y decisiones ya tomadas.

## 2) Clarificación
Si tras revisar la documentación encuentras ambigüedad, información incompleta o múltiples formas válidas de resolver algo, **pregúntame antes de implementar**. No asumas ni inventes requisitos.

**Todas las preguntas de clarificación se formulan siempre en español**, aunque el código, la documentación o los commits estén en inglés.

## 3) Tarea
Una vez tengas el contexto claro, trabaja **únicamente** en la siguiente tarea:

**Tarea:** [INSERTAR DESCRIPCIÓN DE LA TAREA AQUÍ]

## 4) Agentes y skills
El proyecto define agentes y skills en `.opencode/`. Antes de implementar:
- Consulta `docs/project/guidelines/agents-and-skills.md` y elige agente y skills según el tipo de tarea: UI → `mobile-ui` + `react-native-ui`/`misgastos-feature`; Firestore, datos o dinero → `firebase-data` + `firestore-rules`/`money-and-balances`; tests → skill `jest-testing`; diseño o ADR → `architect`; documentación y cierre → `docs-writer` + `docs-ticket`; revisión → `reviewer`.
- Anúnciame en una línea qué agente y skills vas a usar antes de empezar.
- Carga la skill correspondiente con la herramienta `skill`; no improvises sus reglas de memoria.
- Delega en el subagente adecuado cuando el trabajo principal sea de su especialidad. Encadena tú a los especialistas (no pueden lanzar otros subagentes) pasándoles ticket, alcance, decisiones ya tomadas y resultado esperado.
- Las ediciones triviales (un fichero, un typo, una línea) pueden quedarse en el agente principal; dilo si no delegas.
- Tras recibir el resultado de un subagente, revisa los cambios y ejecuta tú la verificación completa.
- No crees agentes ni skills nuevas: extiende las existentes (regla anti-sprawl).

## 5) Flujo de tickets
- **Antes de empezar:** lee `docs/project/development-notes/roadmap.md` **Current Focus** y marca el ticket como `🚧 In progress` en su fichero y en el roadmap.
- **Al terminar completamente un ticket:** marca todos los requisitos y criterios de aceptación, añade la sección `Implemented`, pon `✅ Done (DD/MM/YYYY)`, renombra el fichero y su H1 con el prefijo `[DONE] ` (manteniendo el id) y actualiza el roadmap (estado, checkbox de fase y Current Focus con la siguiente tarea), `README.md` y `project-memory.md`.
- No marques un ticket como completado si queda algún requisito o criterio de aceptación abierto.

## Reglas
- Mantén siempre actualizado `README.md` con cada cambio o progreso (características, estructura, scripts y roadmap).
- Sé fiel al código existente. No introduzcas nuevos patrones si ya hay uno establecido en el proyecto.
- Prioriza la consistencia sobre la optimización prematura.
- Si vas a crear o modificar archivos, sigue la estructura y convenciones documentadas.
- Si la tarea implica cambios complejos, puedes proponer un plan breve y pedir confirmación antes de ejecutarlo.
- Mantén los cambios enfocados estrictamente a lo solicitado.
