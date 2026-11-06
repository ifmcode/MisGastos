import { describe, expect, it, jest } from "@jest/globals";
import type { User } from "firebase/auth";

import type { IEmailVerificationRepository } from "../../repositories/auth.repository";
import { createAuthUser } from "../../utils/__tests__/auth-user.fixture";
import { EmailVerificationService } from "../email-verification.service";

function createRepository(): IEmailVerificationRepository {
  return {
    sendVerificationEmail: jest.fn(async () => undefined),
    reloadCurrentUser: jest.fn(async () => null),
  };
}

describe("EmailVerificationService.requestEmail", () => {
  it("skips anonymous, Google and already verified accounts", async () => {
    const repository = createRepository();
    const service = new EmailVerificationService(repository);

    await expect(service.requestEmail(null)).resolves.toBe("skipped");
    await expect(
      service.requestEmail(
        createAuthUser({ providerIds: ["google.com"], emailVerified: false }),
      ),
    ).resolves.toBe("skipped");
    await expect(
      service.requestEmail(createAuthUser({ emailVerified: true })),
    ).resolves.toBe("skipped");

    expect(repository.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("sends the email for an unverified email/password account", async () => {
    const repository = createRepository();
    const service = new EmailVerificationService(repository);

    await expect(service.requestEmail(createAuthUser())).resolves.toBe("sent");

    expect(repository.sendVerificationEmail).toHaveBeenCalledTimes(1);
  });

  it("propagates rate-limit and network failures", async () => {
    const repository = createRepository();
    repository.sendVerificationEmail = jest.fn(async () => {
      throw new Error("auth/too-many-requests");
    });
    const service = new EmailVerificationService(repository);

    await expect(service.requestEmail(createAuthUser())).rejects.toThrow(
      "auth/too-many-requests",
    );
  });
});

describe("EmailVerificationService.refreshStatus", () => {
  it("returns the refreshed app snapshot", async () => {
    const repository = createRepository();
    repository.reloadCurrentUser = jest.fn(
      async () =>
        ({
          uid: "user-1",
          email: "user@example.com",
          displayName: null,
          emailVerified: true,
          providerData: [{ providerId: "password" }],
        } as unknown as User),
    );
    const service = new EmailVerificationService(repository);

    const user = await service.refreshStatus();

    expect(user?.emailVerified).toBe(true);
    expect(user?.providerIds).toEqual(["password"]);
  });

  it("returns null when the session is gone", async () => {
    const service = new EmailVerificationService(createRepository());

    await expect(service.refreshStatus()).resolves.toBeNull();
  });

  it("propagates reload failures", async () => {
    const repository = createRepository();
    repository.reloadCurrentUser = jest.fn(async () => {
      throw new Error("auth/network-request-failed");
    });
    const service = new EmailVerificationService(repository);

    await expect(service.refreshStatus()).rejects.toThrow(
      "auth/network-request-failed",
    );
  });
});
