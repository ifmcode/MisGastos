import { useTranslation } from "react-i18next";

import { useConfirmDialog } from "@/shared/hooks/use-confirm-dialog";

import { WalletInput } from "../schemas/wallet.schema";
import { DeleteWalletOptions, Wallet } from "../types/wallet.types";
import { isWalletArchived } from "../utils/wallet-status";
import {
  useWalletManagement,
  WalletManagement,
} from "./use-wallet-management";
import { useWallets, UseWalletsResult } from "./use-wallets";

export interface WalletScreenController {
  wallets: UseWalletsResult;
  management: WalletManagement;
  archiveDialog: ReturnType<typeof useConfirmDialog>;
  canAddWallet: boolean;
  showScreenError: boolean;
  openCreate: () => void;
  openActions: (wallet: Wallet) => void;
  openEdit: (wallet: Wallet) => void;
  openDelete: (wallet: Wallet) => void;
  requestArchiveToggle: () => void;
  submitForm: (input: WalletInput) => Promise<void>;
  confirmDelete: (options: DeleteWalletOptions) => Promise<void>;
  closeForm: () => void;
  closeDelete: () => void;
}

/** Coordinates wallet data, modal lifecycle and user actions for the screen. */
export function useWalletScreen(): WalletScreenController {
  const { t } = useTranslation("wallets");
  const wallets = useWallets();
  const management = useWalletManagement({
    getWalletUsage: wallets.getWalletUsage,
  });
  const archiveDialog = useConfirmDialog();

  const canAddWallet = !wallets.loading && !wallets.error && wallets.wallets.length > 0;

  function openCreate() {
    wallets.clearMutationState();
    management.openCreate();
  }

  function openActions(wallet: Wallet) {
    wallets.clearMutationState();
    management.openActions(wallet);
  }

  function openEdit(wallet: Wallet) {
    wallets.clearMutationState();
    management.openEdit(wallet);
  }

  function openDelete(wallet: Wallet) {
    wallets.clearMutationState();
    management.openDelete(wallet);
  }

  function requestArchiveToggle() {
    const wallet = management.actionsWallet;
    if (!wallet) return;

    const archived = isWalletArchived(wallet);
    management.closeActions();
    wallets.clearMutationState();

    archiveDialog.open({
      title: archived
        ? t("archiveDialog.restoreTitle")
        : t("archiveDialog.archiveTitle"),
      message: archived
        ? t("archiveDialog.restoreMessage", { name: wallet.name })
        : t("archiveDialog.archiveMessage", { name: wallet.name }),
      confirmLabel: archived
        ? t("actions.restore")
        : t("actions.archive"),
      onConfirm: () => void wallets.setArchived(wallet.id, !archived),
    });
  }

  async function submitForm(input: WalletInput) {
    const editing =
      management.formMode === "edit" ? management.editingWallet : null;
    const saved = editing
      ? await wallets.updateWallet(editing.id, input)
      : await wallets.createWallet(input);

    if (saved) management.closeForm();
  }

  async function confirmDelete(options: DeleteWalletOptions) {
    if (!management.deleteTarget) return;

    const deleted = await wallets.deleteWallet(
      management.deleteTarget.id,
      options,
    );
    if (deleted) management.closeDelete();
  }

  function closeForm() {
    if (!wallets.mutating) management.closeForm();
  }

  function closeDelete() {
    if (!wallets.mutating) management.closeDelete();
  }

  const showScreenError =
    wallets.mutationError !== null &&
    management.formMode === null &&
    management.deleteTarget === null;

  return {
    wallets,
    management,
    archiveDialog,
    canAddWallet,
    showScreenError,
    openCreate,
    openActions,
    openEdit,
    openDelete,
    requestArchiveToggle,
    submitForm,
    confirmDelete,
    closeForm,
    closeDelete,
  };
}
