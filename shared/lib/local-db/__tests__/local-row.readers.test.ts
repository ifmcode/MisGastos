import { describe, expect, it } from "@jest/globals";

import {
  readLocalRowId,
  readLocalRowOwnerId,
} from "../local-row.readers";

describe("local row readers", () => {
  it("reads an addressable id and rejects blank or non-string values", () => {
    expect(readLocalRowId({ id: "wallet-1" })).toBe("wallet-1");
    expect(readLocalRowId({ id: "   " })).toBeNull();
    expect(readLocalRowId({ id: 7 })).toBeNull();
    expect(readLocalRowId({})).toBeNull();
  });

  it("reads the owner and falls back to an empty string", () => {
    expect(readLocalRowOwnerId({ ownerId: "owner-1" })).toBe("owner-1");
    expect(readLocalRowOwnerId({ ownerId: null })).toBe("");
  });
});
