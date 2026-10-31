import { describe, expect, it } from "@jest/globals";

import { TransferOperationError, TransferValidationError } from "../transfer.errors";
import {
  buildTransfer,
  captureError,
  createService,
} from "./transfer-service.fixtures";

describe("TransferService.deleteTransfer", () => {
  it("trims ids and delegates the soft delete", async () => {
    const { transferRepository, service } = createService();
    transferRepository.transferById = buildTransfer();

    const result = await service.deleteTransfer(
      "  user-1  ",
      "  transfer-1  ",
    );

    expect(transferRepository.deleteCalls).toEqual([
      { ownerId: "user-1", transferId: "transfer-1" },
    ]);
    expect(result.transfer.deletedAt).toBeDefined();
  });

  it("requires an owner id", async () => {
    const { transferRepository, service } = createService();

    await expect(
      service.deleteTransfer("   ", "transfer-1"),
    ).rejects.toBeInstanceOf(TransferValidationError);

    expect(transferRepository.deleteCalls).toEqual([]);
  });

  it("rejects an empty transfer id", async () => {
    const { transferRepository, service } = createService();

    const error = await captureError(
      service.deleteTransfer("user-1", "   "),
    );

    expect(error).toBeInstanceOf(TransferOperationError);
    if (!(error instanceof TransferOperationError)) return;

    expect(error.code).toBe("TRANSFER_NOT_FOUND");
    expect(transferRepository.deleteCalls).toEqual([]);
  });

  it("propagates repository failures", async () => {
    const { transferRepository, service } = createService();
    const failure = new Error("delete failed");
    transferRepository.failure = failure;

    await expect(
      service.deleteTransfer("user-1", "transfer-1"),
    ).rejects.toBe(failure);
  });
});
