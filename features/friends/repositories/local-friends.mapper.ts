import type {
  LocalRecordSyncStatus,
  LocalRow,
} from "@/shared/lib/local-db/local-db.types";
import { decodeLocalJson, encodeLocalJson } from "@/shared/lib/local-db/local-json";
import { readLocalRowId } from "@/shared/lib/local-db/local-row.readers";

import type {
  FriendRequest,
  Friendship,
  PublicProfile,
} from "../types/friend.types";
import {
  mapFriendRequestDocument,
  mapFriendshipDocument,
  mapPublicProfileDocument,
} from "./friends.mapper";

export function toFriendshipLocalRow(
  friendship: Friendship,
  ownerId: string,
  syncStatus: LocalRecordSyncStatus = "synced",
): LocalRow {
  return {
    id: friendship.id,
    ownerId,
    memberIds: encodeLocalJson(friendship.memberIds),
    requesterId: friendship.requesterId,
    recipientId: friendship.recipientId,
    createdAt: friendship.createdAt,
    updatedAt: friendship.createdAt,
    syncStatus,
  };
}

export function fromFriendshipLocalRow(row: LocalRow): Friendship | null {
  const id = readLocalRowId(row);
  if (!id) return null;

  return mapFriendshipDocument(id, {
    memberIds: decodeLocalJson(row.memberIds),
    requesterId: row.requesterId,
    recipientId: row.recipientId,
    createdAt: row.createdAt,
  });
}

export function toFriendRequestLocalRow(
  request: FriendRequest,
  ownerId: string,
  syncStatus: LocalRecordSyncStatus = "synced",
): LocalRow {
  return {
    id: request.id,
    ownerId,
    requesterId: request.requesterId,
    recipientId: request.recipientId,
    participantIds: encodeLocalJson(request.participantIds),
    status: request.status,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    syncStatus,
  };
}

export function fromFriendRequestLocalRow(row: LocalRow): FriendRequest | null {
  const id = readLocalRowId(row);
  if (!id) return null;

  return mapFriendRequestDocument(id, {
    requesterId: row.requesterId,
    recipientId: row.recipientId,
    participantIds: decodeLocalJson(row.participantIds),
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function toPublicProfileLocalRow(
  profile: PublicProfile,
  ownerId: string,
  syncStatus: LocalRecordSyncStatus = "synced",
): LocalRow {
  return {
    id: profile.uid,
    ownerId,
    displayName: profile.displayName,
    email: profile.email,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    syncStatus,
  };
}

export function fromPublicProfileLocalRow(row: LocalRow): PublicProfile | null {
  const id = readLocalRowId(row);
  if (!id) return null;

  return mapPublicProfileDocument(id, {
    displayName: row.displayName,
    email: row.email,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}
