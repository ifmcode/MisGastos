type ReactNativeModule = { Platform: { OS: string } };

/**
 * `Platform.OS` without a static `react-native` import: this flag is imported
 * by every local-db module and its tests, and `react-native` only resolves in
 * Metro. The guarded `require` resolves through Metro in the app (cached by the
 * module registry, so retrying is cheap) and falls back to "not web" when the
 * package cannot be loaded, as in the Node-based Jest environment. The failure
 * is never memoized: one failed load must not disable the web guard for the
 * whole process.
 */
function readPlatformOs(): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require("react-native") as ReactNativeModule;
    return module.Platform.OS;
  } catch {
    return null;
  }
}

/**
 * Read-cache switch. Read only here so no screen or service inlines the
 * environment variable and the default stays off.
 *
 * **Web is online-only** (ADR decision, see the future TICKET-076): the local
 * SQLite database is never opened there, so offline-first stays off on the web
 * even when the environment variable turns it on.
 */
export function isOfflineFirstEnabled(): boolean {
  if (readPlatformOs() === "web") return false;

  return process.env.EXPO_PUBLIC_OFFLINE_FIRST === "true";
}
