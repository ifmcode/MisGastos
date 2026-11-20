import { describe, expect, it } from "@jest/globals";

import {
  validateGroupInput,
  validateGroupInviteeIds,
  validateGroupUpdateInput,
} from "../group.schema";

const valid = {
  name: "Viaje a Roma",
  description: "Finde largo",
  defaultCurrency: "EUR" as const,
  inviteeIds: ["user-b"],
};

describe("validateGroupInput", () => {
  it("normalizes the form and keeps the description trimmed", () => {
    const result = validateGroupInput(
      { ...valid, name: "  Viaje  ", description: "  Finde  " },
      "user-a",
    );

    expect(result).toEqual({
      ok: true,
      value: {
        name: "Viaje",
        description: "Finde",
        defaultCurrency: "EUR",
        inviteeIds: ["user-b"],
      },
    });
  });

  it("stores an empty description as null", () => {
    const result = validateGroupInput(
      { ...valid, description: "   " },
      "user-a",
    );

    expect(result.ok && result.value.description).toBeNull();
  });

  it("requires a name and bounds its length", () => {
    const missing = validateGroupInput({ ...valid, name: "  " }, "user-a");
    const tooLong = validateGroupInput(
      { ...valid, name: "a".repeat(61) },
      "user-a",
    );

    expect(!missing.ok && missing.error).toEqual([
      { field: "name", code: "NAME_REQUIRED" },
    ]);
    expect(!tooLong.ok && tooLong.error).toEqual([
      { field: "name", code: "NAME_TOO_LONG" },
    ]);
  });

  it("rejects an oversized description and an unknown currency", () => {
    const result = validateGroupInput(
      {
        ...valid,
        description: "a".repeat(201),
        defaultCurrency: "BTC" as never,
      },
      "user-a",
    );

    expect(!result.ok && result.error).toEqual([
      { field: "description", code: "DESCRIPTION_TOO_LONG" },
      { field: "defaultCurrency", code: "CURRENCY_INVALID" },
    ]);
  });

  it("requires at least one invitee and at most 19", () => {
    const empty = validateGroupInput({ ...valid, inviteeIds: [] }, "user-a");
    const tooMany = validateGroupInput(
      {
        ...valid,
        inviteeIds: Array.from({ length: 20 }, (_, index) => `user-${index}`),
      },
      "user-a",
    );

    expect(!empty.ok && empty.error).toEqual([
      { field: "inviteeIds", code: "INVITEES_REQUIRED" },
    ]);
    expect(!tooMany.ok && tooMany.error).toEqual([
      { field: "inviteeIds", code: "INVITEES_TOO_MANY" },
    ]);
  });

  it("rejects duplicates, the owner and blank invitees", () => {
    const duplicate = validateGroupInviteeIds(
      ["user-b", " user-b "],
      "user-a",
    );
    const self = validateGroupInput(
      { ...valid, inviteeIds: ["user-a"] },
      "user-a",
    );
    const blank = validateGroupInviteeIds(["  "], "user-a");

    expect(!duplicate.ok && duplicate.error).toEqual([
      { field: "inviteeIds", code: "INVITEES_DUPLICATE" },
    ]);
    expect(!self.ok && self.error).toEqual([
      { field: "inviteeIds", code: "INVITEE_INVALID" },
    ]);
    expect(!blank.ok && blank.error).toEqual([
      { field: "inviteeIds", code: "INVITEE_INVALID" },
    ]);
  });

  it("rejects a missing invitee list", () => {
    const result = validateGroupInviteeIds(undefined, "user-a");

    expect(!result.ok && result.error).toEqual([
      { field: "inviteeIds", code: "INVITEES_REQUIRED" },
    ]);
  });
});

describe("validateGroupUpdateInput", () => {
  it("accepts a metadata edit without invitees", () => {
    const result = validateGroupUpdateInput({
      name: "Renombrado",
      description: null,
      defaultCurrency: "USD",
    });

    expect(result).toEqual({
      ok: true,
      value: {
        name: "Renombrado",
        description: null,
        defaultCurrency: "USD",
      },
    });
  });

  it("reports every invalid metadata field at once", () => {
    const result = validateGroupUpdateInput({
      name: "",
      description: "a".repeat(201),
      defaultCurrency: "CHF",
    });

    expect(!result.ok && result.error).toEqual([
      { field: "name", code: "NAME_REQUIRED" },
      { field: "description", code: "DESCRIPTION_TOO_LONG" },
    ]);
  });
});
