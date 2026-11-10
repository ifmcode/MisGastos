import { useCallback, useState } from "react";

import { WalletValidationErrors } from "../schemas/wallet.schema";
import {
  getWalletErrorMessage,
  WalletValidationError,
} from "../services/wallet.errors";

export interface WalletMutationState {
  mutating: boolean;
  mutationError: string | null;
  mutationFieldErrors: WalletValidationErrors;
  clearMutationState: () => void;
  reportMutationError: (failure: unknown, fallback: string) => void;
  runMutation: (
    operation: (ownerId: string) => Promise<void>,
    fallback: string,
    unauthenticatedMessage: string,
  ) => Promise<boolean>;
}

/** Owns the loading/error state shared by every wallet mutation. */
export function useWalletMutationState(
  ownerId: string | undefined,
): WalletMutationState {
  const [mutating, setMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationFieldErrors, setMutationFieldErrors] =
    useState<WalletValidationErrors>({});

  const clearMutationState = useCallback(() => {
    setMutationError(null);
    setMutationFieldErrors({});
  }, []);

  const reportMutationError = useCallback(
    (failure: unknown, fallback: string) => {
      setMutationError(getWalletErrorMessage(failure, fallback));
    },
    [],
  );

  const runMutation = useCallback(
    async (
      operation: (currentOwnerId: string) => Promise<void>,
      fallback: string,
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
        return true;
      } catch (failure: unknown) {
        if (failure instanceof WalletValidationError) {
          setMutationFieldErrors(failure.fieldErrors);
        }
        setMutationError(getWalletErrorMessage(failure, fallback));
        return false;
      } finally {
        setMutating(false);
      }
    },
    [ownerId, clearMutationState],
  );

  return {
    mutating,
    mutationError,
    mutationFieldErrors,
    clearMutationState,
    reportMutationError,
    runMutation,
  };
}
