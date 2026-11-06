import { useCallback, useEffect, useReducer, useRef } from "react";

import { useAuth } from "@/hooks/use-auth";

import { getAuthErrorMessage } from "../services/auth.errors";
import type { AuthFeedbackMessage } from "../types/auth.types";
import { needsEmailVerification } from "../utils/email-verification";
import { consumePendingVerificationEmail } from "../utils/verification-email-store";
import {
  emailVerificationReducer,
  INITIAL_EMAIL_VERIFICATION_STATE,
} from "./email-verification-reducer";
import { useEmailVerificationService } from "./use-email-verification-service";

export const VERIFICATION_POLL_INTERVAL_MS = 10_000;
export const VERIFICATION_MAX_POLLS = 6;
const RESEND_FALLBACK =
  "No pudimos enviar el correo de verificación. Inténtalo de nuevo.";
const CHECK_FALLBACK =
  "No pudimos comprobar el estado. Inténtalo de nuevo.";
const PENDING_MESSAGE =
  "Todavía no detectamos la verificación. Abre el enlace del correo y vuelve a intentarlo.";
const VERIFIED_MESSAGE = "Tu correo está verificado. Entrando a la app...";

export interface EmailVerificationController {
  sending: boolean;
  checking: boolean;
  feedback: AuthFeedbackMessage | null;
  resend: () => Promise<void>;
  checkStatus: () => Promise<void>;
}

/** Orchestrates resend, manual status refresh and controlled polling. */
export function useEmailVerification(): EmailVerificationController {
  const { user, refreshUser } = useAuth();
  const service = useEmailVerificationService();
  const [state, dispatch] = useReducer(
    emailVerificationReducer,
    INITIAL_EMAIL_VERIFICATION_STATE,
  );
  const sendingRef = useRef(false);
  const checkingRef = useRef(false);
  const needsVerification = needsEmailVerification(user);
  const userId = user?.uid;

  const resend = useCallback(async () => {
    if (sendingRef.current) {
      return;
    }

    sendingRef.current = true;
    dispatch({ type: "resend-started" });

    try {
      const result = await service.requestEmail(user);

      if (result === "sent") {
        dispatch({
          type: "resend-succeeded",
          message: `Te enviamos un enlace de verificación a ${user?.email ?? "tu correo"}.`,
        });
      } else {
        dispatch({
          type: "resend-failed",
          message: "Esta cuenta no necesita verificación.",
        });
      }
    } catch (error: unknown) {
      dispatch({
        type: "resend-failed",
        message: getAuthErrorMessage(error, RESEND_FALLBACK),
      });
    } finally {
      sendingRef.current = false;
    }
  }, [service, user]);

  const checkStatus = useCallback(
    async (showFeedback = true) => {
      if (checkingRef.current) {
        return;
      }

      checkingRef.current = true;

      if (showFeedback) {
        dispatch({ type: "check-started" });
      }

      try {
        const updated = await refreshUser();

        if (updated && !needsEmailVerification(updated)) {
          dispatch({ type: "check-verified", message: VERIFIED_MESSAGE });
        } else if (showFeedback) {
          dispatch({ type: "check-pending", message: PENDING_MESSAGE });
        }
      } catch (error: unknown) {
        if (showFeedback) {
          dispatch({
            type: "check-failed",
            message: getAuthErrorMessage(error, CHECK_FALLBACK),
          });
        }
      } finally {
        checkingRef.current = false;
      }
    },
    [refreshUser],
  );

  useEffect(() => {
    if (!user || !needsVerification) {
      return;
    }

    if (!consumePendingVerificationEmail(user.uid)) {
      return;
    }

    void resend();
  }, [needsVerification, resend, user]);

  useEffect(() => {
    if (!userId || !needsVerification) {
      return;
    }

    let attempts = 0;
    const interval = setInterval(() => {
      if (attempts >= VERIFICATION_MAX_POLLS) {
        clearInterval(interval);
        return;
      }

      attempts += 1;
      void checkStatus(false);
    }, VERIFICATION_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [checkStatus, needsVerification, userId]);

  return {
    sending: state.sending,
    checking: state.checking,
    feedback: state.feedback,
    resend,
    checkStatus: () => checkStatus(),
  };
}
