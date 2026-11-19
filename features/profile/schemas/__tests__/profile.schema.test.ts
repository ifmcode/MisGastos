import { describe, expect, it } from "@jest/globals";

import {
  PROFILE_NAME_MAX_LENGTH,
  toProfileFieldErrors,
  validateProfileFormValues,
  validateProfileSaveInput,
} from "../profile.schema";

describe("validateProfileFormValues", () => {
  it("trims the display name and keeps a valid currency", () => {
    expect(
      validateProfileFormValues({
        displayName: "  Ada Lovelace  ",
        preferredCurrency: "USD",
      }),
    ).toEqual({
      ok: true,
      value: { displayName: "Ada Lovelace", preferredCurrency: "USD" },
    });
  });

  it("rejects empty names, names over the limit and invalid currencies", () => {
    expect(
      validateProfileFormValues({
        displayName: "   ",
        preferredCurrency: "EUR",
      }),
    ).toEqual({
      ok: false,
      error: [{ field: "displayName", code: "NAME_REQUIRED" }],
    });

    expect(
      validateProfileFormValues({
        displayName: "a".repeat(PROFILE_NAME_MAX_LENGTH + 1),
        preferredCurrency: "EUR",
      }),
    ).toEqual({
      ok: false,
      error: [{ field: "displayName", code: "NAME_TOO_LONG" }],
    });

    expect(
      validateProfileFormValues({
        displayName: "Ada",
        preferredCurrency: "BTC" as never,
      }),
    ).toEqual({
      ok: false,
      error: [{ field: "preferredCurrency", code: "INVALID_CURRENCY" }],
    });
  });
});

describe("validateProfileSaveInput", () => {
  it("requires a uid and normalizes the optional email", () => {
    expect(
      validateProfileSaveInput({
        uid: "  ",
        email: "  ",
        displayName: "Ada",
        preferredCurrency: "EUR",
        registerSharedExpensesInWallet: false,
      }),
    ).toEqual({
      ok: false,
      error: [{ field: "uid", code: "UID_REQUIRED" }],
    });

    expect(
      validateProfileSaveInput({
        uid: "user-1",
        email: "  ada@example.com ",
        displayName: " Ada ",
        preferredCurrency: "GBP",
        registerSharedExpensesInWallet: true,
      }),
    ).toEqual({
      ok: true,
      value: {
        uid: "user-1",
        email: "ada@example.com",
        displayName: "Ada",
        preferredCurrency: "GBP",
        registerSharedExpensesInWallet: true,
      },
    });
  });

  it("returns a null email when it is missing", () => {
    const result = validateProfileSaveInput({
      uid: "user-1",
      displayName: "Ada",
      preferredCurrency: "EUR",
      registerSharedExpensesInWallet: false,
    });

    expect(result).toMatchObject({ ok: true, value: { email: null } });
  });

  it("normalizes a missing or malformed wallet preference to false", () => {
    expect(
      validateProfileSaveInput({
        uid: "user-1",
        displayName: "Ada",
        preferredCurrency: "EUR",
        registerSharedExpensesInWallet: "true" as unknown as boolean,
      }),
    ).toMatchObject({
      ok: true,
      value: { registerSharedExpensesInWallet: false },
    });

    expect(
      validateProfileSaveInput({
        uid: "user-1",
        displayName: "Ada",
        preferredCurrency: "EUR",
      } as unknown as Parameters<typeof validateProfileSaveInput>[0]),
    ).toMatchObject({
      ok: true,
      value: { registerSharedExpensesInWallet: false },
    });
  });
});

describe("toProfileFieldErrors", () => {
  it("keeps the first code per field", () => {
    expect(
      toProfileFieldErrors([
        { field: "displayName", code: "NAME_REQUIRED" },
        { field: "displayName", code: "NAME_TOO_LONG" },
        { field: "preferredCurrency", code: "INVALID_CURRENCY" },
      ]),
    ).toEqual({
      displayName: "NAME_REQUIRED",
      preferredCurrency: "INVALID_CURRENCY",
    });
  });
});
