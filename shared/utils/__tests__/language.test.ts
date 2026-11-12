import { describe, expect, it } from "@jest/globals";

import {
  normalizeLanguageCode,
  resolveAppLanguage,
  resolveLanguageTag,
} from "../language";

describe("normalizeLanguageCode", () => {
  it("reduces tags and codes to the base language", () => {
    expect(normalizeLanguageCode("es-ES")).toBe("es");
    expect(normalizeLanguageCode("en_US")).toBe("en");
    expect(normalizeLanguageCode(" ES ")).toBe("es");
  });
});

describe("resolveAppLanguage", () => {
  it("prefers a valid saved preference", () => {
    expect(resolveAppLanguage("en", ["es-ES"])).toBe("en");
    expect(resolveAppLanguage("es", ["en-US"])).toBe("es");
  });

  it("uses the first supported device locale", () => {
    expect(resolveAppLanguage(null, ["fr-FR", "en-GB"])).toBe("en");
    expect(resolveAppLanguage("fr", ["es-MX"])).toBe("es");
  });

  it("falls back to Spanish for unsupported or empty locales", () => {
    expect(resolveAppLanguage(null, ["fr-FR", "de-DE"])).toBe("es");
    expect(resolveAppLanguage(undefined, [])).toBe("es");
    expect(resolveAppLanguage("pt", [])).toBe("es");
  });
});

describe("resolveLanguageTag", () => {
  it("keeps the device region for the selected language", () => {
    expect(resolveLanguageTag("en", ["es-ES", "en-GB"])).toBe("en-GB");
    expect(resolveLanguageTag("es", ["en-US", "es-MX"])).toBe("es-MX");
  });

  it("falls back to the canonical tag when the device has no match", () => {
    expect(resolveLanguageTag("en", ["fr-FR"])).toBe("en-US");
    expect(resolveLanguageTag("es", ["fr-FR"])).toBe("es-ES");
  });
});
