import { describe, expect, it, jest } from "@jest/globals";

jest.mock("../settlement-create.operation", () => ({
  createSettlementOperation: jest.fn(async () => "created"),
}));

jest.mock("../settlement-update.operation", () => ({
  updateSettlementOperation: jest.fn(async () => "updated"),
}));

jest.mock("../settlement-delete.operation", () => ({
  softDeleteSettlementOperation: jest.fn(async () => undefined),
}));

jest.mock("../settlements.operations", () => ({
  SETTLEMENTS_COLLECTION: "settlements",
  getSettlementOperation: jest.fn(async () => "read"),
  getSettlementsOperation: jest.fn(async () => ["listed"]),
}));

import { FirebaseSettlementsRepository } from "../firebase-settlements.repository";
import { createSettlementOperation } from "../settlement-create.operation";
import { softDeleteSettlementOperation } from "../settlement-delete.operation";
import { updateSettlementOperation } from "../settlement-update.operation";
import {
  getSettlementOperation,
  getSettlementsOperation,
} from "../settlements.operations";
import type { NotificationWrite } from "@/features/notifications/types/notification.types";
import type { Settlement } from "../../types/settlement.types";
import {
  buildCreateSettlementDto,
  buildSettlementUpdateDto,
} from "./settlement-document.fixtures";

const notification: NotificationWrite = {
  userId: "user-b",
  type: "settlement-created",
  payload: { settlementId: "settlement-1" },
  dedupeKey: "settlement-1:created:user-b",
  createdAt: "2026-11-16T10:00:00.000Z",
};

const buildNotification = (settlement: Settlement) => ({
  ...notification,
  dedupeKey: `${settlement.id}:created:user-b`,
});

describe("FirebaseSettlementsRepository", () => {
  const repository = new FirebaseSettlementsRepository();

  it("delegates the reads", async () => {
    await expect(repository.getSettlement("settlement-1")).resolves.toBe("read");
    await expect(repository.getSettlements("user-a")).resolves.toEqual([
      "listed",
    ]);

    expect(getSettlementOperation).toHaveBeenCalledWith("settlement-1");
    expect(getSettlementsOperation).toHaveBeenCalledWith("user-a");
  });

  it("delegates the transactional writes", async () => {
    const createDto = buildCreateSettlementDto();
    const updateDto = buildSettlementUpdateDto();

    await expect(
      repository.createSettlement(createDto, buildNotification),
    ).resolves.toBe("created");
    await expect(
      repository.updateSettlement("user-b", "settlement-1", updateDto, notification),
    ).resolves.toBe("updated");
    await repository.softDeleteSettlement(
      "user-b",
      "settlement-1",
      "now",
      notification,
    );

    expect(createSettlementOperation).toHaveBeenCalledWith(
      createDto,
      buildNotification,
    );
    expect(updateSettlementOperation).toHaveBeenCalledWith({
      viewerUid: "user-b",
      settlementId: "settlement-1",
      update: updateDto,
      notification,
    });
    expect(softDeleteSettlementOperation).toHaveBeenCalledWith({
      viewerUid: "user-b",
      settlementId: "settlement-1",
      deletedAt: "now",
      notification,
    });
  });
});
