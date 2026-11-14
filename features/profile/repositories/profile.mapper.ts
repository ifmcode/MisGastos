import { resolveCurrencyCode } from "@/shared/constants/currencies";

import { Profile } from "../types/profile.types";

export interface ProfileMapFallback {
  uid: string;
  email?: string | null;
}

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readTextOrNull(value: unknown): string | null {
  const text = readText(value);
  return text.length > 0 ? text : null;
}

/**
 * Converts a `users` document into a Profile. Missing or malformed fields fall
 * back to safe values so a legacy document never breaks Settings.
 */
export function mapProfileDocument(
  id: string,
  data: Record<string, unknown>,
  fallback: ProfileMapFallback,
): Profile {
  const storedUid = readText(data.uid);

  return {
    id,
    uid: storedUid.length > 0 ? storedUid : fallback.uid,
    email: readTextOrNull(data.email) ?? fallback.email ?? null,
    displayName: readTextOrNull(data.name),
    preferredCurrency: resolveCurrencyCode(data.preferredCurrency),
  };
}
