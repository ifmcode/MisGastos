import { useReducer } from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getLoginEmailError, validateLoginForm } from "../schemas/login.schema";
import type { LoginFieldErrors } from "../schemas/login.schema";
import { getAuthErrorCode } from "../services/auth.errors";
import type { AuthFeedbackMessage, Email } from "../types/auth.types";
import {
  INITIAL_LOGIN_FORM_STATE,
  loginFormReducer,
} from "./login-form-reducer";
import { useAuthService } from "./use-auth-service";
import { useLoginRequest } from "./use-login-request";

export interface LoginForm {
  email: string;
  password: string;
  name: string;
  loading: boolean;
  isRegister: boolean;
  fieldErrors: LoginFieldErrors;
  emailError: string | null;
  googleError: string | null;
  resetFeedback: AuthFeedbackMessage | null;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setName: (name: string) => void;
  toggleMode: () => void;
  submit: () => Promise<void>;
  googleLogin: () => Promise<void>;
  resetPassword: () => Promise<void>;
}

/** Owns the login/register fields, inline feedback and the auth flows. */
export function useLoginForm(): LoginForm {
  const authService = useAuthService();
  const { t, tr } = useScopedTranslation("auth");
  const [state, dispatch] = useReducer(
    loginFormReducer,
    INITIAL_LOGIN_FORM_STATE,
  );
  const { runRequest, isRequestInFlight } = useLoginRequest(dispatch);

  function translateError(code: string): string {
    return tr(`errors.${code}`);
  }

  async function submit() {
    if (isRequestInFlight()) {
      return;
    }

    const errors = validateLoginForm({
      name: state.name,
      email: state.email,
      password: state.password,
      isRegister: state.isRegister,
    });

    if (Object.keys(errors).length > 0) {
      dispatch({ type: "validation-failed", errors });
      return;
    }

    const email = state.email.trim() as Email;
    const fallback = state.isRegister ? "createFailed" : "signInFailed";

    await runRequest(
      () =>
        state.isRegister
          ? authService.register(state.name.trim(), email, state.password)
          : authService.signInWithEmail(email, state.password),
      () => dispatch({ type: "request-finished" }),
      (error) =>
        dispatch({
          type: "email-failed",
          message: translateError(getAuthErrorCode(error, fallback)),
        }),
    );
  }

  async function googleLogin() {
    await runRequest(
      () => authService.signInWithGoogle(),
      () => dispatch({ type: "request-finished" }),
      (error) =>
        dispatch({
          type: "google-failed",
          message: translateError(getAuthErrorCode(error, "googleFailed")),
        }),
    );
  }

  async function resetPassword() {
    if (isRequestInFlight()) {
      return;
    }

    const emailError = getLoginEmailError(state.email);

    if (emailError) {
      dispatch({ type: "reset-invalid", error: emailError });
      return;
    }

    const email = state.email.trim() as Email;

    await runRequest(
      () => authService.resetPassword(email),
      () =>
        dispatch({
          type: "reset-succeeded",
          message: t("login.resetSent"),
        }),
      (error) =>
        dispatch({
          type: "reset-failed",
          message: translateError(getAuthErrorCode(error, "resetFailed")),
        }),
    );
  }

  function setEmail(email: string) {
    dispatch({ type: "field-changed", field: "email", value: email });
  }

  function setPassword(password: string) {
    dispatch({ type: "field-changed", field: "password", value: password });
  }

  function setName(name: string) {
    dispatch({ type: "field-changed", field: "name", value: name });
  }

  function toggleMode() {
    if (isRequestInFlight()) {
      return;
    }

    dispatch({ type: "mode-toggled" });
  }

  return {
    email: state.email,
    password: state.password,
    name: state.name,
    loading: state.loading,
    isRegister: state.isRegister,
    fieldErrors: state.fieldErrors,
    emailError: state.emailError,
    googleError: state.googleError,
    resetFeedback: state.resetFeedback,
    setEmail,
    setPassword,
    setName,
    toggleMode,
    submit,
    googleLogin,
    resetPassword,
  };
}
