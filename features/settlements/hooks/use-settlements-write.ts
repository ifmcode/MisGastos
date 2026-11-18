import { useCallback, useState } from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { SettlementFieldErrors } from "../schemas/settlement-validation.types";
import {
  getSettlementErrorCode,
  SettlementValidationError,
  type SettlementErrorCode,
} from "../services/settlement.errors";
import type { Settlement, SettlementInput } from "../types/settlement.types";
import { useSettlementsService } from "./use-settlements-service";

export interface SettlementsWriteController {
  submitting: boolean;
  actionError: string | null;
  fieldErrors: SettlementFieldErrors;
  resetErrors: () => void;
  create: (viewerUid: string, input: SettlementInput) => Promise<Settlement | null>;
  update: (
    viewerUid: string,
    settlementId: string,
    input: SettlementInput,
  ) => Promise<Settlement | null>;
  remove: (viewerUid: string, settlementId: string) => Promise<boolean>;
}

interface WriteResult<T> {
  ok: boolean;
  value: T | null;
}

/**
 * Single-flight create/update/delete of settlements with the stable error codes
 * translated once. The screens decide what to do on success, so create, the
 * editor modal and the wallet link share one mutation path.
 */
export function useSettlementsWrite(): SettlementsWriteController {
  const service = useSettlementsService();
  const { tr } = useScopedTranslation("settlements");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<SettlementFieldErrors>({});

  const resetErrors = useCallback(() => {
    setActionError(null);
    setFieldErrors({});
  }, []);

  const run = useCallback(
    async <T,>(
      mutate: () => Promise<T>,
      fallback: SettlementErrorCode,
    ): Promise<WriteResult<T>> => {
      setSubmitting(true);
      resetErrors();

      try {
        return { ok: true, value: await mutate() };
      } catch (error: unknown) {
        if (error instanceof SettlementValidationError) {
          setFieldErrors(error.fieldErrors);
        }
        setActionError(tr(`errors.${getSettlementErrorCode(error, fallback)}`));
        return { ok: false, value: null };
      } finally {
        setSubmitting(false);
      }
    },
    [resetErrors, tr],
  );

  const create = useCallback(
    async (viewerUid: string, input: SettlementInput) => {
      const result = await run(
        () => service.createSettlement(viewerUid, input),
        "SAVE_FAILED",
      );

      return result.value;
    },
    [run, service],
  );

  const update = useCallback(
    async (viewerUid: string, settlementId: string, input: SettlementInput) => {
      const result = await run(
        () => service.updateSettlement(viewerUid, settlementId, input),
        "SAVE_FAILED",
      );

      return result.value;
    },
    [run, service],
  );

  const remove = useCallback(
    async (viewerUid: string, settlementId: string) => {
      const result = await run(
        () => service.deleteSettlement(viewerUid, settlementId),
        "DELETE_FAILED",
      );

      return result.ok;
    },
    [run, service],
  );

  return {
    submitting,
    actionError,
    fieldErrors,
    resetErrors,
    create,
    update,
    remove,
  };
}
