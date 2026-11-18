import type { ReactNode } from "react";
import { View } from "react-native";

import { EMPTY_DETAIL_SUMMARY } from "@/shared/types/detail.types";
import type {
  DetailActionLabels,
  DetailCloseIcon,
  DetailField,
  DetailMissingStateLabels,
  DetailSummary,
} from "@/shared/types/detail.types";

import { DetailBody } from "./detail-body";
import { DetailHeader } from "./detail-header";
import { DetailMissingState } from "./detail-missing-state";
import { detailStyles as styles } from "./detail.styles";

export interface DetailViewProps {
  title: string;
  subtitle: string;
  summary?: DetailSummary;
  fields?: readonly DetailField[];
  /** True when the selected record is gone and the missing state must show. */
  missing: boolean;
  disabled?: boolean;
  labels: DetailActionLabels;
  missingLabels: DetailMissingStateLabels;
  /** Optional feature banners (errors, notices) rendered above the summary. */
  errorContent?: ReactNode;
  /** Primary follow-up rendered above the summary, visible without scrolling. */
  highlightContent?: ReactNode;
  /** Optional feature blocks rendered after the fields card. */
  children?: ReactNode;
  /** "back" on routes that push the detail; "close" inside a modal. */
  closeIcon?: DetailCloseIcon;
  onEdit: () => void;
  /** Opens the feature confirmation; the caller decides whether to delete. */
  onDelete: () => void;
  onClose: () => void;
}

/**
 * Route-safe read-only detail layout: header actions, summary, fields, optional
 * banners, extra blocks and the missing-record state. It owns no navigation, no
 * modal and no dialog state, so `DetailModal` and full-screen routes share it.
 */
export function DetailView({
  title,
  subtitle,
  summary = EMPTY_DETAIL_SUMMARY,
  fields = [],
  missing,
  disabled = false,
  labels,
  missingLabels,
  errorContent,
  highlightContent,
  children,
  closeIcon,
  onEdit,
  onDelete,
  onClose,
}: DetailViewProps) {
  return (
    <View style={styles.container}>
      {missing ? (
        <DetailMissingState labels={missingLabels} onClose={onClose} />
      ) : (
        <>
          <DetailHeader
            title={title}
            subtitle={subtitle}
            disabled={disabled}
            labels={labels}
            closeIcon={closeIcon}
            onEdit={onEdit}
            onDelete={onDelete}
            onClose={onClose}
          />

          <DetailBody
            summary={summary}
            fields={fields}
            errorContent={errorContent}
            highlightContent={highlightContent}
          >
            {children}
          </DetailBody>
        </>
      )}
    </View>
  );
}
