import { parseDateInput } from "./date";

let lastUsedIsoDate: string | null = null;
const listeners = new Set<() => void>();

export function getLastUsedIsoDate(): string | null {
  return lastUsedIsoDate;
}

export function subscribeToLastUsedDate(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Remembers the date of a saved movement for the current app session. */
export function rememberLastUsedDate(isoDate: string): void {
  const normalized = parseDateInput(isoDate);
  if (!normalized || normalized === lastUsedIsoDate) return;

  lastUsedIsoDate = normalized;
  for (const listener of listeners) listener();
}

/** Test helper: clears the in-memory session value. */
export function resetLastUsedDate(): void {
  lastUsedIsoDate = null;
  for (const listener of listeners) listener();
}
