import { describe, expect, it } from "@jest/globals";

import { FriendValidationError } from "../friend.errors";
import { FriendsService } from "../friends.service";
import {
  FakeFriendLedgerRepository,
  FakeFriendsRepository,
} from "./friends-service.fakes";

function createService() {
  const repository = new FakeFriendsRepository();
  const ledger = new FakeFriendLedgerRepository();
  repository.seedProfile("user-a", "Ada", "ada@example.com");
  repository.seedProfile("user-b", "Bea", "bea@example.com");

  return { repository, service: new FriendsService(repository, ledger) };
}

describe("FriendsService.acceptRequest", () => {
  it("accepts as the recipient and returns the friendship", async () => {
    const { repository, service } = createService();
    const request = repository.seedRequest("user-a", "user-b");

    const friendship = await service.acceptRequest(" user-b ", request.id);

    expect(repository.acceptedCalls).toEqual([
      { viewerUid: "user-b", requestId: request.id },
    ]);
    expect(friendship).toMatchObject({
      id: request.id,
      memberIds: ["user-a", "user-b"],
    });
    expect(repository.requests.size).toBe(0);
    expect(repository.friendships.size).toBe(1);
  });

  it("rejects an unknown request", async () => {
    const { service } = createService();

    await expect(
      service.acceptRequest("user-b", "user-a__user-b"),
    ).rejects.toMatchObject({ code: "REQUEST_NOT_FOUND" });
  });

  it("only lets the recipient accept", async () => {
    const { repository, service } = createService();
    const request = repository.seedRequest("user-a", "user-b");

    await expect(service.acceptRequest("user-a", request.id)).rejects
      .toMatchObject({ code: "NOT_REQUEST_RECIPIENT" });
  });

  it("refuses non-participants and non-pending requests", async () => {
    const { repository, service } = createService();
    const request = repository.seedRequest("user-a", "user-b");

    await expect(service.acceptRequest("user-c", request.id)).rejects
      .toMatchObject({ code: "NOT_REQUEST_RECIPIENT" });

    repository.requests.set(request.id, { ...request, status: "cancelled" });
    await expect(service.acceptRequest("user-b", request.id)).rejects
      .toMatchObject({ code: "REQUEST_NOT_PENDING" });
  });

  it("validates the viewer", async () => {
    const { service } = createService();

    await expect(service.acceptRequest(" ", "id")).rejects.toBeInstanceOf(
      FriendValidationError,
    );
  });
});

describe("FriendsService.rejectRequest", () => {
  it("marks a pending request as rejected", async () => {
    const { repository, service } = createService();
    const request = repository.seedRequest("user-a", "user-b");

    const rejected = await service.rejectRequest("user-b", request.id);

    expect(rejected.status).toBe("rejected");
    expect(repository.requests.get(request.id)?.status).toBe("rejected");
    expect(repository.friendships.size).toBe(0);
  });

  it("only lets the recipient reject", async () => {
    const { repository, service } = createService();
    const request = repository.seedRequest("user-a", "user-b");

    await expect(service.rejectRequest("user-a", request.id)).rejects
      .toMatchObject({ code: "NOT_REQUEST_RECIPIENT" });
    expect(repository.requests.get(request.id)?.status).toBe("pending");
  });
});

describe("FriendsService.cancelRequest", () => {
  it("marks a pending request as cancelled", async () => {
    const { repository, service } = createService();
    const request = repository.seedRequest("user-a", "user-b");

    const cancelled = await service.cancelRequest("user-a", request.id);

    expect(cancelled.status).toBe("cancelled");
    expect(repository.requests.get(request.id)?.status).toBe("cancelled");
  });

  it("only lets the sender cancel", async () => {
    const { repository, service } = createService();
    const request = repository.seedRequest("user-a", "user-b");

    await expect(service.cancelRequest("user-b", request.id)).rejects
      .toMatchObject({ code: "NOT_REQUEST_SENDER" });
  });

  it("rejects a request that is not pending", async () => {
    const { repository, service } = createService();
    const request = repository.seedRequest("user-a", "user-b", "rejected");

    await expect(service.cancelRequest("user-a", request.id)).rejects
      .toMatchObject({ code: "REQUEST_NOT_PENDING" });
  });
});

describe("FriendsService.removeFriend", () => {
  it("deletes the deterministic friendship document", async () => {
    const { repository, service } = createService();
    repository.seedFriendship("user-a", "user-b");

    await service.removeFriend(" user-b ", "user-a");

    expect(repository.deletedFriendships).toEqual(["user-a__user-b"]);
    expect(repository.friendships.size).toBe(0);
  });

  it("fails when there is no friendship", async () => {
    const { service } = createService();

    await expect(service.removeFriend("user-a", "user-b")).rejects
      .toMatchObject({ code: "FRIEND_NOT_FOUND" });
  });

  it("fails when trying to remove yourself", async () => {
    const { service } = createService();

    await expect(service.removeFriend("user-a", "user-a")).rejects
      .toMatchObject({ code: "FRIEND_NOT_FOUND" });
  });

  it("validates both uids", async () => {
    const { service } = createService();

    await expect(service.removeFriend(" ", "user-b")).rejects.toBeInstanceOf(
      FriendValidationError,
    );
    await expect(service.removeFriend("user-a", " ")).rejects.toBeInstanceOf(
      FriendValidationError,
    );
  });
});
