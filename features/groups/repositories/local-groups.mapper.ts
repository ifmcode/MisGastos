import type {
  LocalRecordSyncStatus,
  LocalRow,
} from "@/shared/lib/local-db/local-db.types";
import { decodeLocalJson, encodeLocalJson } from "@/shared/lib/local-db/local-json";
import { readLocalRowId } from "@/shared/lib/local-db/local-row.readers";

import type { Group, GroupInvitation } from "../types/group.types";
import {
  mapGroupDocument,
  mapGroupInvitationDocument,
} from "./groups.mapper";

export function toGroupLocalRow(
  group: Group,
  ownerId: string,
  syncStatus: LocalRecordSyncStatus = "synced",
): LocalRow {
  return {
    id: group.id,
    ownerId,
    groupOwnerId: group.ownerId,
    createdBy: group.createdBy,
    memberIds: encodeLocalJson(group.memberIds),
    name: group.name,
    description: group.description,
    defaultCurrency: group.defaultCurrency,
    joinCode: group.joinCode,
    simplifyDebts: group.simplifyDebts ? 1 : 0,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
    syncStatus,
  };
}

export function fromGroupLocalRow(row: LocalRow): Group | null {
  const id = readLocalRowId(row);
  if (!id) return null;

  return mapGroupDocument(id, {
    ownerId: row.groupOwnerId,
    createdBy: row.createdBy,
    memberIds: decodeLocalJson(row.memberIds),
    name: row.name,
    description: row.description,
    defaultCurrency: row.defaultCurrency,
    joinCode: row.joinCode,
    simplifyDebts: row.simplifyDebts === 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function toGroupInvitationLocalRow(
  invitation: GroupInvitation,
  ownerId: string,
  syncStatus: LocalRecordSyncStatus = "synced",
): LocalRow {
  return {
    id: invitation.id,
    ownerId,
    groupId: invitation.groupId,
    groupName: invitation.groupName,
    inviterId: invitation.inviterId,
    inviteeId: invitation.inviteeId,
    pairId: invitation.pairId,
    status: invitation.status,
    createdAt: invitation.createdAt,
    updatedAt: invitation.updatedAt,
    syncStatus,
  };
}

export function fromGroupInvitationLocalRow(
  row: LocalRow,
): GroupInvitation | null {
  const id = readLocalRowId(row);
  if (!id) return null;

  return mapGroupInvitationDocument(id, {
    groupId: row.groupId,
    groupName: row.groupName,
    inviterId: row.inviterId,
    inviteeId: row.inviteeId,
    pairId: row.pairId,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}
