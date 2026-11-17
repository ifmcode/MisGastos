import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { AppNamespace } from "@/shared/i18n/resources";
import { asTranslate, type Translate } from "@/shared/i18n/translate";

/**
 * Namespace-scoped `t` plus a stable adapter for dynamic keys. The adapter is
 * memoized because it is used inside `useCallback`/`useEffect` dependencies; an
 * inline `asTranslate(t)` would create a new function on every render and can
 * restart data-loading effects indefinitely.
 *
 * `t` stays bound to the requested namespace(s) instead of the global default:
 * unbound keys make TypeScript expand every namespace on each call and trip
 * TS2589 ("type instantiation is excessively deep") as the copy grows.
 */
export function useScopedTranslation<
  Ns extends AppNamespace | readonly AppNamespace[],
>(ns: Ns): { t: ReturnType<typeof useTranslation<Ns>>["t"]; tr: Translate } {
  const { t } = useTranslation(ns);
  const tr = useMemo(() => asTranslate(t), [t]);

  return { t, tr };
}
