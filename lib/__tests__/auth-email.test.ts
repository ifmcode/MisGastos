import type { Email } from "@/shared/types/email.types";
import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firebase mocks are registered before the auth helpers.
import {
  mockAddDoc,
  mockCreateUserWithEmailAndPassword,
  mockSendPasswordResetEmail,
  mockSignInWithEmailAndPassword,
  setupAuthMocks,
} from "./auth.test-helpers";
import {
  logInWithEmailAndPassword,
  registerWithEmailAndPassword,
  sendPasswordReset,
} from "../auth";

beforeEach(setupAuthMocks);

describe("logInWithEmailAndPassword", () => {
  it("should call signInWithEmailAndPassword", async () => {
    mockSignInWithEmailAndPassword.mockResolvedValue({});
    const email = "user@example.com" as Email;

    await logInWithEmailAndPassword(email, "password123");

    expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
      { currentUser: null },
      email,
      "password123",
    );
  });

  it("should handle errors gracefully", async () => {
    mockSignInWithEmailAndPassword.mockRejectedValue(
      new Error("Invalid credentials"),
    );

    await logInWithEmailAndPassword("bad@email.com" as Email, "wrong");

    expect(console.error).toHaveBeenCalled();
    expect(global.alert).toHaveBeenCalledWith("Invalid credentials");
  });
});

describe("registerWithEmailAndPassword", () => {
  it("should create auth user and firestore doc", async () => {
    mockCreateUserWithEmailAndPassword.mockResolvedValue({
      user: { uid: "456" },
    });
    mockAddDoc.mockResolvedValue({});
    const email = "new@user.com" as Email;

    await registerWithEmailAndPassword("New User", email, "securePass");

    expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
      { currentUser: null },
      email,
      "securePass",
    );
    expect(mockAddDoc).toHaveBeenCalledWith(undefined, {
      uid: "456",
      name: "New User",
      authProvider: "local",
      email,
    });
  });

  it("should handle errors gracefully", async () => {
    mockCreateUserWithEmailAndPassword.mockRejectedValue(
      new Error("Email already in use"),
    );

    await registerWithEmailAndPassword(
      "User",
      "dup@email.com" as Email,
      "pass",
    );

    expect(console.error).toHaveBeenCalled();
    expect(global.alert).toHaveBeenCalledWith("Email already in use");
  });
});

describe("sendPasswordReset", () => {
  it("should send a password reset email", async () => {
    mockSendPasswordResetEmail.mockResolvedValue(undefined);
    const email = "reset@user.com" as Email;

    await sendPasswordReset(email);

    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
      { currentUser: null },
      email,
    );
    expect(global.alert).toHaveBeenCalledWith("Password reset link sent!");
  });

  it("should handle errors gracefully", async () => {
    mockSendPasswordResetEmail.mockRejectedValue(new Error("User not found"));

    await sendPasswordReset("unknown@user.com" as Email);

    expect(console.error).toHaveBeenCalled();
    expect(global.alert).toHaveBeenCalledWith("User not found");
  });
});
