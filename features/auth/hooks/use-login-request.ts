import { Dispatch, useRef } from "react";

import type { LoginFormAction } from "./login-form-reducer";

export interface LoginRequestRunner {
  runRequest: (
    action: () => Promise<unknown>,
    onSuccess: () => void,
    onFailure: (error: unknown) => void,
  ) => Promise<void>;
  isRequestInFlight: () => boolean;
}

/** Keeps auth requests single-flight while exposing loading state to the form. */
export function useLoginRequest(
  dispatch: Dispatch<LoginFormAction>,
): LoginRequestRunner {
  const inFlight = useRef(false);

  async function runRequest(
    action: () => Promise<unknown>,
    onSuccess: () => void,
    onFailure: (error: unknown) => void,
  ) {
    if (inFlight.current) {
      return;
    }

    inFlight.current = true;
    dispatch({ type: "request-started" });

    try {
      await action();
      onSuccess();
    } catch (error: unknown) {
      onFailure(error);
    } finally {
      inFlight.current = false;
    }
  }

  return {
    runRequest,
    isRequestInFlight: () => inFlight.current,
  };
}
