import { readCurrentOwnerId } from "@/shared/lib/local-db/current-owner";
import { isOfflineFirstEnabled } from "@/shared/lib/local-db/offline-first.flag";

import type {
  CreateFriendRequestDto,
  FriendRequest,
  FriendRequestUpdate,
  Friendship,
  PublicProfile,
  PublicProfileInput,
} from "../types/friend.types";
import type { IFriendsRepository } from "./friends.repository";
import {
  cacheFriendRequest,
  cacheFriendship,
  cacheFriendships,
  cacheFriendRequests,
  cachePublicProfiles,
  readCachedFriendRequests,
  readCachedFriendship,
  readCachedFriendships,
  readCachedPublicProfile,
  readCachedPublicProfiles,
  removeCachedFriendRequest,
  removeCachedFriendship,
} from "./local-friends.cache";

/**
 * Read-through friends. The list and pair reads mirror the cache; a remote
 * failure falls back to it. Friendship management stays online-only: the
 * mutations delegate and mirror their result, and a request list falls back to
 * an empty list when offline (requests are not cached as money records are).
 */
export class CachedFriendsRepository implements IFriendsRepository {
  constructor(private readonly remote: IFriendsRepository) {}

  async ensurePublicProfile(input: PublicProfileInput): Promise<PublicProfile> {
    return this.mirrorProfile(await this.remote.ensurePublicProfile(input));
  }

  async getPublicProfile(uid: string): Promise<PublicProfile | null> {
    try {
      const profile = await this.remote.getPublicProfile(uid);
      if (profile) {
        await this.mirrorProfile(profile);
        return profile;
      }

      const ownerId = readCurrentOwnerId();
      return ownerId ? readCachedPublicProfile(ownerId, uid) : null;
    } catch (error) {
      const ownerId = readCurrentOwnerId();
      const cached = ownerId ? await readCachedPublicProfile(ownerId, uid) : null;
      if (cached) return cached;
      throw error;
    }
  }

  async getPublicProfiles(uids: readonly string[]): Promise<PublicProfile[]> {
    try {
      const profiles = await this.remote.getPublicProfiles(uids);
      const ownerId = readCurrentOwnerId();
      if (ownerId) {
        await this.bestEffort(() =>
          cachePublicProfiles(ownerId, profiles, new Date().toISOString()),
        );
      }
      return profiles;
    } catch (error) {
      const ownerId = readCurrentOwnerId();
      const cached = ownerId
        ? await readCachedPublicProfiles(ownerId, uids)
        : null;
      if (cached) return cached;
      throw error;
    }
  }

  findPublicProfileByEmail(email: string): Promise<PublicProfile | null> {
    return this.remote.findPublicProfileByEmail(email);
  }

  async getFriendRequest(requestId: string): Promise<FriendRequest | null> {
    try {
      const request = await this.remote.getFriendRequest(requestId);
      if (request) {
        await this.mirrorRequest(request);
        return request;
      }

      const ownerId = readCurrentOwnerId();
      const requests = ownerId
        ? await readCachedFriendRequests(ownerId)
        : null;
      return requests?.find((candidate) => candidate.id === requestId) ?? null;
    } catch (error) {
      const ownerId = readCurrentOwnerId();
      const requests = ownerId
        ? await readCachedFriendRequests(ownerId)
        : null;
      const match = requests?.find((request) => request.id === requestId);
      if (match) return match;
      throw error;
    }
  }

  async getFriendRequests(uid: string): Promise<FriendRequest[]> {
    try {
      const requests = await this.remote.getFriendRequests(uid);
      await this.bestEffort(() =>
        cacheFriendRequests(uid, requests, new Date().toISOString()),
      );
      return requests;
    } catch (error) {
      const cached = await readCachedFriendRequests(uid);
      if (cached !== null) return cached;
      if (isOfflineFirstEnabled()) return [];
      throw error;
    }
  }

  async createFriendRequest(
    dto: CreateFriendRequestDto,
  ): Promise<FriendRequest> {
    return this.mirrorRequest(await this.remote.createFriendRequest(dto));
  }

  async updateFriendRequest(
    requestId: string,
    update: FriendRequestUpdate,
  ): Promise<FriendRequest> {
    return this.mirrorRequest(
      await this.remote.updateFriendRequest(requestId, update),
    );
  }

  async deleteFriendRequest(requestId: string): Promise<void> {
    await this.remote.deleteFriendRequest(requestId);
    const ownerId = readCurrentOwnerId();
    if (ownerId) {
      await this.bestEffort(() => removeCachedFriendRequest(ownerId, requestId));
    }
  }

  async getFriendship(friendshipId: string): Promise<Friendship | null> {
    try {
      const friendship = await this.remote.getFriendship(friendshipId);
      if (friendship) {
        await this.mirrorFriendship(friendship);
        return friendship;
      }

      const ownerId = readCurrentOwnerId();
      return ownerId ? readCachedFriendship(ownerId, friendshipId) : null;
    } catch (error) {
      const ownerId = readCurrentOwnerId();
      const cached = ownerId
        ? await readCachedFriendship(ownerId, friendshipId)
        : null;
      if (cached) return cached;
      throw error;
    }
  }

  async getFriendships(uid: string): Promise<Friendship[]> {
    try {
      const friendships = await this.remote.getFriendships(uid);
      await this.bestEffort(() =>
        cacheFriendships(uid, friendships, new Date().toISOString()),
      );
      return friendships;
    } catch (error) {
      const cached = await readCachedFriendships(uid);
      if (cached) return cached;
      throw error;
    }
  }

  async acceptFriendRequest(
    viewerUid: string,
    requestId: string,
  ): Promise<Friendship> {
    const friendship = await this.remote.acceptFriendRequest(
      viewerUid,
      requestId,
    );
    await this.mirrorFriendship(friendship);
    await this.bestEffort(() =>
      removeCachedFriendRequest(viewerUid, requestId),
    );
    return friendship;
  }

  async deleteFriendship(friendshipId: string): Promise<void> {
    await this.remote.deleteFriendship(friendshipId);
    const ownerId = readCurrentOwnerId();
    if (ownerId) {
      await this.bestEffort(() =>
        removeCachedFriendship(ownerId, friendshipId),
      );
    }
  }

  private async mirrorProfile(profile: PublicProfile): Promise<PublicProfile> {
    const ownerId = readCurrentOwnerId();
    if (ownerId) {
      await this.bestEffort(() =>
        cachePublicProfiles(ownerId, [profile], new Date().toISOString()),
      );
    }
    return profile;
  }

  private async mirrorRequest(request: FriendRequest): Promise<FriendRequest> {
    const ownerId = readCurrentOwnerId();
    if (ownerId) {
      await this.bestEffort(() =>
        cacheFriendRequest(ownerId, request, new Date().toISOString()),
      );
    }
    return request;
  }

  private async mirrorFriendship(
    friendship: Friendship,
  ): Promise<Friendship> {
    const ownerId = readCurrentOwnerId();
    if (ownerId) {
      await this.bestEffort(() =>
        cacheFriendship(ownerId, friendship, new Date().toISOString()),
      );
    }
    return friendship;
  }

  private async bestEffort(work: () => Promise<void>): Promise<void> {
    try {
      await work();
    } catch {
      // The online operation already succeeded.
    }
  }
}
