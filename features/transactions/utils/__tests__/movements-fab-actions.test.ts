import { describe, expect, it } from "@jest/globals";

import { resources } from "@/shared/i18n/resources";
import type { Translate } from "@/shared/i18n/translate";

import {
  getMovementsFabActions,
  type MovementsFriendsState,
  type MovementsGroupsState,
} from "../movements-fab-actions";

/** Fake translator: returns the key so the assertions stay copy-free. */
const t: Translate = (key) => key;

const FRIENDS_STATES: MovementsFriendsState[] = [
  "ready",
  "none",
  "loading",
  "error",
];

const GROUPS_STATES: MovementsGroupsState[] = [
  "ready",
  "none",
  "loading",
  "error",
];

describe("getMovementsFabActions", () => {
  it("returns the three create actions in menu order", () => {
    const actions = getMovementsFabActions(t, {
      friendsState: "ready",
      groupsState: "ready",
    });

    expect(actions.map((action) => action.key)).toEqual([
      "newMovement",
      "friendExpense",
      "groupExpense",
    ]);
  });

  it("wires the translated label and icon of every action", () => {
    const actions = getMovementsFabActions(t, {
      friendsState: "ready",
      groupsState: "ready",
    });

    expect(actions.map(({ label, icon }) => ({ label, icon }))).toEqual([
      { label: "fab.newMovement", icon: "add-circle-outline" },
      { label: "fab.friendExpense", icon: "people-outline" },
      { label: "fab.groupExpense", icon: "people-circle-outline" },
    ]);
  });

  it("keeps the new movement enabled with its hint", () => {
    const [newMovement] = getMovementsFabActions(t, {
      friendsState: "none",
      groupsState: "none",
    });

    expect(newMovement).toMatchObject({ hint: "fab.newMovementHint" });
    expect(newMovement.disabled).toBeUndefined();
  });

  it("enables the friend action and shows its hint when friends are ready", () => {
    const friendAction = getMovementsFabActions(t, {
      friendsState: "ready",
      groupsState: "ready",
    })[1];

    expect(friendAction.disabled).toBe(false);
    expect(friendAction.hint).toBe("fab.friendExpenseHint");
  });

  it.each([
    ["none", "fab.friendExpenseNoFriendsHint"],
    ["loading", "fab.friendExpenseHint"],
    ["error", "fab.friendExpenseHint"],
  ] as const)("keeps the friend action disabled in the %s state", (friendsState, hint) => {
    const friendAction = getMovementsFabActions(t, {
      friendsState,
      groupsState: "ready",
    })[1];

    expect(friendAction.disabled).toBe(true);
    expect(friendAction.hint).toBe(hint);
  });

  it("enables the group action and shows its hint when groups are ready", () => {
    const groupAction = getMovementsFabActions(t, {
      friendsState: "ready",
      groupsState: "ready",
    })[2];

    expect(groupAction.disabled).toBe(false);
    expect(groupAction.hint).toBe("fab.groupExpenseHint");
  });

  it.each([
    ["none", "fab.groupExpenseNoGroupsHint"],
    ["loading", "fab.groupExpenseHint"],
    ["error", "fab.groupExpenseHint"],
  ] as const)("keeps the group action disabled in the %s state", (groupsState, hint) => {
    const groupAction = getMovementsFabActions(t, {
      friendsState: "ready",
      groupsState,
    })[2];

    expect(groupAction.disabled).toBe(true);
    expect(groupAction.hint).toBe(hint);
  });

  it("keeps the friend and group actions independent", () => {
    const actions = getMovementsFabActions(t, {
      friendsState: "none",
      groupsState: "ready",
    });

    expect(actions[1].disabled).toBe(true);
    expect(actions[2].disabled).toBe(false);
  });

  it("emits only fab keys that exist in both languages", () => {
    const spanishKeys = Object.keys(resources.es.transactions.fab);
    const englishKeys = Object.keys(resources.en.transactions.fab);

    for (const friendsState of FRIENDS_STATES) {
      for (const groupsState of GROUPS_STATES) {
        const actions = getMovementsFabActions(t, {
          friendsState,
          groupsState,
        });

        for (const action of actions) {
          for (const copy of [action.label, action.hint]) {
            if (!copy) continue;

            const key = copy.replace("fab.", "");

            expect(spanishKeys).toContain(key);
            expect(englishKeys).toContain(key);
          }
        }
      }
    }
  });
});
