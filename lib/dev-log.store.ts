/** Severity of a development log; both render as a themed in-app card. */
export type DevLogLevel = "warn" | "error";

export interface DevLogEntry {
  id: number;
  level: DevLogLevel;
  message: string;
}

/** Known dev-only noise: it would flood the overlay and hide real warnings. */
const IGNORED_PATTERNS = [
  "Could not reach Cloud Firestore backend",
  "WebChannelConnection",
  "RestConnection",
  "transport errored",
  "SafeAreaView has been deprecated",
  "ImageBackground is deprecated",
] as const;

const MAX_ENTRIES = 3;
const MAX_MESSAGE_LENGTH = 600;
const AUTO_DISMISS_MS = 8_000;

const listeners = new Set<() => void>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();
const seen = new Set<string>();
let entries: DevLogEntry[] = [];
let nextId = 1;

function emit(): void {
  for (const listener of listeners) listener();
}

export function isIgnoredDevLog(message: string): boolean {
  return IGNORED_PATTERNS.some((pattern) => message.includes(pattern));
}

function formatArgument(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null ||
    value === undefined
  ) {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/** One readable line/multiline from the console arguments, capped in length. */
export function formatDevLogArgs(args: readonly unknown[]): string {
  return args
    .map(formatArgument)
    .join(" ")
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);
}

/** Adds a card unless it is known noise or was already shown this session. */
export function pushDevLog(level: DevLogLevel, message: string): void {
  const trimmed = message.trim();
  if (!trimmed || isIgnoredDevLog(trimmed) || seen.has(trimmed)) return;

  seen.add(trimmed);
  const entry: DevLogEntry = { id: nextId, level, message: trimmed };
  nextId += 1;

  const previous = entries;
  entries = [...entries, entry].slice(-MAX_ENTRIES);

  const kept = new Set(entries.map((item) => item.id));
  for (const item of previous) {
    if (kept.has(item.id)) continue;
    const timer = timers.get(item.id);
    if (timer) clearTimeout(timer);
    timers.delete(item.id);
  }

  timers.set(
    entry.id,
    setTimeout(() => dismissDevLog(entry.id), AUTO_DISMISS_MS),
  );
  emit();
}

export function dismissDevLog(id: number): void {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
  entries = entries.filter((entry) => entry.id !== id);
  emit();
}

export function subscribeDevLogs(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/** Stable snapshot for `useSyncExternalStore`. */
export function getDevLogSnapshot(): DevLogEntry[] {
  return entries;
}

/** Test/HMR seam: forgets entries, timers and the duplicate guard. */
export function resetDevLogs(): void {
  for (const timer of timers.values()) clearTimeout(timer);
  timers.clear();
  entries = [];
  seen.clear();
  nextId = 1;
  emit();
}
