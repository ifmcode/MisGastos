import { describe, expect, it } from "@jest/globals";

import { Transfer } from "../../types/transfer.types";
import { TransferValidationError } from "../transfer.errors";
import { createService, validInput } from "./transfer-service.fixtures";

describe("TransferService.getTransfers", () => {
  it("trims the owner id and delegates to the repository", async () => {
    const { transferRepository, service } = createService();
    const transfers = [
      {
        ...validInput,
        id: "transfer-1",
        ownerId: "user-1",
        createdAt: "2026-10-29T10:00:00.000Z",
        updatedAt: "2026-10-29T10:00:00.000Z",
      },
    ] as Transfer[];
    transferRepository.transfers = transfers;

    await expect(service.getTransfers("  user-1  ")).resolves.toEqual(
      transfers,
    );
    expect(transferRepository.getCalls).toEqual(["user-1"]);
  });

  it("rejects an empty owner id without calling the repository", async () => {
    const { transferRepository, service } = createService();

    await expect(service.getTransfers("   ")).rejects.toBeInstanceOf(
      TransferValidationError,
    );
    expect(transferRepository.getCalls).toEqual([]);
  });

  it("propagates repository failures", async () => {
    const { transferRepository, service } = createService();
    const failure = new Error("firestore unavailable");
    transferRepository.failure = failure;

    await expect(service.getTransfers("user-1")).rejects.toBe(failure);
  });
});
