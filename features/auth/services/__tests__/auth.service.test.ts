import { describe, expect, it, jest } from "@jest/globals";

import type { Email } from "../../types/auth.types";
import type { IAuthRepository } from "../../repositories/auth.repository";
import { AuthService } from "../auth.service";

const email = "user@example.com" as Email;

function createRepository(): IAuthRepository {
  return {
    signInWithGoogle: jest.fn(async () => null),
    signInWithEmail: jest.fn(async () => null),
    registerWithEmail: jest.fn(async () => null),
    sendPasswordReset: jest.fn(async () => undefined),
    signOut: jest.fn(async () => undefined),
  };
}

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
});
