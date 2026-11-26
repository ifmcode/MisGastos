type SyncTriggerListener = () => void;

const listeners = new Set<SyncTriggerListener>();

/**
 * In-process notification that a local write enqueued a mutation. The sync
 * provider debounces it, so a burst of writes produces one push cycle. It is a
 * Set of callbacks instead of an event bus: there is exactly one subscriber.
 */
export function requestSyncTrigger(): void {
  for (const listener of listeners) listener();
}

export function subscribeSyncTrigger(
  listener: SyncTriggerListener,
): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/** Test seam: forgets every subscriber. */
export function resetSyncTriggers(): void {
  listeners.clear();
}
