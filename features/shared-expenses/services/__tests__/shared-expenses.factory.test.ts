import { describe, expect, it, jest } from "@jest/globals";

jest.mock("../../repositories/firebase-shared-expenses.repository", () => ({
  FirebaseSharedExpensesRepository: jest.fn(() => ({ kind: "expenses" })),
}));

jest.mock("@/features/friends/repositories/firebase-friends.repository", () => ({
  FirebaseFriendsRepository: jest.fn(() => ({ kind: "friends" })),
}));

import { FirebaseSharedExpensesRepository } from "../../repositories/firebase-shared-expenses.repository";
import { getSharedExpensesService } from "../shared-expenses.factory";

describe("getSharedExpensesService", () => {
  it("reuses one service wired to Firestore and the friends repository", () => {
    const service = getSharedExpensesService();

    expect(getSharedExpensesService()).toBe(service);
    expect(FirebaseSharedExpensesRepository).toHaveBeenCalledTimes(1);
  });
});
