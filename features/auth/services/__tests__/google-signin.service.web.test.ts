import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockSignInWithPopup = jest.fn<
  (...args: unknown[]) => Promise<unknown>
>();

jest.mock("firebase/auth", () => ({
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: (...args: unknown[]) => mockSignInWithPopup(...args),
}));

jest.mock("@/lib/firebase", () => ({ auth: { currentUser: null } }));

import { signInWithGoogle } from "../google-signin.service.web";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("signInWithGoogle (web)", () => {
  it("returns the user resolved by the Firebase popup", async () => {
    const user = { uid: "123" };
    mockSignInWithPopup.mockResolvedValue({ user });

    await expect(signInWithGoogle()).resolves.toBe(user);
    expect(mockSignInWithPopup).toHaveBeenCalledWith(
      { currentUser: null },
      expect.anything(),
    );
  });

  it("propagates popup failures", async () => {
    mockSignInWithPopup.mockRejectedValue({
      code: "auth/popup-blocked",
    });

    await expect(signInWithGoogle()).rejects.toMatchObject({
      code: "auth/popup-blocked",
    });
  });
});
