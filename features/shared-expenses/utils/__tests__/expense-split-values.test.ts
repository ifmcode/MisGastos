import { describe, expect, it } from "@jest/globals";

import type { SharedExpenseParticipantInput } from "../../types/shared-expense.types";
import {
  parseSplitParticipants,
  parseSplitValue,
} from "../expense-split-values";

function row(userId: string, value: string): SharedExpenseParticipantInput {
  return { userId, value };
}

describe("parseSplitValue - percentage", () => {
  it("converts percentages with up to 2 decimals into basis points", () => {
    expect(parseSplitValue("percentage", "50")).toBe(5000);
    expect(parseSplitValue("percentage", "12.34")).toBe(1234);
    expect(parseSplitValue("percentage", "0,5")).toBe(50);
    expect(parseSplitValue("percentage", "100")).toBe(10000);
  });

  it("accepts 0% so one participant can take the whole expense", () => {
    expect(parseSplitValue("percentage", "0")).toBe(0);
  });

  it("rejects malformed and out-of-range percentages", () => {
    expect(parseSplitValue("percentage", "abc")).toBeNull();
    expect(parseSplitValue("percentage", "12.345")).toBeNull();
    expect(parseSplitValue("percentage", "100.01")).toBeNull();
    expect(parseSplitValue("percentage", "")).toBeNull();
    expect(parseSplitValue("percentage", 50)).toBeNull();
  });
});

describe("parseSplitValue - fixed and shares", () => {
  it("converts fixed amounts into integer cents, zero included", () => {
    expect(parseSplitValue("fixed", "10")).toBe(1000);
    expect(parseSplitValue("fixed", "10,50")).toBe(1050);
    expect(parseSplitValue("fixed", "0")).toBe(0);
    expect(parseSplitValue("fixed", "")).toBeNull();
    expect(parseSplitValue("fixed", "abc")).toBeNull();
  });

  it("reads integer share weights", () => {
    expect(parseSplitValue("shares", "3")).toBe(3);
    expect(parseSplitValue("shares", "0")).toBe(0);
    expect(parseSplitValue("shares", "1.5")).toBeNull();
    expect(parseSplitValue("shares", "-2")).toBeNull();
    expect(parseSplitValue("shares", "abc")).toBeNull();
  });

  it("ignores the value in equal mode", () => {
    expect(parseSplitValue("equal", "")).toBe(0);
    expect(parseSplitValue("equal", "whatever")).toBe(0);
  });
});

describe("parseSplitParticipants", () => {
  it("trims the uids and parses every value", () => {
    expect(
      parseSplitParticipants("percentage", [
        row(" user-a ", "60"),
        row("user-b", "40"),
      ]),
    ).toEqual({
      ok: true,
      value: [
        { userId: "user-a", value: 6000 },
        { userId: "user-b", value: 4000 },
      ],
    });
  });

  it("rejects an empty participant list", () => {
    expect(parseSplitParticipants("equal", [])).toEqual({
      ok: false,
      error: "PARTICIPANTS_INVALID",
    });
  });

  it("rejects a participant without uid", () => {
    expect(
      parseSplitParticipants("fixed", [row(" ", "10"), row("user-b", "10")]),
    ).toEqual({ ok: false, error: "PARTICIPANTS_INVALID" });
    expect(parseSplitParticipants("equal", [row(" ", ""), row("user-b", "")]))
      .toEqual({ ok: false, error: "PARTICIPANTS_INVALID" });
    expect(
      parseSplitParticipants("equal", [
        { userId: 7 as unknown as string, value: "" },
        row("user-b", ""),
      ]),
    ).toEqual({ ok: false, error: "PARTICIPANTS_INVALID" });
  });

  it("reports the parse failure of the active mode", () => {
    expect(
      parseSplitParticipants("percentage", [row("user-a", "x"), row("user-b", "50")]),
    ).toEqual({ ok: false, error: "INVALID_PERCENTAGE" });
    expect(
      parseSplitParticipants("shares", [row("user-a", "1.5"), row("user-b", "2")]),
    ).toEqual({ ok: false, error: "INVALID_SHARES" });
  });
});
