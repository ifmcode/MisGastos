import { describe, expect, it } from "@jest/globals";

import { GROUP_JOIN_CODE_ALPHABET } from "../../types/group-join.types";
import {
  createGroupJoinRequestId,
  formatGroupJoinCode,
  generateGroupJoinCode,
  isGroupJoinCode,
  isGroupJoinRequestId,
  normalizeGroupJoinCode,
} from "../group-join-code";

/** Injected random: every draw maps to `draw / 1000`. */
function sequence(...draws: number[]): () => number {
  let index = 0;

  return () => draws[index++] / 1000;
}

describe("normalizeGroupJoinCode", () => {
  it("uppercases and removes spaces, hyphens and underscores", () => {
    expect(normalizeGroupJoinCode(" abcd-2345 ")).toBe("ABCD2345");
    expect(normalizeGroupJoinCode("ABCD_2345")).toBe("ABCD2345");
    expect(normalizeGroupJoinCode("ab cd 23 45")).toBe("ABCD2345");
  });

  it("returns an empty string for a character outside the alphabet", () => {
    expect(normalizeGroupJoinCode("ABCD2340")).toBe("");
    expect(normalizeGroupJoinCode("ABCD234I")).toBe("");
    expect(normalizeGroupJoinCode("ABCD234")).toBe("");
    expect(normalizeGroupJoinCode("ABCD23456")).toBe("");
    expect(normalizeGroupJoinCode(42)).toBe("");
  });
});

describe("isGroupJoinCode", () => {
  it("accepts only the exact normalized form", () => {
    expect(isGroupJoinCode("ABCD2345")).toBe(true);
    expect(isGroupJoinCode("abcd2345")).toBe(false);
    expect(isGroupJoinCode("ABCD-2345")).toBe(false);
    expect(isGroupJoinCode(undefined)).toBe(false);
  });
});

describe("formatGroupJoinCode", () => {
  it("groups the code in two halves for display", () => {
    expect(formatGroupJoinCode("abcd2345")).toBe("ABCD-2345");
    expect(formatGroupJoinCode("ABCD-2345")).toBe("ABCD-2345");
    expect(formatGroupJoinCode("nope")).toBe("");
  });
});

describe("generateGroupJoinCode", () => {
  it("builds a deterministic code from the injected sequence", () => {
    const code = generateGroupJoinCode(sequence(0, 1, 2, 3, 28, 29, 30, 31));

    expect(code).toBe("2345WXYZ");
    expect(code).toHaveLength(8);
  });

  it("rejects a draw outside the unbiased range before sampling", () => {
    const code = generateGroupJoinCode(
      sequence(999, 0, 0, 0, 0, 0, 0, 0, 0),
    );

    expect(code).toBe("22222222");
  });

  it("only produces symbols of the alphabet", () => {
    const code = generateGroupJoinCode(() => 0.5);

    expect(isGroupJoinCode(code)).toBe(true);
    for (const symbol of code) {
      expect(GROUP_JOIN_CODE_ALPHABET).toContain(symbol);
    }
  });
});

describe("join request ids", () => {
  it("builds the deterministic id and trims its parts", () => {
    expect(createGroupJoinRequestId(" user-a__g1 ", " user-b ")).toBe(
      "user-a__g1__user-b",
    );
    expect(createGroupJoinRequestId("", "user-b")).toBe("");
    expect(createGroupJoinRequestId("user-a__g1", "  ")).toBe("");
  });

  it("guards the shape without proving the ids", () => {
    expect(isGroupJoinRequestId("user-a__g1__user-b")).toBe(true);
    expect(isGroupJoinRequestId("a__b")).toBe(false);
    expect(isGroupJoinRequestId("a____b")).toBe(false);
    expect(isGroupJoinRequestId(42)).toBe(false);
  });
});
