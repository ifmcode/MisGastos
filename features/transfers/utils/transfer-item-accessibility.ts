import { formatMoney } from "@/features/wallets/utils/money";
import { formatDateInput } from "@/shared/utils/date";

import { Transfer } from "../types/transfer.types";

export const EDIT_TRANSFER_HINT =
  "Abre el formulario para editar o eliminar esta transferencia.";

/** Screen-reader summary and edit action for a transfer card. */
export function getTransferEditLabel(
  transfer: Transfer,
  fromName: string,
  toName: string,
): string {
  return [
    `Editar transferencia: ${fromName} a ${toName}`,
    formatMoney(transfer.amount, transfer.currency),
    formatDateInput(transfer.date),
  ].join(", ");
}
