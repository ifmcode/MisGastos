import type { Email } from "@/common/types";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  logInWithEmailAndPassword,
  logout,
  registerWithEmailAndPassword,
  sendPasswordReset,
  signInWithGoogle,
} from "../auth";

const mockSignInWithPopup = jest.fn<any>();
const mockSignInWithEmailAndPassword = jest.fn<any>();
const mockCreateUserWithEmailAndPassword = jest.fn<any>();
const mockSendPasswordResetEmail = jest.fn<any>();
const mockSignOut = jest.fn<any>();
const mockGetDocs = jest.fn<any>();
const mockAddDoc = jest.fn<any>();
const mockQuery = jest.fn<any>();
const mockCollection = jest.fn<any>();
const mockWhere = jest.fn<any>();

jest.mock("firebase/auth", () => ({
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: (...args: unknown[]) => mockSignInWithPopup(...args),
  signInWithEmailAndPassword: (...args: unknown[]) =>
    mockSignInWithEmailAndPassword(...args),
  createUserWithEmailAndPassword: (...args: unknown[]) =>
    mockCreateUserWithEmailAndPassword(...args),
  sendPasswordResetEmail: (...args: unknown[]) =>
    mockSendPasswordResetEmail(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

jest.mock("firebase/firestore", () => ({
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  where: (...args: unknown[]) => mockWhere(...args),
}));

jest.mock("./firebase", () => ({
  auth: { currentUser: null },
  db: {},
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
  global.alert = jest.fn();
});

describe("auth tests:", () => {
  describe("signInWithGoogle", () => {
    it("should create a new user doc if none exists", async () => {
      mockSignInWithPopup.mockResolvedValue({
        user: {
          uid: "123",
          displayName: "Test User",
          email: "test@test.com",
        },
      });
      mockGetDocs.mockResolvedValue({ docs: [] });
      mockAddDoc.mockResolvedValue({});

      await signInWithGoogle();

      expect(mockSignInWithPopup).toHaveBeenCalledTimes(1);
      expect(mockGetDocs).toHaveBeenCalledTimes(1);
      expect(mockAddDoc).toHaveBeenCalledWith(undefined, {
        uid: "123",
        name: "Test User",
        authProvider: "google",
        email: "test@test.com",
      });
    });

    it("should not create a user doc if one already exists", async () => {
      mockSignInWithPopup.mockResolvedValue({
        user: { uid: "123", displayName: "Test User", email: "test@test.com" },
      });
      mockGetDocs.mockResolvedValue({ docs: [{ id: "existing" }] });

      await signInWithGoogle();

      expect(mockAddDoc).not.toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      mockSignInWithPopup.mockRejectedValue(new Error("Google sign-in failed"));

      await signInWithGoogle();

      expect(console.error).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith("Google sign-in failed");
    });
  });

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

  describe("logout", () => {
    it("should call signOut", () => {
      logout();

      expect(mockSignOut).toHaveBeenCalledWith({ currentUser: null });
    });
  });
});
