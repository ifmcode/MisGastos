import type { DocumentReference, Transaction } from "firebase/firestore";

import {
  CurrencyCode,
  isCurrencyCode,
  resolveCurrencyCode,
} from "@/shared/constants/currencies";

/**
 * ISO marker stored on the profile. It is what prevents a re-seed after the
 * user deletes every wallet, so it is written even when no wallet is created.
 */
const SEEDED_AT_FIELD = "defaultWalletSeededAt";

export function hasSeedMarker(profile: Record<string, unknown> | null): boolean {
  const marker = profile?.[SEEDED_AT_FIELD];
  return typeof marker === "string" && marker.trim().length > 0;
}

/**
 * Currency of the seeded wallet. The stored preference wins because the profile
 * is the account source of truth; an invalid or missing value falls back to the
 * DTO currency, which the service already resolved with the EUR fallback.
 */
export function resolveSeedCurrency(
  profile: Record<string, unknown> | null,
  fallback: CurrencyCode,
): CurrencyCode {
  const stored = profile?.preferredCurrency;
  const resolved = resolveCurrencyCode(stored);

  return isCurrencyCode(stored) ? resolved : fallback;
}

/**
 * Only the marker is written on the existing profile: name, email and preferred
 * currency belong to the user and are never overwritten by the seed.
 */
export function writeProfileMarker(
  firestoreTransaction: Transaction,
  profileRef: DocumentReference,
  now: string,
): void {
  firestoreTransaction.update(profileRef, {
    [SEEDED_AT_FIELD]: now,
    updatedAt: now,
  });
}
