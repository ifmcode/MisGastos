import { describe, expect, it } from "@jest/globals";

import { formatMoney } from "@/features/wallets/utils/money";
import type { LocalConflict } from "@/shared/lib/local-db/local-db.types";

import {
  DELETED_STATUS_VALUE,
  toSyncConflictView,
} from "../sync-conflict-view";

function buildConflict(overrides: Partial<LocalConflict> = {}): LocalConflict {
  return {
    id: "owner-1__m1",
    ownerId: "owner-1",
    clientMutationId: "m1",
    entityType: "transaction",
    entityId: "tx-1",
    kind: "REMOTE_CHANGED",
    localSnapshot: {
      amount: 25.5,
      currency: "EUR",
      concept: "Supermercado",
      walletId: "wallet-1",
      date: "2026-11-26",
    },
    remoteSnapshot: {
      amount: 30,
      currency: "EUR",
      concept: "Cena",
      walletId: "wallet-2",
      date: "2026-11-27",
      deletedAt: "2026-11-27T10:00:00.000Z",
    },
    detectedAt: "2026-11-26T10:00:00.000Z",
    resolvedAt: null,
    resolution: null,
    ...overrides,
  };
}

describe("toSyncConflictView", () => {
  it("exposes the kind copy and both decisions for a concurrent edit", () => {
    const view = toSyncConflictView(buildConflict());

    expect(view).toMatchObject({
      id: "owner-1__m1",
      kind: "REMOTE_CHANGED",
      titleKey: "conflict.kinds.REMOTE_CHANGED.title",
      descriptionKey: "conflict.kinds.REMOTE_CHANGED.description",
      options: ["keep-mine", "keep-remote"],
    });
  });

  it("only offers discarding a wallet problem", () => {
    const view = toSyncConflictView(
      buildConflict({ kind: "WALLET_UNAVAILABLE" }),
    );

    expect(view.options).toEqual(["keep-remote"]);
    expect(view.titleKey).toBe("conflict.kinds.WALLET_UNAVAILABLE.title");
  });

  it("formats the highlighted values of the local change", () => {
    const view = toSyncConflictView(buildConflict());

    expect(view.mine).toEqual([
      { key: "amount", value: formatMoney(25.5, "EUR") },
      { key: "concept", value: "Supermercado" },
      { key: "wallet", value: "wallet-1" },
      { key: "date", value: "2026-11-26" },
    ]);
  });

  it("describes a transfer by its two wallets and flags a deleted record", () => {
    const view = toSyncConflictView(
      buildConflict({
        entityType: "transfer",
        localSnapshot: {
          amount: 10,
          currency: "EUR",
          fromWalletId: "wallet-1",
          toWalletId: "wallet-2",
        },
        remoteSnapshot: { deletedAt: "2026-11-27T10:00:00.000Z" },
      }),
    );

    expect(view.mine).toContainEqual({
      key: "wallet",
      value: "wallet-1 → wallet-2",
    });
    expect(view.remote).toEqual([
      { key: "status", value: DELETED_STATUS_VALUE },
    ]);
  });

  it("uses the wallet names when the screen provides them", () => {
    const view = toSyncConflictView(
      buildConflict(),
      new Map([
        ["wallet-1", "Cuenta principal"],
        ["wallet-2", "Ahorro"],
      ]),
    );

    expect(view.mine).toContainEqual({
      key: "wallet",
      value: "Cuenta principal",
    });
    expect(view.remote).toContainEqual({ key: "wallet", value: "Ahorro" });
  });

  it("describes a social movement by its cents, description and receiver wallet", () => {
    const view = toSyncConflictView(
      buildConflict({
        entityType: "settlement",
        localSnapshot: {
          amountCents: 1050,
          currency: "EUR",
          note: "Cena",
          receiverWalletId: "wallet-1",
          date: "2026-11-26",
        },
        remoteSnapshot: {
          amountCents: 2000,
          currency: "EUR",
          description: "Lunch",
          receiverWalletId: "wallet-2",
        },
      }),
      new Map([["wallet-1", "Cuenta principal"]]),
    );

    expect(view.mine).toEqual([
      { key: "amount", value: formatMoney(10.5, "EUR") },
      { key: "concept", value: "Cena" },
      { key: "wallet", value: "Cuenta principal" },
      { key: "date", value: "2026-11-26" },
    ]);
    expect(view.remote).toContainEqual({ key: "concept", value: "Lunch" });
    expect(view.remote).toContainEqual({ key: "wallet", value: "wallet-2" });
  });

  it("ignores malformed snapshots instead of throwing", () => {
    const view = toSyncConflictView(
      buildConflict({ localSnapshot: {}, remoteSnapshot: {} }),
    );

    expect(view.mine).toEqual([]);
    expect(view.remote).toEqual([]);
  });
});
