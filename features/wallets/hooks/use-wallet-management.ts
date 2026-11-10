import { useCallback, useRef, useState } from "react";

import { Wallet, WalletUsage } from "../types/wallet.types";

export type WalletFormMode = "create" | "edit";

export interface UseWalletManagementOptions {
  getWalletUsage: (walletId: string) => Promise<WalletUsage | null>;
}

export interface WalletManagement {
  formMode: WalletFormMode | null;
  editingWallet: Wallet | null;
  editingUsage: WalletUsage | null;
  usageLoading: boolean;
  actionsWallet: Wallet | null;
  deleteTarget: Wallet | null;
  deleteUsage: WalletUsage | null;
  openCreate: () => void;
  openActions: (wallet: Wallet) => void;
  closeActions: () => void;
  openEdit: (wallet: Wallet) => void;
  openDelete: (wallet: Wallet) => void;
  closeForm: () => void;
  closeDelete: () => void;
}

/** Owns the wallet actions/form/delete modal lifecycle and usage lookups. */
export function useWalletManagement({
  getWalletUsage,
}: UseWalletManagementOptions): WalletManagement {
  const [formMode, setFormMode] = useState<WalletFormMode | null>(null);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [editingUsage, setEditingUsage] = useState<WalletUsage | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [actionsWallet, setActionsWallet] = useState<Wallet | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Wallet | null>(null);
  const [deleteUsage, setDeleteUsage] = useState<WalletUsage | null>(null);
  const requestRef = useRef(0);
  const deleteRequestRef = useRef(0);

  const loadUsage = useCallback(
    async (wallet: Wallet): Promise<WalletUsage | null> => {
      requestRef.current += 1;
      const request = requestRef.current;
      setUsageLoading(true);

      const usage = await getWalletUsage(wallet.id);
      if (requestRef.current === request) {
        setEditingUsage(usage);
        setUsageLoading(false);
      }

      return usage;
    },
    [getWalletUsage],
  );

  const openCreate = useCallback(() => {
    setEditingWallet(null);
    setEditingUsage(null);
    setFormMode("create");
  }, []);

  const openActions = useCallback((wallet: Wallet) => {
    setActionsWallet(wallet);
  }, []);

  const closeActions = useCallback(() => setActionsWallet(null), []);

  const openEdit = useCallback(
    (wallet: Wallet) => {
      setActionsWallet(null);
      setEditingWallet(wallet);
      setEditingUsage(null);
      setFormMode("edit");
      void loadUsage(wallet);
    },
    [loadUsage],
  );

  const openDelete = useCallback(
    (wallet: Wallet) => {
      setActionsWallet(null);
      setDeleteTarget(wallet);
      setDeleteUsage(null);
      deleteRequestRef.current += 1;
      const request = deleteRequestRef.current;

      void (async () => {
        const usage = await getWalletUsage(wallet.id);
        if (deleteRequestRef.current === request) {
          setDeleteUsage(usage);
        }
      })();
    },
    [getWalletUsage],
  );

  const closeForm = useCallback(() => {
    setFormMode(null);
    setEditingWallet(null);
    setEditingUsage(null);
  }, []);

  const closeDelete = useCallback(() => {
    deleteRequestRef.current += 1;
    setDeleteTarget(null);
    setDeleteUsage(null);
  }, []);

  return {
    formMode,
    editingWallet,
    editingUsage,
    usageLoading,
    actionsWallet,
    deleteTarget,
    deleteUsage,
    openCreate,
    openActions,
    closeActions,
    openEdit,
    openDelete,
    closeForm,
    closeDelete,
  };
}
