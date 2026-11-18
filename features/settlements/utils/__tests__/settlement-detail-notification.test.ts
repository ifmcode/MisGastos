import { describe, expect, it } from "@jest/globals";

import { buildSettlement } from "./settlement.fixtures";
import {
  buildSettlementViewerDetail,
  getSettlementDetailStatus,
} from "../settlement-detail";
import {
  buildSettlementDedupeKey,
  buildSettlementNotificationInput,
} from "../settlement-notification";

describe("buildSettlementViewerDetail", () => {
  it("projects the creditor side with the pending wallet link", () => {
    const settlement = buildSettlement({ toUserId: "user-b" });
    const detail = buildSettlementViewerDetail(settlement, "user-b");

    expect(detail).toMatchObject({
      friendUid: "user-a",
      viewerIsCreditor: true,
      isActive: true,
      hasReceiverWallet: false,
      canLinkWallet: true,
      canEditAmount: true,
    });
  });

  it("hides the link from the debtor and disables it once a movement exists", () => {
    const settlement = buildSettlement({
      receiverWalletId: "wallet-1",
      receiverCategoryId: "category-1",
      receiverTransactionId: "movement-1",
    });

    expect(buildSettlementViewerDetail(settlement, "user-a")).toMatchObject({
      viewerIsCreditor: false,
      hasReceiverWallet: true,
      canLinkWallet: false,
      canEditAmount: false,
    });
  });

  it("returns null for an outsider or a malformed pair", () => {
    expect(
      buildSettlementViewerDetail(buildSettlement(), "user-c"),
    ).toBeNull();
    expect(
      buildSettlementViewerDetail(
        buildSettlement({ participantIds: ["user-a"] }),
        "user-a",
      ),
    ).toBeNull();
  });

  it("does not offer the link on a soft-deleted settlement", () => {
    const detail = buildSettlementViewerDetail(
      buildSettlement({ deletedAt: "2026-11-16T10:00:00.000Z" }),
      "user-b",
    );

    expect(detail).toMatchObject({ isActive: false, canLinkWallet: false });
  });
});

describe("getSettlementDetailStatus", () => {
  const settlement = buildSettlement();
  const detail = buildSettlementViewerDetail(settlement, "user-a");

  it("resolves a loaded record before a stale list error", () => {
    expect(
      getSettlementDetailStatus({
        settlement,
        detail,
        loading: true,
        error: "boom",
      }),
    ).toBe("ready");
  });

  it("treats a record without a projection as missing", () => {
    expect(
      getSettlementDetailStatus({
        settlement,
        detail: null,
        loading: false,
        error: null,
      }),
    ).toBe("missing");
  });

  it("maps the empty list states to loading, error or missing", () => {
    expect(
      getSettlementDetailStatus({
        settlement: null,
        detail: null,
        loading: true,
        error: null,
      }),
    ).toBe("loading");
    expect(
      getSettlementDetailStatus({
        settlement: null,
        detail: null,
        loading: false,
        error: "boom",
      }),
    ).toBe("error");
    expect(
      getSettlementDetailStatus({
        settlement: null,
        detail: null,
        loading: false,
        error: null,
      }),
    ).toBe("missing");
  });
});

describe("buildSettlementNotificationInput", () => {
  const settlement = buildSettlement({
    updatedAt: "2026-11-16T10:00:00.000Z",
  });

  it("notifies the other participant with ids, numbers and booleans", () => {
    const notification = buildSettlementNotificationInput({
      settlement,
      event: "created",
      recipientUid: "user-b",
      actorUid: "user-a",
      isFull: true,
      canLinkWallet: true,
    });

    expect(notification).toEqual({
      userId: "user-b",
      type: "settlement-created",
      payload: {
        settlementId: "settlement-1",
        pairId: "user-a__user-b",
        friendUid: "user-a",
        amountCents: 1000,
        currency: "EUR",
        isFull: true,
        canLinkWallet: true,
      },
      dedupeKey: "settlement-1:created:user-b",
      createdAt: "2026-11-16T10:00:00.000Z",
    });
  });

  it("keeps the same dedupe key for create and delete events", () => {
    const created = buildSettlementNotificationInput({
      settlement,
      event: "created",
      recipientUid: "user-b",
      actorUid: "user-a",
      isFull: false,
      canLinkWallet: false,
    });
    const deleted = buildSettlementNotificationInput({
      settlement,
      event: "deleted",
      recipientUid: "user-b",
      actorUid: "user-a",
      isFull: false,
      canLinkWallet: false,
    });

    expect(created.dedupeKey).toBe("settlement-1:created:user-b");
    expect(deleted.dedupeKey).toBe("settlement-1:deleted:user-b");
    expect(deleted.type).toBe("settlement-deleted");
  });

  it("appends updatedAt to an update key so a real edit notifies once", () => {
    const notification = buildSettlementNotificationInput({
      settlement,
      event: "updated",
      recipientUid: "user-a",
      actorUid: "user-b",
      isFull: false,
      canLinkWallet: true,
    });

    expect(notification.type).toBe("settlement-updated");
    expect(notification.dedupeKey).toBe(
      "settlement-1:updated:user-a:2026-11-16T10:00:00.000Z",
    );
  });

  it("builds the deterministic key without the settlement object", () => {
    expect(
      buildSettlementDedupeKey({
        settlementId: "settlement-1",
        event: "updated",
        recipientUid: "user-a",
        updatedAt: "2026-11-16T10:00:00.000Z",
      }),
    ).toBe("settlement-1:updated:user-a:2026-11-16T10:00:00.000Z");
  });
});
