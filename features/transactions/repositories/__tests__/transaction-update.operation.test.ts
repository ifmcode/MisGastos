import { beforeEach, describe, expect, it } from "@jest/globals";

import {
  mockGetDoc,
  setupTransactionRepositoryMocks,
  snapshot,
  transactionDocument,
  transactionGet,
  transactionUpdate,
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

describe("updateTransactionOperation", () => {
  it("updates a movement on the same wallet by reverting and reapplying", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot("transaction-1", transactionDocument()))
      .mockResolvedValueOnce(
        snapshot("wallet-1", walletDocument({ balance: 74.5 })),
      );
    mockGetDoc.mockResolvedValue(
      snapshot("wallet-1", walletDocument({ balance: 70 })),
    );

    const result = await run({ ...validDto, amount: 30, notes: "  Nuevo  " });

    expect(transactionUpdate).toHaveBeenCalledWith(
      { kind: "wallet", id: "wallet-1" },
      expect.objectContaining({
        balance: 70,
        updatedAt: expect.any(String),
        revision: 1,
      }),
    );
    expect(transactionUpdate).toHaveBeenCalledWith(
      { kind: "transaction", id: "transaction-1" },
      expect.objectContaining({
        amount: 30,
        notes: "Nuevo",
        createdAt: "2026-11-12T10:00:00.000Z",
        walletName: { kind: "delete-field" },
        revision: 1,
      }),
    );
    expect(result.transaction).toMatchObject({
      amount: 30,
      notes: "Nuevo",
      revision: 1,
    });
    expect(result.wallets.map((wallet) => wallet.balance)).toEqual([70]);
  });

  it("writes the stored revision plus one", async () => {
    transactionGet
      .mockResolvedValueOnce(
        snapshot("transaction-1", transactionDocument({ revision: 6 })),
      )
      .mockResolvedValueOnce(
        snapshot("wallet-1", walletDocument({ balance: 74.5, revision: 2 })),
      );
    mockGetDoc.mockResolvedValue(snapshot("wallet-1", walletDocument()));

    const result = await run({ ...validDto, amount: 30 });

    const patch = transactionUpdate.mock.calls.find(
      (call) => (call[0] as { kind?: string }).kind === "transaction",
    )?.[1] as Record<string, unknown>;
    expect(patch.revision).toBe(7);
    expect(transactionUpdate).toHaveBeenCalledWith(
      { kind: "wallet", id: "wallet-1" },
      expect.objectContaining({ revision: 3 }),
    );
    expect(result.transaction.revision).toBe(7);
  });

  it("moves a movement between wallets", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot("transaction-1", transactionDocument()))
      .mockResolvedValueOnce(
        snapshot("wallet-2", walletDocument({ balance: 200 })),
      )
      .mockResolvedValueOnce(
        snapshot("wallet-1", walletDocument({ balance: 74.5 })),
      );
    mockGetDoc.mockResolvedValue(
      snapshot("wallet-2", walletDocument({ balance: 190 })),
    );

    await run({ ...validDto, walletId: "wallet-2", amount: 10 });

    expect(transactionUpdate).toHaveBeenCalledWith(
      { kind: "wallet", id: "wallet-1" },
      expect.objectContaining({ balance: 100 }),
    );
    expect(transactionUpdate).toHaveBeenCalledWith(
      { kind: "wallet", id: "wallet-2" },
      expect.objectContaining({ balance: 190 }),
    );
  });

  it("applies a new wallet without reverting an orphaned previous one", async () => {
    transactionGet
      .mockResolvedValueOnce(
        snapshot("transaction-1", transactionDocument({ walletId: "-1" })),
      )
      .mockResolvedValueOnce(
        snapshot("wallet-1", walletDocument({ balance: 100 })),
      );
    mockGetDoc.mockResolvedValue(snapshot("wallet-1", walletDocument()));

    await run({ ...validDto, type: "income", amount: 10 });

    expect(transactionGet).toHaveBeenCalledTimes(2);
    expect(transactionUpdate).toHaveBeenCalledWith(
      { kind: "wallet", id: "wallet-1" },
      expect.objectContaining({ balance: 110 }),
    );
  });

  it("keeps an orphaned movement orphaned when the wallet is unchanged", async () => {
    transactionGet.mockResolvedValueOnce(
      snapshot("transaction-1", transactionDocument({ walletId: "-1" })),
    );
    mockGetDoc.mockResolvedValue(snapshot("-1"));

    const result = await run({ ...validDto, walletId: "-1", amount: 30 });

    expect(transactionGet).toHaveBeenCalledTimes(1);
    expect(transactionUpdate).toHaveBeenCalledTimes(1);
    const patch = transactionUpdate.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(patch).not.toHaveProperty("walletName");
    expect(result.wallets).toEqual([]);
  });

  it("falls back to now when createdAt is invalid", async () => {
    transactionGet
      .mockResolvedValueOnce(
        snapshot("transaction-1", transactionDocument({ createdAt: "bad" })),
      )
      .mockResolvedValueOnce(
        snapshot("wallet-1", walletDocument({ balance: 74.5 })),
      );
    mockGetDoc.mockResolvedValue(snapshot("wallet-1", walletDocument()));

    await run();

    const patch = transactionUpdate.mock.calls[1]?.[1] as Record<string, unknown>;
    expect(patch.createdAt).toEqual(expect.any(String));
    expect(patch.createdAt).not.toBe("bad");
  });

  it("preserves the stored group expense link on a personal edit", async () => {
    transactionGet
      .mockResolvedValueOnce(
        snapshot(
          "transaction-1",
          transactionDocument({ groupExpenseId: "group-expense-1" }),
        ),
      )
      .mockResolvedValueOnce(
        snapshot("wallet-1", walletDocument({ balance: 74.5 })),
      );
    mockGetDoc.mockResolvedValue(snapshot("wallet-1", walletDocument()));

    await run({ ...validDto, amount: 30 });

    expect(transactionUpdate).toHaveBeenCalledWith(
      { kind: "transaction", id: "transaction-1" },
      expect.objectContaining({ groupExpenseId: "group-expense-1" }),
    );
  });

  it("preserves the stored group settlement link on a personal edit", async () => {
    transactionGet
      .mockResolvedValueOnce(
        snapshot(
          "transaction-1",
          transactionDocument({
            type: "income",
            groupSettlementId: "group-settlement-1",
          }),
        ),
      )
      .mockResolvedValueOnce(
        snapshot("wallet-1", walletDocument({ balance: 74.5 })),
      );
    mockGetDoc.mockResolvedValue(snapshot("wallet-1", walletDocument()));

    await run({ ...validDto, type: "income", amount: 30 });

    const patch = transactionUpdate.mock.calls.find(
      (call) => (call[0] as { kind?: string }).kind === "transaction",
    )?.[1] as Record<string, unknown>;
    expect(patch).toMatchObject({ groupSettlementId: "group-settlement-1" });
    expect(patch).not.toHaveProperty("settlementId");
  });

  it("rejects editing a soft-deleted movement without touching the wallet", async () => {
    transactionGet.mockResolvedValueOnce(
      snapshot(
        "transaction-1",
        transactionDocument({ deletedAt: "2026-11-20T10:00:00.000Z" }),
      ),
    );

    await expect(run({ ...validDto, amount: 30 })).rejects.toMatchObject({
      code: "TRANSACTION_NOT_FOUND",
    });
    expect(transactionUpdate).not.toHaveBeenCalled();
  });
});
