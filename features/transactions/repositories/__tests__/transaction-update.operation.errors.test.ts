import { beforeEach, describe, expect, it } from "@jest/globals";

import {
  setupTransactionRepositoryMocks,
  snapshot,
  transactionDocument,
  transactionGet,
  validDto,
  walletDocument,
} from "./transaction-repository.test-helpers";
import { updateTransactionOperation } from "../transaction-update.operation";

beforeEach(setupTransactionRepositoryMocks);

function run(dto = validDto) {
  return updateTransactionOperation({
    ownerId: "user-1",
    transactionId: "transaction-1",
    dto,
  });
}

describe("updateTransactionOperation errors", () => {
  it("rejects missing or foreign movements", async () => {
    transactionGet.mockResolvedValueOnce(snapshot("transaction-1"));
    await expect(run()).rejects.toMatchObject({ code: "TRANSACTION_NOT_FOUND" });

    transactionGet.mockResolvedValueOnce(
      snapshot("transaction-1", transactionDocument({ ownerId: "user-2" })),
    );
    await expect(run()).rejects.toMatchObject({ code: "TRANSACTION_NOT_FOUND" });
  });

  it("rejects movements with invalid stored data", async () => {
    const invalidDocuments = [
      transactionDocument({ type: "transfer" }),
      transactionDocument({ amount: 0 }),
      transactionDocument({ walletId: "" }),
    ];

    for (const document of invalidDocuments) {
      transactionGet.mockResolvedValueOnce(snapshot("transaction-1", document));
      await expect(run()).rejects.toMatchObject({ code: "TRANSACTION_INVALID" });
    }
  });

  it("rejects a missing, foreign or mismatched new wallet", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot("transaction-1", transactionDocument()))
      .mockResolvedValueOnce(snapshot("wallet-2"));
    await expect(
      run({ ...validDto, walletId: "wallet-2" }),
    ).rejects.toMatchObject({ code: "WALLET_NOT_FOUND" });

    transactionGet
      .mockResolvedValueOnce(snapshot("transaction-1", transactionDocument()))
      .mockResolvedValueOnce(
        snapshot("wallet-2", walletDocument({ ownerId: "user-2" })),
      );
    await expect(
      run({ ...validDto, walletId: "wallet-2" }),
    ).rejects.toMatchObject({ code: "WALLET_NOT_OWNED" });

    transactionGet
      .mockResolvedValueOnce(snapshot("transaction-1", transactionDocument()))
      .mockResolvedValueOnce(
        snapshot("wallet-2", walletDocument({ currency: "USD" })),
      );
    await expect(
      run({ ...validDto, walletId: "wallet-2" }),
    ).rejects.toMatchObject({ code: "CURRENCY_MISMATCH" });
  });

  it("rejects a missing or foreign previous wallet", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot("transaction-1", transactionDocument()))
      .mockResolvedValueOnce(
        snapshot("wallet-2", walletDocument({ balance: 200 })),
      )
      .mockResolvedValueOnce(snapshot("wallet-1"));
    await expect(
      run({ ...validDto, walletId: "wallet-2" }),
    ).rejects.toMatchObject({ code: "WALLET_NOT_FOUND" });

    transactionGet
      .mockResolvedValueOnce(snapshot("transaction-1", transactionDocument()))
      .mockResolvedValueOnce(
        snapshot("wallet-2", walletDocument({ balance: 200 })),
      )
      .mockResolvedValueOnce(
        snapshot("wallet-1", walletDocument({ ownerId: "user-2" })),
      );
    await expect(
      run({ ...validDto, walletId: "wallet-2" }),
    ).rejects.toMatchObject({ code: "WALLET_NOT_OWNED" });
  });
});
