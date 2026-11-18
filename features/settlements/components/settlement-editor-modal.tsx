import type { Category } from "@/features/categories/types/category.types";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import { PageSheetFormModal } from "@/shared/components/molecules/page-sheet-form-modal";

import type { SettlementEditorController } from "../hooks/use-settlement-editor";
import { SettlementForm } from "./settlement-form";

export interface SettlementEditorModalProps {
  editor: SettlementEditorController;
  friendName: string;
  wallets: readonly Wallet[];
  categories: readonly Category[];
}

/** Page sheet of the settlement edit form, opened from the detail actions. */
export function SettlementEditorModal({
  editor,
  friendName,
  wallets,
  categories,
}: SettlementEditorModalProps) {
  const { initialValues } = editor;

  return (
    <PageSheetFormModal
      visible={editor.visible && Boolean(initialValues)}
      onRequestClose={editor.close}
      onDismiss={editor.close}
    >
      {initialValues ? (
        <SettlementForm
          initialValues={initialValues}
          options={editor.options}
          friendName={friendName}
          debtCents={editor.debtCents}
          viewerIsCreditor={editor.viewerIsCreditor}
          wallets={wallets}
          categories={categories}
          fieldErrors={editor.fieldErrors}
          error={editor.error}
          submitting={editor.submitting}
          isEditing
          amountLocked={editor.amountLocked}
          onSubmit={editor.submit}
          onCancel={editor.close}
        />
      ) : null}
    </PageSheetFormModal>
  );
}
