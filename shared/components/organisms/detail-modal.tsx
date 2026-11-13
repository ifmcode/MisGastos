import type { ReactNode } from "react";
import { Modal, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConfirmDialog } from "@/shared/components/molecules/confirm-dialog";
import { useConfirmDialog } from "@/shared/hooks/use-confirm-dialog";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { EMPTY_DETAIL_SUMMARY } from "@/shared/types/detail.types";
import type {
  DetailActionLabels,
  DetailDeleteConfirmation,
  DetailField,
  DetailMissingStateLabels,
  DetailSummary,
} from "@/shared/types/detail.types";

import { DetailBody } from "./detail-body";
import { DetailHeader } from "./detail-header";
import { DetailMissingState } from "./detail-missing-state";
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
 * Shared read-only detail view: page-sheet shell, header actions, summary,
 * fields, optional error and the missing-record state. Features pass resolved
 * copy and data, so no visible string or domain type lives here.
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
  const deleteDialog = useConfirmDialog();

  function closeDetail() {
    deleteDialog.close();
    onClose();
  }

  async function confirmDelete() {
    const deleted = await onConfirmDelete();
    if (deleted) closeDetail();
  }

  function requestDelete() {
    if (!deleteConfirmation) return;

    deleteDialog.open({
      title: deleteConfirmation.title,
      message: deleteConfirmation.message,
      onConfirm: () => {
        void confirmDelete();
      },
    });
  }

  function handleRequestClose() {
    if (deleteDialog.visible) {
      deleteDialog.close();
      return;
    }

    closeDetail();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleRequestClose}
      onDismiss={deleteDialog.close}
    >
      {visible ? (
        <SafeAreaView
          style={[styles.safeArea, { backgroundColor: theme.background }]}
        >
          <View style={styles.container}>
            {missing ? (
              <DetailMissingState
                labels={missingLabels}
                onClose={closeDetail}
              />
            ) : (
              <>
                <DetailHeader
                  title={title}
                  subtitle={subtitle}
                  disabled={disabled}
                  labels={labels}
                  onEdit={onEdit}
                  onDelete={requestDelete}
                  onClose={closeDetail}
                />

                <DetailBody
                  summary={summary}
                  fields={fields}
                  errorContent={errorContent}
                />
              </>
            )}

            {missing ? null : (
              <ConfirmDialog
                visible={deleteDialog.visible}
                title={deleteDialog.title}
                message={deleteDialog.message}
                confirmLabel={deleteDialog.confirmLabel}
                cancelLabel={deleteDialog.cancelLabel}
                onConfirm={deleteDialog.confirm}
                onCancel={deleteDialog.close}
              />
            )}
          </View>
        </SafeAreaView>
      ) : null}
    </Modal>
  );
}
