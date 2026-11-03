import { toLocalIsoDate } from "./date";
import { getLastUsedDateOption } from "./date-quick-options";
import { getLastUsedIsoDate } from "./last-used-date-store";

/**
 * Default date for a new movement: the last saved date in this session when it
 * is still visible as a quick option, otherwise today.
 */
export function getDefaultMovementIsoDate(reference = new Date()): string {
  const lastUsedOption = getLastUsedDateOption(getLastUsedIsoDate(), reference);
  return lastUsedOption?.isoDate ?? toLocalIsoDate(reference) ?? "";
}
