import { describe, expect, it, jest } from "@jest/globals";

import { TransactionValidationError } from "../transaction.errors";
import {
  captureError,
  createService,
  validInput,
} from "./transaction-service.fixtures";

describe("TransactionService.updateTransaction", () => {
  it("trims both ids and persists the validated movement", async () => {
    const { repository, service } = createService();

    await service.updateTransaction(
      "  user-1  ",
      "  transaction-1  ",
      validInput,
    );

    expect(repository.updateCalls).toHaveLength(1);
    expect(repository.updateCalls[0]?.id).toBe("transaction-1");
    expect(repository.updateCalls[0]?.dto).toEqual(
      expect.objectContaining({ amount: 10.5 }),
    );
  });

  it("rejects a blank owner, a blank id and invalid input", async () => {
    const { repository, service } = createService();

    await expect(
      service.updateTransaction(" ", "transaction-1", validInput),
    ).rejects.toBeInstanceOf(TransactionValidationError);

    await expect(
      service.updateTransaction("user-1", " ", validInput),
    ).rejects.toMatchObject({ code: "TRANSACTION_NOT_FOUND" });

    await expect(
      service.updateTransaction("user-1", "transaction-1", {
        ...validInput,
        concept: "   ",
      }),
    ).rejects.toBeInstanceOf(TransactionValidationError);

    expect(repository.updateCalls).toEqual([]);
  });
});

describe("TransactionService.deleteTransaction", () => {
  it("trims both ids and delegates the delete", async () => {
    const { repository, service } = createService();

    await service.deleteTransaction("  user-1  ", "  transaction-1  ");

    expect(repository.deleteCalls).toEqual(["transaction-1"]);
  });

  it("rejects a blank owner and a blank id", async () => {
    const { service } = createService();

    await expect(
      service.deleteTransaction(" ", "transaction-1"),
    ).rejects.toBeInstanceOf(TransactionValidationError);
    await expect(
      service.deleteTransaction("user-1", " "),
    ).rejects.toMatchObject({ code: "TRANSACTION_NOT_FOUND" });
  });
});

describe("TransactionService failures", () => {
  it("propagates repository errors", async () => {
    const { repository, service } = createService();
    const failure = new Error("write failed");
    repository.createTransaction = jest.fn(async () => {
      throw failure;
    });

    await expect(
      service.createTransaction("user-1", validInput),
    ).rejects.toBe(failure);
  });
});
