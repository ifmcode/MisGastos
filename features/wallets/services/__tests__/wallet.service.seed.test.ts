import { beforeEach, describe, expect, it } from "@jest/globals";

import { DEFAULT_WALLET_FORM_VALUES } from "../../utils/wallet-options";
import { WalletService } from "../wallet.service";
import { WalletValidationError } from "../wallet.errors";
import { FakeWalletRepository } from "./wallet-service.fakes";

let repository: FakeWalletRepository;
let service: WalletService;

beforeEach(() => {
  repository = new FakeWalletRepository();
  service = new WalletService(repository);
});

describe("WalletService.seedDefaultWallet", () => {
  it("rejects an empty owner id", async () => {
    await expect(
      service.seedDefaultWallet("   ", { name: "Main wallet" }),
    ).rejects.toMatchObject({
      issues: [{ field: "ownerId", code: "OWNER_REQUIRED" }],
    });
    expect(repository.seedCalls).toHaveLength(0);
  });

  it("rejects an empty name", async () => {
    await expect(
      service.seedDefaultWallet("user-1", { name: "   " }),
    ).rejects.toBeInstanceOf(WalletValidationError);

    expect(repository.seedCalls).toHaveLength(0);
  });

  it("keeps a valid preferred currency", async () => {
    await service.seedDefaultWallet("user-1", {
      name: "Main wallet",
      preferredCurrency: "USD",
    });

    expect(repository.seedCalls[0]?.dto.currency).toBe("USD");
  });

  it("falls back to EUR when the preferred currency is invalid or missing", async () => {
    await service.seedDefaultWallet("user-1", {
      name: "Main wallet",
      preferredCurrency: "XYZ",
    });
    await service.seedDefaultWallet("user-1", { name: "Main wallet" });

    expect(repository.seedCalls[0]?.dto.currency).toBe("EUR");
    expect(repository.seedCalls[1]?.dto.currency).toBe("EUR");
  });

  it("builds the DTO from the shared wallet defaults", async () => {
    await service.seedDefaultWallet(" user-1 ", {
      name: "  Cartera principal  ",
      preferredCurrency: "EUR",
    });

    expect(repository.seedCalls).toEqual([
      {
        ownerId: "user-1",
        dto: {
          name: "Cartera principal",
          currency: "EUR",
          icon: DEFAULT_WALLET_FORM_VALUES.icon,
          color: DEFAULT_WALLET_FORM_VALUES.color,
          initialBalance: 0,
          type: DEFAULT_WALLET_FORM_VALUES.type,
          includeInTotal: DEFAULT_WALLET_FORM_VALUES.includeInTotal,
        },
      },
    ]);
  });

  it("returns the repository result", async () => {
    repository.seedResult = { status: "skipped-existing-wallets" };

    const result = await service.seedDefaultWallet("user-1", {
      name: "Main wallet",
    });

    expect(result).toEqual({ status: "skipped-existing-wallets" });
  });
});
