import { describe, expect, it, jest } from "@jest/globals";

jest.mock("../group-expenses.operations", () => ({
  GROUP_EXPENSES_COLLECTION: "groupExpenses",
  createGroupExpenseOperation: jest.fn(async () => "created"),
  getGroupExpenseOperation: jest.fn(async () => "read"),
  getGroupExpensesOperation: jest.fn(async () => ["listed"]),
  softDeleteGroupExpenseOperation: jest.fn(async () => undefined),
  updateGroupExpenseOperation: jest.fn(async () => "updated"),
}));

import { FirebaseGroupExpensesRepository } from "../firebase-group-expenses.repository";
import {
  createGroupExpenseOperation,
  getGroupExpenseOperation,
  getGroupExpensesOperation,
  softDeleteGroupExpenseOperation,
  updateGroupExpenseOperation,
} from "../group-expenses.operations";
import {
  buildCreateDto,
  buildUpdateDto,
} from "./group-expense-document.fixtures";

describe("FirebaseGroupExpensesRepository", () => {
  it("delegates every method to its operation", async () => {
    const repository = new FirebaseGroupExpensesRepository();
    const createDto = buildCreateDto();
    const updateDto = buildUpdateDto();

    await expect(repository.getExpense("expense-1")).resolves.toBe("read");
    await expect(repository.getGroupExpenses("group-1")).resolves.toEqual([
      "listed",
    ]);
    await expect(repository.createExpense(createDto)).resolves.toBe("created");
    await expect(
      repository.updateExpense("expense-1", updateDto),
    ).resolves.toBe("updated");
    await expect(
      repository.softDeleteExpense("expense-1", "2026-11-15T10:00:00.000Z"),
    ).resolves.toBeUndefined();

    expect(getGroupExpenseOperation).toHaveBeenCalledWith("expense-1");
    expect(getGroupExpensesOperation).toHaveBeenCalledWith("group-1");
    expect(createGroupExpenseOperation).toHaveBeenCalledWith(createDto);
    expect(updateGroupExpenseOperation).toHaveBeenCalledWith(
      "expense-1",
      updateDto,
    );
    expect(softDeleteGroupExpenseOperation).toHaveBeenCalledWith(
      "expense-1",
      "2026-11-15T10:00:00.000Z",
    );
  });
});
