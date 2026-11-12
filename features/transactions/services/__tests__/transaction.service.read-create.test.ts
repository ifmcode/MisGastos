import { describe, expect, it } from "@jest/globals";

import { TransactionValidationError } from "../transaction.errors";
import {
  captureError,
  createService,
  createServiceWithCategory,
  expenseCategory,
  validInput,
} from "./transaction-service.fixtures";

const input = {
  ...validInput,
  amount: "25,50",
  walletId: "  wallet-1  ",
  concept: "  Supermercado  ",
  notes: "  Compra semanal  ",
  date: "12/11/2026",
};

describe("TransactionService.getTransactions", () => {
  it("trims the owner id", async () => {
    const { repository, service } = createService();

    await service.getTransactions("  user-1  ");

    expect(repository.getCalls).toEqual(["user-1"]);
  });

  it("rejects a blank owner id", async () => {
    const { service } = createService();

    const error = await captureError(service.getTransactions("   "));

    expect(error).toBeInstanceOf(TransactionValidationError);
    expect(
      (error as TransactionValidationError).fieldErrors.ownerId,
    ).toBeDefined();
  });
});

describe("TransactionService.createTransaction", () => {
  it("validates, checks the category and persists normalized data", async () => {
    const { repository, service } = createService();

    await service.createTransaction("  user-1  ", input);

    expect(repository.createCalls).toHaveLength(1);
    expect(repository.createCalls[0]).toEqual({
      type: "expense",
      amount: 25.5,
      currency: "EUR",
      walletId: "wallet-1",
      categoryId: "user-1__food",
      concept: "Supermercado",
      notes: "Compra semanal",
      date: "2026-11-12",
    });
  });

  it("reports the owner and field issues together", async () => {
    const { repository, service } = createService();

    const error = await captureError(
      service.createTransaction("  ", { ...input, amount: "0" }),
    );

    expect(error).toBeInstanceOf(TransactionValidationError);
    if (!(error instanceof TransactionValidationError)) return;
    expect(error.fieldErrors.ownerId).toBeDefined();
    expect(error.fieldErrors.amount).toBeDefined();
    expect(repository.createCalls).toEqual([]);
  });

  it("rejects only the owner when the input is valid", async () => {
    const { service } = createService();

    const error = await captureError(service.createTransaction(" ", input));

    expect(error).toBeInstanceOf(TransactionValidationError);
    if (!(error instanceof TransactionValidationError)) return;
    expect(error.fieldErrors).toEqual({
      ownerId: "OWNER_REQUIRED",
    });
  });

  it("rejects a missing category and a type mismatch", async () => {
    const missing = createServiceWithCategory(null);
    await expect(
      captureError(missing.service.createTransaction("user-1", input)),
    ).resolves.toMatchObject({ code: "CATEGORY_NOT_FOUND" });

    const mismatch = createServiceWithCategory({
      ...expenseCategory,
      type: "income",
    });
    await expect(
      captureError(mismatch.service.createTransaction("user-1", input)),
    ).resolves.toMatchObject({ code: "CATEGORY_TYPE_MISMATCH" });
  });
});
