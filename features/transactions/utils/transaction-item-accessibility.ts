import { formatMoney } from "@/features/wallets/utils/money";
import { formatDateInput } from "@/shared/utils/date";

import { Transaction } from "../types/transaction.types";

export const EDIT_TRANSACTION_HINT =
  "Abre el formulario para editar o eliminar este movimiento.";

/** Screen-reader summary and edit action for a movement card. */
export function getTransactionEditLabel(
  transaction: Transaction,
  categoryLabel: string,
  walletName?: string,
): string {
  const kind = transaction.type === "income" ? "ingreso" : "gasto";
  const parts = [
    `Editar ${kind}: ${transaction.concept}`,
    formatMoney(transaction.amount, transaction.currency),
    formatDateInput(transaction.date),
    categoryLabel,
  ];

  if (walletName) parts.push(walletName);

  return parts.join(", ");
}
