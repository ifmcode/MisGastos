import { describe, expect, it, jest } from "@jest/globals";

jest.mock("../group-settlements.operations", () => ({
  GROUP_SETTLEMENTS_COLLECTION: "groupSettlements",
  getGroupSettlementOperation: jest.fn(async () => "read"),
  getGroupSettlementsOperation: jest.fn(async () => ["listed"]),
}));

jest.mock("../group-settlement-create.operation", () => ({
  createGroupSettlementOperation: jest.fn(async () => "created"),
}));

jest.mock("../group-settlement-update.operation", () => ({
  updateGroupSettlementOperation: jest.fn(async () => "updated"),
}));

jest.mock("../group-settlement-delete.operation", () => ({
  softDeleteGroupSettlementOperation: jest.fn(async () => undefined),
}));

import { FirebaseGroupSettlementsRepository } from "../firebase-group-settlements.repository";
import { createGroupSettlementOperation } from "../group-settlement-create.operation";
import { softDeleteGroupSettlementOperation } from "../group-settlement-delete.operation";
import { updateGroupSettlementOperation } from "../group-settlement-update.operation";
import {
  getGroupSettlementOperation,
  getGroupSettlementsOperation,
} from "../group-settlements.operations";

const dto = {
  groupId: "user-a__group-1",
  participantIds: ["user-b", "user-c"],
  pairId: "user-b__user-c",
  fromUserId: "user-b",
  toUserId: "user-c",
  amountCents: 1000,
  currency: "EUR" as const,
  date: "2026-11-10",
  note: "",
  createdBy: "user-b",
  createdAt: "2026-11-10T20:00:00.000Z",
  updatedAt: "2026-11-10T20:00:00.000Z",
  deletedAt: null,
  receiverWalletId: null,
  receiverCategoryId: null,
  receiverTransactionId: null,
};

const update = {
  amountCents: 2000,
  date: "2026-11-11",
  note: "",
  updatedAt: "2026-11-11T10:00:00.000Z",
  receiverWalletId: null,
  receiverCategoryId: null,
};

const notification = {
  userId: "user-c",
  type: "group-settlement" as const,
  payload: {},
  dedupeKey: "group-settlement:group-settlement-1:created:stamp",
  createdAt: "2026-11-10T20:00:00.000Z",
};

describe("FirebaseGroupSettlementsRepository", () => {
  it("delegates the reads to their operations", async () => {
    const repository = new FirebaseGroupSettlementsRepository();

    await expect(repository.getGroupSettlement("group-settlement-1")).resolves.toBe(
      "read",
    );
    await expect(
      repository.getGroupSettlements("user-a__group-1"),
    ).resolves.toEqual(["listed"]);

    expect(getGroupSettlementOperation).toHaveBeenCalledWith(
      "group-settlement-1",
    );
    expect(getGroupSettlementsOperation).toHaveBeenCalledWith(
      "user-a__group-1",
    );
  });

  it("delegates the writes to their operations", async () => {
    const repository = new FirebaseGroupSettlementsRepository();
    const builder = () => notification;

    await expect(
      repository.createGroupSettlement(dto, builder),
    ).resolves.toBe("created");
    await expect(
      repository.updateGroupSettlement(
        "user-c",
        "group-settlement-1",
        update,
        notification,
      ),
    ).resolves.toBe("updated");
    await expect(
      repository.softDeleteGroupSettlement(
        "user-c",
        "group-settlement-1",
        "2026-11-21T10:00:00.000Z",
        notification,
      ),
    ).resolves.toBeUndefined();

    expect(createGroupSettlementOperation).toHaveBeenCalledWith(dto, builder);
    expect(updateGroupSettlementOperation).toHaveBeenCalledWith({
      viewerUid: "user-c",
      settlementId: "group-settlement-1",
      update,
      notification,
    });
    expect(softDeleteGroupSettlementOperation).toHaveBeenCalledWith({
      viewerUid: "user-c",
      settlementId: "group-settlement-1",
      deletedAt: "2026-11-21T10:00:00.000Z",
      notification,
    });
  });
});
