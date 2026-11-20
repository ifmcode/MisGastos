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
  memberIds: ["user-a", "user-b"],
  name: "Viaje",
  description: "Finde",
  defaultCurrency: "USD",
  createdAt: "2026-11-20T10:00:00.000Z",
  updatedAt: "2026-11-20T10:00:00.000Z",
};

describe("group form", () => {
  it("starts an empty creation form with the default currency", () => {
    expect(getInitialGroupFormValues()).toEqual({
      name: "",
      description: "",
      defaultCurrency: "EUR",
      inviteeIds: [],
    });
  });

  it("prefills an edit without seeding invitees", () => {
    expect(getInitialGroupFormValues(stored)).toEqual({
      name: "Viaje",
      description: "Finde",
      defaultCurrency: "USD",
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
        inviteeIds: [" user-b "],
      }),
    ).toEqual({
      name: "Viaje",
      description: null,
      defaultCurrency: "GBP",
      inviteeIds: ["user-b"],
    });
  });

  it("never sends invitees on an edit", () => {
    const update = toGroupUpdateInput({
      name: "Viaje",
      description: "Finde",
      defaultCurrency: "EUR",
      inviteeIds: ["user-z"],
    });

    expect(update).toEqual({
      name: "Viaje",
      description: "Finde",
      defaultCurrency: "EUR",
    });
    expect("inviteeIds" in update).toBe(false);
  });
});
