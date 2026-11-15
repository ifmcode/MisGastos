import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { useProfile } from "@/features/profile/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";

import { useFriendsService } from "./use-friends-service";

/** Bounded retry budget for a failed publish; resuming the app retries too. */
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;

/**
 * Publishes the signed-in profile to `publicProfiles` so other users can find
 * the account by email. The auth email wins because the write is authorized
 * against it. The profile is not published while it is still loading, and a
 * failure retries a few times before dropping the attempt.
 */
export function useFriendsProfileSync(): void {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const service = useFriendsService();

  const keyRef = useRef<string | null>(null);
  const syncedRef = useRef<string | null>(null);
  const attemptsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const uid = profileLoading ? null : (profile?.uid ?? user?.uid ?? null);
  const email = user?.email ?? profile?.email ?? null;
  const displayName = profile?.displayName ?? user?.displayName ?? null;

  const clearTimer = useCallback(() => {
    if (timerRef.current === null) return;

    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => {
    clearTimer();

    if (profileLoading) return;

    if (!uid || !email) {
      // A later sign-in must sync again even with the same account.
      keyRef.current = null;
      syncedRef.current = null;
      attemptsRef.current = 0;
      return;
    }

    const key = `${uid}|${email}|${displayName ?? ""}`;
    if (keyRef.current !== key) {
      keyRef.current = key;
      attemptsRef.current = 0;
    }

    if (syncedRef.current === key) return;

    let cancelled = false;
    let published = false;
    attemptsRef.current += 1;
    syncedRef.current = key;

    void service
      .ensurePublicProfile({ uid, displayName, email })
      .then(() => {
        published = true;
      })
      .catch(() => {
        // A newer identity or attempt owns the bookkeeping now.
        if (cancelled || keyRef.current !== key) return;

        syncedRef.current = null;
        if (attemptsRef.current >= MAX_ATTEMPTS) return;

        timerRef.current = setTimeout(
          () => setRetryToken((token) => token + 1),
          RETRY_DELAY_MS,
        );
      });

    return () => {
      cancelled = true;
      clearTimer();

      // An attempt cancelled before it finished must not block the next run.
      if (!published && syncedRef.current === key) {
        syncedRef.current = null;
      }
    };
  }, [clearTimer, displayName, email, profileLoading, retryToken, service, uid]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState !== "active") return;

        clearTimer();
        keyRef.current = null;
        syncedRef.current = null;
        attemptsRef.current = 0;
        setRetryToken((token) => token + 1);
      },
    );

    return () => subscription.remove();
  }, [clearTimer]);
}
