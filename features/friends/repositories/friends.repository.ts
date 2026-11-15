import type {
  CreateFriendRequestDto,
  FriendRequest,
  FriendRequestUpdate,
  Friendship,
  PublicProfile,
  PublicProfileInput,
} from "../types/friend.types";

export interface IFriendsRepository {
  /** Creates or refreshes the owner-only `publicProfiles/{uid}` document. */
  ensurePublicProfile(input: PublicProfileInput): Promise<PublicProfile>;

  getPublicProfile(uid: string): Promise<PublicProfile | null>;

  /** Pair resolution for list rows; unknown uids are skipped. */
  getPublicProfiles(uids: readonly string[]): Promise<PublicProfile[]>;

  /** Exact normalized email lookup (`limit(1)`). */
  findPublicProfileByEmail(email: string): Promise<PublicProfile | null>;

  /** Reads by the deterministic pair id. */
  getFriendRequest(requestId: string): Promise<FriendRequest | null>;

  /** Every request the user participates in (any status), for the overview. */
  getFriendRequests(uid: string): Promise<FriendRequest[]>;

  createFriendRequest(dto: CreateFriendRequestDto): Promise<FriendRequest>;

  /** Reject, cancel and re-open transitions. `participantIds` never changes. */
  updateFriendRequest(
    requestId: string,
    update: FriendRequestUpdate,
  ): Promise<FriendRequest>;

  /**
   * Deletes the pending request as its recipient, inside the accept flow. The
   * rules deny sender deletes, so this is not a general-purpose cleanup method.
   */
  deleteFriendRequest(requestId: string): Promise<void>;

  getFriendship(friendshipId: string): Promise<Friendship | null>;

  getFriendships(uid: string): Promise<Friendship[]>;

  /**
   * Atomically creates the friendship and deletes the pending request. The
   * recipient is verified again inside `runTransaction`.
   */
  acceptFriendRequest(viewerUid: string, requestId: string): Promise<Friendship>;

  /** Removes a friend; no blocking and no balance side effects yet. */
  deleteFriendship(friendshipId: string): Promise<void>;
}
