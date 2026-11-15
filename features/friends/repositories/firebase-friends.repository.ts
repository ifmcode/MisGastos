import type {
  CreateFriendRequestDto,
  FriendRequest,
  FriendRequestUpdate,
  Friendship,
  PublicProfile,
  PublicProfileInput,
} from "../types/friend.types";
import { acceptFriendRequestOperation } from "./friend-accept.operation";
import {
  deleteFriendshipOperation,
  getFriendshipOperation,
  getFriendshipsOperation,
} from "./friends-friendship.operations";
import {
  ensurePublicProfileOperation,
  findPublicProfileByEmailOperation,
  getPublicProfileOperation,
  getPublicProfilesOperation,
} from "./friends-profile.operations";
import {
  createFriendRequestOperation,
  deleteFriendRequestOperation,
  getFriendRequestOperation,
  getFriendRequestsOperation,
  updateFriendRequestOperation,
} from "./friends-request.operations";
import type { IFriendsRepository } from "./friends.repository";

export class FirebaseFriendsRepository implements IFriendsRepository {
  ensurePublicProfile(input: PublicProfileInput): Promise<PublicProfile> {
    return ensurePublicProfileOperation(input);
  }

  getPublicProfile(uid: string): Promise<PublicProfile | null> {
    return getPublicProfileOperation(uid);
  }

  getPublicProfiles(uids: readonly string[]): Promise<PublicProfile[]> {
    return getPublicProfilesOperation(uids);
  }

  findPublicProfileByEmail(email: string): Promise<PublicProfile | null> {
    return findPublicProfileByEmailOperation(email);
  }

  getFriendRequest(requestId: string): Promise<FriendRequest | null> {
    return getFriendRequestOperation(requestId);
  }

  getFriendRequests(uid: string): Promise<FriendRequest[]> {
    return getFriendRequestsOperation(uid);
  }

  createFriendRequest(dto: CreateFriendRequestDto): Promise<FriendRequest> {
    return createFriendRequestOperation(dto);
  }

  updateFriendRequest(
    requestId: string,
    update: FriendRequestUpdate,
  ): Promise<FriendRequest> {
    return updateFriendRequestOperation(requestId, update);
  }

  deleteFriendRequest(requestId: string): Promise<void> {
    return deleteFriendRequestOperation(requestId);
  }

  getFriendship(friendshipId: string): Promise<Friendship | null> {
    return getFriendshipOperation(friendshipId);
  }

  getFriendships(uid: string): Promise<Friendship[]> {
    return getFriendshipsOperation(uid);
  }

  acceptFriendRequest(
    viewerUid: string,
    requestId: string,
  ): Promise<Friendship> {
    return acceptFriendRequestOperation(viewerUid, requestId);
  }

  deleteFriendship(friendshipId: string): Promise<void> {
    return deleteFriendshipOperation(friendshipId);
  }
}
