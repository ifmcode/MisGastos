import { useCallback, useState } from "react";
import { Share } from "react-native";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getGroupErrorCode } from "../services/group.errors";
import { formatGroupJoinCode } from "../utils/group-join-code";
import { useGroupsService } from "./use-groups-service";

export interface UseGroupJoinCodeOptions {
  viewerUid: string | undefined;
  groupId: string;
  groupName: string;
  /** Code already stored in the group; `null` for a legacy group. */
  joinCode: string | null;
  /** Refreshes the detail so the generated code is persisted in the view. */
  onGenerated: () => void;
}

export interface GroupJoinCodeController {
  code: string | null;
  generating: boolean;
  error: string | null;
  generate: () => void;
  share: () => void;
}

/**
 * Shareable code of the group detail. Generation is owner-only and lazy, and a
 * denied concurrent create is reported as a stable error code. Sharing goes
 * through the platform sheet, so web only needs the promise rejection handled.
 */
export function useGroupJoinCode({
  viewerUid,
  groupId,
  groupName,
  joinCode,
  onGenerated,
}: UseGroupJoinCodeOptions): GroupJoinCodeController {
  const service = useGroupsService();
  const { tr } = useScopedTranslation("groups");
  const [generated, setGenerated] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const code = joinCode ?? generated;

  const generate = useCallback(() => {
    if (!viewerUid || !groupId || generating) return;

    setGenerating(true);
    setError(null);

    void service
      .ensureJoinCode(viewerUid, groupId)
      .then((value) => {
        setGenerated(value);
        onGenerated();
      })
      .catch((generateError: unknown) => {
        const mapped = getGroupErrorCode(generateError, "SAVE_FAILED");
        setError(tr(`errors.${mapped}`));
      })
      .finally(() => setGenerating(false));
  }, [generating, groupId, onGenerated, service, tr, viewerUid]);

  const share = useCallback(() => {
    if (!code) return;

    const message = tr("detail.joinCodeShareMessage", {
      group: groupName,
      code: formatGroupJoinCode(code),
    });

    void Share.share({ message }).catch(() => {
      setError(tr("detail.joinCodeShareFailed"));
    });
  }, [code, groupName, tr]);

  return { code, generating, error, generate, share };
}
