import { describe, expect, it } from "@jest/globals";

import { parseMissingKey } from "../missing-key";
import { NAMESPACES, resources } from "../resources";

type ResourceTree = { [key: string]: string | ResourceTree };

function flattenEntries(
  tree: ResourceTree,
  prefix = "",
): Array<[string, string]> {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string"
      ? ([[path, value]] as Array<[string, string]>)
      : flattenEntries(value, path);
  });
}

function flattenKeys(tree: ResourceTree, prefix = ""): string[] {
  return flattenEntries(tree, prefix).map(([key]) => key);
}

describe("translation resources", () => {
  it("keeps every namespace in both languages", () => {
    expect(Object.keys(resources.es).sort()).toEqual(
      Object.keys(resources.en).sort(),
    );
    expect(Object.keys(resources.es).sort()).toEqual(
      [...NAMESPACES].sort(),
    );
  });

  it("keeps the exact same keys in Spanish and English", () => {
    for (const namespace of NAMESPACES) {
      const spanish = flattenKeys(resources.es[namespace]).sort();
      const english = flattenKeys(resources.en[namespace]).sort();

      expect({ namespace, keys: english }).toEqual({
        namespace,
        keys: spanish,
      });
    }
  });

  it("does not leave blank values", () => {
    for (const namespace of NAMESPACES) {
      const spanish = flattenEntries(resources.es[namespace]);
      const english = flattenEntries(resources.en[namespace]);

      expect(spanish.every(([, value]) => value.trim().length > 0)).toBe(
        true,
      );
      expect(english.every(([, value]) => value.trim().length > 0)).toBe(
        true,
      );
    }
  });
});

describe("parseMissingKey", () => {
  it("prefers an explicit default value", () => {
    expect(parseMissingKey("wallets:title", "Carteras")).toBe("Carteras");
  });

  it("humanizes the last key segment instead of returning a raw key", () => {
    expect(parseMissingKey("wallets:form.someMissingKey")).toBe(
      "some Missing Key",
    );
  });
});
