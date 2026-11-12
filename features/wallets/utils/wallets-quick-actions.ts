export type WalletsQuickActionKey = "transfer" | "history";

export interface WalletsQuickAction {
  key: WalletsQuickActionKey;
  label: string;
  accessibilityLabel: string;
  icon: "swap-horizontal" | "time-outline";
}

const transferAction: WalletsQuickAction = {
  key: "transfer",
  label: "Transferir",
  accessibilityLabel: "Nueva transferencia",
  icon: "swap-horizontal",
};

const historyAction: WalletsQuickAction = {
  key: "history",
  label: "Historial de transferencias",
  accessibilityLabel: "Ver historial de transferencias",
  icon: "time-outline",
};

/**
 * Quick actions shown above the wallet list. Transfer needs two active wallets
 * sharing a currency, so it disappears when the same rule used by the transfer
 * form makes it impossible. History is always available.
 */
export function getWalletsQuickActions(
  canTransfer: boolean,
): WalletsQuickAction[] {
  return canTransfer ? [transferAction, historyAction] : [historyAction];
}
