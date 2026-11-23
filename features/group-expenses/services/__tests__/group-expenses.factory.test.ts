import { describe, expect, it, jest } from "@jest/globals";

jest.mock("../../repositories/firebase-group-expenses.repository", () => ({
  FirebaseGroupExpensesRepository: jest.fn(() => ({ kind: "group-expenses" })),
}));

jest.mock("../../repositories/firebase-group-settlements.repository", () => ({
  FirebaseGroupSettlementsRepository: jest.fn(() => ({ kind: "settlements" })),
}));

jest.mock("@/features/groups/repositories/firebase-groups.repository", () => ({
  FirebaseGroupsRepository: jest.fn(() => ({ kind: "groups" })),
}));

import { FirebaseGroupsRepository } from "@/features/groups/repositories/firebase-groups.repository";

import { FirebaseGroupExpensesRepository } from "../../repositories/firebase-group-expenses.repository";
import { FirebaseGroupSettlementsRepository } from "../../repositories/firebase-group-settlements.repository";
import { getGroupExpensesService } from "../group-expenses.factory";

describe("getGroupExpensesService", () => {
  it("reuses one service wired to Firestore, the groups and settlements repositories", () => {
    const service = getGroupExpensesService();

    expect(getGroupExpensesService()).toBe(service);
    expect(FirebaseGroupExpensesRepository).toHaveBeenCalledTimes(1);
    expect(FirebaseGroupsRepository).toHaveBeenCalledTimes(1);
    expect(FirebaseGroupSettlementsRepository).toHaveBeenCalledTimes(1);
  });
});
