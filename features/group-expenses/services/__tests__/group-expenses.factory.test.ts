import { describe, expect, it, jest } from "@jest/globals";

jest.mock("../../repositories/firebase-group-expenses.repository", () => ({
  FirebaseGroupExpensesRepository: jest.fn(() => ({ kind: "group-expenses" })),
}));

jest.mock("@/features/groups/repositories/firebase-groups.repository", () => ({
  FirebaseGroupsRepository: jest.fn(() => ({ kind: "groups" })),
}));

import { FirebaseGroupsRepository } from "@/features/groups/repositories/firebase-groups.repository";

import { FirebaseGroupExpensesRepository } from "../../repositories/firebase-group-expenses.repository";
import { getGroupExpensesService } from "../group-expenses.factory";

describe("getGroupExpensesService", () => {
  it("reuses one service wired to Firestore and the groups repository", () => {
    const service = getGroupExpensesService();

    expect(getGroupExpensesService()).toBe(service);
    expect(FirebaseGroupExpensesRepository).toHaveBeenCalledTimes(1);
    expect(FirebaseGroupsRepository).toHaveBeenCalledTimes(1);
  });
});
