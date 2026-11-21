import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { groupJoinStyles as styles } from "../styles/group-join.styles";
import { formatGroupJoinCode } from "../utils/group-join-code";
import { GroupJoinActionButton } from "./group-join-action-button";

export interface GroupJoinCodeCardProps {
  /** Stored join code; `null` for a legacy group. */
  code: string | null;
  isOwner: boolean;
  generating: boolean;
  error: string | null;
  onGenerate: () => void;
  onShare: () => void;
}

/**
 * Shareable code of the group detail. Members see the code and can share it; the
 * owner can create it for a legacy group; everyone else gets the pending notice.
 */
export function GroupJoinCodeCard({
  code,
  isOwner,
  generating,
  error,
  onGenerate,
  onShare,
}: GroupJoinCodeCardProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groups");
  const formatted = code ? formatGroupJoinCode(code) : "";

  return (
    <View
      style={[
        styles.card,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
        {t("detail.joinCodeTitle")}
      </ThemedText>

      {code ? (
        <>
          <ThemedText
            selectable
            accessibilityLabel={t("detail.joinCodeLabel", {
              code: formatted,
            })}
            style={[styles.code, { color: theme.primary }]}
          >
            {formatted}
          </ThemedText>
          <ThemedText style={[styles.helper, { color: theme.muted }]}>
            {t("detail.joinCodeHelper")}
          </ThemedText>
          <View style={styles.actionRow}>
            <GroupJoinActionButton
              label={t("detail.joinCodeShare")}
              accessibilityLabel={t("detail.joinCodeShareAccessibility")}
              accessibilityHint={t("detail.joinCodeShareHint")}
              icon="share-outline"
              onPress={onShare}
            />
          </View>
        </>
      ) : isOwner ? (
        <>
          <ThemedText style={[styles.helper, { color: theme.muted }]}>
            {t("detail.joinCodeMissingOwner")}
          </ThemedText>
          <View style={styles.actionRow}>
            <GroupJoinActionButton
              label={
                generating
                  ? t("detail.joinCodeGenerating")
                  : t("detail.joinCodeGenerate")
              }
              accessibilityLabel={t("detail.joinCodeGenerateAccessibility")}
              accessibilityHint={t("detail.joinCodeGenerateHint")}
              icon="key-outline"
              loading={generating}
              disabled={generating}
              onPress={onGenerate}
            />
          </View>
        </>
      ) : (
        <ThemedText style={[styles.helper, { color: theme.muted }]}>
          {t("detail.joinCodeMissingMember")}
        </ThemedText>
      )}

      <ErrorBanner message={error} />
    </View>
  );
}
