import { useCallback, useState } from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { validateFriendEmail } from "../schemas/friend.schema";
import { getFriendErrorCode } from "../services/friend.errors";
import type {
  FriendRelation,
  FriendSearchResult,
} from "../types/friend.types";
import { useFriendsService } from "./use-friends-service";

export type FriendSearchStatus = "idle" | "not-found" | "found";

export interface UseFriendSearchOptions {
  viewerUid: string | undefined;
}

export interface FriendSearchController {
  email: string;
  fieldError: string | null;
  searching: boolean;
  status: FriendSearchStatus;
  result: FriendSearchResult | null;
  error: string | null;
  setEmail: (value: string) => void;
  search: () => Promise<void>;
  reset: () => void;
  markRelation: (relation: FriendRelation, requestId: string | null) => void;
}

/** Exact-email search with inline validation and relation tracking. */
export function useFriendSearch({
  viewerUid,
}: UseFriendSearchOptions): FriendSearchController {
  const service = useFriendsService();
  const { tr } = useScopedTranslation("friends");
  const [email, setEmailValue] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [status, setStatus] = useState<FriendSearchStatus>("idle");
  const [result, setResult] = useState<FriendSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setEmail = useCallback((value: string) => {
    setEmailValue(value);
    setFieldError(null);
  }, []);

  const reset = useCallback(() => {
    setEmailValue("");
    setFieldError(null);
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  const markRelation = useCallback(
    (relation: FriendRelation, requestId: string | null) => {
      setResult((current) => (current ? { ...current, relation, requestId } : current));
    },
    [],
  );

  const search = useCallback(async () => {
    const validation = validateFriendEmail(email);

    if (!validation.ok) {
      const code = validation.error[0]?.code ?? "EMAIL_INVALID";
      setFieldError(tr(`errors.${code}`));
      setStatus("idle");
      setResult(null);
      return;
    }

    setFieldError(null);
    setError(null);

    if (!viewerUid) {
      setError(tr("errors.SIGN_IN_SEARCH"));
      return;
    }

    setSearching(true);

    try {
      const found = await service.searchByEmail(viewerUid, validation.value);
      setResult(found);
      setStatus(found ? "found" : "not-found");
    } catch (searchError: unknown) {
      setResult(null);
      setStatus("idle");
      setError(
        tr(`errors.${getFriendErrorCode(searchError, "SEARCH_FAILED")}`),
      );
    } finally {
      setSearching(false);
    }
  }, [email, viewerUid, service, tr]);

  return {
    email,
    fieldError,
    searching,
    status,
    result,
    error,
    setEmail,
    search,
    reset,
    markRelation,
  };
}
