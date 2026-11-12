export type WalletsQuickActionKey = "transfer" | "history";

export interface WalletsQuickAction {
  key: WalletsQuickActionKey;
  labelKey: string;
  accessibilityKey: string;
  icon: "swap-horizontal" | "time-outline";
}

const transferAction: WalletsQuickAction = {
  key: "transfer",
  labelKey: "quick.transfer",
  accessibilityKey: "quick.transferAccessibility",
  icon: "swap-horizontal",
};

const historyAction: WalletsQuickAction = {
  key: "history",
  labelKey: "quick.history",
  accessibilityKey: "quick.historyAccessibility",
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
