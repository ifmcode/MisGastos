import { useCallback } from "react";

import {
  useConfirmDialog,
  type UseConfirmDialogResult,
} from "@/shared/hooks/use-confirm-dialog";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { Settlement, SettlementInput } from "../types/settlement.types";
import { formatSettlementAmountInput } from "../utils/settlement-form";
import { useSettlementsWrite } from "./use-settlements-write";

export interface UseSettlementWalletLinkOptions {
  viewerUid: string;
  settlement: Settlement | null;
  /** Refreshes the list and the friend balances after the reversion. */
  onChanged: () => void;
}

export interface SettlementWalletLinkController {
  confirm: UseConfirmDialogResult;
  /** Opens the confirmation; the unlink also works from an archived wallet. */
  requestUnlink: () => void;
  pending: boolean;
  error: string | null;
}

/**
 * Creditor follow-up of the notification: unlinking reverts the income exactly
 * once. The update keeps the current amount, date and note and sends an empty
 * wallet/category, which the service resolves as "no link". The wallet may be
 * archived, so the action is never blocked by `WALLET_ARCHIVED`.
 */
export function useSettlementWalletLink({
  viewerUid,
  settlement,
  onChanged,
}: UseSettlementWalletLinkOptions): SettlementWalletLinkController {
  const write = useSettlementsWrite();
  const confirm = useConfirmDialog();
  const { t } = useScopedTranslation(["settlements", "common"]);

  const unlink = useCallback(() => {
    if (!settlement || !viewerUid) return;

    const input: SettlementInput = {
      friendUid:
        settlement.participantIds.find((uid) => uid !== viewerUid) ?? "",
      currency: settlement.currency,
      amount: formatSettlementAmountInput(settlement.amountCents),
      date: settlement.date,
      note: settlement.note,
      walletId: "",
      categoryId: "",
    };

    void write
      .update(viewerUid, settlement.id, input)
      .then((updated) => {
        if (updated) onChanged();
      });
  }, [onChanged, settlement, viewerUid, write.update]);

  const requestUnlink = useCallback(() => {
    if (!settlement) return;

    confirm.open({
      title: t("detail.unlinkDialogTitle"),
      message: t("detail.unlinkDialogMessage"),
      confirmLabel: t("detail.unlinkWallet"),
      cancelLabel: t("common:actions.cancel"),
      onConfirm: unlink,
    });
  }, [confirm, settlement, t, unlink]);

  return {
    confirm,
    requestUnlink,
    pending: write.submitting,
    error: write.actionError,
  };
}
