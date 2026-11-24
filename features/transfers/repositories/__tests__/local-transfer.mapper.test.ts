import { describe, expect, it } from "@jest/globals";

import type { LocalRow } from "@/shared/lib/local-db/local-db.types";

import {
  fromTransferLocalRow,
  toTransferLocalRow,
} from "../local-transfer.mapper";
import { buildTransfer } from "./local-transfer.fixtures";

describe("local transfer mapper", () => {
  it("round-trips a transfer through its storage row", () => {
    const transfer = buildTransfer();

    expect(fromTransferLocalRow(toTransferLocalRow(transfer))).toEqual(
      transfer,
    );
  });

  it("keeps the stored wallet names", () => {
    const row = toTransferLocalRow(buildTransfer());

    expect(row.fromWalletName).toBe("Cuenta principal");
    expect(row.toWalletName).toBe("Ahorros");
    expect(row.syncStatus).toBe("synced");
  });

  it("stores optional fields as null", () => {
    const row = toTransferLocalRow(
      buildTransfer({
        fromWalletName: undefined,
        toWalletName: undefined,
        notes: undefined,
        deletedAt: undefined,
      }),
    );

    expect(row.fromWalletName).toBeNull();
    expect(row.toWalletName).toBeNull();
    expect(row.notes).toBeNull();
    expect(row.deletedAt).toBeNull();
  });

  it("falls back to the epoch for malformed audit dates", () => {
    const row = toTransferLocalRow(
      buildTransfer({ createdAt: "not-a-date", updatedAt: "not-a-date" }),
    );

    expect(row.createdAt).toBe(new Date(0).toISOString());
    expect(row.updatedAt).toBe(new Date(0).toISOString());
  });

  it("drops a row the transfer document mapper rejects", () => {
    const row = toTransferLocalRow(buildTransfer());

    expect(
      fromTransferLocalRow({ ...row, toWalletId: row.fromWalletId }),
    ).toBeNull();
    expect(fromTransferLocalRow({ ...row, amount: 0 })).toBeNull();
  });

  it("drops a row without an addressable id", () => {
    const row: LocalRow = {
      ...toTransferLocalRow(buildTransfer()),
      id: null,
    };

    expect(fromTransferLocalRow(row)).toBeNull();
  });
});
