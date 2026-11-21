import { runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";

import { GroupOperationError } from "../services/group.errors";
import type { Group } from "../types/group.types";
import type {
  GroupJoinRequest,
  RespondToGroupJoinRequestInput,
} from "../types/group-join.types";
import { appendGroupMember, isGroupFull } from "../utils/group-membership";
import { mapGroupDocument, mapGroupJoinRequestDocument } from "./groups.mapper";
import { groupJoinRequestRef, groupRef } from "./groups.operations";

/**
 * Owner decision in one transaction: the request and, on acceptance, the
 * owner-first member list move together. Acceptance re-checks membership and
 * the 20 cap inside the transaction, never trusting the caller.
 */
export async function respondToGroupJoinRequestOperation(
  input: RespondToGroupJoinRequestInput,
): Promise<{ group: Group; request: GroupJoinRequest }> {
  let result: { group: Group; request: GroupJoinRequest } | null = null;

  await runTransaction(db, async (transaction) => {
    const requestSnapshot = await transaction.get(
      groupJoinRequestRef(input.requestId),
    );
    if (!requestSnapshot.exists()) {
      throw new GroupOperationError("JOIN_REQUEST_NOT_FOUND");
    }

    const request = mapGroupJoinRequestDocument(
      requestSnapshot.id,
      requestSnapshot.data() as Record<string, unknown>,
    );
    if (!request || request.groupId !== input.groupId) {
      throw new GroupOperationError("JOIN_REQUEST_NOT_FOUND");
    }
    if (request.status !== "pending") {
      throw new GroupOperationError("JOIN_REQUEST_NOT_PENDING");
    }

    const groupSnapshot = await transaction.get(groupRef(request.groupId));
    if (!groupSnapshot.exists()) {
      throw new GroupOperationError("GROUP_NOT_FOUND");
    }

    const group = mapGroupDocument(
      groupSnapshot.id,
      groupSnapshot.data() as Record<string, unknown>,
    );
    if (!group) throw new GroupOperationError("GROUP_NOT_FOUND");
    if (group.ownerId !== input.viewerUid) {
      throw new GroupOperationError("NOT_GROUP_OWNER");
    }

    if (input.decision === "rejected") {
      transaction.update(groupJoinRequestRef(request.id), {
        status: "rejected",
        updatedAt: input.updatedAt,
      });
      result = {
        group,
        request: { ...request, status: "rejected", updatedAt: input.updatedAt },
      };
      return;
    }

    if (group.memberIds.includes(request.requesterId)) {
      throw new GroupOperationError("ALREADY_MEMBER");
    }
    if (isGroupFull(group.memberIds)) {
      throw new GroupOperationError("GROUP_FULL");
    }

    const memberIds = appendGroupMember(group.memberIds, request.requesterId);

    transaction.update(groupJoinRequestRef(request.id), {
      status: "accepted",
      updatedAt: input.updatedAt,
    });
    transaction.update(groupRef(group.id), {
      memberIds,
      updatedAt: input.updatedAt,
    });

    result = {
      group: { ...group, memberIds, updatedAt: input.updatedAt },
      request: { ...request, status: "accepted", updatedAt: input.updatedAt },
    };
  });

  if (!result) throw new GroupOperationError("JOIN_REQUEST_NOT_FOUND");

  return result;
}
