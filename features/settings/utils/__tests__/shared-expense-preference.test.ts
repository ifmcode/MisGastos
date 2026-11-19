import { describe, expect, it } from "@jest/globals";

import type { Profile } from "@/features/profile/types/profile.types";

import { buildSharedExpensePreferenceSaveInput } from "../shared-expense-preference";

function buildProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "user-a",
    uid: "user-a",
    email: "ana@example.com",
    displayName: "Ana",
    preferredCurrency: "EUR",
    registerSharedExpensesInWallet: false,
    ...overrides,
  };
}

describe("buildSharedExpensePreferenceSaveInput", () => {
  it("preserves the profile fields and applies the boolean", () => {
    const input = buildSharedExpensePreferenceSaveInput(
      buildProfile(),
      "user-a",
      "ana@example.com",
      true,
    );

    expect(input).toEqual({
      uid: "user-a",
      email: "ana@example.com",
      displayName: "Ana",
      preferredCurrency: "EUR",
      registerSharedExpensesInWallet: true,
    });
  });

  it("keeps a preferred currency the profile already stores", () => {
    const input = buildSharedExpensePreferenceSaveInput(
      buildProfile({ preferredCurrency: "USD" }),
      "user-a",
      "ana@example.com",
      false,
    );

    expect(input.preferredCurrency).toBe("USD");
    expect(input.registerSharedExpensesInWallet).toBe(false);
  });

  it("falls back to an empty display name and keeps a null email", () => {
    const input = buildSharedExpensePreferenceSaveInput(
      buildProfile({ displayName: null }),
      "user-a",
      null,
      false,
    );

    expect(input.displayName).toBe("");
    expect(input.email).toBeNull();
  });
});
