import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { ProfileContext, type ProfileContextValue } from "../context/profile-context";
import { useProfileService } from "../hooks/use-profile-service";
import { getProfileErrorCode } from "../services/profile.errors";
import type { Profile } from "../types/profile.types";
import { createProfileFromAuth } from "../utils/profile-defaults";

export interface ProfileProviderProps {
  children: ReactNode;
}

/** Loads the signed-in user's profile once and keeps it fresh after edits. */
export function ProfileProvider({ children }: ProfileProviderProps) {
  const { user } = useAuth();
  const profileService = useProfileService();
  const { tr } = useScopedTranslation("profile");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setError(null);
      setLoading(false);
      return;
    }

    requestRef.current += 1;
    const request = requestRef.current;
    setProfile((current) => (current?.uid === user.uid ? current : null));
    setLoading(true);
    setError(null);

    try {
      const loaded = await profileService.getProfile(user.uid);
      if (requestRef.current !== request) return;

      const next = loaded ?? createProfileFromAuth(user);
      setProfile({
        ...next,
        email: next.email ?? user.email,
        displayName: next.displayName ?? user.displayName,
      });
    } catch (loadError: unknown) {
      if (requestRef.current !== request) return;

      setError(tr(`errors.${getProfileErrorCode(loadError, "LOAD_FAILED")}`));
    } finally {
      if (requestRef.current === request) {
        setLoading(false);
      }
    }
  }, [user, profileService, tr]);

  useEffect(() => {
    void load();
  }, [load]);

  const replaceProfile = useCallback((next: Profile) => {
    setProfile(next);
    setError(null);
  }, []);

  const value = useMemo<ProfileContextValue>(
    () => ({ profile, loading, error, reload: load, replaceProfile }),
    [profile, loading, error, load, replaceProfile],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}
