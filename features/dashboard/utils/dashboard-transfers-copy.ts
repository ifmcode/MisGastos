export const TRANSFER_EMPTY_GUIDANCE =
  "Abre Carteras y pulsa Transferir para mover dinero entre tus carteras.";

export const TRANSFER_EMPTY_REQUIREMENT =
  "Necesitas al menos dos carteras con la misma moneda.";

/** Points the dashboard empty state to the transfer action's new home. */
export function getTransfersEmptyMessage(canTransfer: boolean): string {
  return canTransfer ? TRANSFER_EMPTY_GUIDANCE : TRANSFER_EMPTY_REQUIREMENT;
}
