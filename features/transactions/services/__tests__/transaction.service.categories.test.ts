import { describe, expect, it } from "@jest/globals";

import { TransactionOperationError } from "../transaction.errors";
import {
  captureError,
  createService,
  validInput,
} from "./transaction-service.fixtures";

describe("TransactionService category checks", () => {
  it("accepts a category owned by the user and matching the type", async () => {
    const { repository, service } = createService();

    await service.createTransaction("user-1", validInput);

    expect(repository.createCalls).toHaveLength(1);
    expect(repository.createCalls[0]).toMatchObject({
      categoryId: "user-1__food",
      type: "expense",
    });
  });

  it("accepts a legacy category id", async () => {
    const { repository, service } = createService();

    await service.createTransaction("user-1", {
      ...validInput,
      categoryId: "food",
    });

    expect(repository.createCalls[0]?.categoryId).toBe("food");
  });

  it("rejects unknown categories before writing", async () => {
    const { repository, service } = createService();

    const error = await captureError(
      service.createTransaction("user-1", {
        ...validInput,
        categoryId: "missing",
      }),
    );

    expect((error as TransactionOperationError).code).toBe(
      "CATEGORY_NOT_FOUND",
    );
    expect(repository.createCalls).toEqual([]);
  });

  it("rejects categories of a different type before writing", async () => {
    const { repository, service } = createService();

    const error = await captureError(
      service.createTransaction("user-1", {
        ...validInput,
        type: "income",
      }),
    );

    expect((error as TransactionOperationError).code).toBe(
      "CATEGORY_TYPE_MISMATCH",
    );
    expect(repository.createCalls).toEqual([]);
  });

  it("applies the same category checks when updating", async () => {
    const { repository, service } = createService();

    const missing = await captureError(
      service.updateTransaction("user-1", "transaction-1", {
        ...validInput,
        categoryId: "missing",
      }),
    );
    await service.updateTransaction("user-1", "transaction-1", validInput);

    expect((missing as TransactionOperationError).code).toBe(
      "CATEGORY_NOT_FOUND",
    );
    expect(repository.updateCalls).toHaveLength(1);
  });
});
