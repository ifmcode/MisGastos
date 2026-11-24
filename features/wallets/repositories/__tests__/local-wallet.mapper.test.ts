import { describe, expect, it } from "@jest/globals";

import type { LocalRow } from "@/shared/lib/local-db/local-db.types";

import { fromWalletLocalRow, toWalletLocalRow } from "../local-wallet.mapper";
import { buildWallet } from "./local-wallet.fixtures";

describe("local wallet mapper", () => {
  it("round-trips a wallet through its storage row", () => {
    const wallet = buildWallet();

    expect(fromWalletLocalRow(toWalletLocalRow(wallet))).toEqual(wallet);
  });

  it("stores the balance in serverBalance and marks the row synced", () => {
    const row = toWalletLocalRow(buildWallet({ includeInTotal: false }));

    expect(row.serverBalance).toBe(150.5);
    expect(row.includeInTotal).toBe(0);
    expect(row.syncStatus).toBe("synced");
  });

  it("stores optional fields as null and defaults a missing total flag", () => {
    const row = toWalletLocalRow(
      buildWallet({ description: undefined, archivedAt: undefined }),
    );

    expect(row.description).toBeNull();
    expect(row.archivedAt).toBeNull();
    expect(
      fromWalletLocalRow({ ...row, includeInTotal: null })?.includeInTotal,
    ).toBe(true);
  });

  it("falls back to the epoch for malformed audit dates", () => {
    const row = toWalletLocalRow(
      buildWallet({ createdAt: "not-a-date", updatedAt: "not-a-date" }),
    );

    expect(row.createdAt).toBe(new Date(0).toISOString());
    expect(row.updatedAt).toBe(new Date(0).toISOString());
  });

  it("drops a row the wallet document mapper rejects", () => {
    const row = toWalletLocalRow(buildWallet());

    expect(fromWalletLocalRow({ ...row, name: "   " })).toBeNull();
    expect(fromWalletLocalRow({ ...row, currency: "BTC" })).toBeNull();
  });

  it("drops a row without an addressable id", () => {
    const row: LocalRow = { ...toWalletLocalRow(buildWallet()), id: null };

    expect(fromWalletLocalRow(row)).toBeNull();
  });
});
