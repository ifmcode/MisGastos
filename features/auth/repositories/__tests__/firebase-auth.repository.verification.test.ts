import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  mockAuth,
  mockSendEmailVerification,
  setupAuthMocks,
} from "./auth.test-helpers";
import { FirebaseAuthRepository } from "../firebase-auth.repository";

beforeEach(setupAuthMocks);

describe("FirebaseAuthRepository.verification", () => {
  it("sends the verification email to the current user", async () => {
    const user = { uid: "123", email: "user@example.com" };
    mockAuth.currentUser = user;
    mockSendEmailVerification.mockResolvedValue(undefined);

    await new FirebaseAuthRepository().sendVerificationEmail();

    expect(mockSendEmailVerification).toHaveBeenCalledWith(user);
  });

  it("rejects when there is no authenticated user", async () => {
    await expect(
      new FirebaseAuthRepository().sendVerificationEmail(),
    ).rejects.toThrow("No authenticated user to verify.");
  });

  it("reloads and returns the refreshed user", async () => {
    const reloaded = { uid: "123", emailVerified: true };
    const reload = jest.fn(async () => {
      mockAuth.currentUser = reloaded;
    });
    mockAuth.currentUser = { uid: "123", emailVerified: false, reload };

    const result = await new FirebaseAuthRepository().reloadCurrentUser();

    expect(reload).toHaveBeenCalledTimes(1);
    expect(result).toBe(reloaded);
  });

  it("returns null when there is no user to reload", async () => {
    await expect(
      new FirebaseAuthRepository().reloadCurrentUser(),
    ).resolves.toBeNull();
  });
});
