import {
  Transfer,
  TransferFormValues,
} from "@/features/transfers/types/transfer.types";
import {
  DEFAULT_CURRENCY,
  type CurrencyCode,
} from "@/shared/constants/currencies";
import { getDefaultMovementIsoDate } from "@/shared/utils/date-defaults";

/**
 * Builds the initial values for the create/edit transfer form. A new transfer
 * starts with both wallets empty; the preferred currency is only provisional and
 * the source wallet currency replaces it once the user picks one.
 */
export function buildTransferFormValues(
  editingTransfer: Transfer | null,
  preferredCurrency: CurrencyCode = DEFAULT_CURRENCY,
): TransferFormValues {
  if (editingTransfer) {
    return {
      fromWalletId: editingTransfer.fromWalletId,
      toWalletId: editingTransfer.toWalletId,
      amount: String(editingTransfer.amount),
      currency: editingTransfer.currency,
      date: editingTransfer.date,
      notes: editingTransfer.notes ?? "",
    };
  }

  return {
    fromWalletId: "",
    toWalletId: "",
    amount: "",
    currency: preferredCurrency,
    date: getDefaultMovementIsoDate(),
    notes: "",
  };
}
