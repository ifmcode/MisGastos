const listeners = new Set<() => void>();

/** Lets a sibling route ask the mounted Social tab to reload its counts. */
export function subscribeToRequestsRefresh(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyRequestsRefresh(): void {
  for (const listener of listeners) listener();
}
