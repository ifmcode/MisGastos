import type { CurrencyCode } from "@/shared/constants/currencies";

export interface Profile {
  id: string;
  uid: string;
  email: string | null;
  displayName: string | null;
  preferredCurrency: CurrencyCode;
  /** Default of the shared-expense wallet toggle; a missing value means false. */
  registerSharedExpensesInWallet: boolean;
}

/** Raw values handled by the profile form. */
export interface ProfileFormValues {
  displayName: string;
  preferredCurrency: CurrencyCode;
}

export interface UpdateProfileDto {
  displayName: string;
  preferredCurrency: CurrencyCode;
}

export interface ProfileSaveInput {
  uid: string;
  email?: string | null;
  displayName: string;
  preferredCurrency: string;
  registerSharedExpensesInWallet: boolean;
}

export interface ValidatedProfileSaveInput {
  uid: string;
  email: string | null;
  displayName: string;
  preferredCurrency: CurrencyCode;
  registerSharedExpensesInWallet: boolean;
}
