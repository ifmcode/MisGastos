import {
  Dispatch,
  SetStateAction,
  useCallback,
  useState,
} from "react";

import { useWallets } from "@/features/wallets/hooks/use-wallets";

import {
  TransactionInput,
  TransactionValidationErrors,
} from "../schemas/transaction.schema";
import { Transaction } from "../types/transaction.types";
import { toTransactionMutationError } from "../utils/transaction-mutation-error";
import { useTransactionService } from "./use-transaction-service";

export interface UseTransactionMutationsOptions {
  ownerId: string | undefined;
  setTransactions: Dispatch<SetStateAction<Transaction[]>>;
}

export interface TransactionMutations {
  mutating: boolean;
  mutationError: string | null;
  mutationFieldErrors: TransactionValidationErrors;
  clearMutationState: () => void;
  createTransaction: (input: TransactionInput) => Promise<boolean>;
  updateTransaction: (
    transactionId: string,
    input: TransactionInput,
  ) => Promise<boolean>;
  deleteTransaction: (transactionId: string) => Promise<boolean>;
}

/** Owns the create/update/delete flows and their error state. */
export function useTransactionMutations({
  ownerId,
  setTransactions,
}: UseTransactionMutationsOptions): TransactionMutations {
  const transactionService = useTransactionService();
  const { reload: reloadWallets } = useWallets();

  const [mutating, setMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationFieldErrors, setMutationFieldErrors] =
    useState<TransactionValidationErrors>({});

  const clearMutationState = useCallback(() => {
    setMutationError(null);
    setMutationFieldErrors({});
  }, []);

  const fail = useCallback((failure: unknown): false => {
    const state = toTransactionMutationError(failure);
    setMutationError(state.message);
    setMutationFieldErrors(state.fieldErrors);
    return false;
  }, []);

  const run = useCallback(
    async (
      operation: (ownerId: string) => Promise<void>,
      unauthenticatedMessage: string,
    ): Promise<boolean> => {
      if (!ownerId) {
        setMutationError(unauthenticatedMessage);
        return false;
      }

      setMutating(true);
      clearMutationState();

      try {
        await operation(ownerId);
        void reloadWallets();
        return true;
      } catch (failure: unknown) {
        return fail(failure);
      } finally {
        setMutating(false);
      }
    },
    [ownerId, clearMutationState, fail, reloadWallets],
  );

  const createTransaction = useCallback(
    (input: TransactionInput) =>
      run(async (currentOwnerId) => {
        const result = await transactionService.createTransaction(
          currentOwnerId,
          input,
        );
        setTransactions((current) => [result.transaction, ...current]);
      }, "Debes iniciar sesión para crear un movimiento."),
    [run, transactionService, setTransactions],
  );

  const updateTransaction = useCallback(
    (transactionId: string, input: TransactionInput) =>
      run(async (currentOwnerId) => {
        const result = await transactionService.updateTransaction(
          currentOwnerId,
          transactionId,
          input,
        );
        setTransactions((current) =>
          current.map((transaction) =>
            transaction.id === transactionId
              ? result.transaction
              : transaction,
          ),
        );
      }, "Debes iniciar sesión para editar un movimiento."),
    [run, transactionService, setTransactions],
  );

  const deleteTransaction = useCallback(
    (transactionId: string) =>
      run(async (currentOwnerId) => {
        await transactionService.deleteTransaction(
          currentOwnerId,
          transactionId,
        );
        setTransactions((current) =>
          current.filter((transaction) => transaction.id !== transactionId),
        );
      }, "Debes iniciar sesión para eliminar un movimiento."),
    [run, transactionService, setTransactions],
  );

  return {
    mutating,
    mutationError,
    mutationFieldErrors,
    clearMutationState,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
