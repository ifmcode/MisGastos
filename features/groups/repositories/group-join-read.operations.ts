import { collection, getDoc, getDocs, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase";

import type { GroupCode, GroupJoinRequest } from "../types/group-join.types";
import { normalizeGroupJoinCode } from "../utils/group-join-code";
import { sortJoinRequestsOldestFirst } from "../utils/group-join-request";
import {
  mapGroupCodeDocument,
  mapGroupJoinRequestDocument,
} from "./group-join.mapper";
import {
  GROUP_CODES_COLLECTION,
  GROUP_JOIN_REQUESTS_COLLECTION,
} from "./groups.data";
import { groupCodeRef, groupJoinRequestRef } from "./groups.operations";

/** Resolves a code through the projection; never touches the group document. */
export async function getGroupCodeOperation(
  code: string,
): Promise<GroupCode | null> {
  const normalized = normalizeGroupJoinCode(code);
  if (normalized.length === 0) return null;

  const snapshot = await getDoc(groupCodeRef(normalized));
  if (!snapshot.exists()) return null;

  return mapGroupCodeDocument(
    snapshot.id,
    snapshot.data() as Record<string, unknown>,
  );
}

export async function getGroupJoinRequestOperation(
  requestId: string,
): Promise<GroupJoinRequest | null> {
  const snapshot = await getDoc(groupJoinRequestRef(requestId));
  if (!snapshot.exists()) return null;

  return mapGroupJoinRequestDocument(
    snapshot.id,
    snapshot.data() as Record<string, unknown>,
  );
}

/** Single-field `groupId` query, sorted oldest first client-side (no index). */
export async function getGroupJoinRequestsOperation(
  groupId: string,
): Promise<GroupJoinRequest[]> {
  const snapshot = await getDocs(
    query(
      collection(db, GROUP_JOIN_REQUESTS_COLLECTION),
      where("groupId", "==", groupId),
    ),
  );

  const requests: GroupJoinRequest[] = [];

  for (const document of snapshot.docs) {
    const request = mapGroupJoinRequestDocument(
      document.id,
      document.data() as Record<string, unknown>,
    );
    if (request) requests.push(request);
  }

  return sortJoinRequestsOldestFirst(requests);
}
