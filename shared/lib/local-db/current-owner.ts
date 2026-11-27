/**
 * Signed-in uid used to scope the social cache. Group repositories do not take
 * the viewer as an argument, and the cache must stay per account, so the auth
 * layer registers a resolver here. Keeping this module free of Firebase imports
 * lets repository and factory tests load without initializing an auth app.
 */
type OwnerResolver = () => string | null;

let resolveOwner: OwnerResolver = () => null;

/** Installed once by `lib/firebase.ts` (the only Firebase bootstrap). */
export function registerCurrentOwnerResolver(resolver: OwnerResolver): void {
  resolveOwner = resolver;
}

export function readCurrentOwnerId(): string | null {
  const uid = resolveOwner();
  return typeof uid === "string" && uid.trim().length > 0 ? uid : null;
}
