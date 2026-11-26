import { useCallback, useRef, useState } from "react";

export interface SingleFlightMutationOptions {
  ownerId: string | undefined;
  /** Resets the mutation error state before each attempt. */
  clear: () => void;
  /** Maps a failure to the UI state and returns the operation result. */
  fail: (failure: unknown) => boolean;
  /** Called with the translation key when there is no authenticated owner. */
  unauthenticated: (key: string) => void;
  /** Side effect after a successful operation (not awaited). */
  afterSuccess?: () => void;
}

export interface SingleFlightMutation {
  mutating: boolean;
  run: (
    operation: (ownerId: string) => Promise<void>,
    unauthenticatedKey: string,
  ) => Promise<boolean>;
}

/**
 * Serializes one mutation at a time. A second tap can arrive before `mutating`
 * re-renders the disabled button, so an in-flight ref rejects it and never
 * races two writes (in the offline path, two local transactions).
 */
export function useSingleFlightMutation({
  ownerId,
  clear,
  fail,
  unauthenticated,
  afterSuccess,
}: SingleFlightMutationOptions): SingleFlightMutation {
  const [mutating, setMutating] = useState(false);
  const inFlight = useRef(false);

  const run = useCallback(
    async (
      operation: (ownerId: string) => Promise<void>,
      unauthenticatedKey: string,
    ): Promise<boolean> => {
      if (!ownerId) {
        unauthenticated(unauthenticatedKey);
        return false;
      }

      if (inFlight.current) return false;

      inFlight.current = true;
      setMutating(true);
      clear();

      try {
        await operation(ownerId);
        afterSuccess?.();
        return true;
      } catch (failure: unknown) {
        return fail(failure);
      } finally {
        inFlight.current = false;
        setMutating(false);
      }
    },
    [ownerId, clear, fail, unauthenticated, afterSuccess],
  );

  return { mutating, run };
}
