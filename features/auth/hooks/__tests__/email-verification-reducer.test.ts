import { describe, expect, it } from "@jest/globals";

import {
  emailVerificationReducer,
  INITIAL_EMAIL_VERIFICATION_STATE,
} from "../email-verification-reducer";

describe("emailVerificationReducer", () => {
  it("marks the resend request as loading and clears old feedback", () => {
    const state = emailVerificationReducer(
      {
        ...INITIAL_EMAIL_VERIFICATION_STATE,
        feedback: { tone: "error", message: "Old error" },
      },
      { type: "resend-started" },
    );

    expect(state.sending).toBe(true);
    expect(state.feedback).toBeNull();
  });

  it("reports resend success", () => {
    const state = emailVerificationReducer(
      { ...INITIAL_EMAIL_VERIFICATION_STATE, sending: true },
      { type: "resend-succeeded", message: "Email sent" },
    );

    expect(state.sending).toBe(false);
    expect(state.feedback).toEqual({ tone: "success", message: "Email sent" });
  });

  it("reports resend failures", () => {
    const state = emailVerificationReducer(
      { ...INITIAL_EMAIL_VERIFICATION_STATE, sending: true },
      { type: "resend-failed", message: "Too many requests" },
    );

    expect(state.sending).toBe(false);
    expect(state.feedback).toEqual({
      tone: "error",
      message: "Too many requests",
    });
  });

  it("tracks the manual status refresh", () => {
    const started = emailVerificationReducer(
      INITIAL_EMAIL_VERIFICATION_STATE,
      { type: "check-started" },
    );

    expect(started.checking).toBe(true);
    expect(started.feedback).toBeNull();

    const pending = emailVerificationReducer(started, {
      type: "check-pending",
      message: "Not yet",
    });

    expect(pending.checking).toBe(false);
    expect(pending.feedback).toEqual({ tone: "error", message: "Not yet" });
  });

  it("reports a verified address", () => {
    const state = emailVerificationReducer(
      { ...INITIAL_EMAIL_VERIFICATION_STATE, checking: true },
      { type: "check-verified", message: "Verified" },
    );

    expect(state.checking).toBe(false);
    expect(state.feedback).toEqual({ tone: "success", message: "Verified" });
  });

  it("reports status-check failures", () => {
    const state = emailVerificationReducer(
      { ...INITIAL_EMAIL_VERIFICATION_STATE, checking: true },
      { type: "check-failed", message: "Network error" },
    );

    expect(state.checking).toBe(false);
    expect(state.feedback).toEqual({ tone: "error", message: "Network error" });
  });
});
