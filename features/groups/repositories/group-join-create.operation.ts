import { setDoc } from "firebase/firestore";

import { GroupOperationError } from "../services/group.errors";
import type {
  CreateGroupJoinRequestInput,
  GroupJoinRequest,
} from "../types/group-join.types";
import {
  createGroupJoinRequestId,
  normalizeGroupJoinCode,
} from "../utils/group-join-code";
import { toGroupJoinRequestData } from "./groups.data";
import { groupJoinRequestRef } from "./groups.operations";

/**
 * Deterministic id, so a duplicate request is a Firestore update attempt: the
 * create rule no longer matches and the permission error propagates untouched.
 */
export async function createGroupJoinRequestOperation(
  input: CreateGroupJoinRequestInput,
): Promise<GroupJoinRequest> {
  const request: GroupJoinRequest = {
    id: createGroupJoinRequestId(input.groupId, input.requesterId),
    groupId: input.groupId.trim(),
    requesterId: input.requesterId.trim(),
    joinCode: normalizeGroupJoinCode(input.joinCode),
    status: "pending",
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  };

  if (request.id.length === 0 || request.joinCode.length === 0) {
    throw new GroupOperationError("INVALID_JOIN_CODE");
  }

  await setDoc(groupJoinRequestRef(request.id), toGroupJoinRequestData(request));

  return request;
}
