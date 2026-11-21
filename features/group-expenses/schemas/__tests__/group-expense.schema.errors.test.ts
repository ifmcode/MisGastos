import { describe, expect, it } from "@jest/globals";

import type { SharedExpenseParticipantInput } from "../../types/group-expense.types";
import { issuesOf, participantRows } from "./group-expense-input.test-helpers";

describe("validateGroupExpenseInput field errors", () => {
  it("requires a group, a description and a dated payload", () => {
    expect(issuesOf({ groupId: "  " })).toEqual([
      { field: "groupId", code: "GROUP_REQUIRED" },
    ]);
    expect(issuesOf({ description: " " })).toEqual([
      { field: "description", code: "DESCRIPTION_REQUIRED" },
    ]);
    expect(issuesOf({ description: "x".repeat(121) })).toEqual([
      { field: "description", code: "DESCRIPTION_TOO_LONG" },
    ]);
    expect(issuesOf({ date: "2026-02-31" })).toEqual([
      { field: "date", code: "DATE_INVALID" },
    ]);
  });

  it("bounds the amount in integer cents", () => {
    expect(issuesOf({ amount: "" })).toEqual([
      { field: "amount", code: "AMOUNT_REQUIRED" },
    ]);
    expect(issuesOf({ amount: "abc" })).toEqual([
      { field: "amount", code: "AMOUNT_INVALID" },
    ]);
    expect(issuesOf({ amount: "0" })).toEqual([
      { field: "amount", code: "AMOUNT_INVALID" },
    ]);
    expect(issuesOf({ amount: "1000001" })).toEqual([
      { field: "amount", code: "AMOUNT_TOO_HIGH" },
    ]);
  });

  it("rejects an unsupported currency or split mode", () => {
    expect(issuesOf({ currency: "BTC" })).toEqual([
      { field: "currency", code: "CURRENCY_INVALID" },
    ]);
    expect(issuesOf({ splitMode: "EQUAL" })).toEqual([
      { field: "splitMode", code: "SPLIT_MODE_INVALID" },
    ]);
  });

  it("requires the payer to be an active group member", () => {
    expect(issuesOf({ payerId: " " })).toEqual([
      { field: "payerId", code: "PAYER_REQUIRED" },
    ]);
    expect(issuesOf({ payerId: "user-z" })).toEqual([
      { field: "payerId", code: "PAYER_NOT_MEMBER" },
    ]);
    expect(issuesOf({ payerId: "user-b" })).toBe("ok");
  });

  it("needs at least one selected participant", () => {
    expect(issuesOf({ participants: [] })).toEqual([
      { field: "participants", code: "PARTICIPANTS_REQUIRED" },
    ]);
  });

  it("rejects more participants than the group can hold", () => {
    const rows = participantRows(...Array.from({ length: 21 }, () => "user-a"));

    expect(issuesOf({ participants: rows })).toEqual([
      { field: "participants", code: "PARTICIPANTS_TOO_MANY" },
    ]);
  });

  it("rejects duplicated, foreign and malformed participant rows", () => {
    expect(
      issuesOf({ participants: participantRows("user-b", "user-b") }),
    ).toEqual([{ field: "participants", code: "PARTICIPANTS_DUPLICATE" }]);
    expect(issuesOf({ participants: participantRows("user-z") })).toEqual([
      { field: "participants", code: "PARTICIPANT_NOT_MEMBER" },
    ]);
    expect(issuesOf({ participants: participantRows("  ") })).toEqual([
      { field: "participants", code: "PARTICIPANT_INVALID" },
    ]);
    expect(
      issuesOf({
        participants: [null as unknown as SharedExpenseParticipantInput],
      }),
    ).toEqual([{ field: "participants", code: "PARTICIPANT_INVALID" }]);
  });

  it("collects every issue in display order", () => {
    expect(
      issuesOf({ description: "", amount: "", currency: "BTC" }),
    ).toEqual([
      { field: "description", code: "DESCRIPTION_REQUIRED" },
      { field: "amount", code: "AMOUNT_REQUIRED" },
      { field: "currency", code: "CURRENCY_INVALID" },
    ]);
  });

  it("normalizes blank and duplicated member ids", () => {
    expect(
      issuesOf({}, "user-a", [" user-a ", "", "user-a", "user-b", "user-c"]),
    ).toBe("ok");
  });

  it("rejects a viewer that is not a string", () => {
    expect(issuesOf({}, null as unknown as string)).toEqual([
      { field: "groupId", code: "NOT_GROUP_MEMBER" },
    ]);
  });

  it("treats a non-array participant payload as missing", () => {
    expect(
      issuesOf({
        participants:
          "nope" as unknown as SharedExpenseParticipantInput[],
      }),
    ).toEqual([{ field: "participants", code: "PARTICIPANTS_REQUIRED" }]);
  });

  it("treats a non-string description as missing", () => {
    expect(issuesOf({ description: 7 as unknown as string })).toEqual([
      { field: "description", code: "DESCRIPTION_REQUIRED" },
    ]);
  });
});
