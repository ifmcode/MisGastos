import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";
import { formatCurrencyLabel } from "@/shared/utils/currency-label";

import { groupsStyles as styles } from "../styles/groups.styles";
import type { Group } from "../types/group.types";

export interface GroupDetailsInfoProps {
  group: Group | null;
  memberCount: number;
}

/** Read-only card of the details sheet: metadata plus the simplify-debts setting. */
export function GroupDetailsInfo({ group, memberCount }: GroupDetailsInfoProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groups");
  const fields = [
    {
      key: "name",
      label: t("details.nameLabel"),
      value: group?.name ?? "",
    },
    {
      key: "description",
      label: t("details.descriptionLabel"),
      value: group?.description ?? t("details.descriptionEmpty"),
    },
    {
      key: "currency",
      label: t("details.currencyLabel"),
      value: formatCurrencyLabel(group?.defaultCurrency),
    },
    {
      key: "members",
      label: t("details.membersLabel"),
      value: t("list.memberCount", { count: memberCount }),
    },
    {
      key: "simplifyDebts",
      label: t("details.simplifyDebtsLabel"),
      value: group?.simplifyDebts
        ? t("details.simplifyDebtsOn")
        : t("details.simplifyDebtsOff"),
    },
  ];

  return (
    <View
      style={[
        styles.infoCard,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      {fields.map((field) => (
        <View key={field.key} style={styles.infoBlock}>
          <ThemedText style={[styles.infoLabel, { color: theme.muted }]}>
            {field.label}
          </ThemedText>
          <ThemedText style={styles.infoValue}>{field.value}</ThemedText>
        </View>
      ))}
    </View>
  );
}
