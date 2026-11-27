import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  consumePendingVerificationEmail,
  markPendingVerificationEmail,
  resetPendingVerificationEmail,
} from "../../utils/verification-email-store";
import { AuthService } from "../auth.service";
import { createLocalSession, createRepository } from "./auth.service.fixtures";

beforeEach(resetPendingVerificationEmail);

describe("AuthService.logout", () => {
  it("clears a pending verification email", async () => {
    const service = new AuthService(createRepository());
    markPendingVerificationEmail("user-1");

    await service.logout();

    expect(consumePendingVerificationEmail("user-1")).toBe(false);
  });

  it("revokes, signs out and only then purges the account", async () => {
    const repository = createRepository();
    repository.getCurrentUserId = jest.fn(() => "user-1");
    const calls: string[] = [];
    repository.signOut = jest.fn(async () => {
      calls.push("signOut");
    });
    const service = new AuthService(repository, createLocalSession(calls));

    await service.logout();

    expect(calls).toEqual(["revoke:user-1", "signOut", "purge:user-1"]);
  });

  it("does not touch the local session without a uid", async () => {
    const localSession = createLocalSession();
    const service = new AuthService(createRepository(), localSession);

    await service.logout();

    expect(localSession.revoke).not.toHaveBeenCalled();
    expect(localSession.restore).not.toHaveBeenCalled();
    expect(localSession.purge).not.toHaveBeenCalled();
  });

  it("restores the account, skips the purge and propagates a sign-out failure", async () => {
    const repository = createRepository();
    repository.getCurrentUserId = jest.fn(() => "user-1");
    const calls: string[] = [];
    repository.signOut = jest.fn(async () => {
      calls.push("signOut");
      throw new Error("offline");
    });
    const localSession = createLocalSession(calls);
    const service = new AuthService(repository, localSession);

    await expect(service.logout()).rejects.toThrow("offline");

    expect(calls).toEqual(["revoke:user-1", "signOut", "restore:user-1"]);
    expect(localSession.purge).not.toHaveBeenCalled();
  });

  it("uses a no-op local session by default", async () => {
    const repository = createRepository();
    repository.getCurrentUserId = jest.fn(() => "user-2");

    await expect(new AuthService(repository).logout()).resolves.toBeUndefined();
  });

  it("propagates a sign-out failure without a uid and does not restore", async () => {
    const repository = createRepository();
    repository.signOut = jest.fn(async () => {
      throw new Error("offline");
    });
    const localSession = createLocalSession();
    const service = new AuthService(repository, localSession);

    await expect(service.logout()).rejects.toThrow("offline");

    expect(localSession.restore).not.toHaveBeenCalled();
  });

  it("propagates a sign-out failure with the default local session", async () => {
    const repository = createRepository();
    repository.getCurrentUserId = jest.fn(() => "user-2");
    repository.signOut = jest.fn(async () => {
      throw new Error("offline");
    });

    await expect(new AuthService(repository).logout()).rejects.toThrow(
      "offline",
    );
  });
});
