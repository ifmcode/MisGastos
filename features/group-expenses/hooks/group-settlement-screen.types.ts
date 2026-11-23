import type { Category } from "@/features/categories/types/category.types";
import type { GroupDetail } from "@/features/groups/types/group.types";
import type { Wallet } from "@/features/wallets/types/wallet.types";

import type { GroupSettlementFieldErrors } from "../schemas/group-settlement.schema";
import type { GroupDebt } from "../types/group-balance.types";
import type {
  GroupSettlement,
  GroupSettlementInput,
} from "../types/group-settlement.types";
import type {
  GroupSettlementDirection,
  GroupSettlementFormValues,
} from "../utils/group-settlement-form.types";
import type { GroupSettlementLoadStatus } from "./use-group-settlement-load";

export type GroupSettlementScreenStatus =
  | GroupSettlementLoadStatus
  | "no-debt"
  | "select";

export interface UseGroupSettlementScreenOptions {
  /** Create route group; the edit record owns it. */
  groupId: string;
  settlementId: string;
  /** Create route currency, already uppercased. */
  currency: string;
  fromUserId: string;
  toUserId: string;
}

export interface GroupSettlementScreenController {
  status: GroupSettlementScreenStatus;
  isEditing: boolean;
  detail: GroupDetail | null;
  settlement: GroupSettlement | null;
  debt: GroupDebt | null;
  direction: GroupSettlementDirection | null;
  boundCents: number;
  groupName: string;
  fromName: string;
  toName: string;
  viewerUid: string;
  viewerIsCreditor: boolean;
  amountLocked: boolean;
  initialValues: GroupSettlementFormValues | null;
  /** Debts listed by the select step; empty means nothing to settle. */
  debts: GroupDebt[];
  /** Group setting behind the direct/simplified caption of the select step. */
  simplifyDebts: boolean;
  /** Opens the form of the chosen pair on the same route. */
  selectDebt: (debt: GroupDebt) => void;
  wallets: Wallet[];
  categories: Category[];
  fieldErrors: GroupSettlementFieldErrors;
  formError: string | null;
  submitting: boolean;
  error: string | null;
  reload: () => void;
  leave: () => void;
  submit: (input: GroupSettlementInput) => void;
}
