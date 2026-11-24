import { describe, expect, it } from "@jest/globals";

import type { Group } from "../../types/group.types";
import {
  getInitialGroupFormValues,
  toGroupInput,
  toGroupUpdateInput,
  toggleGroupInviteeId,
} from "../group-form";

const stored: Group = {
  id: "group-1",
  ownerId: "user-a",
  createdBy: "user-a",
  memberIds: ["user-a", "user-b"],
  name: "Viaje",
  description: "Finde",
  defaultCurrency: "USD",
  joinCode: "ABCD2345",
  simplifyDebts: false,
  createdAt: "2026-11-20T10:00:00.000Z",
  updatedAt: "2026-11-20T10:00:00.000Z",
};

describe("group form", () => {
  it("starts an empty creation form with the default currency and simplifying", () => {
    expect(getInitialGroupFormValues()).toEqual({
      name: "",
      description: "",
      defaultCurrency: "EUR",
      simplifyDebts: true,
      inviteeIds: [],
    });
  });

  it("prefills an edit without seeding invitees and keeps the toggle", () => {
    expect(getInitialGroupFormValues(stored)).toEqual({
      name: "Viaje",
      description: "Finde",
      defaultCurrency: "USD",
      simplifyDebts: false,
      inviteeIds: [],
    });
    expect(getInitialGroupFormValues({ ...stored, description: null }))
      .toMatchObject({ description: "" });
  });

  it("toggles one invitee without duplicating it", () => {
    expect(toggleGroupInviteeId(["user-b"], " user-c ")).toEqual([
      "user-b",
      "user-c",
    ]);
    expect(toggleGroupInviteeId(["user-b", "user-c"], "user-b")).toEqual([
      "user-c",
    ]);
    expect(toggleGroupInviteeId(["user-b"], "  ")).toEqual(["user-b"]);
  });

  it("trims the payload and stores an empty description as null", () => {
    expect(
      toGroupInput({
        name: "  Viaje ",
        description: "  ",
        defaultCurrency: "GBP",
        simplifyDebts: true,
        inviteeIds: [" user-b "],
      }),
    ).toEqual({
      name: "Viaje",
      description: null,
      defaultCurrency: "GBP",
      inviteeIds: ["user-b"],
    });
  });

  it("never sends the simplify toggle on create: the data layer stamps it", () => {
    const input = toGroupInput({
      name: "Viaje",
      description: "",
      defaultCurrency: "EUR",
      simplifyDebts: false,
      inviteeIds: ["user-b"],
    });

    expect("simplifyDebts" in input).toBe(false);
  });

  it("never sends invitees on an edit and keeps the simplify toggle", () => {
    const update = toGroupUpdateInput({
      name: "Viaje",
      description: "Finde",
      defaultCurrency: "EUR",
      simplifyDebts: false,
      inviteeIds: ["user-z"],
    });

    expect(update).toEqual({
      name: "Viaje",
      description: "Finde",
      defaultCurrency: "EUR",
      simplifyDebts: false,
    });
    expect("inviteeIds" in update).toBe(false);
  });
});
