import { describe, expect, it } from "@jest/globals";

import type { Translate } from "@/shared/i18n/translate";

import type { GroupActivityDisplay } from "../group-activity-display";
import type { GroupActivityType } from "../../types/group-activity.types";
import {
  getGroupActivityErrorCopy,
  getGroupActivityMeta,
  getGroupActivityTitle,
} from "../group-activity-copy";

const FALLBACK = "history.unknownMember";

function createTranslate() {
  const calls: Array<{ key: string; options?: Record<string, unknown> }> = [];
  const tr: Translate = (key, options) => {
    calls.push({ key, options });
    return key;
  };

  return { tr, calls };
}

function makeDisplay(
  overrides: Partial<GroupActivityDisplay> = {},
): GroupActivityDisplay {
  return {
    key: "activity-1",
    type: "expense-created",
    actorName: "Ana",
    targetName: null,
    fromName: null,
    toName: null,
    isMemberAddition: false,
    isViewerActor: false,
    isViewerTarget: false,
    amountCents: 1000,
    currency: "EUR",
    description: null,
    changedFields: [],
    simplifyDebts: null,
    expenseId: "expense-1",
    settlementId: null,
    createdAt: "2026-11-20T10:00:00.000Z",
    ...overrides,
  };
}

const SIMPLE_TYPES: readonly GroupActivityType[] = [
  "expense-created",
  "expense-updated",
  "expense-deleted",
  "settlement-created",
  "settlement-updated",
  "settlement-deleted",
  "group-updated",
  "simplify-debts-changed",
];

describe("getGroupActivityTitle", () => {
  it("uses the actor variant of every simple type", () => {
    for (const type of SIMPLE_TYPES) {
      const { tr, calls } = createTranslate();

      expect(getGroupActivityTitle(makeDisplay({ type }), {
        tr,
        fallback: FALLBACK,
      })).toBe(`history.types.${type}.actor`);
      expect(calls[0].options).toEqual({ actor: "Ana" });
    }
  });

  it("uses the viewer variant of every simple type", () => {
    for (const type of SIMPLE_TYPES) {
      const { tr } = createTranslate();

      expect(
        getGroupActivityTitle(
          makeDisplay({ type, isViewerActor: true }),
          { tr, fallback: FALLBACK },
        ),
      ).toBe(`history.types.${type}.viewer`);
    }
  });

  it("names both sides of a removal", () => {
    const { tr, calls } = createTranslate();
    const display = makeDisplay({
      type: "member-removed",
      targetName: "Luis",
    });

    expect(getGroupActivityTitle(display, { tr, fallback: FALLBACK })).toBe(
      "history.types.member-removed.actor",
    );
    expect(calls[0].options).toEqual({ actor: "Ana", target: "Luis" });
  });

  it("tells the removed viewer what happened", () => {
    const { tr, calls } = createTranslate();
    const display = makeDisplay({
      type: "member-removed",
      targetName: "Luis",
      isViewerTarget: true,
    });

    expect(getGroupActivityTitle(display, { tr, fallback: FALLBACK })).toBe(
      "history.types.member-removed.viewerTarget",
    );
    expect(calls[0].options).toEqual({ actor: "Ana" });
  });

  it("tells the removing viewer what they did", () => {
    const { tr, calls } = createTranslate();
    const display = makeDisplay({
      type: "member-removed",
      targetName: "Luis",
      isViewerActor: true,
    });

    expect(getGroupActivityTitle(display, { tr, fallback: FALLBACK })).toBe(
      "history.types.member-removed.viewer",
    );
    expect(calls[0].options).toEqual({ target: "Luis" });
  });

  it("resolves an ownership transfer for the new owner", () => {
    const { tr, calls } = createTranslate();
    const display = makeDisplay({
      type: "owner-transferred",
      targetName: "Luis",
      isViewerTarget: true,
    });

    expect(getGroupActivityTitle(display, { tr, fallback: FALLBACK })).toBe(
      "history.types.owner-transferred.viewerTarget",
    );
    expect(calls[0].options).toEqual({ actor: "Ana" });
  });

  it("speaks in first person when the viewer joined or left", () => {
    for (const type of ["member-joined", "member-left"] as const) {
      const { tr } = createTranslate();

      expect(
        getGroupActivityTitle(
          makeDisplay({ type, isViewerActor: true }),
          { tr, fallback: FALLBACK },
        ),
      ).toBe(`history.types.${type}.viewer`);
    }
  });

  it("tells the owner who added the member", () => {
    const { tr, calls } = createTranslate();
    const display = makeDisplay({
      type: "member-joined",
      targetName: "Luis",
      isMemberAddition: true,
      isViewerActor: true,
    });

    expect(getGroupActivityTitle(display, { tr, fallback: FALLBACK })).toBe(
      "history.types.member-joined.addedViewer",
    );
    expect(calls[0].options).toEqual({ name: "Luis" });
  });

  it("names the joiner and the actor when someone else added them", () => {
    const { tr, calls } = createTranslate();
    const display = makeDisplay({
      type: "member-joined",
      targetName: "Luis",
      isMemberAddition: true,
    });

    expect(getGroupActivityTitle(display, { tr, fallback: FALLBACK })).toBe(
      "history.types.member-joined.added",
    );
    expect(calls[0].options).toEqual({ actor: "Ana", name: "Luis" });
  });

  it("tells the added viewer who added them", () => {
    const { tr, calls } = createTranslate();
    const display = makeDisplay({
      type: "member-joined",
      targetName: "Luis",
      isMemberAddition: true,
      isViewerTarget: true,
    });

    expect(getGroupActivityTitle(display, { tr, fallback: FALLBACK })).toBe(
      "history.types.member-joined.addedViewerTarget",
    );
    expect(calls[0].options).toEqual({ actor: "Ana" });
  });

  it("keeps the self-join copy when the joiner is the actor", () => {
    const { tr, calls } = createTranslate();
    const display = makeDisplay({ type: "member-joined" });

    expect(getGroupActivityTitle(display, { tr, fallback: FALLBACK })).toBe(
      "history.types.member-joined.actor",
    );
    expect(calls[0].options).toEqual({ name: "Ana" });
  });

  it("falls back to the translated unknown member", () => {
    const { tr, calls } = createTranslate();

    getGroupActivityTitle(
      makeDisplay({ type: "expense-created", actorName: null }),
      { tr, fallback: FALLBACK },
    );

    expect(calls[0].options).toEqual({ actor: FALLBACK });
  });
});

describe("getGroupActivityErrorCopy", () => {
  const tr: Translate = (key) => key;

  it("keeps a missing group out of the banner copy", () => {
    const denied = Object.assign(new Error("denied"), {
      code: "permission-denied",
    });

    expect(getGroupActivityErrorCopy(denied, tr)).toBeNull();
  });

  it("maps a network failure to its shared copy", () => {
    const offline = Object.assign(new Error("offline"), {
      code: "unavailable",
    });

    expect(getGroupActivityErrorCopy(offline, tr)).toBe("errors.NETWORK");
  });

  it("falls back to the history load failure", () => {
    expect(getGroupActivityErrorCopy(new Error("boom"), tr)).toBe(
      "history.loadFailed",
    );
  });
});

describe("getGroupActivityMeta", () => {
  const tr: Translate = (key) => key;

  it("lists the changed metadata fields", () => {
    expect(
      getGroupActivityMeta(
        makeDisplay({
          type: "group-updated",
          changedFields: ["name", "defaultCurrency"],
        }),
        tr,
      ),
    ).toBe("history.changedFields.name, history.changedFields.defaultCurrency");
  });

  it("omits the meta when no field was reported", () => {
    expect(
      getGroupActivityMeta(makeDisplay({ type: "group-updated" }), tr),
    ).toBeUndefined();
  });

  it("reads the new setting state", () => {
    expect(
      getGroupActivityMeta(
        makeDisplay({ type: "simplify-debts-changed", simplifyDebts: true }),
        tr,
      ),
    ).toBe("history.settingOn");
    expect(
      getGroupActivityMeta(
        makeDisplay({ type: "simplify-debts-changed", simplifyDebts: false }),
        tr,
      ),
    ).toBe("history.settingOff");
    expect(
      getGroupActivityMeta(
        makeDisplay({ type: "simplify-debts-changed", simplifyDebts: null }),
        tr,
      ),
    ).toBeUndefined();
  });

  it("puts the settlement pair before the note", () => {
    expect(
      getGroupActivityMeta(
        makeDisplay({
          type: "settlement-created",
          fromName: "Ana",
          toName: "ti",
          description: "Pago",
        }),
        tr,
      ),
    ).toBe("history.settlementPair · Pago");
  });

  it("keeps the settlement pair without a note", () => {
    expect(
      getGroupActivityMeta(
        makeDisplay({
          type: "settlement-deleted",
          fromName: "Ana",
          toName: "Luis",
        }),
        tr,
      ),
    ).toBe("history.settlementPair");
  });

  it("falls back to the note when the pair was not recorded", () => {
    expect(
      getGroupActivityMeta(
        makeDisplay({ type: "settlement-created", description: "Pago" }),
        tr,
      ),
    ).toBe("Pago");
  });

  it("never shows a pair outside settlement events", () => {
    expect(
      getGroupActivityMeta(
        makeDisplay({
          type: "expense-created",
          fromName: "Ana",
          toName: "Luis",
          description: "Cena",
        }),
        tr,
      ),
    ).toBe("Cena");
  });

  it("shows the concept or note as the meta", () => {
    expect(
      getGroupActivityMeta(makeDisplay({ description: "Cena" }), tr),
    ).toBe("Cena");
    expect(getGroupActivityMeta(makeDisplay(), tr)).toBeUndefined();
  });
});
