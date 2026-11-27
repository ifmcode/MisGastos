import { LocalCacheMetaRepository } from "@/shared/lib/local-db/cache-meta.repository";
import { mirrorOwnerRows } from "@/shared/lib/local-db/cache-mirror";
import type {
  LocalCacheCollection,
  LocalRow,
} from "@/shared/lib/local-db/local-db.types";
import { getLocalDatabase } from "@/shared/lib/local-db/local-db.runtime";
import { isOfflineFirstEnabled } from "@/shared/lib/local-db/offline-first.flag";
import {
  cacheSocialRow,
  readCachedSocialRows,
  removeCachedSocialRow,
} from "@/shared/lib/local-db/social-cache";

import type {
  FriendRequest,
  Friendship,
  PublicProfile,
} from "../types/friend.types";
import {
  fromFriendRequestLocalRow,
  fromFriendshipLocalRow,
  fromPublicProfileLocalRow,
  toFriendRequestLocalRow,
  toFriendshipLocalRow,
  toPublicProfileLocalRow,
} from "./local-friends.mapper";

const FRIENDSHIPS = "friendships" as const;
const REQUESTS = "friendRequests" as const;
const PROFILES = "publicProfiles" as const;

async function readCollection<T>(
  table: LocalCacheCollection,
  ownerId: string,
  map: (row: LocalRow) => T | null,
): Promise<T[] | null> {
  const rows = await readCachedSocialRows({ table, ownerId, collection: table });
  if (rows === null) return null;

  return rows.flatMap((row) => {
    const value = map(row);
    return value ? [value] : [];
  });
}

export function readCachedFriendships(
  ownerId: string,
): Promise<Friendship[] | null> {
  return readCollection(FRIENDSHIPS, ownerId, fromFriendshipLocalRow);
}

export function readCachedFriendRequests(
  ownerId: string,
): Promise<FriendRequest[] | null> {
  return readCollection(REQUESTS, ownerId, fromFriendRequestLocalRow);
}

export async function readCachedPublicProfiles(
  ownerId: string,
  uids: readonly string[],
): Promise<PublicProfile[] | null> {
  const profiles = await readCollection(
    PROFILES,
    ownerId,
    fromPublicProfileLocalRow,
  );
  if (profiles === null) return null;

  const wanted = new Set(uids);
  return profiles.filter((profile) => wanted.has(profile.uid));
}

export async function readCachedFriendship(
  ownerId: string,
  friendshipId: string,
): Promise<Friendship | null> {
  const rows = await readCachedSocialRows({
    table: FRIENDSHIPS,
    ownerId,
    collection: FRIENDSHIPS,
  });

  const row = rows?.find((candidate) => candidate.id === friendshipId);
  return row ? fromFriendshipLocalRow(row) : null;
}

export async function readCachedPublicProfile(
  ownerId: string,
  uid: string,
): Promise<PublicProfile | null> {
  const rows = await readCachedSocialRows({
    table: PROFILES,
    ownerId,
    collection: PROFILES,
  });

  const row = rows?.find((candidate) => candidate.id === uid);
  return row ? fromPublicProfileLocalRow(row) : null;
}

async function mirrorList(
  ownerId: string,
  table: LocalCacheCollection,
  rows: readonly LocalRow[],
  now: string,
): Promise<void> {
  const port = await getLocalDatabase();
  if (!port) return;

  const meta = new LocalCacheMetaRepository(port);

  await port.transaction(async (tx) => {
    await mirrorOwnerRows(tx, { table, ownerId, rows, now });
    await meta.markFetched(ownerId, table, now, tx);
  });
}

export async function cacheFriendships(
  ownerId: string,
  friendships: readonly Friendship[],
  now: string,
): Promise<void> {
  if (!isOfflineFirstEnabled()) return;

  await mirrorList(
    ownerId,
    FRIENDSHIPS,
    friendships.map((friendship) =>
      toFriendshipLocalRow(friendship, ownerId),
    ),
    now,
  );
}

export async function cacheFriendRequests(
  ownerId: string,
  requests: readonly FriendRequest[],
  now: string,
): Promise<void> {
  if (!isOfflineFirstEnabled()) return;

  await mirrorList(
    ownerId,
    REQUESTS,
    requests.map((request) => toFriendRequestLocalRow(request, ownerId)),
    now,
  );
}

export async function cachePublicProfiles(
  ownerId: string,
  profiles: readonly PublicProfile[],
  now: string,
): Promise<void> {
  for (const profile of profiles) {
    await cacheSocialRow(
      PROFILES,
      ownerId,
      toPublicProfileLocalRow(profile, ownerId),
      now,
    );
  }
}

export async function cacheFriendship(
  ownerId: string,
  friendship: Friendship,
  now: string,
): Promise<void> {
  await cacheSocialRow(
    FRIENDSHIPS,
    ownerId,
    toFriendshipLocalRow(friendship, ownerId),
    now,
  );
}

export async function cacheFriendRequest(
  ownerId: string,
  request: FriendRequest,
  now: string,
): Promise<void> {
  await cacheSocialRow(
    REQUESTS,
    ownerId,
    toFriendRequestLocalRow(request, ownerId),
    now,
  );
}

export async function removeCachedFriendship(
  ownerId: string,
  friendshipId: string,
): Promise<void> {
  await removeCachedSocialRow(FRIENDSHIPS, ownerId, friendshipId);
}

export async function removeCachedFriendRequest(
  ownerId: string,
  requestId: string,
): Promise<void> {
  await removeCachedSocialRow(REQUESTS, ownerId, requestId);
}
