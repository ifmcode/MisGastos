import { createContext } from "react";

import type { Profile } from "../types/profile.types";

export interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  replaceProfile: (profile: Profile) => void;
}

export const ProfileContext = createContext<ProfileContextValue | null>(null);
