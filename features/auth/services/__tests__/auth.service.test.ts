import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { User } from "firebase/auth";

import {
  consumePendingVerificationEmail,
  markPendingVerificationEmail,
  resetPendingVerificationEmail,
} from "../../utils/verification-email-store";
import { AuthService } from "../auth.service";
import { createRepository, email } from "./auth.service.fixtures";

beforeEach(resetPendingVerificationEmail);

describe("AuthService", () => {
  it("delegates Google, email and registration flows", async () => {
    const repository = createRepository();
    const service = new AuthService(repository);

    await service.signInWithGoogle();
    await service.signInWithEmail(email, "secret123");
    await service.register("Name", email, "secret123");

    expect(repository.signInWithGoogle).toHaveBeenCalledTimes(1);
    expect(repository.signInWithEmail).toHaveBeenCalledWith(email, "secret123");
    expect(repository.registerWithEmail).toHaveBeenCalledWith(
      "Name",
      email,
      "secret123",
    );
  });

  it("delegates display-name updates", async () => {
    const repository = createRepository();
    const service = new AuthService(repository);

    await service.updateDisplayName("Ada");

    expect(repository.updateDisplayName).toHaveBeenCalledWith("Ada");
  });

  it("delegates password reset and logout", async () => {
    const repository = createRepository();
    const service = new AuthService(repository);

    await service.resetPassword(email);
    await service.logout();

    expect(repository.sendPasswordReset).toHaveBeenCalledWith(email);
    expect(repository.signOut).toHaveBeenCalledTimes(1);
  });

  it("propagates repository errors to the caller", async () => {
    const repository = createRepository();
    repository.signInWithEmail = jest.fn(async () => {
      throw new Error("Invalid credentials");
    });
    const service = new AuthService(repository);

    await expect(service.signInWithEmail(email, "wrong")).rejects.toThrow(
      "Invalid credentials",
    );
  });

  it("marks the verification email as pending after registration", async () => {
    const repository = createRepository();
    repository.registerWithEmail = jest.fn(
      async () => ({ uid: "user-1" } as unknown as User),
    );
    const service = new AuthService(repository);

    await service.register("Name", email, "secret123");

    expect(consumePendingVerificationEmail("user-1")).toBe(true);
  });
});
