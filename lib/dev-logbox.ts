import { LogBox } from "react-native";

import { formatDevLogArgs, pushDevLog } from "./dev-log.store";

const BRIDGE_KEY = "__misgastosDevLogBridge";

/**
 * Dev-only console bridge. The default LogBox card is white in this dark theme
 * and, in bridgeless builds, only says "Open debugger to view warnings.", so it
 * is unreadable. This bridge:
 *
 * - hides the default LogBox notifications (`ignoreAllLogs`),
 * - keeps the real message in the Metro console,
 * - feeds every `console.warn`/`console.error` into the themed in-app overlay
 *   (`DevLogOverlay`), which filters the known noise and deduplicates.
 *
 * It runs from the custom entry (`index.js`) before the router renders, so the
 * first-render warnings are captured too.
 */
export function installDevLogBridge(): void {
  if (!__DEV__) return;

  const globalState = globalThis as Record<string, unknown>;
  if (globalState[BRIDGE_KEY]) return;
  globalState[BRIDGE_KEY] = true;

  LogBox.ignoreAllLogs(true);

  for (const level of ["warn", "error"] as const) {
    const original = console[level].bind(console);

    console[level] = (...args: unknown[]) => {
      original(...args);
      pushDevLog(level, formatDevLogArgs(args));
    };
  }
}

installDevLogBridge();
