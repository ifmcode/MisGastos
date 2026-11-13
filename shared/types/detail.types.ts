/** Semantic tone of the detail summary amount. */
export type DetailTone = "positive" | "negative" | "neutral";

export interface DetailSummary {
  /** Type label shown above the amount ("Gasto", "Transferencia"…). */
  label: string;
  /** Already formatted amount, including any sign the feature wants to show. */
  amount: string;
  /** Secondary line under the amount, usually the currency code. */
  meta: string;
  tone: DetailTone;
}

/** Read-only row shown by the detail fields card. */
export interface DetailField {
  key: string;
  label: string;
  value: string;
}

/** Neutral placeholder used while the detail has no record to show. */
export const EMPTY_DETAIL_SUMMARY: DetailSummary = {
  label: "",
  amount: "",
  meta: "",
  tone: "neutral",
};

/** Copy of the confirmation shown before deleting from the detail view. */
export interface DetailDeleteConfirmation {
  title: string;
  message: string;
}

export interface DetailActionLabels {
  close: string;
  edit: string;
  editHint?: string;
  delete: string;
  deleteHint?: string;
}

export interface DetailMissingStateLabels {
  title: string;
  message: string;
  close: string;
  closeAccessibilityLabel: string;
}
