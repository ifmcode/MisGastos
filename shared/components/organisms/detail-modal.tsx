import type { ReactNode } from "react";
import { Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConfirmDialog } from "@/shared/components/molecules/confirm-dialog";
import { useDetailActions } from "@/shared/hooks/use-detail-actions";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { EMPTY_DETAIL_SUMMARY } from "@/shared/types/detail.types";
import type {
  DetailActionLabels,
  DetailDeleteConfirmation,
  DetailField,
  DetailMissingStateLabels,
  DetailSummary,
} from "@/shared/types/detail.types";

import { DetailView } from "./detail-view";
import { detailStyles as styles } from "./detail.styles";

export interface DetailModalProps {
  visible: boolean;
  title: string;
  subtitle: string;
  summary?: DetailSummary;
  fields?: readonly DetailField[];
  /** True when the selected record is gone and the missing state must show. */
  missing: boolean;
  disabled?: boolean;
  labels: DetailActionLabels;
  missingLabels: DetailMissingStateLabels;
  /** Optional feature error banner rendered above the summary. */
  errorContent?: ReactNode;
  deleteConfirmation: DetailDeleteConfirmation | null;
  onEdit: () => void;
  /** Returns true when the record was deleted and the modal can close. */
  onConfirmDelete: () => Promise<boolean>;
  onClose: () => void;
}

/**
 * Page-sheet shell of the shared read-only detail: it adds the modal, the
 * safe area and the confirmation on top of the route-safe `DetailView`.
 */
export function DetailModal({
  visible,
  title,
  subtitle,
  summary = EMPTY_DETAIL_SUMMARY,
  fields = [],
  missing,
  disabled = false,
  labels,
  missingLabels,
  errorContent,
  deleteConfirmation,
  onEdit,
  onConfirmDelete,
  onClose,
}: DetailModalProps) {
  const theme = useFormTheme();
  const actions = useDetailActions({
    deleteConfirmation,
    onConfirmDelete,
    onClose,
  });

  function handleRequestClose() {
    if (actions.confirm.visible) {
      actions.confirm.close();
      return;
    }

    actions.closeDetail();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleRequestClose}
      onDismiss={actions.confirm.close}
    >
      {visible ? (
        <SafeAreaView
          style={[styles.safeArea, { backgroundColor: theme.background }]}
        >
          <DetailView
            title={title}
            subtitle={subtitle}
            summary={summary}
            fields={fields}
            missing={missing}
            disabled={disabled}
            labels={labels}
            missingLabels={missingLabels}
            errorContent={errorContent}
            onEdit={onEdit}
            onDelete={actions.requestDelete}
            onClose={actions.closeDetail}
          />

          {missing ? null : (
            <ConfirmDialog
              visible={actions.confirm.visible}
              title={actions.confirm.title}
              message={actions.confirm.message}
              confirmLabel={actions.confirm.confirmLabel}
              cancelLabel={actions.confirm.cancelLabel}
              onConfirm={actions.confirm.confirm}
              onCancel={actions.confirm.close}
            />
          )}
        </SafeAreaView>
      ) : null}
    </Modal>
  );
}
