import type {
  Profile,
  ProfileSaveInput,
} from "@/features/profile/types/profile.types";

/**
 * Saving the preference rewrites the whole profile document, so the fields
 * owned by the profile form are preserved and only the shared-expense default
 * changes. A missing display name falls back to an empty string, exactly like
 * the profile form does.
 */
export function buildSharedExpensePreferenceSaveInput(
  profile: Profile,
  uid: string,
  email: string | null,
  value: boolean,
): ProfileSaveInput {
  return {
    uid,
    email,
    displayName: profile.displayName ?? "",
    preferredCurrency: profile.preferredCurrency,
    registerSharedExpensesInWallet: value,
  };
}
