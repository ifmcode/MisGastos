import { useCallback, useState } from "react";

import { useAuthService } from "@/features/auth/hooks/use-auth-service";
import { useAuth } from "@/hooks/use-auth";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { ProfileValidationErrors } from "../schemas/profile.schema";
import { getProfileErrorCode, ProfileValidationError } from "../services/profile.errors";
import type { Profile, UpdateProfileDto } from "../types/profile.types";
import { useProfile } from "./use-profile";
import { useProfileService } from "./use-profile-service";

export interface ProfileScreenController {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  saveError: string | null;
  fieldErrors: ProfileValidationErrors;
  reload: () => Promise<void>;
  submit: (input: UpdateProfileDto) => Promise<void>;
}

/** Coordinates profile loading, saving and the best-effort Firebase Auth sync. */
export function useProfileScreen(): ProfileScreenController {
  const { user, refreshUser } = useAuth();
  const authService = useAuthService();
  const profileService = useProfileService();
  const { profile, loading, error, reload, replaceProfile } = useProfile();
  const { tr } = useScopedTranslation("profile");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ProfileValidationErrors>({});

  const submit = useCallback(
    async (input: UpdateProfileDto) => {
      if (!user) return;

      setSaving(true);
      setSaveError(null);
      setFieldErrors({});

      try {
        const saved = await profileService.saveProfile({
          uid: user.uid,
          email: user.email,
          ...input,
        });

        replaceProfile(saved);

        if (saved.displayName) {
          try {
            await authService.updateDisplayName(saved.displayName);
            await refreshUser();
          } catch {
            // The Firestore profile is authoritative; Auth sync is best effort.
          }
        }
      } catch (saveFailure: unknown) {
        if (saveFailure instanceof ProfileValidationError) {
          setFieldErrors(saveFailure.fieldErrors);
          return;
        }

        setSaveError(
          tr(`errors.${getProfileErrorCode(saveFailure, "SAVE_FAILED")}`),
        );
      } finally {
        setSaving(false);
      }
    },
    [
      user,
      profileService,
      authService,
      refreshUser,
      replaceProfile,
      tr,
    ],
  );

  return {
    profile,
    loading,
    error,
    saving,
    saveError,
    fieldErrors,
    reload,
    submit,
  };
}
