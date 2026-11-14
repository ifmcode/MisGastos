import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";

import { ErrorBanner } from "@/shared/components/molecules/error-banner";

import { useProfileForm } from "../hooks/use-profile-form";
import type { ProfileValidationErrors } from "../schemas/profile.schema";
import { profileStyles as styles } from "../styles/profile.styles";
import type { Profile, UpdateProfileDto } from "../types/profile.types";
import { buildProfileFormValues } from "../utils/profile-defaults";
import { ProfileAccountCard } from "./profile-account-card";
import { ProfileCurrencyField } from "./profile-currency-field";
import { ProfileFormActions } from "./profile-form-actions";
import { ProfileNameField } from "./profile-name-field";

export interface ProfileFormProps {
  profile: Profile;
  submitting: boolean;
  error: string | null;
  fieldErrors: ProfileValidationErrors;
  onSubmit: (input: UpdateProfileDto) => void;
}

export function ProfileForm({
  profile,
  submitting,
  error,
  fieldErrors,
  onSubmit,
}: ProfileFormProps) {
  const { values, errors, updateValue, submit } = useProfileForm({
    initialValues: buildProfileFormValues(profile),
    fieldErrors,
    onSubmit,
  });

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ErrorBanner message={error} />

        <ProfileAccountCard email={profile.email} />

        <ProfileNameField
          value={values.displayName}
          error={errors.displayName}
          disabled={submitting}
          onChange={(value) => updateValue("displayName", value)}
        />

        <ProfileCurrencyField
          value={values.preferredCurrency}
          error={errors.preferredCurrency}
          disabled={submitting}
          onChange={(currency) => updateValue("preferredCurrency", currency)}
        />

        <ProfileFormActions submitting={submitting} onPress={submit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
