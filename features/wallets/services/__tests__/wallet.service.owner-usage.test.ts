import { describe, expect, it } from "@jest/globals";

import { buildWallet, createService, validInput } from "./wallet-service.fixtures";

describe("WalletService owner and usage handling", () => {
  it("reports only the owner issue when the input is valid", async () => {
    const { service } = createService();

    await expect(
      service.createWallet("   ", validInput),
    ).rejects.toMatchObject({
      fieldErrors: {
        ownerId: "OWNER_REQUIRED",
      },
    });
  });

  it("normalizes the ids before loading usage", async () => {
    const { repository, service } = createService();
    repository.wallets = [buildWallet()];

    await service.getWalletUsage("  user-1  ", "  wallet-1  ");

    expect(repository.usageCalls).toEqual([
      { ownerId: "user-1", walletId: "wallet-1" },
    ]);
  });

  it("omits the description when the input does not include one", async () => {
    const { repository, service } = createService();
    repository.wallets = [buildWallet()];

    const { description: _description, ...input } = validInput;
    await service.updateWallet("user-1", "wallet-1", input);

    expect(repository.updateCalls[0].dto.description).toBe("");
  });
});
