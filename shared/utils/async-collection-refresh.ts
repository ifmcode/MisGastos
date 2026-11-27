/**
 * What a failed **background** collection refresh may do. Data already on
 * screen is never replaced by an error, the cache is only a fallback for an
 * empty screen, and the error is only reported when there is nothing to show.
 */
export type RefreshFailureResolution<T> =
  | { readonly action: "keep" }
  | { readonly action: "use-cache"; readonly items: T[] }
  | { readonly action: "report-error" };

/**
 * Decides the fallback of a failed refresh (tab focus, reconnect or after a
 * mutation). Pure on purpose: the hook only applies the resolution.
 */
export function resolveRefreshFailure<T>(
  currentItems: readonly T[],
  cachedItems: T[] | null,
): RefreshFailureResolution<T> {
  if (currentItems.length > 0) return { action: "keep" };
  if (cachedItems !== null) {
    return { action: "use-cache", items: cachedItems };
  }

  return { action: "report-error" };
}
