import type { Category } from "@/features/categories/types/category.types";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { formatCurrencyLabel } from "@/shared/utils/currency-label";

import {
  useGroupSettlementForm,
  type GroupSettlementFormController,
} from "../hooks/use-group-settlement-form";
import type { GroupSettlementFieldErrors } from "../schemas/group-settlement.schema";
import type { GroupSettlementInput } from "../types/group-settlement.types";
import type {
  GroupSettlementDirection,
  GroupSettlementFormValues,
} from "../utils/group-settlement-form.types";
import { GroupSettlementFormBody } from "./group-settlement-form-body";

export interface GroupSettlementFormProps {
  initialValues: GroupSettlementFormValues;
  /** Outstanding debt of the pair bound to this form. */
  debtCents: number;
  viewerIsCreditor: boolean;
  amountLocked: boolean;
  direction: GroupSettlementDirection;
  /** Already resolved display names of the group and the pair. */
  groupName: string;
  fromName: string;
  toName: string;
  wallets: readonly Wallet[];
  categories: readonly Category[];
  fieldErrors: GroupSettlementFieldErrors;
  error: string | null;
  submitting: boolean;
  isEditing: boolean;
  onSubmit: (input: GroupSettlementInput) => void;
  onCancel: () => void;
}

/**
 * Group settlement form. The controller owns the draft; the parent only needs
 * to remount it when the resolved pair changes, so the values never reset
 * under the user's fingers.
 */
export function GroupSettlementForm({
  initialValues,
  debtCents,
  viewerIsCreditor,
  amountLocked,
  direction,
  groupName,
  fromName,
  toName,
  wallets,
  categories,
  fieldErrors,
  error,
  submitting,
  isEditing,
  onSubmit,
  onCancel,
}: GroupSettlementFormProps) {
  const locale = useAppLocale();
  const form: GroupSettlementFormController = useGroupSettlementForm({
    initialValues,
    debtCents,
    viewerIsCreditor,
    fieldErrors,
    onSubmit,
  });

  return (
    <GroupSettlementFormBody
      form={form}
      groupName={groupName}
      fromName={fromName}
      toName={toName}
      currencyLabel={formatCurrencyLabel(initialValues.currency)}
      debtAmount={locale.formatCurrency(debtCents / 100, initialValues.currency)}
      direction={direction}
      isEditing={isEditing}
      amountLocked={amountLocked}
      viewerIsCreditor={viewerIsCreditor}
      wallets={wallets}
      categories={categories}
      error={error}
      submitting={submitting}
      onCancel={onCancel}
    />
  );
}
