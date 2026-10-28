import { describe, expect, it } from "@jest/globals";

import { IWalletRepository } from "../../repositories/wallet.repository";
import { WalletInput } from "../../schemas/wallet.schema";
import { CreateWalletDto, Wallet } from "../../types/wallet.types";
import { WalletValidationError } from "../wallet.errors";
import { WalletService } from "../wallet.service";

class FakeWalletRepository implements IWalletRepository {
  readonly getCalls: string[] = [];
  readonly createCalls: Array<{ ownerId: string; dto: CreateWalletDto }> = [];
  wallets: Wallet[] = [];
  failure: Error | null = null;

  async getWallets(ownerId: string): Promise<Wallet[]> {
    this.getCalls.push(ownerId);
    if (this.failure) throw this.failure;
    return this.wallets;
  }

  async createWallet(
    ownerId: string,
    dto: CreateWalletDto,
  ): Promise<Wallet> {
    this.createCalls.push({ ownerId, dto });
    if (this.failure) throw this.failure;

    const wallet: Wallet = {
      ...dto,
      id: `wallet-${this.createCalls.length}`,
      balance: dto.initialBalance,
      ownerId,
      createdAt: "2026-10-28T10:00:00.000Z",
      updatedAt: "2026-10-28T10:00:00.000Z",
    };

    this.wallets = [wallet, ...this.wallets];
    return wallet;
  }
}

const validInput: WalletInput = {
  name: "  Cuenta principal  ",
  currency: "EUR",
  icon: "wallet",
  color: "#0a7ea4",
  initialBalance: "100,50",
  type: "bank",
  includeInTotal: true,
  description: "  Nómina  ",
};

function createService() {
  const repository = new FakeWalletRepository();
  return { repository, service: new WalletService(repository) };
}

async function captureError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error: unknown) {
    return error;
  }

  throw new Error("Expected promise to reject");
}

describe("WalletService.getWallets", () => {
  it("trims the owner id and delegates to the repository", async () => {
    const { repository, service } = createService();
    const wallets = [
      {
        ...validInput,
        id: "wallet-1",
        balance: 100.5,
        ownerId: "user-1",
        createdAt: "2026-10-28T10:00:00.000Z",
        updatedAt: "2026-10-28T10:00:00.000Z",
      },
    ] as Wallet[];
    repository.wallets = wallets;

    await expect(service.getWallets("  user-1  ")).resolves.toEqual(wallets);
    expect(repository.getCalls).toEqual(["user-1"]);
  });

  it("rejects an empty owner id without calling the repository", async () => {
    const { repository, service } = createService();

    await expect(service.getWallets("   ")).rejects.toBeInstanceOf(
      WalletValidationError,
    );
    expect(repository.getCalls).toEqual([]);
  });

  it("propagates repository failures", async () => {
    const { repository, service } = createService();
    const failure = new Error("firestore unavailable");
    repository.failure = failure;

    await expect(service.getWallets("user-1")).rejects.toBe(failure);
  });
});

describe("WalletService.createWallet", () => {
  it("validates, normalizes and persists the wallet with its initial balance", async () => {
    const { repository, service } = createService();

    const wallet = await service.createWallet("  user-1  ", validInput);

    expect(repository.createCalls).toHaveLength(1);
    expect(repository.createCalls[0]).toEqual({
      ownerId: "user-1",
      dto: {
        name: "Cuenta principal",
        currency: "EUR",
        icon: "wallet",
        color: "#0A7EA4",
        initialBalance: 100.5,
        type: "bank",
        includeInTotal: true,
        description: "Nómina",
      },
    });
    expect(wallet.balance).toBe(100.5);
    expect(wallet.initialBalance).toBe(100.5);
    expect(wallet.ownerId).toBe("user-1");
  });

  it("defaults the initial balance to zero", async () => {
    const { repository, service } = createService();

    const wallet = await service.createWallet("user-1", {
      ...validInput,
      initialBalance: "",
    });

    expect(wallet.balance).toBe(0);
    expect(repository.createCalls[0].dto.initialBalance).toBe(0);
  });

  it("throws validation errors and does not persist invalid data", async () => {
    const { repository, service } = createService();

    const error = await captureError(
      service.createWallet("user-1", {
        ...validInput,
        name: "   ",
        initialBalance: "-1",
      }),
    );

    expect(error).toBeInstanceOf(WalletValidationError);
    if (!(error instanceof WalletValidationError)) return;

    expect(error.fieldErrors.name).toBeDefined();
    expect(error.fieldErrors.initialBalance).toBeDefined();
    expect(repository.createCalls).toEqual([]);
  });

  it("requires an owner id and still reports field errors", async () => {
    const { repository, service } = createService();

    const error = await captureError(
      service.createWallet("   ", { ...validInput, currency: "BTC" }),
    );

    expect(error).toBeInstanceOf(WalletValidationError);
    if (!(error instanceof WalletValidationError)) return;

    expect(error.fieldErrors.ownerId).toBeDefined();
    expect(error.fieldErrors.currency).toBeDefined();
    expect(repository.createCalls).toEqual([]);
  });

  it("propagates repository failures", async () => {
    const { repository, service } = createService();
    const failure = new Error("write failed");
    repository.failure = failure;

    await expect(
      service.createWallet("user-1", validInput),
    ).rejects.toBe(failure);
  });
});
