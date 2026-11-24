import {
  collection,
  doc,
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  type QueryConstraint,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import type {
  GroupActivity,
  GroupActivityCursor,
  GroupActivityPage,
  GroupActivityQuery,
} from "../types/group-activity.types";
import { clampGroupActivityLimit } from "../utils/group-activity";
import { GROUP_ACTIVITY_SUBCOLLECTION } from "./group-activity.data";
import { mapGroupActivityDocument } from "./group-activity.mapper";
import { GROUPS_COLLECTION } from "./groups.data";

/** Member-only subcollection: no root collection, no collection-group query. */
export function groupActivityCollection(groupId: string) {
  return collection(
    db,
    GROUPS_COLLECTION,
    groupId,
    GROUP_ACTIVITY_SUBCOLLECTION,
  );
}

/** Client-generated id so the event commits with the write it describes. */
export function newGroupActivityRef(groupId: string) {
  return doc(groupActivityCollection(groupId));
}

/**
 * Cursor of a **raw** document. It must never depend on the mapper: a malformed
 * row is dropped from `items`, but its `(createdAt, id)` is still the exact
 * position the next `startAfter` needs.
 */
function readCursor(document: {
  id: string;
  data: () => unknown;
}): GroupActivityCursor | null {
  const data = document.data();
  const createdAt =
    data && typeof data === "object"
      ? (data as Record<string, unknown>).createdAt
      : null;
  const id = typeof document.id === "string" ? document.id.trim() : "";

  if (typeof createdAt !== "string" || createdAt.trim().length === 0) return null;
  if (id.length === 0) return null;

  return { createdAt, id };
}

/**
 * Newest first with the document id as deterministic tiebreaker, so entries that
 * share a `createdAt` keep a stable order. The same subcollection means no
 * composite index is needed: the only constraint is the parent path.
 *
 * `hasMore` requires a usable raw cursor: without one the next request could not
 * advance, so the feed reports the end instead of looping forever.
 */
export async function getGroupActivityOperation(
  groupId: string,
  options: GroupActivityQuery = {},
): Promise<GroupActivityPage> {
  const pageSize = clampGroupActivityLimit(options.limit);
  const after = options.after ?? null;
  const constraints: QueryConstraint[] = [
    orderBy("createdAt", "desc"),
    orderBy(documentId(), "desc"),
  ];

  if (after) constraints.push(startAfter(after.createdAt, after.id));
  // One extra row only proves whether another page exists; it is never returned.
  constraints.push(limit(pageSize + 1));

  const snapshot = await getDocs(
    query(groupActivityCollection(groupId), ...constraints),
  );
  const rawPage = snapshot.docs.slice(0, pageSize);
  const lastRaw = rawPage[rawPage.length - 1];
  const nextCursor =
    snapshot.docs.length > pageSize && lastRaw ? readCursor(lastRaw) : null;
  const items: GroupActivity[] = [];

  for (const document of rawPage) {
    const activity = mapGroupActivityDocument(
      document.id,
      document.data() as Record<string, unknown>,
    );
    if (activity) items.push(activity);
  }

  return { items, hasMore: nextCursor !== null, nextCursor };
}
