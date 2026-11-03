import { useSyncExternalStore } from "react";

import {
  getLastUsedIsoDate,
  subscribeToLastUsedDate,
} from "@/shared/utils/last-used-date-store";

/** Last date saved in this app session, or null when nothing was saved yet. */
export function useLastUsedDate(): string | null {
  return useSyncExternalStore(
    subscribeToLastUsedDate,
    getLastUsedIsoDate,
    getLastUsedIsoDate,
  );
}
