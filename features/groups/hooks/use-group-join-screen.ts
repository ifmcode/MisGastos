import { useCallback, useMemo, useRef, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getGroupErrorCode } from "../services/group.errors";
import type { GroupJoinLookup } from "../types/group-join.types";
import { readGroupJoinCodeInput } from "../utils/group-join-input";
import { resolveGroupJoinView, type GroupJoinView } from "../utils/group-join-view";
import { useGroupJoinRequest } from "./use-group-join-request";
import { useGroupsService } from "./use-groups-service";

export type GroupJoinStatus = "idle" | "looking" | "sending";

export interface GroupJoinScreenController {
  code: string;
  fieldError: string | null;
  error: string | null;
  status: GroupJoinStatus;
  view: GroupJoinView;
  onChangeCode: (value: string) => void;
  lookup: () => Promise<void>;
  sendRequest: () => Promise<void>;
  resetCode: () => void;
}

/**
 * Join-code route state: the raw field, the resolved lookup and one single
 * flight for the lookup and the request. The visible state is derived by
 * `resolveGroupJoinView`, so the component only renders it.
 */
export function useGroupJoinScreen(): GroupJoinScreenController {
  const service = useGroupsService();
  const { tr } = useScopedTranslation("groups");
  const { user } = useAuth();
  const viewerUid = user?.uid;
  const [code, setCode] = useState("");
  const [result, setResult] = useState<GroupJoinLookup | null>(null);
  const [sent, setSent] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [looking, setLooking] = useState(false);
  const inFlightRef = useRef(false);

  const handleSent = useCallback(() => setSent(true), []);

  const request = useGroupJoinRequest({
    viewerUid,
    lookup: result,
    onLookupChanged: setResult,
    onSent: handleSent,
  });
  const clearRequestError = request.clearError;

  const view = useMemo(
    () => resolveGroupJoinView({ lookup: result, sent, errorCode }),
    [result, sent, errorCode],
  );

  const onChangeCode = useCallback((value: string) => {
    setCode(value);
    setFieldError(null);
  }, []);

  const lookup = useCallback(async () => {
    if (inFlightRef.current) return;

    const input = readGroupJoinCodeInput(code);
    if (input.error) {
      setFieldError(
        tr(
          input.error === "required" ? "join.codeRequired" : "join.codeInvalid",
        ),
      );
      return;
    }

    if (!viewerUid) {
      setError(tr("errors.SIGN_IN_REQUIRED"));
      return;
    }

    inFlightRef.current = true;
    setLooking(true);
    setFieldError(null);
    setError(null);
    setErrorCode(null);
    setSent(false);
    clearRequestError();

    try {
      setResult(await service.lookupJoinCode(viewerUid, input.code));
    } catch (lookupError: unknown) {
      const mapped = getGroupErrorCode(lookupError, "LOAD_FAILED");
      setResult(null);
      setErrorCode(mapped);
      if (mapped === "INVALID_JOIN_CODE") {
        setFieldError(tr("join.codeInvalid"));
      } else {
        setError(tr(`errors.${mapped}`));
      }
    } finally {
      inFlightRef.current = false;
      setLooking(false);
    }
  }, [clearRequestError, code, service, tr, viewerUid]);

  const resetCode = useCallback(() => {
    setCode("");
    setResult(null);
    setSent(false);
    setFieldError(null);
    setError(null);
    setErrorCode(null);
    clearRequestError();
  }, [clearRequestError]);

  const status: GroupJoinStatus = looking
    ? "looking"
    : request.sending
      ? "sending"
      : "idle";

  return {
    code,
    fieldError,
    error: error ?? request.error,
    status,
    view,
    onChangeCode,
    lookup,
    sendRequest: request.sendRequest,
    resetCode,
  };
}
