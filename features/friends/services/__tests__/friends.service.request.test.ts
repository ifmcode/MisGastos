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

describe("FriendsService.sendRequest", () => {
  it("creates one deterministic pending request", async () => {
    const { repository, service } = createService();

    const request = await service.sendRequest(" user-a ", "user-b");

    expect(request).toMatchObject({
      id: "user-a__user-b",
      requesterId: "user-a",
      recipientId: "user-b",
      participantIds: ["user-a", "user-b"],
      status: "pending",
    });
    expect(repository.requests.size).toBe(1);
  });

  it("rejects a self request", async () => {
    const { repository, service } = createService();

    await expect(service.sendRequest("user-a", " user-a ")).rejects
      .toMatchObject({ code: "SELF_REQUEST" });
    expect(repository.requests.size).toBe(0);
  });

  it("requires both uids", async () => {
    const { service } = createService();

    await expect(service.sendRequest(" ", "user-b")).rejects.toBeInstanceOf(
      FriendValidationError,
    );
  });

  it("rejects unknown recipients", async () => {
    const { repository, service } = createService();

    await expect(
      service.sendRequest("user-a", "user-unknown"),
    ).rejects.toMatchObject({ code: "USER_NOT_FOUND" });
    expect(repository.requests.size).toBe(0);
  });

  it("rejects a request to an existing friend", async () => {
    const { repository, service } = createService();
    repository.seedFriendship("user-a", "user-b");

    await expect(service.sendRequest("user-a", "user-b")).rejects.toMatchObject(
      { code: "ALREADY_FRIENDS" },
    );
  });

  it("rejects a duplicate outgoing request", async () => {
    const { repository, service } = createService();
    repository.seedRequest("user-a", "user-b");

    await expect(service.sendRequest("user-a", "user-b")).rejects.toMatchObject(
      { code: "DUPLICATE_REQUEST" },
    );
  });

  it("rejects a request when the other user already asked", async () => {
    const { repository, service } = createService();
    repository.seedRequest("user-b", "user-a");

    await expect(service.sendRequest("user-a", "user-b")).rejects.toMatchObject(
      { code: "INCOMING_REQUEST_EXISTS" },
    );
  });

  it("re-opens a rejected request and swaps requester and recipient", async () => {
    const { repository, service } = createService();
    repository.seedRequest("user-a", "user-b", "rejected");

    const request = await service.sendRequest("user-b", "user-a");

    expect(request).toMatchObject({
      id: "user-a__user-b",
      requesterId: "user-b",
      recipientId: "user-a",
      participantIds: ["user-a", "user-b"],
      status: "pending",
    });
    expect(repository.requests.size).toBe(1);
  });

  it("re-opens a cancelled request keeping the same sender", async () => {
    const { repository, service } = createService();
    repository.seedRequest("user-a", "user-b", "cancelled");

    const request = await service.sendRequest("user-a", "user-b");

    expect(request).toMatchObject({
      id: "user-a__user-b",
      requesterId: "user-a",
      recipientId: "user-b",
      status: "pending",
    });
  });

  it("propagates repository failures", async () => {
    const { repository, service } = createService();
    const failure = new Error("offline");
    repository.failure = failure;

    await expect(service.sendRequest("user-a", "user-b")).rejects.toBe(failure);
  });
});
