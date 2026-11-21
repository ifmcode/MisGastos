import { getDoc, writeBatch } from "firebase/firestore";

import { db } from "@/lib/firebase";

import { GroupOperationError } from "../services/group.errors";
import type { Group } from "../types/group.types";
import type { EnsureGroupJoinCodeInput } from "../types/group-join.types";
import { normalizeGroupJoinCode } from "../utils/group-join-code";
import { mapGroupDocument } from "./groups.mapper";
import { toGroupCodeData } from "./groups.data";
import { groupCodeRef, groupRef } from "./groups.operations";

/**
 * Lazy backfill for a group created before TICKET-061. Idempotent: an existing
 * code is returned without writing. A concurrent client wins the projection
 * create and this write is denied; the service reloads and reuses that code.
 */
export async function ensureGroupJoinCodeOperation(
  input: EnsureGroupJoinCodeInput,
): Promise<Group> {
  const snapshot = await getDoc(groupRef(input.groupId));
  if (!snapshot.exists()) throw new GroupOperationError("GROUP_NOT_FOUND");

  const group = mapGroupDocument(
    snapshot.id,
    snapshot.data() as Record<string, unknown>,
  );
  if (!group) throw new GroupOperationError("GROUP_NOT_FOUND");
  if (group.joinCode) return group;

  const code = normalizeGroupJoinCode(input.code);
  if (code.length === 0) throw new GroupOperationError("INVALID_JOIN_CODE");

  const batch = writeBatch(db);
  batch.update(groupRef(group.id), {
    joinCode: code,
    updatedAt: input.updatedAt,
  });
  batch.set(
    groupCodeRef(code),
    toGroupCodeData({
      code,
      groupId: group.id,
      ownerId: group.ownerId,
      groupName: group.name,
    }),
  );

  await batch.commit();

  return { ...group, joinCode: code, updatedAt: input.updatedAt };
}
