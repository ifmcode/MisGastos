/**
 * Mobile build helper. Separates the two daily flows so nobody rebuilds native
 * code for a JS change or tests against a stale Metro cache:
 *
 *   node scripts/mobile.js status
 *   node scripts/mobile.js refresh  [--offline|--online] [expo args]
 *   node scripts/mobile.js android  [--offline|--online] [expo args]
 *   node scripts/mobile.js ios      [--offline|--online] [expo args]
 *
 * `refresh` only restarts Metro with a clean cache (JS, styles and copy).
 * `android`/`ios` build and install the native debug app on a physical device
 * and then start Metro. The offline flag is inlined at bundle time, so the
 * script prints the effective value and lets `--offline`/`--online` override
 * `.env` without editing it.
 */
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const FLAG = "EXPO_PUBLIC_OFFLINE_FIRST";
const APP_ID = "com.misgastos.app";
const COMMANDS = new Set(["status", "refresh", "android", "ios"]);

function readDotEnvFlag() {
  const file = path.join(process.cwd(), ".env");
  if (!fs.existsSync(file)) return null;

  const line = fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .find((row) => row.trim().startsWith(`${FLAG}=`));
  if (!line) return null;

  return line
    .slice(line.indexOf("=") + 1)
    .trim()
    .replace(/^['"]|['"]$/g, "");
}

function describeFlag(envValue, dotEnvValue) {
  const effective = envValue ?? dotEnvValue ?? "false";
  const source =
    envValue !== undefined
      ? "override de la línea de comandos"
      : dotEnvValue !== null
        ? ".env"
        : "valor por defecto";

  return `${effective === "true" ? "ON" : "OFF"} (${FLAG}=${effective}; ${source})`;
}

function printHelp() {
  console.log(`MisGastos · mobile

Uso:
  node scripts/mobile.js status
  node scripts/mobile.js refresh [--offline|--online] [args de expo]
  node scripts/mobile.js android [--offline|--online] [args de expo]
  node scripts/mobile.js ios     [--offline|--online] [args de expo]

Comandos:
  status    Muestra el flag offline efectivo y los comandos recomendados.
  refresh   Reinicia Metro con caché limpia (solo cambios JS/estilos/copy).
  android   Compila e instala el build nativo debug en un móvil Android
            conectado por USB y arranca Metro.
  ios       Compila e instala en un iPhone (requiere Xcode y firma).

Opciones:
  --offline   Fuerza EXPO_PUBLIC_OFFLINE_FIRST=true para este proceso.
  --online    Fuerza EXPO_PUBLIC_OFFLINE_FIRST=false para este proceso.
  --dry-run   Muestra el comando de Expo sin ejecutarlo.
  --help      Muestra esta ayuda.

Cualquier otro argumento se pasa a Expo, por ejemplo:
  node scripts/mobile.js android --no-build-cache
  node scripts/mobile.js android --device Pixel_8`);
}

function printStatus(flagLine) {
  const android = fs.existsSync(path.join(process.cwd(), "android"));
  const ios = fs.existsSync(path.join(process.cwd(), "ios"));

  console.log("MisGastos · mobile\n");
  console.log(`Offline-first: ${flagLine}`);
  console.log(`Android app id: ${APP_ID}`);
  console.log(
    `Carpetas nativas: android/ ${android ? "presente" : "ausente"} · ios/ ${
      ios ? "presente" : "ausente"
    }\n`,
  );
  console.log("Refrescar solo JS (sin rebuild):");
  console.log("  npm run mobile:refresh");
  console.log("  npm run mobile:refresh:offline");
  console.log("  npm run mobile:refresh:online\n");
  console.log("Recompilar e instalar en el móvil físico:");
  console.log("  npm run mobile:android   (Android, depuración USB activa)");
  console.log("  npm run mobile:ios       (iPhone, Xcode y firma)\n");
  console.log("Build nativo limpio (si el incremental falla):");
  console.log("  npm run mobile:android:clean\n");
  console.log(
    "El flag se inlinea en el bundle: cámbialo antes de arrancar Metro. Solo",
  );
  console.log(
    "necesitas rebuild nativo si cambian dependencias nativas, app.json/plugins",
  );
  console.log("o la carpeta android/.");
}

function runExpo(args, env) {
  const binary = process.platform === "win32" ? "npx.cmd" : "npx";
  const child = spawn(binary, args, {
    stdio: "inherit",
    env,
    shell: process.platform === "win32",
  });

  child.on("error", (error) => {
    console.error(`No se pudo ejecutar npx: ${error.message}`);
    process.exit(1);
  });
  child.on("exit", (code, signal) => {
    if (signal) process.exit(1);
    process.exit(code ?? 0);
  });
}

const [command, ...rawArgs] = process.argv.slice(2);

if (
  !command ||
  command === "--help" ||
  command === "-h" ||
  rawArgs.includes("--help") ||
  rawArgs.includes("-h")
) {
  printHelp();
  process.exit(0);
}

if (!COMMANDS.has(command)) {
  console.error(`Comando desconocido: ${command}\n`);
  printHelp();
  process.exit(1);
}

const offline = rawArgs.includes("--offline");
const online = rawArgs.includes("--online");
if (offline && online) {
  console.error("Usa solo uno de --offline o --online.");
  process.exit(1);
}

const env = { ...process.env };
if (offline) env[FLAG] = "true";
if (online) env[FLAG] = "false";

const flagLine = describeFlag(
  offline ? "true" : online ? "false" : undefined,
  readDotEnvFlag(),
);

const dryRun = rawArgs.includes("--dry-run");

const passthrough = rawArgs.filter(
  (arg) =>
    arg !== "--offline" &&
    arg !== "--online" &&
    arg !== "--dry-run" &&
    arg !== "--",
);

if (command === "status") {
  printStatus(flagLine);
  process.exit(0);
}

const expoArgs =
  command === "refresh"
    ? ["expo", "start", "--clear", ...passthrough]
    : [
        `expo`,
        `run:${command}`,
        ...passthrough.some((arg) => arg === "-d" || arg === "--device")
          ? []
          : ["--device"],
        ...passthrough,
      ];

console.log(`MisGastos · mobile\n`);
console.log(`Offline-first: ${flagLine}`);
console.log(`Ejecutando: npx ${expoArgs.join(" ")}\n`);

if (dryRun) process.exit(0);

runExpo(expoArgs, env);
