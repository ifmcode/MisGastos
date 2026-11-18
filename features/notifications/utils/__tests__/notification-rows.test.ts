import { describe, expect, it } from "@jest/globals";

import {
  buildNotification,
  rowContext as context,
} from "./notification-row.fixtures";
import { buildNotificationRow, buildNotificationRows } from "../notification-rows";

describe("buildNotificationRow", () => {
  it("resolves the actor, amount and unread copy from the payload", () => {
    const row = buildNotificationRow(buildNotification(), context);

    expect(row.icon).toBe("checkmark-circle-outline");
    expect(row.unread).toBe(true);
    expect(row.meta).toBe("hace 1 hora");
    expect(row.title).toContain("types.settlement-created.full");
    expect(row.title).toContain("Ana");
    expect(row.title).toContain("12.50 €");
    expect(row.accessibilityLabel).toContain("unread");
  });

  it("falls back to the generic actor and uses the partial sentence", () => {
    const row = buildNotificationRow(
      buildNotification({
        payload: {
          friendUid: "unknown",
          amountCents: 100,
          currency: "USD",
          isFull: false,
        },
      }),
      context,
    );

    expect(row.title).toContain("types.settlement-created.partial");
    expect(row.title).toContain("actorFallback");
  });

  it("adds the wallet hint only when the recipient can link one", () => {
    const linked = buildNotificationRow(
      buildNotification({
        payload: {
          friendUid: "user-a",
          amountCents: 100,
          isFull: false,
          canLinkWallet: true,
        },
      }),
      context,
    );
    const plain = buildNotificationRow(buildNotification(), context);

    expect(linked.accessibilityHint).toContain("row.settlementWalletHint");
    expect(plain.accessibilityHint).not.toContain("row.settlementWalletHint");
  });

  it("marks a read notification and picks the icon of its event", () => {
    const rows = buildNotificationRows(
      [
        buildNotification({ type: "settlement-deleted", readAt: "2026-11-17" }),
        buildNotification({ id: "notification-2", type: "settlement-updated" }),
      ],
      context,
    );

    expect(rows[0].unread).toBe(false);
    expect(rows[0].accessibilityLabel).not.toContain("unread");
    expect(rows.map((row) => row.icon)).toEqual([
      "trash-outline",
      "create-outline",
    ]);
  });

  it("keeps the unread marker on a viewed row", () => {
    const row = buildNotificationRow(
      buildNotification({ seenAt: "2026-11-17T10:05:00.000Z" }),
      context,
    );

    expect(row.unread).toBe(true);
    expect(row.accessibilityLabel).toContain("unread");
  });
});
