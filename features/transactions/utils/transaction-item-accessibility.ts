import { formatMoney } from "@/features/wallets/utils/money";
import { formatDateInput } from "@/shared/utils/date";

import { Transaction } from "../types/transaction.types";

export const OPEN_TRANSACTION_DETAIL_HINT =
  "Abre el detalle del movimiento para editar o eliminar.";

/** Screen-reader summary and open action for a movement card. */
export function getTransactionDetailLabel(
  transaction: Transaction,
  categoryLabel: string,
  walletName?: string,
): string {
  const kind = transaction.type === "income" ? "ingreso" : "gasto";
  const parts = [
    `Ver detalle del ${kind}: ${transaction.concept}`,
    formatMoney(transaction.amount, transaction.currency),
    formatDateInput(transaction.date),
    categoryLabel,
  ];

  if (walletName) parts.push(walletName);

  return parts.join(", ");
}
