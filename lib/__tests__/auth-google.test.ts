import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firebase mocks are registered before the auth helpers.
import {
  mockAddDoc,
  mockGetDocs,
  mockSignInWithPopup,
  setupAuthMocks,
} from "./auth.test-helpers";
import { signInWithGoogle } from "../auth";

beforeEach(setupAuthMocks);

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
