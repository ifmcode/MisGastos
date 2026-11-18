import type { IFriendLedgerRepository } from "../../repositories/friend-ledger.repository";
import type { IFriendsRepository } from "../../repositories/friends.repository";
import { FriendOperationError } from "../friend.errors";
import type {
  CreateFriendRequestDto,
  FriendLedgerEntry,
  FriendRequest,
  FriendRequestUpdate,
  Friendship,
  PublicProfile,
  PublicProfileInput,
} from "../../types/friend.types";
import { createFriendPairId, getFriendPairMemberIds } from "../../utils/friend-pair";

const NOW = "2026-11-15T10:00:00.000Z";

export class FakeFriendsRepository implements IFriendsRepository {
  readonly profiles = new Map<string, PublicProfile>();
  readonly requests = new Map<string, FriendRequest>();
  readonly friendships = new Map<string, Friendship>();
  readonly publicProfileCalls: PublicProfileInput[] = [];
  readonly publicProfileReads: string[] = [];
  readonly profileBatchCalls: string[][] = [];
  readonly acceptedCalls: Array<{ viewerUid: string; requestId: string }> = [];
  readonly deletedFriendships: string[] = [];
  failure: Error | null = null;

  seedProfile(uid: string, displayName: string | null, email: string): void {
    this.profiles.set(uid, {
      uid,
      displayName,
      email,
      createdAt: NOW,
      updatedAt: NOW,
    });
  }

  seedFriendship(
    uidA: string,
    uidB: string,
    createdAt = NOW,
  ): Friendship {
    const id = createFriendPairId(uidA, uidB);
    const friendship: Friendship = {
      id,
      memberIds: getFriendPairMemberIds(uidA, uidB),
      requesterId: uidA,
      recipientId: uidB,
      createdAt,
    };
    this.friendships.set(id, friendship);
    return friendship;
  }

  seedRequest(
    requesterId: string,
    recipientId: string,
    status: FriendRequest["status"] = "pending",
    createdAt = NOW,
  ): FriendRequest {
    const id = createFriendPairId(requesterId, recipientId);
    const request: FriendRequest = {
      id,
      requesterId,
      recipientId,
      participantIds: getFriendPairMemberIds(requesterId, recipientId),
      status,
      createdAt,
      updatedAt: createdAt,
    };
    this.requests.set(id, request);
    return request;
  }

  private guard(): void {
    if (this.failure) throw this.failure;
  }

  async ensurePublicProfile(
    input: PublicProfileInput,
  ): Promise<PublicProfile> {
    this.guard();
    this.publicProfileCalls.push(input);

    const existing = this.profiles.get(input.uid);
    const profile: PublicProfile = {
      ...input,
      createdAt: existing?.createdAt ?? NOW,
      updatedAt: NOW,
    };
    this.profiles.set(input.uid, profile);

    return profile;
  }

  async getPublicProfile(uid: string): Promise<PublicProfile | null> {
    this.guard();
    this.publicProfileReads.push(uid);
    return this.profiles.get(uid) ?? null;
  }

  async getPublicProfiles(uids: readonly string[]): Promise<PublicProfile[]> {
    this.guard();
    this.profileBatchCalls.push([...uids]);

    return uids
      .map((uid) => this.profiles.get(uid))
      .filter((profile): profile is PublicProfile => !!profile);
  }

  async findPublicProfileByEmail(
    email: string,
  ): Promise<PublicProfile | null> {
    this.guard();
    return (
      Array.from(this.profiles.values()).find(
        (profile) => profile.email === email,
      ) ?? null
    );
  }

  async getFriendRequest(requestId: string): Promise<FriendRequest | null> {
    this.guard();
    return this.requests.get(requestId) ?? null;
  }

  async getFriendRequests(uid: string): Promise<FriendRequest[]> {
    this.guard();
    return Array.from(this.requests.values()).filter((request) =>
      request.participantIds.includes(uid),
    );
  }

  async createFriendRequest(
    dto: CreateFriendRequestDto,
  ): Promise<FriendRequest> {
    this.guard();
    const request: FriendRequest = { ...dto };
    this.requests.set(dto.id, request);

    return request;
  }

  async updateFriendRequest(
    requestId: string,
    update: FriendRequestUpdate,
  ): Promise<FriendRequest> {
    this.guard();
    const existing = this.requests.get(requestId);
    if (!existing) throw new FriendOperationError("REQUEST_NOT_FOUND");

    const updated: FriendRequest = { ...existing, ...update };
    this.requests.set(requestId, updated);

    return updated;
  }

  async deleteFriendRequest(requestId: string): Promise<void> {
    this.guard();
    this.requests.delete(requestId);
  }

  async getFriendship(friendshipId: string): Promise<Friendship | null> {
    this.guard();
    return this.friendships.get(friendshipId) ?? null;
  }

  async getFriendships(uid: string): Promise<Friendship[]> {
    this.guard();
    return Array.from(this.friendships.values()).filter((friendship) =>
      friendship.memberIds.includes(uid),
    );
  }

  async acceptFriendRequest(
    viewerUid: string,
    requestId: string,
  ): Promise<Friendship> {
    this.guard();
    this.acceptedCalls.push({ viewerUid, requestId });

    const request = this.requests.get(requestId);
    if (!request) throw new FriendOperationError("REQUEST_NOT_FOUND");

    const friendship: Friendship = {
      id: request.id,
      memberIds: request.participantIds,
      requesterId: request.requesterId,
      recipientId: request.recipientId,
      createdAt: NOW,
    };
    this.friendships.set(friendship.id, friendship);
    this.requests.delete(requestId);

    return friendship;
  }

  async deleteFriendship(friendshipId: string): Promise<void> {
    this.guard();
    this.deletedFriendships.push(friendshipId);
    this.friendships.delete(friendshipId);
  }
}

export class FakeFriendLedgerRepository implements IFriendLedgerRepository {
  entries: FriendLedgerEntry[] = [];

  async getEntries(viewerUid: string): Promise<FriendLedgerEntry[]> {
    void viewerUid;
    return this.entries;
  }
}
