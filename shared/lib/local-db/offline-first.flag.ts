/**
 * Read-cache switch. Read only here so no screen or service inlines the
 * environment variable and the default stays off.
 */
export function isOfflineFirstEnabled(): boolean {
  return process.env.EXPO_PUBLIC_OFFLINE_FIRST === "true";
}
