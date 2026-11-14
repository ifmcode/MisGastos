import { beforeEach, describe, expect, it } from "@jest/globals";

import type { Email } from "../../types/auth.types";

import {
  mockAddDoc,
  mockAuth,
  mockCreateUserWithEmailAndPassword,
  mockGetDocs,
  mockSendPasswordResetEmail,
  mockSignInWithEmailAndPassword,
  mockSignInWithGoogle,
  mockSignOut,
  mockUpdateProfile,
  setupAuthMocks,
} from "./auth.test-helpers";
import { FirebaseAuthRepository } from "../firebase-auth.repository";

beforeEach(setupAuthMocks);

const email = "user@example.com" as Email;

describe("FirebaseAuthRepository.google", () => {
  it("creates a user profile when the Google user has none", async () => {
    const user = { uid: "123", displayName: "Test", email };
    mockSignInWithGoogle.mockResolvedValue(user);
    mockGetDocs.mockResolvedValue({ docs: [] });
    mockAddDoc.mockResolvedValue({});

    const result = await new FirebaseAuthRepository().signInWithGoogle();

    expect(result).toBe(user);
    expect(mockAddDoc).toHaveBeenCalledWith(undefined, {
      uid: "123",
      name: "Test",
      authProvider: "google",
      email,
    });
  });

  it("does not duplicate an existing Google profile", async () => {
    mockSignInWithGoogle.mockResolvedValue({
      uid: "123",
      displayName: "Test",
      email,
    });
    mockGetDocs.mockResolvedValue({ docs: [{ id: "existing" }] });

    await new FirebaseAuthRepository().signInWithGoogle();

    expect(mockAddDoc).not.toHaveBeenCalled();
  });

  it("propagates provider failures without showing UI", async () => {
    mockSignInWithGoogle.mockRejectedValue(new Error("Google failed"));

    await expect(
      new FirebaseAuthRepository().signInWithGoogle(),
    ).rejects.toThrow("Google failed");
  });
});

describe("FirebaseAuthRepository.email", () => {
  it("returns the signed-in user", async () => {
    const user = { uid: "456", email };
    mockSignInWithEmailAndPassword.mockResolvedValue({ user });
    mockGetDocs.mockResolvedValue({ docs: [{ id: "existing" }] });

    const result = await new FirebaseAuthRepository().signInWithEmail(
      email,
      "secret123",
    );

    expect(result).toBe(user);
  });

  it("propagates login failures", async () => {
    mockSignInWithEmailAndPassword.mockRejectedValue(
      new Error("Invalid credentials"),
    );

    await expect(
      new FirebaseAuthRepository().signInWithEmail(email, "wrong"),
    ).rejects.toThrow("Invalid credentials");
  });

  it("creates the auth user and the profile on registration", async () => {
    const user = { uid: "789", email };
    mockCreateUserWithEmailAndPassword.mockResolvedValue({ user });
    mockGetDocs.mockResolvedValue({ docs: [] });
    mockAddDoc.mockResolvedValue({});

    const result = await new FirebaseAuthRepository().registerWithEmail(
      "New User",
      email,
      "secret123",
    );

    expect(result).toBe(user);
    expect(mockAddDoc).toHaveBeenCalledWith(undefined, {
      uid: "789",
      name: "New User",
      authProvider: "local",
      email,
    });
  });

  it("repairs a missing profile on email sign-in", async () => {
    const user = { uid: "456", email, displayName: null };
    mockSignInWithEmailAndPassword.mockResolvedValue({ user });
    mockGetDocs.mockResolvedValue({ docs: [] });
    mockAddDoc.mockResolvedValue({});

    await new FirebaseAuthRepository().signInWithEmail(email, "secret123");

    expect(mockAddDoc).toHaveBeenCalledWith(undefined, {
      uid: "456",
      name: null,
      authProvider: "local",
      email,
    });
  });

  it("keeps the session when profile creation fails after registration", async () => {
    const user = { uid: "790", email };
    mockCreateUserWithEmailAndPassword.mockResolvedValue({ user });
    mockGetDocs.mockResolvedValue({ docs: [] });
    mockAddDoc.mockRejectedValue(new Error("Offline"));

    await expect(
      new FirebaseAuthRepository().registerWithEmail("User", email, "secret123"),
    ).resolves.toBe(user);
  });

  it("propagates registration failures", async () => {
    mockCreateUserWithEmailAndPassword.mockRejectedValue(
      new Error("Email already in use"),
    );

    await expect(
      new FirebaseAuthRepository().registerWithEmail("User", email, "secret123"),
    ).rejects.toThrow("Email already in use");
  });
});

describe("FirebaseAuthRepository.session", () => {
  it("sends the password reset email", async () => {
    mockSendPasswordResetEmail.mockResolvedValue(undefined);

    await new FirebaseAuthRepository().sendPasswordReset(email);

    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
      { currentUser: null },
      email,
    );
  });

  it("signs out", async () => {
    await new FirebaseAuthRepository().signOut();

    expect(mockSignOut).toHaveBeenCalledWith({ currentUser: null });
  });

  it("updates the Firebase display name", async () => {
    const user = { uid: "123", email };
    mockAuth.currentUser = user;
    mockUpdateProfile.mockResolvedValue(undefined);

    await new FirebaseAuthRepository().updateDisplayName("  Ada Lovelace  ");

    expect(mockUpdateProfile).toHaveBeenCalledWith(user, {
      displayName: "  Ada Lovelace  ",
    });
  });

  it("rejects a display-name update without an authenticated user", async () => {
    await expect(
      new FirebaseAuthRepository().updateDisplayName("Ada"),
    ).rejects.toThrow("No authenticated user to update.");
  });
});
