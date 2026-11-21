import { describe, expect, it, jest } from "@jest/globals";

import type { Translate } from "@/shared/i18n/translate";

import {
  getMovementsFabActions,
  getMovementsFabMenuActions,
  type MovementsFabActionHandlers,
} from "../movements-fab-actions";

/** Fake translator: returns the key so the assertions stay copy-free. */
const t: Translate = (key) => key;

function buildHandlers(): MovementsFabActionHandlers {
  return {
    newMovement: jest.fn(),
    friendExpense: jest.fn(),
    groupExpense: jest.fn(),
  };
}

describe("getMovementsFabMenuActions", () => {
  it("attaches a press handler to every action", () => {
    const menuActions = getMovementsFabMenuActions(
      getMovementsFabActions(t, { friendsState: "ready", groupsState: "ready" }),
      buildHandlers(),
    );

    expect(menuActions).toHaveLength(3);
    menuActions.forEach((action) => {
      expect(typeof action.onPress).toBe("function");
    });
  });

  it("calls only the matching handler of an enabled action", () => {
    const handlers = buildHandlers();
    const menuActions = getMovementsFabMenuActions(
      getMovementsFabActions(t, { friendsState: "ready", groupsState: "ready" }),
      handlers,
    );

    menuActions[0].onPress();

    expect(handlers.newMovement).toHaveBeenCalledTimes(1);
    expect(handlers.friendExpense).not.toHaveBeenCalled();
    expect(handlers.groupExpense).not.toHaveBeenCalled();
  });

  it("runs the group handler once its groups are ready", () => {
    const handlers = buildHandlers();
    const menuActions = getMovementsFabMenuActions(
      getMovementsFabActions(t, { friendsState: "ready", groupsState: "ready" }),
      handlers,
    );

    menuActions[2].onPress();

    expect(handlers.groupExpense).toHaveBeenCalledTimes(1);
  });

  it("never runs the handler of a disabled action", () => {
    const handlers = buildHandlers();
    const menuActions = getMovementsFabMenuActions(
      getMovementsFabActions(t, { friendsState: "none", groupsState: "none" }),
      handlers,
    );

    expect(() => {
      menuActions[1].onPress();
      menuActions[2].onPress();
    }).not.toThrow();

    expect(handlers.friendExpense).not.toHaveBeenCalled();
    expect(handlers.groupExpense).not.toHaveBeenCalled();
    expect(handlers.newMovement).not.toHaveBeenCalled();
  });
});
