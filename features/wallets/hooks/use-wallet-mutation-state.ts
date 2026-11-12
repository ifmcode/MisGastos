import { useCallback, useState } from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { WalletValidationErrors } from "../schemas/wallet.schema";
import {
  getWalletErrorCode,
  type WalletErrorCode,
  WalletValidationError,
} from "../services/wallet.errors";

export interface WalletMutationState {
  mutating: boolean;
  mutationError: string | null;
  mutationFieldErrors: WalletValidationErrors;
  clearMutationState: () => void;
  reportMutationError: (failure: unknown, fallback: WalletErrorCode) => void;
  runMutation: (
    operation: (ownerId: string) => Promise<void>,
    fallback: WalletErrorCode,
    unauthenticated: WalletErrorCode,
  ) => Promise<boolean>;
}

/** Owns the loading/error state shared by every wallet mutation. */
export function useWalletMutationState(
  ownerId: string | undefined,
): WalletMutationState {
  const { tr } = useScopedTranslation("wallets");
  const [mutating, setMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationFieldErrors, setMutationFieldErrors] =
    useState<WalletValidationErrors>({});

  const translate = useCallback(
    (code: WalletErrorCode) => tr(`errors.${code}`),
    [tr],
  );

  const clearMutationState = useCallback(() => {
    setMutationError(null);
    setMutationFieldErrors({});
  }, []);

  const reportMutationError = useCallback(
    (failure: unknown, fallback: WalletErrorCode) => {
      setMutationError(translate(getWalletErrorCode(failure, fallback)));
    },
    [translate],
  );

  const runMutation = useCallback(
    async (
      operation: (currentOwnerId: string) => Promise<void>,
      fallback: WalletErrorCode,
      unauthenticated: WalletErrorCode,
    ): Promise<boolean> => {
      if (!ownerId) {
        setMutationError(translate(unauthenticated));
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
        setMutationError(translate(getWalletErrorCode(failure, fallback)));
        return false;
      } finally {
        setMutating(false);
      }
    },
    [ownerId, clearMutationState, translate],
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
