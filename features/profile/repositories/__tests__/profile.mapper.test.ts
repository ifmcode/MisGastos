import { describe, expect, it } from "@jest/globals";

import { mapProfileDocument } from "../profile.mapper";

describe("mapProfileDocument", () => {
  it("maps the stored profile and trims its text fields", () => {
    expect(
      mapProfileDocument(
        "doc-1",
        {
          uid: " user-1 ",
          name: " Ada Lovelace ",
          email: " ada@example.com ",
          preferredCurrency: "USD",
        },
        { uid: "fallback" },
      ),
    ).toEqual({
      id: "doc-1",
      uid: "user-1",
      email: "ada@example.com",
      displayName: "Ada Lovelace",
      preferredCurrency: "USD",
    });
  });

  it("falls back to the auth uid, email and default currency", () => {
    expect(
      mapProfileDocument(
        "doc-1",
        { name: null, preferredCurrency: "BTC" },
        { uid: "user-1", email: "user@example.com" },
      ),
    ).toEqual({
      id: "doc-1",
      uid: "user-1",
      email: "user@example.com",
      displayName: null,
      preferredCurrency: "EUR",
    });
  });

  it("handles documents without an email or display name", () => {
    expect(
      mapProfileDocument("doc-1", {}, { uid: "user-1" }),
    ).toMatchObject({
      uid: "user-1",
      email: null,
      displayName: null,
      preferredCurrency: "EUR",
    });
  });
});
