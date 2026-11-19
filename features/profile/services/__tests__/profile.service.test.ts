import { describe, expect, it, jest } from "@jest/globals";

import type { IProfileRepository } from "../../repositories/profile.repository";
import type {
  Profile,
  ValidatedProfileSaveInput,
} from "../../types/profile.types";
import { ProfileValidationError } from "../profile.errors";
import { ProfileService } from "../profile.service";

const profile: Profile = {
  id: "doc-1",
  uid: "user-1",
  email: "ada@example.com",
  displayName: "Ada",
  preferredCurrency: "EUR",
  registerSharedExpensesInWallet: false,
};

function createRepository(): IProfileRepository {
  return {
    getProfile: jest.fn(async () => profile),
    saveProfile: jest.fn(async (input: ValidatedProfileSaveInput) => ({
      ...profile,
      uid: input.uid,
      displayName: input.displayName,
      preferredCurrency: input.preferredCurrency,
      registerSharedExpensesInWallet: input.registerSharedExpensesInWallet,
    })),
  };
}

describe("ProfileService", () => {
  it("normalizes the uid before reading the profile", async () => {
    const repository = createRepository();
    const service = new ProfileService(repository);

    await expect(service.getProfile("  user-1  ")).resolves.toEqual(profile);
    expect(repository.getProfile).toHaveBeenCalledWith("user-1");
  });

  it("does not query Firestore without a uid", async () => {
    const repository = createRepository();
    const service = new ProfileService(repository);

    await expect(service.getProfile("   ")).resolves.toBeNull();
    expect(repository.getProfile).not.toHaveBeenCalled();
  });

  it("validates, trims and persists the profile", async () => {
    const repository = createRepository();
    const service = new ProfileService(repository);

    const saved = await service.saveProfile({
      uid: " user-1 ",
      email: " ada@example.com ",
      displayName: " Ada Lovelace ",
      preferredCurrency: "USD",
      registerSharedExpensesInWallet: true,
    });

    expect(repository.saveProfile).toHaveBeenCalledWith({
      uid: "user-1",
      email: "ada@example.com",
      displayName: "Ada Lovelace",
      preferredCurrency: "USD",
      registerSharedExpensesInWallet: true,
    });
    expect(saved).toMatchObject({
      displayName: "Ada Lovelace",
      preferredCurrency: "USD",
      registerSharedExpensesInWallet: true,
    });
  });

  it("normalizes a missing wallet preference to false", async () => {
    const repository = createRepository();
    const service = new ProfileService(repository);

    await service.saveProfile({
      uid: "user-1",
      displayName: "Ada",
      preferredCurrency: "EUR",
    } as unknown as Parameters<typeof service.saveProfile>[0]);

    expect(repository.saveProfile).toHaveBeenCalledWith(
      expect.objectContaining({ registerSharedExpensesInWallet: false }),
    );
  });

  it("throws field errors and never persists invalid profiles", async () => {
    const repository = createRepository();
    const service = new ProfileService(repository);

    const failure = service.saveProfile({
      uid: "  ",
      displayName: "   ",
      preferredCurrency: "BTC",
      registerSharedExpensesInWallet: false,
    });

    await expect(failure).rejects.toBeInstanceOf(ProfileValidationError);
    await expect(failure).rejects.toMatchObject({
      fieldErrors: {
        uid: "UID_REQUIRED",
        displayName: "NAME_REQUIRED",
        preferredCurrency: "INVALID_CURRENCY",
      },
    });
    expect(repository.saveProfile).not.toHaveBeenCalled();
  });

  it("propagates repository failures", async () => {
    const repository = createRepository();
    const failure = new Error("write failed");
    repository.saveProfile = jest.fn(async () => {
      throw failure;
    });
    const service = new ProfileService(repository);

    await expect(
      service.saveProfile({
        uid: "user-1",
        displayName: "Ada",
        preferredCurrency: "EUR",
        registerSharedExpensesInWallet: false,
      }),
    ).rejects.toBe(failure);
  });
});
