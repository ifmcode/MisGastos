import { describe, expect, it } from "@jest/globals";

import { resources } from "@/shared/i18n/resources";

import type { TransactionsFabProps } from "../transactions-fab";

type FabPropKeys = keyof TransactionsFabProps;

type RequiredFabProp =
  | "bottom"
  | "menuVisible"
  | "actions"
  | "onOpen"
  | "onClose";

type LegacyFabProp = Extract<FabPropKeys, "onPress" | "onCreate">;

type OptionalFabProp = {
  [K in FabPropKeys]-?: undefined extends TransactionsFabProps[K] ? K : never;
}[FabPropKeys];

// Compile-time contract: the FAB now opens the create menu, so it requires the
// menu contract and must never accept the old direct-create props again. If any
// assumption breaks, these constants become `false` and `tsc --noEmit` fails.
const fabRequiresMenuProps: RequiredFabProp extends FabPropKeys ? true : false =
  true;
const fabHasNoLegacyProps: LegacyFabProp extends never ? true : false = true;
const fabHasNoOptionalProps: OptionalFabProp extends never ? true : false =
  true;

const FAB_KEYS = [
  "openAccessibility",
  "openHint",
  "menuTitle",
  "newMovement",
  "newMovementHint",
  "friendExpense",
  "friendExpenseHint",
  "friendExpenseNoFriendsHint",
  "groupExpense",
  "groupExpenseComingSoonHint",
] as const;

type FabKey = (typeof FAB_KEYS)[number];

const spanishFab: Record<FabKey, string> = resources.es.transactions.fab;
const englishFab: Record<FabKey, string> = resources.en.transactions.fab;

describe("TransactionsFab contract", () => {
  it("requires the create menu props and no legacy press props", () => {
    expect(fabRequiresMenuProps).toBe(true);
    expect(fabHasNoLegacyProps).toBe(true);
    expect(fabHasNoOptionalProps).toBe(true);
  });

  it("keeps the new fab copy in both languages", () => {
    expect(Object.keys(spanishFab).sort()).toEqual([...FAB_KEYS].sort());
    expect(Object.keys(englishFab).sort()).toEqual([...FAB_KEYS].sort());

    for (const key of FAB_KEYS) {
      expect(spanishFab[key].length).toBeGreaterThan(0);
      expect(englishFab[key].length).toBeGreaterThan(0);
    }
  });

  it("drops the unused header create keys", () => {
    const spanishKeys = Object.keys(resources.es.transactions);
    const englishKeys = Object.keys(resources.en.transactions);

    expect(spanishKeys).not.toContain("new");
    expect(spanishKeys).not.toContain("add");
    expect(englishKeys).not.toContain("new");
    expect(englishKeys).not.toContain("add");
  });
});
