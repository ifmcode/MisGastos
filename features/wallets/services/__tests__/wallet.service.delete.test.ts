import { describe, expect, it } from "@jest/globals";

import { DeleteWalletOptions } from "../../types/wallet.types";
import {
  buildWallet,
  captureError,
  createService,
  expectOperationError,
} from "./wallet-service.fixtures";

const withMovements = {
  transactionCount: 2,
  transferCount: 1,
  hasMovements: true,
};

const keep: DeleteWalletOptions = { mode: "keep" };
const reassignTo = (targetWalletId?: string): DeleteWalletOptions => ({
  mode: "reassign",
  targetWalletId,
});

describe("WalletService.deleteWallet", () => {
  it("deletes a wallet without movements using the keep mode", async () => {
    const { repository, service } = createService();
    repository.wallets = [buildWallet()];

    const result = await service.deleteWallet("user-1", "wallet-1", keep);

    expect(repository.deleteCalls).toEqual([
      { ownerId: "user-1", walletId: "wallet-1", options: keep },
    ]);
    expect(result.deletedWalletId).toBe("wallet-1");
  });

  it("keeps movements under the deleted placeholder when requested", async () => {
    const { repository, service } = createService();
    repository.wallets = [buildWallet()];
    repository.usage = withMovements;

    await service.deleteWallet("user-1", "wallet-1", keep);

    expect(repository.deleteCalls[0].options).toEqual(keep);
  });

  it("requires a target wallet when reassigning movements", async () => {
    const { repository, service } = createService();
    repository.wallets = [buildWallet()];
    repository.usage = withMovements;

    const error = await captureError(
      service.deleteWallet("user-1", "wallet-1", reassignTo()),
    );

    expectOperationError(error, "TARGET_WALLET_REQUIRED");
    expect(repository.deleteCalls).toEqual([]);
  });

  it("rejects the deleted wallet as its own target", async () => {
    const { repository, service } = createService();
    repository.wallets = [buildWallet()];
    repository.usage = withMovements;

    const error = await captureError(
      service.deleteWallet("user-1", "wallet-1", reassignTo("wallet-1")),
    );

    expectOperationError(error, "TARGET_WALLET_SAME");
    expect(repository.deleteCalls).toEqual([]);
  });

  it("rejects missing, archived or foreign targets", async () => {
    const { repository, service } = createService();
    repository.wallets = [
      buildWallet(),
      buildWallet({
        id: "wallet-archived",
        name: "Antigua",
        archivedAt: "2026-11-01T10:00:00.000Z",
      }),
      buildWallet({ id: "wallet-foreign", ownerId: "other-user" }),
    ];
    repository.usage = withMovements;

    expectOperationError(
      await captureError(
        service.deleteWallet("user-1", "wallet-1", reassignTo("missing")),
      ),
      "TARGET_WALLET_NOT_FOUND",
    );
    expectOperationError(
      await captureError(
        service.deleteWallet(
          "user-1",
          "wallet-1",
          reassignTo("wallet-archived"),
        ),
      ),
      "TARGET_WALLET_ARCHIVED",
    );
    expectOperationError(
      await captureError(
        service.deleteWallet(
          "user-1",
          "wallet-1",
          reassignTo("wallet-foreign"),
        ),
      ),
      "TARGET_WALLET_NOT_FOUND",
    );
    expect(repository.deleteCalls).toEqual([]);
  });

  it("requires the target to have the same currency", async () => {
    const { repository, service } = createService();
    repository.wallets = [
      buildWallet(),
      buildWallet({ id: "wallet-usd", currency: "USD" }),
    ];
    repository.usage = withMovements;

    const error = await captureError(
      service.deleteWallet("user-1", "wallet-1", reassignTo("wallet-usd")),
    );

    expectOperationError(error, "TARGET_WALLET_CURRENCY_MISMATCH");
    expect(repository.deleteCalls).toEqual([]);
  });

  it("delegates a valid reassignment and returns the updated target", async () => {
    const { repository, service } = createService();
    const target = buildWallet({ id: "wallet-2", name: "Ahorros" });
    repository.wallets = [buildWallet(), target];
    repository.usage = withMovements;
    repository.deletionResult = {
      deletedWalletId: "wallet-1",
      targetWallet: { ...target, balance: 250 },
    };

    const result = await service.deleteWallet(
      "user-1",
      "wallet-1",
      reassignTo("wallet-2"),
    );

    expect(repository.deleteCalls[0].options).toEqual(reassignTo("wallet-2"));
    expect(result.targetWallet).toMatchObject({ balance: 250 });
  });

  it("rejects a wallet owned by someone else", async () => {
    const { repository, service } = createService();
    repository.wallets = [buildWallet({ ownerId: "other-user" })];

    const error = await captureError(
      service.deleteWallet("user-1", "wallet-1", keep),
    );

    expectOperationError(error, "WALLET_NOT_FOUND");
    expect(repository.deleteCalls).toEqual([]);
  });
});
