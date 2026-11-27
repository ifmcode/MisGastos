import { useCallback, useRef, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useAuthService } from "@/features/auth/hooks/use-auth-service";
import { useSync } from "@/features/sync/providers/sync-context";
import { readSyncOverview } from "@/features/sync/services/sync-overview";
import {
  useConfirmDialog,
  type UseConfirmDialogResult,
} from "@/shared/hooks/use-confirm-dialog";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

interface LogoutCounts {
  pending: number;
  conflicts: number;
}

export interface SettingsLogoutController {
  /** True while `authService.logout()` is running. */
  busy: boolean;
  /** True while the fresh counter read runs; the button is disabled too. */
  checking: boolean;
  /** Already translated; null until a sign-out fails. */
  errorMessage: string | null;
  /** Warning dialog state and pending action. */
  confirm: UseConfirmDialogResult;
  /** Runs the pending-changes warning first, then the sign-out. */
  requestLogout: () => void;
  /** Signs out without asking; safe to call more than once. */
  logout: () => void;
}

/**
 * Sign-out of Settings. Pending uploads are never dropped silently: the open
 * queue is read from the local database right before deciding, so a movement
 * created a second ago still triggers the warning. Only the confirmation runs
 * `authService.logout()`, which also purges the account's local data. It never
 * navigates: `AuthNavigator` reacts to the auth state.
 */
export function useSettingsLogout(): SettingsLogoutController {
  const authService = useAuthService();
  const { user } = useAuth();
  const { pendingCount, conflictCount } = useSync();
  const { t } = useScopedTranslation("settings");
  const confirm = useConfirmDialog();
  const { open } = confirm;
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inFlightRef = useRef(false);
  const checkingRef = useRef(false);
  const uid = user?.uid ?? null;

  /** Fresh counters; the shared ones are the fallback when the read fails. */
  const readCounts = useCallback(async (): Promise<LogoutCounts> => {
    if (uid) {
      try {
        const overview = await readSyncOverview(uid);
        return {
          pending: overview.pendingCount,
          conflicts: overview.conflictCount,
        };
      } catch {
        // The warning must never block the sign-out.
      }
    }

    return { pending: pendingCount, conflicts: conflictCount };
  }, [conflictCount, pendingCount, uid]);

  const run = useCallback(async () => {
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setBusy(true);
    setErrorMessage(null);

    try {
      await authService.logout();
    } catch {
      setErrorMessage(t("logoutWarning.error"));
    } finally {
      inFlightRef.current = false;
      setBusy(false);
    }
  }, [authService, t]);

  const logout = useCallback(() => {
    void run();
  }, [run]);

  const requestLogout = useCallback(() => {
    if (checkingRef.current || inFlightRef.current) return;

    checkingRef.current = true;
    setChecking(true);

    void (async () => {
      let counts: LogoutCounts = {
        pending: pendingCount,
        conflicts: conflictCount,
      };

      try {
        counts = await readCounts();
      } finally {
        // Released before the dialog opens so its confirm can sign out.
        checkingRef.current = false;
        setChecking(false);
      }

      const details = [
        counts.pending > 0
          ? t("logoutWarning.pending", { count: counts.pending })
          : null,
        counts.conflicts > 0
          ? t("logoutWarning.conflicts", { count: counts.conflicts })
          : null,
      ].filter((part): part is string => part !== null);

      if (details.length === 0) {
        logout();
        return;
      }

      open({
        title: t("logoutWarning.title"),
        message: t("logoutWarning.message", { details: details.join(" · ") }),
        confirmLabel: t("logoutWarning.confirm"),
        cancelLabel: t("logoutWarning.cancel"),
        onConfirm: logout,
      });
    })();
  }, [conflictCount, logout, open, pendingCount, readCounts, t]);

  return { busy, checking, errorMessage, confirm, requestLogout, logout };
}
