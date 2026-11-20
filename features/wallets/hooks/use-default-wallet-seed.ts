import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { useProfile } from "@/features/profile/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { useAppLanguage } from "@/shared/hooks/use-app-language";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { useWalletService } from "./use-wallet-service";

/** Bounded retry budget for a failed seed; resuming the app retries too. */
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;

/**
 * Seeds the account's main wallet on the first authenticated load, for new and
 * legacy accounts with zero wallets. The auth user is the source of truth, so
 * it does not wait for the profile: the stored profile currency is read inside
 * the operation, and `profile` only provides the fallback here. It is silent and
 * never blocks the UI: a failure retries a few times and then waits for the next
 * load. The stored name is resolved from the active language, so the language is
 * part of the run key.
 */
export function useDefaultWalletSeed(): void {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { t } = useScopedTranslation("wallets");
  const { language } = useAppLanguage();
  const service = useWalletService();

  const keyRef = useRef<string | null>(null);
  const seededRef = useRef<string | null>(null);
  const attemptsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const uid = user?.uid ?? null;
  // Only a fallback: the stored profile currency wins inside the transaction.
  const preferredCurrency = profile?.preferredCurrency;
  const name = t("defaults.mainWalletName");

  const clearTimer = useCallback(() => {
    if (timerRef.current === null) return;

    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => {
    clearTimer();

    if (!uid) {
      // A later sign-in must seed again even with the same account.
      keyRef.current = null;
      seededRef.current = null;
      attemptsRef.current = 0;
      return;
    }

    const key = `${uid}|${language}|${name}`;
    if (keyRef.current !== key) {
      keyRef.current = key;
      attemptsRef.current = 0;
    }

    if (seededRef.current === key) return;

    let cancelled = false;
    let finished = false;
    attemptsRef.current += 1;
    seededRef.current = key;

    void service
      .seedDefaultWallet(uid, { name, preferredCurrency })
      .then(() => {
        finished = true;
      })
      .catch(() => {
        // A newer identity or attempt owns the bookkeeping now.
        if (cancelled || keyRef.current !== key) return;

        seededRef.current = null;
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
      if (!finished && seededRef.current === key) {
        seededRef.current = null;
      }
    };
  }, [
    clearTimer,
    language,
    name,
    preferredCurrency,
    retryToken,
    service,
    uid,
  ]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState !== "active") return;

        clearTimer();
        keyRef.current = null;
        seededRef.current = null;
        attemptsRef.current = 0;
        setRetryToken((token) => token + 1);
      },
    );

    return () => subscription.remove();
  }, [clearTimer]);
}
