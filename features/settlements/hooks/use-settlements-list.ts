import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getSettlementErrorCode } from "../services/settlement.errors";
import type { Settlement } from "../types/settlement.types";
import { filterActiveSettlements } from "../utils/settlement-ledger";
import { useSettlementsService } from "./use-settlements-service";

type LoadMode = "initial" | "refresh";

export interface UseSettlementsListOptions {
  viewerUid: string | undefined;
}

export interface SettlementsListController {
  /** Active settlements only: a soft-deleted record keeps no UI presence. */
  settlements: Settlement[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  refresh: () => Promise<void>;
}

/** Loads the viewer's settlements with initial, refresh and focus reloads. */
export function useSettlementsList({
  viewerUid,
}: UseSettlementsListOptions): SettlementsListController {
  const service = useSettlementsService();
  const { tr } = useScopedTranslation("settlements");
  const [stored, setStored] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const load = useCallback(
    async (mode: LoadMode) => {
      if (!viewerUid) {
        setStored([]);
        setError(null);
        setLoading(false);
        return;
      }

      requestRef.current += 1;
      const request = requestRef.current;

      if (mode === "initial") setLoading(true);
      setError(null);

      try {
        const loaded = await service.getSettlements(viewerUid);
        if (requestRef.current === request) setStored(loaded);
      } catch (loadError: unknown) {
        if (requestRef.current === request) {
          setError(
            tr(`errors.${getSettlementErrorCode(loadError, "LOAD_FAILED")}`),
          );
        }
      } finally {
        if (requestRef.current === request && mode === "initial") {
          setLoading(false);
        }
      }
    },
    [service, tr, viewerUid],
  );

  useEffect(() => {
    void load("initial");
  }, [load]);

  const hasFocusedOnce = useRef(false);
  const refresh = useCallback(() => load("refresh"), [load]);

  // The counterpart can settle from another device while this tab is open.
  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnce.current) {
        hasFocusedOnce.current = true;
        return;
      }

      void refresh();
    }, [refresh]),
  );

  const reload = useCallback(() => {
    void load("initial");
  }, [load]);

  const settlements = useMemo(() => filterActiveSettlements(stored), [stored]);

  return { settlements, loading, error, reload, refresh };
}
