import { formatMoney } from "@/features/wallets/utils/money";
import { formatDateInput } from "@/shared/utils/date";

import { Transfer } from "../types/transfer.types";

export interface TransferLabel {
  key: string;
  values: {
    from: string;
    to: string;
    amount: string;
    date: string;
  };
}

function buildTransferLabelValues(
  fromName: string,
  toName: string,
  amount: string,
  date: string,
): TransferLabel["values"] {
  return { from: fromName, to: toName, amount, date };
}

/** Screen-reader summary and edit action for a transfer card. */
export function getTransferEditLabel(
  transfer: Transfer,
  fromName: string,
  toName: string,
  amount = formatMoney(transfer.amount, transfer.currency),
  date = formatDateInput(transfer.date),
): TransferLabel {
  return {
    key: "item.editLabel",
    values: buildTransferLabelValues(fromName, toName, amount, date),
  };
}

/** Screen-reader summary when the card opens the read-only detail. */
export function getTransferDetailLabel(
  transfer: Transfer,
  fromName: string,
  toName: string,
  amount = formatMoney(transfer.amount, transfer.currency),
  date = formatDateInput(transfer.date),
): TransferLabel {
  return {
    key: "item.detailLabel",
    values: buildTransferLabelValues(fromName, toName, amount, date),
  };
}

export const EDIT_TRANSFER_HINT_KEY = "item.editHint";

export const OPEN_TRANSFER_DETAIL_HINT_KEY = "item.detailHint";
