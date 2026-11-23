import { useCallback, useState } from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { GroupSettlementFieldErrors } from "../schemas/group-settlement.schema";

import {
  getGroupSettlementErrorCode,
  GroupSettlementValidationError,
} from "../services/group-settlement.errors";
import type { GroupExpenseErrorCode } from "../services/group-expense.errors";
import type {
  GroupSettlement,
  GroupSettlementInput,
} from "../types/group-settlement.types";
import { getGroupSettlementErrorCopyKey } from "../utils/group-settlement-error-copy";
import { useGroupSettlementsService } from "./use-group-settlements-service";

export interface GroupSettlementWriteController {
  submitting: boolean;
  /** Translated notice shown above the actions. */
  actionError: string | null;
  fieldErrors: GroupSettlementFieldErrors;
  resetErrors: () => void;
  create: (
    viewerUid: string,
    input: GroupSettlementInput,
  ) => Promise<GroupSettlement | null>;
  update: (
    viewerUid: string,
    settlementId: string,
    input: GroupSettlementInput,
  ) => Promise<GroupSettlement | null>;
  remove: (viewerUid: string, settlementId: string) => Promise<boolean>;
}

interface WriteResult {
  ok: boolean;
  value: GroupSettlement | null;
}

/**
 * Single-flight create/update/delete of group settlements with the stable
 * codes translated once. Field errors stay separate, so the amount/date/note
 * inputs own their own message and the notice never repeats it.
 */
export function useGroupSettlementWrite(): GroupSettlementWriteController {
  const service = useGroupSettlementsService();
  const { tr } = useScopedTranslation("groupExpenses");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<GroupSettlementFieldErrors>({});

  const resetErrors = useCallback(() => {
    setActionError(null);
    setFieldErrors({});
  }, []);

  const run = useCallback(
    async (
      mutate: () => Promise<GroupSettlement | void>,
      fallback: GroupExpenseErrorCode,
    ): Promise<WriteResult> => {
      setSubmitting(true);
      resetErrors();

      try {
        const value = await mutate();
        return { ok: true, value: (value as GroupSettlement) ?? null };
      } catch (error: unknown) {
        if (error instanceof GroupSettlementValidationError) {
          setFieldErrors(error.fieldErrors);
        }
        const code = getGroupSettlementErrorCode(error, fallback);
        setActionError(
          tr(`errors.${getGroupSettlementErrorCopyKey(code)}`),
        );
        return { ok: false, value: null };
      } finally {
        setSubmitting(false);
      }
    },
    [resetErrors, tr],
  );

  const create = useCallback(
    async (viewerUid: string, input: GroupSettlementInput) => {
      const result = await run(
        () => service.createGroupSettlement(viewerUid, input),
        "SAVE_FAILED",
      );

      return result.value;
    },
    [run, service],
  );

  const update = useCallback(
    async (
      viewerUid: string,
      settlementId: string,
      input: GroupSettlementInput,
    ) => {
      const result = await run(
        () => service.updateGroupSettlement(viewerUid, settlementId, input),
        "SAVE_FAILED",
      );

      return result.value;
    },
    [run, service],
  );

  const remove = useCallback(
    async (viewerUid: string, settlementId: string) => {
      const result = await run(
        () => service.deleteGroupSettlement(viewerUid, settlementId),
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
