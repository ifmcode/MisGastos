import { DEFAULT_CURRENCY } from "@/shared/constants/currencies";
import type { AuthUser } from "@/features/auth/types/auth.types";

import {
  Profile,
  ProfileFormValues,
} from "../types/profile.types";

/** Builds an editable profile for accounts whose Firestore document is missing. */
export function createProfileFromAuth(user: AuthUser): Profile {
  return {
    id: "",
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    preferredCurrency: DEFAULT_CURRENCY,
  };
}

export function buildProfileFormValues(profile: Profile): ProfileFormValues {
  return {
    displayName: profile.displayName ?? "",
    preferredCurrency: profile.preferredCurrency,
  };
}
