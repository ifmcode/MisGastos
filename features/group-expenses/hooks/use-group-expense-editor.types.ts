import type { Group, GroupDetail } from "@/features/groups/types/group.types";
import type { CurrencyCode } from "@/shared/constants/currencies";

import type { GroupExpenseFieldErrors } from "../schemas/group-expense.schema";
import type {
  GroupExpense,
  GroupExpenseInput,
} from "../types/group-expense.types";
import type { GroupExpenseFormValues } from "../utils/group-expense-form";

/** Public contract of `useGroupExpenseEditor`, kept out of the hook body. */
export interface UseGroupExpenseEditorOptions {
  viewerUid: string | undefined;
  /** Groups of the movements picker; the group detail entry point passes none. */
  groups: readonly Group[];
  /** Already-loaded group detail: its members are reused instead of re-read. */
  lockedDetail?: GroupDetail | null;
  /** Currency of a create before any group is picked. */
  preferredCurrency: CurrencyCode;
  onSaved: () => void;
}

export interface GroupExpenseEditorController {
  formVisible: boolean;
  editingExpense: GroupExpense | null;
  initialValues: GroupExpenseFormValues;
  /** Changes with the group and its members, so the page sheet remounts. */
  formKey: string;
  formError: string | null;
  fieldErrors: GroupExpenseFieldErrors;
  submitting: boolean;
  groupId: string;
  groupName: string;
  /** Editing or opening from the group detail keeps the group read-only. */
  groupLocked: boolean;
  groupPickerVisible: boolean;
  groups: readonly Group[];
  members: GroupDetail["members"];
  memberIds: string[];
  membersLoading: boolean;
  membersError: string | null;
  retryMembers: () => void;
  openCreate: () => void;
  openEdit: (expense: GroupExpense) => void;
  closeForm: () => void;
  openGroupPicker: () => void;
  closeGroupPicker: () => void;
  selectGroup: (groupId: string) => void;
  submit: (input: GroupExpenseInput) => void;
}
