import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockConfigure = jest.fn<(options: unknown) => void>();
const mockHasPlayServices = jest.fn<(options: unknown) => Promise<boolean>>();
const mockSignIn = jest.fn<() => Promise<unknown>>();
const mockCredential = jest.fn<(idToken: string) => unknown>();
const mockSignInWithCredential = jest.fn<
  (...args: unknown[]) => Promise<unknown>
>();

jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    configure: (options: unknown) => mockConfigure(options),
    hasPlayServices: (options: unknown) => mockHasPlayServices(options),
    signIn: () => mockSignIn(),
  },
}));

jest.mock("firebase/auth", () => ({
  GoogleAuthProvider: {
    credential: (idToken: string) => mockCredential(idToken),
  },
  signInWithCredential: (...args: unknown[]) =>
    mockSignInWithCredential(...args),
}));

jest.mock("@/lib/firebase", () => ({ auth: { currentUser: null } }));

import { signInWithGoogle } from "../google-signin.service";

const CLIENT_ID = "web-client-id.apps.googleusercontent.com";

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = CLIENT_ID;
  mockConfigure.mockReturnValue(undefined);
  mockHasPlayServices.mockResolvedValue(true);
  mockCredential.mockReturnValue({ token: "credential" });
});

describe("signInWithGoogle (native)", () => {
  it("exchanges the Google ID token for a Firebase user", async () => {
    const firebaseUser = { uid: "123" };
    mockSignIn.mockResolvedValue({
      type: "success",
      data: { idToken: "google-id-token" },
    });
    mockSignInWithCredential.mockResolvedValue({ user: firebaseUser });

    const result = await signInWithGoogle();

    expect(result).toBe(firebaseUser);
    expect(mockConfigure).toHaveBeenCalledWith({ webClientId: CLIENT_ID });
    expect(mockHasPlayServices).toHaveBeenCalledWith({
      showPlayServicesUpdateDialog: true,
    });
    expect(mockCredential).toHaveBeenCalledWith("google-id-token");
    expect(mockSignInWithCredential).toHaveBeenCalledWith(
      { currentUser: null },
      { token: "credential" },
    );
  });

  it("does not open the consent screen without a web client ID", async () => {
    delete process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

    await expect(signInWithGoogle()).rejects.toMatchObject({
      code: "auth/google-missing-client-id",
    });
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("reports a cancelled flow", async () => {
    mockSignIn.mockResolvedValue({ type: "cancelled", data: null });

    await expect(signInWithGoogle()).rejects.toMatchObject({
      code: "auth/popup-closed-by-user",
    });
  });

  it("reports missing Play Services", async () => {
    mockHasPlayServices.mockResolvedValue(false);

    await expect(signInWithGoogle()).rejects.toMatchObject({
      code: "auth/play-services-not-available",
    });
  });

  it("rejects a success response without an ID token", async () => {
    mockSignIn.mockResolvedValue({
      type: "success",
      data: { idToken: null },
    });

    await expect(signInWithGoogle()).rejects.toMatchObject({
      code: "auth/missing-google-id-token",
    });
  });
});
