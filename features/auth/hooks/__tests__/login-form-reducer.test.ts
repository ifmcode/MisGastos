import { describe, expect, it } from "@jest/globals";

import {
  INITIAL_LOGIN_FORM_STATE,
  loginFormReducer,
  LoginFormState,
} from "../login-form-reducer";

const stateWithFeedback: LoginFormState = {
  ...INITIAL_LOGIN_FORM_STATE,
  name: "Ada",
  email: "ada@example.com",
  password: "secret123",
  fieldErrors: { email: "Old email error" },
  emailError: "Old email error",
  googleError: "Old Google error",
  resetFeedback: { tone: "error", message: "Old reset error" },
};

describe("loginFormReducer", () => {
  it("updates the edited field and clears action feedback", () => {
    const state = loginFormReducer(stateWithFeedback, {
      type: "field-changed",
      field: "email",
      value: "new@example.com",
    });

    expect(state.email).toBe("new@example.com");
    expect(state.fieldErrors.email).toBeUndefined();
    expect(state.emailError).toBeNull();
    expect(state.googleError).toBeNull();
    expect(state.resetFeedback).toBeNull();
  });

  it("keeps errors from other fields when editing one field", () => {
    const state = loginFormReducer(
      {
        ...stateWithFeedback,
        fieldErrors: { email: "Email error", password: "Password error" },
      },
      { type: "field-changed", field: "email", value: "new@example.com" },
    );

    expect(state.fieldErrors.password).toBe("Password error");
  });

  it("toggles the mode and clears every error", () => {
    const state = loginFormReducer(stateWithFeedback, {
      type: "mode-toggled",
    });

    expect(state.isRegister).toBe(true);
    expect(state.fieldErrors).toEqual({});
    expect(state.emailError).toBeNull();
    expect(state.googleError).toBeNull();
    expect(state.resetFeedback).toBeNull();
  });

  it("stores validation errors without starting a request", () => {
    const state = loginFormReducer(stateWithFeedback, {
      type: "validation-failed",
      errors: { email: "Required", password: "Required" },
    });

    expect(state.loading).toBe(false);
    expect(state.fieldErrors).toEqual({
      email: "Required",
      password: "Required",
    });
    expect(state.emailError).toBeNull();
  });

  it("starts a request and clears previous feedback", () => {
    const state = loginFormReducer(stateWithFeedback, {
      type: "request-started",
    });

    expect(state.loading).toBe(true);
    expect(state.name).toBe("Ada");
    expect(state.email).toBe("ada@example.com");
    expect(state.fieldErrors).toEqual({});
    expect(state.emailError).toBeNull();
    expect(state.googleError).toBeNull();
    expect(state.resetFeedback).toBeNull();
  });

  it("finishes a successful request", () => {
    const state = loginFormReducer(
      { ...INITIAL_LOGIN_FORM_STATE, loading: true },
      { type: "request-finished" },
    );

    expect(state.loading).toBe(false);
  });

  it("shows email failures above the email action", () => {
    const state = loginFormReducer(
      { ...INITIAL_LOGIN_FORM_STATE, loading: true },
      { type: "email-failed", message: "Wrong credentials" },
    );

    expect(state.loading).toBe(false);
    expect(state.emailError).toBe("Wrong credentials");
    expect(state.googleError).toBeNull();
  });

  it("shows Google failures above the Google action", () => {
    const state = loginFormReducer(
      { ...INITIAL_LOGIN_FORM_STATE, loading: true },
      { type: "google-failed", message: "Popup closed" },
    );

    expect(state.loading).toBe(false);
    expect(state.googleError).toBe("Popup closed");
    expect(state.emailError).toBeNull();
  });

  it("shows an invalid reset email as a field error", () => {
    const state = loginFormReducer(stateWithFeedback, {
      type: "reset-invalid",
      error: "Ingresa tu correo electrónico.",
    });

    expect(state.loading).toBe(false);
    expect(state.fieldErrors.email).toBe("Ingresa tu correo electrónico.");
    expect(state.resetFeedback).toBeNull();
  });

  it("shows password-reset success", () => {
    const state = loginFormReducer(
      { ...INITIAL_LOGIN_FORM_STATE, loading: true },
      { type: "reset-succeeded", message: "Email sent" },
    );

    expect(state.loading).toBe(false);
    expect(state.resetFeedback).toEqual({
      tone: "success",
      message: "Email sent",
    });
  });

  it("shows password-reset failures", () => {
    const state = loginFormReducer(
      { ...INITIAL_LOGIN_FORM_STATE, loading: true },
      { type: "reset-failed", message: "Try later" },
    );

    expect(state.loading).toBe(false);
    expect(state.resetFeedback).toEqual({
      tone: "error",
      message: "Try later",
    });
  });
});
