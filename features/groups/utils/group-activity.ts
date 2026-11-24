import type { GroupMetadataUpdate } from "../types/group.types";
import {
  GROUP_ACTIVITY_MAX_PAGE_SIZE,
  GROUP_ACTIVITY_PAGE_SIZE,
  type GroupActivityChangedField,
} from "../types/group-activity.types";

/**
 * Page size of the history: a missing or malformed value falls back to 20 and
 * everything else is clamped to 1..50, so a caller can never ask the server for
 * an unbounded feed.
 */
export function clampGroupActivityLimit(limit: unknown): number {
  if (typeof limit !== "number" || !Number.isFinite(limit)) {
    return GROUP_ACTIVITY_PAGE_SIZE;
  }

  const rounded = Math.floor(limit);

  if (rounded < 1) return 1;

  return Math.min(rounded, GROUP_ACTIVITY_MAX_PAGE_SIZE);
}

/** Metadata fields a `group-updated` event reports, in a stable order. */
export function collectGroupMetadataChanges(
  previous: Pick<GroupMetadataUpdate, "name" | "description" | "defaultCurrency">,
  next: Pick<GroupMetadataUpdate, "name" | "description" | "defaultCurrency">,
): GroupActivityChangedField[] {
  const fields: GroupActivityChangedField[] = [];

  if (previous.name !== next.name) fields.push("name");
  if (previous.description !== next.description) fields.push("description");
  if (previous.defaultCurrency !== next.defaultCurrency) {
    fields.push("defaultCurrency");
  }

  return fields;
}
