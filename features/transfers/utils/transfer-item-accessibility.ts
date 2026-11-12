import { Transfer } from "../types/transfer.types";
import { formatMoney } from "@/features/wallets/utils/money";
import { formatDateInput } from "@/shared/utils/date";

export interface TransferEditLabel {
  key: string;
  values: {
    from: string;
    to: string;
    amount: string;
    date: string;
  };
}

/** Screen-reader summary and edit action for a transfer card. */
export function getTransferEditLabel(
  transfer: Transfer,
  fromName: string,
  toName: string,
  amount = formatMoney(transfer.amount, transfer.currency),
  date = formatDateInput(transfer.date),
): TransferEditLabel {
  return {
    key: "item.editLabel",
    values: { from: fromName, to: toName, amount, date },
  };
}

export const EDIT_TRANSFER_HINT_KEY = "item.editHint";
