import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { AppNamespace } from "@/shared/i18n/resources";
import { asTranslate, type Translate } from "@/shared/i18n/translate";

/**
 * Namespace-scoped `t` plus a stable adapter for dynamic keys. The adapter is
 * memoized because it is used inside `useCallback`/`useEffect` dependencies; an
 * inline `asTranslate(t)` would create a new function on every render and can
 * restart data-loading effects indefinitely.
 */
export function useScopedTranslation(ns: AppNamespace | AppNamespace[]): {
  t: ReturnType<typeof useTranslation>["t"];
  tr: Translate;
} {
  const { t } = useTranslation(ns);
  const tr = useMemo(() => asTranslate(t), [t]);

  return { t, tr };
}
