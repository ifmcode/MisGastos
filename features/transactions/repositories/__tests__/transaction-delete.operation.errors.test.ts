import { beforeEach, describe, expect, it } from "@jest/globals";

import {
  transactionDelete,
  transactionGet,
  transactionDocument,
  setupTransactionRepositoryMocks,
  snapshot,
  walletDocument,
} from "./transaction-repository.test-helpers";
import { deleteTransactionOperation } from "../transaction-delete.operation";

beforeEach(setupTransactionRepositoryMocks);

describe("deleteTransactionOperation errors", () => {
  it("rejects missing or foreign movements", async () => {
    transactionGet.mockResolvedValueOnce(snapshot("transaction-1"));
    await expect(
      deleteTransactionOperation("user-1", "transaction-1"),
    ).rejects.toMatchObject({ code: "TRANSACTION_NOT_FOUND" });

    transactionGet.mockResolvedValueOnce(
      snapshot("transaction-1", transactionDocument({ ownerId: "user-2" })),
    );
    await expect(
      deleteTransactionOperation("user-1", "transaction-1"),
    ).rejects.toMatchObject({ code: "TRANSACTION_NOT_FOUND" });
  });

  it("rejects movements with invalid stored data", async () => {
    const invalidDocuments = [
      transactionDocument({ type: "transfer" }),
      transactionDocument({ amount: -1 }),
      transactionDocument({ amount: "25" }),
      transactionDocument({ walletId: "" }),
    ];

    for (const document of invalidDocuments) {
      transactionGet.mockResolvedValueOnce(snapshot("transaction-1", document));

      await expect(
        deleteTransactionOperation("user-1", "transaction-1"),
      ).rejects.toMatchObject({ code: "TRANSACTION_INVALID" });
    }
  });

  it("rejects a missing or foreign wallet", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot("transaction-1", transactionDocument()))
      .mockResolvedValueOnce(snapshot("wallet-1"));
    await expect(
      deleteTransactionOperation("user-1", "transaction-1"),
    ).rejects.toMatchObject({ code: "WALLET_NOT_FOUND" });

    transactionGet
      .mockResolvedValueOnce(snapshot("transaction-1", transactionDocument()))
      .mockResolvedValueOnce(
        snapshot("wallet-1", walletDocument({ ownerId: "user-2" })),
      );
    await expect(
      deleteTransactionOperation("user-1", "transaction-1"),
    ).rejects.toMatchObject({ code: "WALLET_NOT_OWNED" });
  });

  it("rejects a currency mismatch when the movement stores a currency", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot("transaction-1", transactionDocument()))
      .mockResolvedValueOnce(
        snapshot("wallet-1", walletDocument({ currency: "USD" })),
      );

    await expect(
      deleteTransactionOperation("user-1", "transaction-1"),
    ).rejects.toMatchObject({ code: "CURRENCY_MISMATCH" });
    expect(transactionDelete).not.toHaveBeenCalled();
  });

  it("skips the currency check for legacy movements without currency", async () => {
    transactionGet
      .mockResolvedValueOnce(
        snapshot("transaction-1", transactionDocument({ currency: undefined })),
      )
      .mockResolvedValueOnce(
        snapshot("wallet-1", walletDocument({ balance: 74.5 })),
      );

    await deleteTransactionOperation("user-1", "transaction-1");

    expect(transactionDelete).toHaveBeenCalled();
  });
});
