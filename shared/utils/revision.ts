/**
 * Revision contract shared by the revisioned collections (`wallets`,
 * `transactions`, `transfers`, `categories`): a create writes
 * `INITIAL_REVISION`, every update writes the stored value plus one, and a
 * legacy document without the field (or with a malformed one) counts as 0.
 */
export const INITIAL_REVISION = 0;

/** Any document or entity that may carry a stored revision. */
export interface RevisionCarrier {
  revision?: unknown;
}

/**
 * Stored revision, never lower than `INITIAL_REVISION`. Missing, non-integer or
 * negative values fall back to 0 so the first update of a legacy document
 * writes 1.
 */
export function readStoredRevision(
  data: RevisionCarrier | null | undefined,
): number {
  if (!data) return INITIAL_REVISION;

  const value = data.revision;
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return INITIAL_REVISION;
  }

  return value > INITIAL_REVISION ? value : INITIAL_REVISION;
}

/** Revision an update must write for the given stored state. */
export function nextRevision(
  data: RevisionCarrier | null | undefined,
): number {
  return readStoredRevision(data) + 1;
}
