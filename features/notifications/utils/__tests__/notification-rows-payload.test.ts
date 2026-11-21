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

  it("names the actor and the group of a group invite", () => {
    const row = buildNotificationRow(
      buildNotification({
        type: "group-invite",
        payload: { groupName: " Viaje ", friendUid: "user-a" },
      }),
      context,
    );

    expect(row.title).toContain("types.group-invite");
    expect(row.title).toContain('"name":"Ana"');
    expect(row.title).toContain('"group":"Viaje"');
    expect(row.icon).toBe("mail-unread-outline");
  });

  it("survives a group invite without a usable group name", () => {
    const row = buildNotificationRow(
      buildNotification({
        type: "group-invite",
        payload: { groupName: 42, friendUid: "user-a" },
      }),
      context,
    );

    expect(row.title).toContain('"group":""');
  });

  it("uses only the group name for a join-code event", () => {
    const types = [
      "group-join-request",
      "group-join-accepted",
      "group-join-rejected",
    ] as const;
    const rows = buildNotificationRows(
      types.map((type, index) =>
        buildNotification({
          id: `join-${index}`,
          type,
          payload: { groupName: " Viaje ", friendUid: "user-a" },
        }),
      ),
      context,
    );

    expect(rows[0].title).toBe('types.group-join-request:{"group":"Viaje"}');
    expect(rows[0].title).not.toContain("Ana");
    expect(rows.map((row) => row.icon)).toEqual([
      "person-add-outline",
      "checkmark-circle-outline",
      "close-circle-outline",
    ]);
  });

  it("prefers an already resolved actor name, as the banner does", () => {    const row = buildNotificationRow(buildNotification(), {
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
