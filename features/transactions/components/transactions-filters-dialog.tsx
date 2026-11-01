import { Modal } from "react-native";

import { Category } from "@/features/categories/types/category.types";
import { Wallet } from "@/features/wallets/types/wallet.types";

import { TransactionFilters } from "../utils/transaction-filters";
import { TransactionFiltersModal } from "./transaction-filters-modal";

export interface TransactionsFiltersDialogProps {
  visible: boolean;
  wallets: Wallet[];
  categories: readonly Category[];
  filters: TransactionFilters;
  onApply: (filters: TransactionFilters) => void;
  onReset: () => void;
  onClose: () => void;
}

export function TransactionsFiltersDialog({
  visible,
  wallets,
  categories,
  filters,
  onApply,
  onReset,
  onClose,
}: TransactionsFiltersDialogProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      {visible ? (
        <TransactionFiltersModal
          wallets={wallets}
          categories={categories}
          filters={filters}
          onApply={onApply}
          onReset={onReset}
          onCancel={onClose}
        />
      ) : null}
    </Modal>
  );
}
