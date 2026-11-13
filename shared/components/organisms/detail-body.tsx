import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";

import type { DetailField, DetailSummary } from "@/shared/types/detail.types";

import { DetailFieldsCard } from "./detail-fields-card";
import { detailStyles as styles } from "./detail.styles";
import { DetailSummaryCard } from "./detail-summary-card";

export interface DetailBodyProps {
  summary: DetailSummary;
  fields: readonly DetailField[];
  /** Optional feature error banner rendered above the summary. */
  errorContent?: ReactNode;
}

/** Scrollable body shared by every detail view: error, summary and fields. */
export function DetailBody({ summary, fields, errorContent }: DetailBodyProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {errorContent}
      <View style={styles.content}>
        <DetailSummaryCard summary={summary} />
        <DetailFieldsCard fields={fields} />
      </View>
    </ScrollView>
  );
}
