import { describe, expect, it, jest } from "@jest/globals";

jest.mock("../../repositories/firebase-auth.repository", () => ({
  FirebaseAuthRepository: jest.fn(() => ({ kind: "auth-repository" })),
}));

import {
  getAuthService,
  getEmailVerificationService,
} from "../auth.factory";

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
});
