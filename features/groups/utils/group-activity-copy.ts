import type { Translate } from "@/shared/i18n/translate";
import { joinMetaParts } from "@/shared/utils/join-meta";

import { getGroupErrorCode } from "../services/group.errors";
import { MISSING_GROUP_CODES } from "./group-error-codes";
import type { GroupActivityDisplay } from "./group-activity-display";

const NAMED_TARGET_TYPES = new Set(["member-removed", "owner-transferred"]);
const SELF_SUBJECT_TYPES = new Set(["member-left"]);

export interface GroupActivityTitleOptions {
  tr: Translate;
  /** Translated label used when the event carries no resolvable name. */
  fallback: string;
}

/** Copy keys of a `member-joined` event. */
function getMemberJoinedTitle(
  activity: GroupActivityDisplay,
  tr: Translate,
  fallback: string,
): string {
  const base = "history.types.member-joined";
  const actor = activity.actorName ?? fallback;

  if (!activity.isMemberAddition) {
    return activity.isViewerActor
      ? tr(`${base}.viewer`)
      : tr(`${base}.actor`, { name: actor });
  }

  const name = activity.targetName ?? fallback;

  if (activity.isViewerActor) return tr(`${base}.addedViewer`, { name });
  if (activity.isViewerTarget) {
    return tr(`${base}.addedViewerTarget`, { actor });
  }

  return tr(`${base}.added`, { actor, name });
}

/**
 * Type sentence with the viewer variant the grammar of the event needs. The
 * viewer variants live in the copy, so "you removed X" and "X removed you" stay
 * correct in both languages.
 */
export function getGroupActivityTitle(
  activity: GroupActivityDisplay,
  { tr, fallback }: GroupActivityTitleOptions,
): string {
  if (activity.type === "member-joined") {
    return getMemberJoinedTitle(activity, tr, fallback);
  }

  const actor = activity.actorName ?? fallback;
  const target = activity.targetName ?? fallback;
  const base = `history.types.${activity.type}`;

  if (NAMED_TARGET_TYPES.has(activity.type)) {
    if (activity.isViewerTarget) {
      return tr(`${base}.viewerTarget`, { actor });
    }
    if (activity.isViewerActor) {
      return tr(`${base}.viewer`, { target });
    }

    return tr(`${base}.actor`, { actor, target });
  }

  if (SELF_SUBJECT_TYPES.has(activity.type)) {
    const viewerIsSubject =
      activity.isViewerTarget ||
      (activity.isViewerActor && activity.targetName === null);

    if (viewerIsSubject) return tr(`${base}.viewer`);

    return tr(`${base}.actor`, { name: activity.targetName ?? actor });
  }

  return activity.isViewerActor
    ? tr(`${base}.viewer`)
    : tr(`${base}.actor`, { actor });
}

/** Copy of a failed page; a missing group is the route's own state. */
export function getGroupActivityErrorCopy(
  error: unknown,
  tr: Translate,
): string | null {
  const code = getGroupErrorCode(error, "LOAD_FAILED");
  if (MISSING_GROUP_CODES.includes(code)) return null;

  return tr(code === "NETWORK" ? "errors.NETWORK" : "history.loadFailed");
}

/** Short second line: concept, changed fields or the new setting state. */
export function getGroupActivityMeta(
  activity: GroupActivityDisplay,
  tr: Translate,
): string | undefined {
  if (activity.type === "group-updated") {
    const labels = activity.changedFields.map((field) =>
      tr(`history.changedFields.${field}`),
    );

    return labels.length > 0 ? labels.join(", ") : undefined;
  }

  if (activity.type === "simplify-debts-changed") {
    if (activity.simplifyDebts === null) return undefined;

    return tr(
      activity.simplifyDebts ? "history.settingOn" : "history.settingOff",
    );
  }

  const description = activity.description ?? undefined;

  if (
    activity.type.startsWith("settlement-") &&
    activity.fromName &&
    activity.toName
  ) {
    return joinMetaParts([
      tr("history.settlementPair", {
        from: activity.fromName,
        to: activity.toName,
      }),
      description,
    ]);
  }

  return description;
}
