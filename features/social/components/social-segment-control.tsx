import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { socialStyles as styles } from "../styles/social.styles";
import type { SocialSegment } from "../types/social.types";

export interface SocialSegmentControlProps {
  value: SocialSegment;
  onChange: (segment: SocialSegment) => void;
}

/** "Tus amigos" / "Tus grupos" switch with tab semantics. */
export function SocialSegmentControl({
  value,
  onChange,
}: SocialSegmentControlProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("social");

  const options = [
    {
      value: "friends" as const,
      label: t("segments.friends"),
      hint: t("segments.friendsHint"),
    },
    {
      value: "groups" as const,
      label: t("segments.groups"),
      hint: t("segments.groupsHint"),
    },
  ];

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={t("segments.accessibility")}
      style={[
        styles.segmentControl,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            accessibilityHint={option.hint}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segment,
              selected && { backgroundColor: theme.primary },
              pressed && styles.pressed,
            ]}
          >
            <ThemedText
              style={[
                styles.segmentText,
                { color: selected ? theme.onPrimary : theme.text },
              ]}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
