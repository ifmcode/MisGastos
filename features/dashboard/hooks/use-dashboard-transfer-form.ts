import { useState } from "react";

import { TransferInput } from "@/features/transfers/schemas/transfer.schema";
import { Transfer } from "@/features/transfers/types/transfer.types";
import { Wallet } from "@/features/wallets/types/wallet.types";

import { showDeleteTransferDialog } from "../utils/transfer-delete-dialog";

export interface UseDashboardTransferFormOptions {
  walletMap: ReadonlyMap<string, Wallet>;
  mutating: boolean;
  createTransfer: (input: TransferInput) => Promise<boolean>;
  updateTransfer: (
    transferId: string,
    input: TransferInput,
  ) => Promise<boolean>;
  deleteTransfer: (transferId: string) => Promise<boolean>;
  clearCreateState: () => void;
  onWalletsChanged: () => void;
}

export interface DashboardTransferForm {
  visible: boolean;
  editingTransfer: Transfer | null;
  openCreate: () => void;
  openEdit: (transfer: Transfer) => void;
  close: () => void;
  submit: (input: TransferInput) => Promise<void>;
  requestDelete: () => void;
}

/** Owns the open/edit/delete lifecycle of the dashboard transfer modal. */
export function useDashboardTransferForm({
  walletMap,
  mutating,
  createTransfer,
  updateTransfer,
  deleteTransfer,
  clearCreateState,
  onWalletsChanged,
}: UseDashboardTransferFormOptions): DashboardTransferForm {
  const [visible, setVisible] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);

  function finish() {
    setVisible(false);
    setEditingTransfer(null);
    onWalletsChanged();
  }

  function openCreate() {
    clearCreateState();
    setEditingTransfer(null);
    setVisible(true);
  }

  function openEdit(transfer: Transfer) {
    clearCreateState();
    setEditingTransfer(transfer);
    setVisible(true);
  }

  function close() {
    if (mutating) return;
    setVisible(false);
    setEditingTransfer(null);
  }

  async function submit(input: TransferInput) {
    const saved = editingTransfer
      ? await updateTransfer(editingTransfer.id, input)
      : await createTransfer(input);

    if (!saved) return;

    finish();
  }

  function requestDelete() {
    if (!editingTransfer) return;

    showDeleteTransferDialog({
      transfer: editingTransfer,
      walletMap,
      onConfirm: async () => {
        const deleted = await deleteTransfer(editingTransfer.id);
        if (!deleted) return;
        finish();
      },
    });
  }

  return {
    visible,
    editingTransfer,
    openCreate,
    openEdit,
    close,
    submit,
    requestDelete,
  };
}
