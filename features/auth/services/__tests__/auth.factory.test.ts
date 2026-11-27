import { afterEach, describe, expect, it, jest } from "@jest/globals";

const mockSession = { signOutFails: false };

jest.mock("../../repositories/firebase-auth.repository", () => ({
  FirebaseAuthRepository: jest.fn(() => ({
    kind: "auth-repository",
    getCurrentUserId: () => "owner-1",
    signOut: async () => {
      if (mockSession.signOutFails) throw new Error("offline");
    },
  })),
}));

import {
  getAuthService,
  getEmailVerificationService,
} from "../auth.factory";

afterEach(() => {
  mockSession.signOutFails = false;
});

describe("auth factories", () => {
  it("reuses one AuthService instance", () => {
    const service = getAuthService();

    expect(getAuthService()).toBe(service);
  });

  it("reuses one EmailVerificationService instance", () => {
    const service = getEmailVerificationService();

    expect(getEmailVerificationService()).toBe(service);
    expect(service).not.toBe(getAuthService());
  });

  it("wires the logout local side effects without loading Firestore", async () => {
    const service = getAuthService();

    await expect(service.logout()).resolves.toBeUndefined();
  });

  it("wires the restore side effect when the sign-out fails", async () => {
    const service = getAuthService();
    mockSession.signOutFails = true;

    await expect(service.logout()).rejects.toThrow("offline");
  });
});
