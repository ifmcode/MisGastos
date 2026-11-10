import { describe, expect, it } from "@jest/globals";

import { resolveColorScheme } from "../theme-resolver";

describe("resolveColorScheme", () => {
  it("uses the manual preference over the system scheme", () => {
    expect(resolveColorScheme("dark", "light")).toBe("light");
    expect(resolveColorScheme("light", "dark")).toBe("dark");
  });

  it("follows the system scheme when the preference is system", () => {
    expect(resolveColorScheme("dark", "system")).toBe("dark");
    expect(resolveColorScheme("light", "system")).toBe("light");
  });

  it("falls back to light when the system scheme is unknown", () => {
    expect(resolveColorScheme(null, "system")).toBe("light");
    expect(resolveColorScheme(undefined, "system")).toBe("light");
  });
});
