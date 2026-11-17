import { describe, expect, it } from "@jest/globals";

import { resources } from "@/shared/i18n/resources";
import type { Translate } from "@/shared/i18n/translate";

import {
  getMovementsFabActions,
  type MovementsFriendsState,
} from "../movements-fab-actions";

/** Fake translator: returns the key so the assertions stay copy-free. */
const t: Translate = (key) => key;

const FRIENDS_STATES: MovementsFriendsState[] = [
  "ready",
  "none",
  "loading",
  "error",
];

describe("getMovementsFabActions", () => {
  it("returns the three create actions in menu order", () => {
    const actions = getMovementsFabActions(t, { friendsState: "ready" });

    expect(actions.map((action) => action.key)).toEqual([
      "newMovement",
      "friendExpense",
      "groupExpense",
    ]);
  });

  it("wires the translated label and icon of every action", () => {
    const actions = getMovementsFabActions(t, { friendsState: "ready" });

    expect(actions.map(({ label, icon }) => ({ label, icon }))).toEqual([
      { label: "fab.newMovement", icon: "add-circle-outline" },
      { label: "fab.friendExpense", icon: "people-outline" },
      { label: "fab.groupExpense", icon: "people-circle-outline" },
    ]);
  });

  it("keeps the new movement enabled with its hint", () => {
    const [newMovement] = getMovementsFabActions(t, { friendsState: "none" });

    expect(newMovement).toMatchObject({ hint: "fab.newMovementHint" });
    expect(newMovement.disabled).toBeUndefined();
  });

  it("enables the friend action and shows its hint when friends are ready", () => {
    const friendAction = getMovementsFabActions(t, { friendsState: "ready" })[1];

    expect(friendAction.disabled).toBe(false);
    expect(friendAction.hint).toBe("fab.friendExpenseHint");
  });

  it.each([
    ["none", "fab.friendExpenseNoFriendsHint"],
    ["loading", "fab.friendExpenseHint"],
    ["error", "fab.friendExpenseHint"],
  ] as const)("keeps the friend action disabled in the %s state", (friendsState, hint) => {
    const friendAction = getMovementsFabActions(t, { friendsState })[1];

    expect(friendAction.disabled).toBe(true);
    expect(friendAction.hint).toBe(hint);
  });

  it("always keeps the group action disabled with the coming soon hint", () => {
    for (const friendsState of FRIENDS_STATES) {
      const groupAction = getMovementsFabActions(t, { friendsState })[2];

      expect(groupAction.disabled).toBe(true);
      expect(groupAction.hint).toBe("fab.groupExpenseComingSoonHint");
    }
  });

  it("emits only fab keys that exist in both languages", () => {
    const spanishKeys = Object.keys(resources.es.transactions.fab);
    const englishKeys = Object.keys(resources.en.transactions.fab);

    for (const friendsState of FRIENDS_STATES) {
      const actions = getMovementsFabActions(t, { friendsState });

      for (const action of actions) {
        for (const copy of [action.label, action.hint]) {
          if (!copy) continue;

          const key = copy.replace("fab.", "");

          expect(spanishKeys).toContain(key);
          expect(englishKeys).toContain(key);
        }
      }
    }
  });
});
