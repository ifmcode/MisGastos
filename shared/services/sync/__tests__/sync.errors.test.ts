import { describe, expect, it } from "@jest/globals";

import { TransactionOperationError } from "@/features/transactions/services/transaction.errors";
import { TransferOperationError } from "@/features/transfers/services/transfer.errors";

import {
  classifySyncError,
  readSyncErrorCode,
  SyncMutationError,
} from "../sync.errors";

describe("classifySyncError", () => {
  it("treats a Firestore connectivity failure as transient", () => {
    for (const code of [
      "unavailable",
      "deadline-exceeded",
      "network-request-failed",
      "resource-exhausted",
      "aborted",
    ]) {
      expect(classifySyncError({ code })).toEqual({
        status: "retry",
        errorCode: code,
      });
    }
  });

  it("maps a revision mismatch to REMOTE_CHANGED", () => {
    expect(classifySyncError(new SyncMutationError("REMOTE_CHANGED"))).toEqual({
      status: "conflict",
      kind: "REMOTE_CHANGED",
      errorCode: "SYNC_REMOTE_CHANGED",
    });
  });

  it.each([
    ["TRANSACTION_NOT_FOUND", "DELETED_REMOTELY"],
    ["TRANSFER_NOT_FOUND", "DELETED_REMOTELY"],
    ["WALLET_NOT_FOUND", "WALLET_UNAVAILABLE"],
    ["WALLET_NOT_OWNED", "WALLET_UNAVAILABLE"],
    ["CURRENCY_MISMATCH", "WALLET_UNAVAILABLE"],
    ["FROM_WALLET_NOT_FOUND", "WALLET_UNAVAILABLE"],
    ["TO_WALLET_NOT_FOUND", "WALLET_UNAVAILABLE"],
    ["INSUFFICIENT_FUNDS", "INSUFFICIENT_FUNDS"],
    ["TRANSACTION_INVALID", "INVALID"],
    ["TRANSFER_INVALID", "INVALID"],
    ["SAME_WALLET", "INVALID"],
  ])("maps the domain code %s to %s", (code, kind) => {
    expect(classifySyncError({ code })).toEqual({
      status: "conflict",
      kind,
      errorCode: code,
    });
  });

  it("reads domain errors through their own class", () => {
    expect(
      classifySyncError(new TransferOperationError("INSUFFICIENT_FUNDS")),
    ).toMatchObject({ status: "conflict", kind: "INSUFFICIENT_FUNDS" });
    expect(
      classifySyncError(new TransactionOperationError("TRANSACTION_NOT_FOUND")),
    ).toMatchObject({ status: "conflict", kind: "DELETED_REMOTELY" });
  });

  it("maps Firestore argument failures to INVALID and not-found to a delete", () => {
    expect(classifySyncError({ code: "invalid-argument" })).toMatchObject({
      status: "conflict",
      kind: "INVALID",
    });
    expect(classifySyncError({ code: "failed-precondition" })).toMatchObject({
      status: "conflict",
      kind: "INVALID",
    });
    expect(classifySyncError({ code: "not-found" })).toMatchObject({
      status: "conflict",
      kind: "DELETED_REMOTELY",
    });
  });

  it("treats anything else as a permanent failure", () => {
    expect(classifySyncError({ code: "permission-denied" })).toEqual({
      status: "failed",
      errorCode: "permission-denied",
    });
    expect(classifySyncError(new Error("boom"))).toEqual({
      status: "failed",
      errorCode: "SYNC_UNKNOWN_ERROR",
    });
  });
});

describe("readSyncErrorCode", () => {
  it("keeps the technical code of a SyncMutationError", () => {
    expect(
      readSyncErrorCode(new SyncMutationError("INVALID", "SYNC_SNAPSHOT_INVALID")),
    ).toBe("SYNC_SNAPSHOT_INVALID");
  });

  it("falls back to UNKNOWN for malformed errors", () => {
    expect(readSyncErrorCode(null)).toBe("SYNC_UNKNOWN_ERROR");
    expect(readSyncErrorCode({ code: "" })).toBe("SYNC_UNKNOWN_ERROR");
  });
});
