import { useTranslation } from "react-i18next";

import { Fab } from "@/shared/components/molecules/fab";

export interface TransactionsFabProps {
  bottom: number;
  onPress: () => void;
}

export function TransactionsFab({ bottom, onPress }: TransactionsFabProps) {
  const { t } = useTranslation("transactions");

  return (
    <Fab
      accessibilityLabel={t("add")}
      bottom={bottom}
      onPress={onPress}
    />
  );
}
