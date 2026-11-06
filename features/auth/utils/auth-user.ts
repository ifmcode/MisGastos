import type { AuthUser } from "../types/auth.types";

export interface FirebaseAuthUserLike {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  providerData: ReadonlyArray<{ providerId: string }>;
}

/** Maps a Firebase user to the small snapshot consumed by the app. */
export function toAuthUser(user: FirebaseAuthUserLike | null): AuthUser | null {
  if (!user) {
    return null;
  }

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
    providerIds: user.providerData.map((provider) => provider.providerId),
    authProvider: user.providerData[0]?.providerId,
  };
}
