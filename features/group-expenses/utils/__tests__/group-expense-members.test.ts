import { describe, expect, it } from "@jest/globals";

import {
  getGroupMemberIds,
  getGroupMemberName,
} from "../group-expense-members";
import { buildMembers, VIEWER } from "./group-expense-ui.test-helpers";

const options = {
  viewerUid: VIEWER,
  viewerLabel: "Tú",
  fallback: "Miembro",
};

describe("getGroupMemberName", () => {
  const members = buildMembers();

  it("labels the viewer instead of using the stored name", () => {
    expect(getGroupMemberName(members, VIEWER, options)).toBe("Tú");
  });

  it("uses the display name of another member", () => {
    expect(getGroupMemberName(members, "user-b", options)).toBe("Beto");
  });

  it("falls back to the email when the member has no display name", () => {
    expect(getGroupMemberName(members, "user-c", options)).toBe(
      "carla@example.com",
    );
  });

  it("uses the fallback for an unknown or blank uid", () => {
    expect(getGroupMemberName(members, "user-z", options)).toBe("Miembro");
    expect(getGroupMemberName(members, "   ", options)).toBe("Miembro");
    expect(getGroupMemberName([], "user-b", options)).toBe("Miembro");
    expect(
      getGroupMemberName(members, null as unknown as string, options),
    ).toBe("Miembro");
  });

  it("falls back when the stored name and email are blank", () => {
    expect(
      getGroupMemberName(
        [{ uid: "user-z", displayName: "  ", email: " ", role: "member" }],
        "user-z",
        options,
      ),
    ).toBe("Miembro");
  });
});

describe("getGroupMemberIds", () => {
  it("keeps the document order, trimmed and unique", () => {
    expect(
      getGroupMemberIds([
        { uid: " user-a ", displayName: null, email: "", role: "owner" },
        { uid: "user-b", displayName: null, email: "", role: "member" },
        { uid: "user-a", displayName: null, email: "", role: "member" },
        { uid: "  ", displayName: null, email: "", role: "member" },
      ]),
    ).toEqual(["user-a", "user-b"]);
  });
});
