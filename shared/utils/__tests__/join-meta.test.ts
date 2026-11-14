import { describe, expect, it } from "@jest/globals";

import { joinMetaParts } from "../join-meta";

describe("joinMetaParts", () => {
  it("joins non-empty parts with a middle dot", () => {
    expect(joinMetaParts(["12/11/2026", "Comida", "Efectivo"])).toBe(
      "12/11/2026 · Comida · Efectivo",
    );
  });

  it("skips null, undefined, empty and whitespace-only parts", () => {
    expect(joinMetaParts(["12/11/2026", null, undefined, "", "   "])).toBe(
      "12/11/2026",
    );
  });

  it("returns an empty string when there is nothing to join", () => {
    expect(joinMetaParts([])).toBe("");
  });

  it("accepts a custom separator", () => {
    expect(joinMetaParts(["a", "b"], " - ")).toBe("a - b");
  });
});
