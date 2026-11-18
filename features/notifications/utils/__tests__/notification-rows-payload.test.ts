import { describe, expect, it } from "@jest/globals";

import {
  buildNotification,
  rowContext as context,
} from "./notification-row.fixtures";
import { buildNotificationRow, buildNotificationRows } from "../notification-rows";

describe("buildNotificationRow payload resolution", () => {
  it("uses the flat sentence and the icon of a reserved type", () => {
    const types = [
      "friend-request",
      "friend-request-accepted",
      "group-expense",
      "group-settlement",
    ] as const;
    const rows = buildNotificationRows(
      types.map((type, index) => buildNotification({ id: `n-${index}`, type })),
      context,
    );

    expect(rows[0].title).toBe('types.friend-request:{"name":"Ana"}');
    expect(rows[2].title).not.toContain("12.50 €");
    expect(rows.map((row) => row.icon)).toEqual([
      "person-add-outline",
      "person-circle-outline",
      "people-outline",
      "swap-horizontal-outline",
    ]);
  });

  it("prefers an already resolved actor name, as the banner does", () => {
    const row = buildNotificationRow(buildNotification(), {
      ...context,
      actorName: "María",
    });

    expect(row.title).toContain("María");
    expect(row.title).not.toContain("Ana");
  });

  it("survives a malformed payload without throwing", () => {
    const row = buildNotificationRow(
      buildNotification({ payload: { friendUid: 42, amountCents: "x" } }),
      context,
    );

    expect(row.title).toContain("actorFallback");
    expect(row.title).toContain("0.00 €");
  });
});
