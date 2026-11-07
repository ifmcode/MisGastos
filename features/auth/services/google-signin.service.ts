import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import type { User } from "firebase/auth";

import { auth } from "@/lib/firebase";

type GoogleSigninModule =
  typeof import("@react-native-google-signin/google-signin");

const SUPPORTED_ENVIRONMENT_CODE =
  "auth/operation-not-supported-in-this-environment";
const MISSING_CLIENT_ID_CODE = "auth/google-missing-client-id";
const CANCELLED_CODE = "auth/popup-closed-by-user";
const PLAY_SERVICES_CODE = "auth/play-services-not-available";
const MISSING_TOKEN_CODE = "auth/missing-google-id-token";

function createAuthError(code: string, message: string): Error {
  return Object.assign(new Error(message), { code });
}

function getWebClientId(): string {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  if (!clientId) {
    throw createAuthError(
      MISSING_CLIENT_ID_CODE,
      "Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.",
    );
  }

  return clientId;
}

async function loadGoogleSignin(): Promise<GoogleSigninModule> {
  try {
    return await import("@react-native-google-signin/google-signin");
  } catch {
    throw createAuthError(
      SUPPORTED_ENVIRONMENT_CODE,
      "Google sign-in requires a development build.",
    );
  }
}

/** Native Google flow: native consent screen, then Firebase ID token sign-in. */
export async function signInWithGoogle(): Promise<User> {
  const { GoogleSignin } = await loadGoogleSignin();
  const webClientId = getWebClientId();

  GoogleSignin.configure({ webClientId });

  const playServicesAvailable = await GoogleSignin.hasPlayServices({
    showPlayServicesUpdateDialog: true,
  });

  if (!playServicesAvailable) {
    throw createAuthError(
      PLAY_SERVICES_CODE,
      "Google Play Services is not available.",
    );
  }

  const response = await GoogleSignin.signIn();

  if (response.type !== "success") {
    throw createAuthError(CANCELLED_CODE, "The Google flow was cancelled.");
  }

  const idToken = response.data.idToken;

  if (!idToken) {
    throw createAuthError(MISSING_TOKEN_CODE, "Google returned no ID token.");
  }

  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);

  return result.user;
}
