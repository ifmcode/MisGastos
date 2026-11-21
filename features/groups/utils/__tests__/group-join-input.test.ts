import { describe, expect, it } from "@jest/globals";

import { readGroupJoinCodeInput } from "../group-join-input";

describe("readGroupJoinCodeInput", () => {
  it("requires a code when the field is blank", () => {
    expect(readGroupJoinCodeInput("")).toEqual({ code: "", error: "required" });
    expect(readGroupJoinCodeInput("   ")).toEqual({
      code: "",
      error: "required",
    });
  });

  it("normalizes separators and lowercase", () => {
    expect(readGroupJoinCodeInput(" abcd-2345 ")).toEqual({
      code: "ABCD2345",
      error: null,
    });
    expect(readGroupJoinCodeInput("ABCD 2345")).toEqual({
      code: "ABCD2345",
      error: null,
    });
  });

  it("rejects a code outside the alphabet", () => {
    expect(readGroupJoinCodeInput("ABCD-2340")).toEqual({
      code: "",
      error: "invalid",
    });
  });

  it("rejects a code with the wrong length", () => {
    expect(readGroupJoinCodeInput("ABCD")).toEqual({ code: "", error: "invalid" });
    expect(readGroupJoinCodeInput("ABCD23456")).toEqual({
      code: "",
      error: "invalid",
    });
  });
});
