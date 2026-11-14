import { describe, expect, it, jest } from "@jest/globals";

jest.mock("../../repositories/firebase-profile.repository", () => ({
  FirebaseProfileRepository: jest.fn(() => ({ kind: "profile-repository" })),
}));

import { getProfileService } from "../profile.factory";

describe("getProfileService", () => {
  it("reuses one ProfileService instance", () => {
    const service = getProfileService();

    expect(getProfileService()).toBe(service);
  });
});
