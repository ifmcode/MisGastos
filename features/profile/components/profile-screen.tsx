import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";

import { useProfileScreen } from "../hooks/use-profile-screen";
import { profileStyles as styles } from "../styles/profile.styles";
import { ProfileForm } from "./profile-form";
import { ProfileHeader } from "./profile-header";

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation(["profile", "common"]);
  const screen = useProfileScreen();
  const profile = screen.profile;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <ProfileHeader onBack={() => router.back()} />

      {screen.loading && !profile ? (
        <LoadingState message={t("loading")} />
      ) : !profile ? (
        <ErrorState
          title={t("loadErrorTitle")}
          message={screen.error ?? t("errors.LOAD_FAILED")}
          retryLabel={t("common:actions.retry")}
          retryAccessibilityLabel={t("retryAccessibility")}
          onRetry={() => void screen.reload()}
        />
      ) : (
        <ProfileForm
          profile={profile}
          submitting={screen.saving}
          error={screen.saveError}
          fieldErrors={screen.fieldErrors}
          onSubmit={(input) => void screen.submit(input)}
        />
      )}
    </ThemedView>
  );
}
