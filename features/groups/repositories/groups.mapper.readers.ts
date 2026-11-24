import {
  GROUP_DESCRIPTION_MAX_LENGTH,
  GROUP_INVITATION_STATUSES,
  type GroupInvitationStatus,
} from "../types/group.types";
import { normalizeGroupJoinCode } from "../utils/group-join-code";

export function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function readStringList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;

  const items: unknown[] = value;
  const list = items.map((item) => readText(item));

  return list.every((item) => item.length > 0) ? list : null;
}

export function readDescription(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return undefined;

  const description = value.trim();
  if (description.length > GROUP_DESCRIPTION_MAX_LENGTH) return undefined;

  return description.length > 0 ? description : null;
}

export function readStatus(value: unknown): GroupInvitationStatus | null {
  return GROUP_INVITATION_STATUSES.includes(value as GroupInvitationStatus)
    ? (value as GroupInvitationStatus)
    : null;
}

/**
 * **Simplificar deudas** is on by default: absent or `null` is a group created
 * before TICKET-010, and a malformed value also keeps it on instead of dropping
 * the whole group. Only a stored `false` turns the toggle off.
 */
export function readSimplifyDebts(value: unknown): boolean {
  return typeof value === "boolean" ? value : true;
}

/**
 * Absent/null is a legacy group (no code yet); a present but malformed code
 * maps to null instead of dropping the whole group.
 */
export function readJoinCode(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  return normalizeGroupJoinCode(value) || null;
}
