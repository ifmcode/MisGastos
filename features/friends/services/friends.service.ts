import type { IFriendLedgerRepository } from "../repositories/friend-ledger.repository";
import type { IFriendsRepository } from "../repositories/friends.repository";
import {
  validatePublicProfileInput,
  validateSendFriendRequestInput,
} from "../schemas/friend.schema";
import type {
  FriendRequest,
  FriendSearchResult,
  Friendship,
  FriendsOverview,
  PublicProfile,
  PublicProfileInput,
} from "../types/friend.types";
import {
  assertRequestIsPending,
  assertViewerIsRecipient,
  requireViewerId,
} from "./friend-guards";
import { FriendOperationError, FriendValidationError } from "./friend.errors";
import { loadFriendsOverview } from "./friend-overview-load";
import { removeFriendWithRepository } from "./friend-remove";
import {
  cancelFriendRequestWithRepository,
  rejectFriendRequestWithRepository,
} from "./friend-request-transition";
import { sendFriendRequestWithRepository } from "./friend-request-send";
import { searchFriendByEmail } from "./friend-search";

export class FriendsService {
  constructor(
    private readonly repository: IFriendsRepository,
    private readonly ledgerRepository: IFriendLedgerRepository,
  ) {}

  async ensurePublicProfile(input: PublicProfileInput): Promise<PublicProfile> {
    const validation = validatePublicProfileInput(input);
    if (!validation.ok) throw new FriendValidationError(validation.error);

    return this.repository.ensurePublicProfile(validation.value);
  }

  async searchByEmail(
    viewerUid: string,
    email: string,
  ): Promise<FriendSearchResult | null> {
    return searchFriendByEmail(this.repository, viewerUid, email);
  }

  async sendRequest(
    requesterId: string,
    recipientId: string,
  ): Promise<FriendRequest> {
    const validation = validateSendFriendRequestInput({
      requesterId,
      recipientId,
    });

    if (!validation.ok) {
      const isSelf = validation.error.some(
        (issue) => issue.code === "SAME_USER",
      );
      if (isSelf) throw new FriendOperationError("SELF_REQUEST");

      throw new FriendValidationError(validation.error);
    }

    return sendFriendRequestWithRepository(this.repository, validation.value);
  }

  async acceptRequest(
    viewerUid: string,
    requestId: string,
  ): Promise<Friendship> {
    const viewer = requireViewerId(viewerUid);
    const request = await this.requirePendingRequest(requestId, viewer);
    assertViewerIsRecipient(request, viewer);

    return this.repository.acceptFriendRequest(viewer, request.id);
  }

  async rejectRequest(
    viewerUid: string,
    requestId: string,
  ): Promise<FriendRequest> {
    const viewer = requireViewerId(viewerUid);
    const request = await this.requirePendingRequest(requestId, viewer);

    return rejectFriendRequestWithRepository(this.repository, viewer, request);
  }

  async cancelRequest(
    viewerUid: string,
    requestId: string,
  ): Promise<FriendRequest> {
    const viewer = requireViewerId(viewerUid);
    const request = await this.requirePendingRequest(requestId, viewer);

    return cancelFriendRequestWithRepository(this.repository, viewer, request);
  }

  async removeFriend(viewerUid: string, friendUid: string): Promise<void> {
    const viewer = requireViewerId(viewerUid);
    const friend = requireViewerId(friendUid);

    return removeFriendWithRepository(this.repository, viewer, friend);
  }

  async getOverview(viewerUid: string): Promise<FriendsOverview> {
    const viewer = requireViewerId(viewerUid);

    return loadFriendsOverview(this.repository, this.ledgerRepository, viewer);
  }

  private async requirePendingRequest(
    requestId: string,
    viewerUid: string,
  ): Promise<FriendRequest> {
    const request = await this.repository.getFriendRequest(requestId.trim());

    if (!request) throw new FriendOperationError("REQUEST_NOT_FOUND");
    if (!request.participantIds.includes(viewerUid)) {
      throw new FriendOperationError("NOT_REQUEST_RECIPIENT");
    }

    assertRequestIsPending(request);

    return request;
  }
}
