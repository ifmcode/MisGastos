import { Dispatch, SetStateAction, useCallback, useState } from "react";
import { useWallets } from "@/features/wallets/hooks/use-wallets";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";
import { useSingleFlightMutation } from "@/shared/hooks/use-single-flight-mutation";

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
  const { tr } = useScopedTranslation("transactions");
  const transactionService = useTransactionService();
  const { reload: reloadWallets } = useWallets();

  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationFieldErrors, setMutationFieldErrors] =
    useState<TransactionValidationErrors>({});

  const clearMutationState = useCallback(() => {
    setMutationError(null);
    setMutationFieldErrors({});
  }, []);

  const fail = useCallback(
    (failure: unknown): false => {
      const state = toTransactionMutationError(failure);
      setMutationError(state.code ? tr(`errors.${state.code}`) : null);
      setMutationFieldErrors(state.fieldErrors);
      return false;
    },
    [tr],
  );

  const unauthenticated = useCallback(
    (key: string) => setMutationError(tr(key)),
    [tr],
  );

  const afterSuccess = useCallback(() => {
    void reloadWallets();
  }, [reloadWallets]);

  const { mutating, run } = useSingleFlightMutation({
    ownerId,
    clear: clearMutationState,
    fail,
    unauthenticated,
    afterSuccess,
  });

  const createTransaction = useCallback(
    (input: TransactionInput) =>
      run(async (currentOwnerId) => {
        const result = await transactionService.createTransaction(
          currentOwnerId,
          input,
        );
        setTransactions((current) => [result.transaction, ...current]);
      }, "errors.SIGN_IN_CREATE"),
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
      }, "errors.SIGN_IN_EDIT"),
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
      }, "errors.SIGN_IN_DELETE"),
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
