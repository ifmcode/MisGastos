import { describe, expect, it } from "@jest/globals";

import type {
  GroupActivity,
  GroupActivityType,
} from "../../types/group-activity.types";
import type { GroupMember } from "../../types/group.types";
import {
  getGroupActivityDate,
  getGroupActivityDestination,
  getGroupActivityDisplay,
  getGroupActivityDisplays,
  resolveGroupMemberName,
} from "../group-activity-display";

const MEMBERS: readonly GroupMember[] = [
  { uid: "ana", displayName: "Ana", email: "ana@example.com", role: "owner" },
  {
    uid: "luis",
    displayName: null,
    email: "luis@example.com",
    role: "member",
  },
  { uid: "sin-nombre", displayName: null, email: "", role: "member" },
];

function makeActivity(
  overrides: Partial<GroupActivity> = {},
): GroupActivity {
  return {
    id: "activity-1",
    type: "expense-created",
    groupId: "group-1",
    actorId: "ana",
    targetUserId: null,
    targetName: null,
    expenseId: "expense-1",
    settlementId: null,
    amountCents: 1234,
    currency: "EUR",
    description: "Cena",
    changedFields: [],
    simplifyDebts: null,
    previousOwnerId: null,
    newOwnerId: null,
    fromUserId: null,
    toUserId: null,
    createdAt: "2026-11-20T10:00:00.000Z",
    ...overrides,
  };
}

const LABELS = { viewerName: "ti", unknownMember: "Miembro desconocido" };
const OPTIONS = { members: MEMBERS, viewerUid: "luis", ...LABELS };

function optionsFor(viewerUid: string) {
  return { members: MEMBERS, viewerUid, ...LABELS };
}

describe("resolveGroupMemberName", () => {
  it("prefers the profile name and falls back to the email", () => {
    expect(resolveGroupMemberName(MEMBERS, "ana")).toBe("Ana");
    expect(resolveGroupMemberName(MEMBERS, "luis")).toBe("luis@example.com");
  });

  it("returns null for a blank uid, an unknown uid or a member without info", () => {
    expect(resolveGroupMemberName(MEMBERS, null)).toBeNull();
    expect(resolveGroupMemberName(MEMBERS, "  ")).toBeNull();
    expect(resolveGroupMemberName(MEMBERS, "nadie")).toBeNull();
    expect(resolveGroupMemberName(MEMBERS, "sin-nombre")).toBeNull();
  });
});

describe("getGroupActivityDisplay", () => {
  it("keeps the structured payload and the id as key", () => {
    const display = getGroupActivityDisplay(makeActivity(), OPTIONS);

    expect(display).toEqual({
      key: "activity-1",
      type: "expense-created",
      actorName: "Ana",
      targetName: null,
      fromName: null,
      toName: null,
      isMemberAddition: false,
      isViewerActor: false,
      isViewerTarget: false,
      amountCents: 1234,
      currency: "EUR",
      description: "Cena",
      changedFields: [],
      simplifyDebts: null,
      expenseId: "expense-1",
      settlementId: null,
      createdAt: "2026-11-20T10:00:00.000Z",
    });
  });

  it("flags the viewer as actor and as target", () => {
    const asActor = getGroupActivityDisplay(makeActivity(), optionsFor("ana"));
    const asTarget = getGroupActivityDisplay(
      makeActivity({
        type: "member-removed",
        actorId: "ana",
        targetUserId: "luis",
      }),
      optionsFor("luis"),
    );

    expect(asActor.isViewerActor).toBe(true);
    expect(asActor.isViewerTarget).toBe(false);
    expect(asTarget.isViewerActor).toBe(false);
    expect(asTarget.isViewerTarget).toBe(true);
  });

  it("does not flag a viewer who is not part of the event", () => {
    const display = getGroupActivityDisplay(
      makeActivity(),
      optionsFor("otro"),
    );

    expect(display.isViewerActor).toBe(false);
    expect(display.isViewerTarget).toBe(false);
  });

  it("uses the target snapshot when the removed member left the group", () => {
    const display = getGroupActivityDisplay(
      makeActivity({
        type: "member-removed",
        actorId: "ana",
        targetUserId: "fuera",
        targetName: "Marta",
      }),
      OPTIONS,
    );

    expect(display.targetName).toBe("Marta");
    expect(display.isViewerTarget).toBe(false);
  });

  it("prefers the current member name over the snapshot", () => {
    const display = getGroupActivityDisplay(
      makeActivity({
        type: "member-left",
        actorId: "ana",
        targetUserId: "luis",
        targetName: "Nombre antiguo",
      }),
      OPTIONS,
    );

    expect(display.targetName).toBe("luis@example.com");
  });

  it("resolves an owner transfer through the new owner", () => {
    const display = getGroupActivityDisplay(
      makeActivity({
        type: "owner-transferred",
        actorId: "ana",
        previousOwnerId: "ana",
        newOwnerId: "luis",
      }),
      OPTIONS,
    );

    expect(display.targetName).toBe("luis@example.com");
    expect(display.isViewerTarget).toBe(true);
  });

  it("returns null names for an unknown actor and an empty target", () => {
    const display = getGroupActivityDisplay(
      makeActivity({ actorId: "fantasma", targetUserId: " " }),
      OPTIONS,
    );

    expect(display.actorName).toBeNull();
    expect(display.targetName).toBeNull();
    expect(display.isViewerActor).toBe(false);
    expect(display.isViewerTarget).toBe(false);
  });

  it("resolves the settlement pair names from the members", () => {
    const display = getGroupActivityDisplay(
      makeActivity({
        type: "settlement-created",
        expenseId: null,
        fromUserId: "ana",
        toUserId: "luis",
      }),
      optionsFor("otro"),
    );

    expect(display.fromName).toBe("Ana");
    expect(display.toName).toBe("luis@example.com");
  });

  it("falls back to the unknown member for a pair side that left", () => {
    const display = getGroupActivityDisplay(
      makeActivity({
        type: "settlement-updated",
        expenseId: null,
        fromUserId: "fuera",
        toUserId: "ana",
      }),
      optionsFor("otro"),
    );

    expect(display.fromName).toBe("Miembro desconocido");
    expect(display.toName).toBe("Ana");
  });

  it("reads the viewer as 'you' on either side of the settlement pair", () => {
    const asPayer = getGroupActivityDisplay(
      makeActivity({
        type: "settlement-created",
        expenseId: null,
        fromUserId: "ana",
        toUserId: "luis",
      }),
      optionsFor("ana"),
    );
    const asPayee = getGroupActivityDisplay(
      makeActivity({
        type: "settlement-deleted",
        expenseId: null,
        fromUserId: "ana",
        toUserId: "luis",
      }),
      optionsFor("luis"),
    );

    expect(asPayer.fromName).toBe("ti");
    expect(asPayer.toName).toBe("luis@example.com");
    expect(asPayee.fromName).toBe("Ana");
    expect(asPayee.toName).toBe("ti");
  });

  it("keeps the pair null outside settlement events", () => {
    const display = getGroupActivityDisplay(
      makeActivity({
        type: "group-updated",
        fromUserId: "ana",
        toUserId: "luis",
      }),
      OPTIONS,
    );

    expect(display.fromName).toBeNull();
    expect(display.toName).toBeNull();
  });

  it("keeps the pair null when a settlement has no recorded pair", () => {
    const display = getGroupActivityDisplay(
      makeActivity({
        type: "settlement-created",
        expenseId: null,
        fromUserId: null,
        toUserId: null,
      }),
      OPTIONS,
    );

    expect(display.fromName).toBeNull();
    expect(display.toName).toBeNull();
  });

  it("flags a member added by another member", () => {
    const added = getGroupActivityDisplay(
      makeActivity({
        type: "member-joined",
        actorId: "ana",
        targetUserId: "luis",
      }),
      OPTIONS,
    );
    const joined = getGroupActivityDisplay(
      makeActivity({ type: "member-joined", actorId: "luis" }),
      OPTIONS,
    );
    const sameActor = getGroupActivityDisplay(
      makeActivity({
        type: "member-joined",
        actorId: "luis",
        targetUserId: "luis",
      }),
      OPTIONS,
    );

    expect(added.isMemberAddition).toBe(true);
    expect(joined.isMemberAddition).toBe(false);
    expect(sameActor.isMemberAddition).toBe(false);
  });

  it("does not flag an addition on another type", () => {
    const display = getGroupActivityDisplay(
      makeActivity({ type: "member-removed", targetUserId: "luis" }),
      OPTIONS,
    );

    expect(display.isMemberAddition).toBe(false);
  });

  it("normalizes blank descriptions and ids to null", () => {
    const display = getGroupActivityDisplay(
      makeActivity({
        description: "   ",
        expenseId: "  ",
        settlementId: "",
      }),
      OPTIONS,
    );

    expect(display.description).toBeNull();
    expect(display.expenseId).toBeNull();
    expect(display.settlementId).toBeNull();
  });

  it("copies the changed fields so the event stays immutable", () => {
    const activity = makeActivity({
      type: "group-updated",
      changedFields: ["name", "defaultCurrency"],
    });
    const display = getGroupActivityDisplay(activity, OPTIONS);

    display.changedFields.push("description");

    expect(activity.changedFields).toEqual(["name", "defaultCurrency"]);
  });
});

describe("getGroupActivityDisplays", () => {
  it("preserves the service order and maps every entry", () => {
    const displays = getGroupActivityDisplays(
      [
        makeActivity({ id: "b", createdAt: "2026-11-21T10:00:00.000Z" }),
        makeActivity({ id: "a", createdAt: "2026-11-20T10:00:00.000Z" }),
      ],
      OPTIONS,
    );

    expect(displays.map((display) => display.key)).toEqual(["b", "a"]);
  });
});

describe("getGroupActivityDate", () => {
  it("turns the event timestamp into the local calendar date", () => {
    const local = new Date(2026, 10, 20, 12, 0, 0);
    const display = getGroupActivityDisplay(
      makeActivity({ createdAt: local.toISOString() }),
      OPTIONS,
    );

    expect(getGroupActivityDate(display)).toBe("2026-11-20");
  });

  it("keeps an unparseable timestamp untouched", () => {
    const display = getGroupActivityDisplay(
      makeActivity({ createdAt: "sin-fecha" }),
      OPTIONS,
    );

    expect(getGroupActivityDate(display)).toBe("sin-fecha");
  });
});

describe("getGroupActivityDestination", () => {
  it("opens the expense detail for active expense events", () => {
    const types: readonly GroupActivityType[] = [
      "expense-created",
      "expense-updated",
    ];

    for (const type of types) {
      const display = getGroupActivityDisplay(
        makeActivity({ type, expenseId: "expense-9" }),
        OPTIONS,
      );

      expect(getGroupActivityDestination(display)).toEqual({
        kind: "expense",
        expenseId: "expense-9",
      });
    }
  });

  it("opens the settlement detail for active settlement events", () => {
    const types: readonly GroupActivityType[] = [
      "settlement-created",
      "settlement-updated",
    ];

    for (const type of types) {
      const display = getGroupActivityDisplay(
        makeActivity({
          type,
          expenseId: null,
          settlementId: "settlement-4",
        }),
        OPTIONS,
      );

      expect(getGroupActivityDestination(display)).toEqual({
        kind: "settlement",
        settlementId: "settlement-4",
      });
    }
  });

  it("keeps deletion events read-only", () => {
    const expense = getGroupActivityDisplay(
      makeActivity({ type: "expense-deleted", expenseId: "expense-9" }),
      OPTIONS,
    );
    const settlement = getGroupActivityDisplay(
      makeActivity({
        type: "settlement-deleted",
        expenseId: null,
        settlementId: "settlement-4",
      }),
      OPTIONS,
    );

    expect(getGroupActivityDestination(expense)).toBeNull();
    expect(getGroupActivityDestination(settlement)).toBeNull();
  });

  it("keeps membership and settings events read-only", () => {
    const types: readonly GroupActivityType[] = [
      "member-joined",
      "member-left",
      "member-removed",
      "owner-transferred",
      "group-updated",
      "simplify-debts-changed",
    ];

    for (const type of types) {
      const display = getGroupActivityDisplay(
        makeActivity({
          type,
          expenseId: null,
          settlementId: null,
          amountCents: null,
          currency: null,
        }),
        OPTIONS,
      );

      expect(getGroupActivityDestination(display)).toBeNull();
    }
  });

  it("does not open an expense event without its id", () => {
    const display = getGroupActivityDisplay(
      makeActivity({ expenseId: null }),
      OPTIONS,
    );

    expect(getGroupActivityDestination(display)).toBeNull();
  });
});
