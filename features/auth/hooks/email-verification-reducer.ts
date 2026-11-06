import type { AuthFeedbackMessage } from "../types/auth.types";

export interface EmailVerificationState {
  sending: boolean;
  checking: boolean;
  feedback: AuthFeedbackMessage | null;
}

export const INITIAL_EMAIL_VERIFICATION_STATE: EmailVerificationState = {
  sending: false,
  checking: false,
  feedback: null,
};

export type EmailVerificationAction =
  | { type: "resend-started" }
  | { type: "resend-succeeded"; message: string }
  | { type: "resend-failed"; message: string }
  | { type: "check-started" }
  | { type: "check-verified"; message: string }
  | { type: "check-pending"; message: string }
  | { type: "check-failed"; message: string };

export function emailVerificationReducer(
  state: EmailVerificationState,
  action: EmailVerificationAction,
): EmailVerificationState {
  switch (action.type) {
    case "resend-started":
      return { ...state, sending: true, feedback: null };

    case "resend-succeeded":
      return {
        ...state,
        sending: false,
        feedback: { tone: "success", message: action.message },
      };

    case "resend-failed":
      return {
        ...state,
        sending: false,
        feedback: { tone: "error", message: action.message },
      };

    case "check-started":
      return { ...state, checking: true, feedback: null };

    case "check-verified":
      return {
        ...state,
        checking: false,
        feedback: { tone: "success", message: action.message },
      };

    case "check-pending":
      return {
        ...state,
        checking: false,
        feedback: { tone: "error", message: action.message },
      };

    case "check-failed":
      return {
        ...state,
        checking: false,
        feedback: { tone: "error", message: action.message },
      };

    default:
      return state;
  }
}
