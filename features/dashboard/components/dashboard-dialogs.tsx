import type { Category } from "@/features/categories/types/category.types";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import type { CurrencyCode } from "@/shared/constants/currencies";

import type {
  DashboardMovementDialogs,
  DashboardMovementMutations,
} from "../hooks/use-dashboard-movement-dialogs";
import type {
  DashboardTransferDialogs,
  DashboardTransferMutations,
} from "../hooks/use-dashboard-transfer-dialogs";
import { DashboardMovementModals } from "./dashboard-movement-modals";
import { DashboardTransferModals } from "./dashboard-transfer-modals";

export interface DashboardDialogsProps {
  transferDialogs: DashboardTransferDialogs;
  transferState: DashboardTransferMutations;
  movementDialogs: DashboardMovementDialogs;
  movementMutations: DashboardMovementMutations;
  /** Every wallet, including archived ones, for the detail labels. */
  wallets: readonly Wallet[];
  /** Active wallets only: the forms never select an archived wallet. */
  activeWallets: Wallet[];
  categories: readonly Category[];
  preferredCurrency: CurrencyCode;
  onCategoryCreated: (category: Category) => void;
}

/** Detail and form dialogs of the dashboard, grouped for the screen. */
export function DashboardDialogs({
  transferDialogs,
  transferState,
  movementDialogs,
  movementMutations,
  wallets,
  activeWallets,
  categories,
  preferredCurrency,
  onCategoryCreated,
}: DashboardDialogsProps) {
  return (
    <>
      <DashboardTransferModals
        dialogs={transferDialogs}
        state={transferState}
        wallets={wallets}
        activeWallets={activeWallets}
        preferredCurrency={preferredCurrency}
      />

      <DashboardMovementModals
        dialogs={movementDialogs}
        mutations={movementMutations}
        wallets={wallets}
        activeWallets={activeWallets}
        categories={categories}
        preferredCurrency={preferredCurrency}
        onCategoryCreated={onCategoryCreated}
      />
    </>
  );
}
