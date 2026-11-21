import { useRouter, type Href } from "expo-router";
import { useCallback } from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { useGroupJoinScreen } from "../hooks/use-group-join-screen";
import { groupJoinStyles as styles } from "../styles/group-join.styles";
import { GroupJoinCodeField } from "./group-join-code-field";
import { GroupJoinResult } from "./group-join-result";
import { GroupRouteHeader } from "./group-route-header";

/** Code entry and request sending for a group the viewer does not belong to. */
export function GroupJoinScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groups");
  const screen = useGroupJoinScreen();
  const busy = screen.status !== "idle";

  const leave = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/social" as Href);
  }, [router]);

  const openGroup = useCallback(
    (groupId: string) => {
      router.push(`/social/groups/${groupId}` as Href);
    },
    [router],
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <GroupRouteHeader
        title={t("join.title")}
        subtitle={t("join.subtitle")}
        onBack={leave}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={[styles.helper, { color: theme.muted }]}>
          {t("join.intro")}
        </ThemedText>

        {screen.view.kind === "form" ? (
          <GroupJoinCodeField
            value={screen.code}
            fieldError={screen.fieldError}
            looking={screen.status === "looking"}
            busy={busy}
            onChange={screen.onChangeCode}
            onSubmit={() => void screen.lookup()}
          />
        ) : (
          <GroupJoinResult
            view={screen.view}
            sending={screen.status === "sending"}
            onSend={() => void screen.sendRequest()}
            onOpenGroup={openGroup}
            onResetCode={screen.resetCode}
            onBackToSocial={leave}
          />
        )}

        <ErrorBanner message={screen.error} />
      </ScrollView>
    </ThemedView>
  );
}
