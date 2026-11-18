import { describe, expect, it } from "@jest/globals";

import type { Friend } from "@/features/friends/types/friend.types";

import type { AppNotification } from "../../types/notification.types";
import { buildNotificationRows } from "../notification-rows";

const friends: Friend[] = [
  {
    uid: "user-a",
    displayName: "Ana",
    email: "ana@example.com",
    balances: [],
    since: "2026-01-01",
  },
];

function buildNotification(
  overrides: Partial<AppNotification> = {},
): AppNotification {
  return {
    id: "notification-1",
    userId: "user-b",
    type: "settlement-created",
    payload: {
      settlementId: "settlement-1",
      pairId: "user-a__user-b",
      friendUid: "user-a",
      amountCents: 1250,
      currency: "EUR",
      isFull: true,
      canLinkWallet: false,
    },
    createdAt: "2026-11-17T10:00:00.000Z",
    readAt: null,
    dedupeKey: "settlement-1:created:user-b",
    ...overrides,
  };
}

const context = {
  friends,
  formatCurrency: (value: number) => `${value.toFixed(2)} €`,
  formatDateTime: () => "17/11/2026 10:00",
  t: (key: string, options?: Record<string, unknown>) =>
    options ? `${key}:${JSON.stringify(options)}` : key,
};

describe("buildNotificationRows", () => {
  it("resolves the actor, amount and unread copy from the payload", () => {
    const [row] = buildNotificationRows([buildNotification()], context);

    expect(row.icon).toBe("checkmark-circle-outline");
    expect(row.unread).toBe(true);
    expect(row.meta).toBe("17/11/2026 10:00");
    expect(row.title).toContain("types.settlement-created.full");
    expect(row.title).toContain("Ana");
    expect(row.title).toContain("12.50 €");
    expect(row.accessibilityLabel).toContain("unread");
  });

  it("falls back to the generic actor and uses the partial sentence", () => {
    const [row] = buildNotificationRows(
      [
        buildNotification({
          payload: {
            friendUid: "unknown",
            amountCents: 100,
            currency: "USD",
            isFull: false,
          },
        }),
      ],
      context,
    );

    expect(row.title).toContain("types.settlement-created.partial");
    expect(row.title).toContain("actorFallback");
  });

  it("adds the wallet hint only when the recipient can link one", () => {
    const linked = buildNotificationRows(
      [
        buildNotification({
          payload: {
            friendUid: "user-a",
            amountCents: 100,
            currency: "EUR",
            isFull: false,
            canLinkWallet: true,
          },
        }),
      ],
      context,
    );
    const plain = buildNotificationRows([buildNotification()], context);

    expect(linked[0].accessibilityHint).toContain("row.settlementWalletHint");
    expect(plain[0].accessibilityHint).not.toContain(
      "row.settlementWalletHint",
    );
  });

  it("marks a read notification and picks the icon of its event", () => {
    const rows = buildNotificationRows(
      [
        buildNotification({ type: "settlement-deleted", readAt: "2026-11-17" }),
        buildNotification({
          id: "notification-2",
          type: "settlement-updated",
          dedupeKey: "settlement-1:updated:user-b",
        }),
      ],
      context,
    );

    expect(rows[0].unread).toBe(false);
    expect(rows[0].icon).toBe("trash-outline");
    expect(rows[0].accessibilityLabel).not.toContain("unread");
    expect(rows[1].icon).toBe("create-outline");
  });
});
