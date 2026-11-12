import type {
  LoginFieldErrors,
  LoginValidationCode,
} from "../schemas/login.schema";
import type { AuthFeedbackMessage } from "../types/auth.types";

export type LoginFieldName = "name" | "email" | "password";

export interface LoginFormState {
  name: string;
  email: string;
  password: string;
  isRegister: boolean;
  loading: boolean;
  fieldErrors: LoginFieldErrors;
  emailError: string | null;
  googleError: string | null;
  resetFeedback: AuthFeedbackMessage | null;
}

export const INITIAL_LOGIN_FORM_STATE: LoginFormState = {
  name: "",
  email: "",
  password: "",
  isRegister: false,
  loading: false,
  fieldErrors: {},
  emailError: null,
  googleError: null,
  resetFeedback: null,
};

export type LoginFormAction =
  | { type: "field-changed"; field: LoginFieldName; value: string }
  | { type: "mode-toggled" }
  | { type: "validation-failed"; errors: LoginFieldErrors }
  | { type: "request-started" }
  | { type: "request-finished" }
  | { type: "email-failed"; message: string }
  | { type: "google-failed"; message: string }
  | { type: "reset-invalid"; error: LoginValidationCode }
  | { type: "reset-succeeded"; message: string }
  | { type: "reset-failed"; message: string };

function clearActionFeedback(state: LoginFormState): LoginFormState {
  return {
    ...state,
    emailError: null,
    googleError: null,
    resetFeedback: null,
  };
}

export function loginFormReducer(
  state: LoginFormState,
  action: LoginFormAction,
): LoginFormState {
  switch (action.type) {
    case "field-changed": {
      const next = clearActionFeedback({
        ...state,
        [action.field]: action.value,
      });
      const fieldErrors = { ...next.fieldErrors };
      delete fieldErrors[action.field];

      return { ...next, fieldErrors };
    }

    case "mode-toggled":
      return {
        ...clearActionFeedback(state),
        isRegister: !state.isRegister,
        fieldErrors: {},
      };

    case "validation-failed":
      return {
        ...clearActionFeedback(state),
        loading: false,
        fieldErrors: action.errors,
      };

    case "request-started":
      return {
        ...clearActionFeedback(state),
        loading: true,
        fieldErrors: {},
      };

    case "request-finished":
      return { ...state, loading: false };

    case "email-failed":
      return { ...state, loading: false, emailError: action.message };

    case "google-failed":
      return { ...state, loading: false, googleError: action.message };

    case "reset-invalid":
      return {
        ...clearActionFeedback(state),
        loading: false,
        fieldErrors: { ...state.fieldErrors, email: action.error },
      };

    case "reset-succeeded":
      return {
        ...clearActionFeedback(state),
        loading: false,
        resetFeedback: { tone: "success", message: action.message },
      };

    case "reset-failed":
      return {
        ...clearActionFeedback(state),
        loading: false,
        resetFeedback: { tone: "error", message: action.message },
      };

    default:
      return state;
  }
}
