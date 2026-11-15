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

describe("FriendsService.searchByEmail", () => {
  it("returns null for an unknown email", async () => {
    const { service } = createService();

    await expect(
      service.searchByEmail("user-a", "nobody@example.com"),
    ).resolves.toBeNull();
  });

  it("normalizes the email before searching", async () => {
    const { repository, service } = createService();

    const result = await service.searchByEmail("user-a", "  BEA@Example.com ");

    expect(result?.profile.uid).toBe("user-b");
    expect(repository.requests.size).toBe(0);
  });

  it("flags the own profile as self", async () => {
    const { service } = createService();

    await expect(
      service.searchByEmail("user-a", "ada@example.com"),
    ).resolves.toMatchObject({
      relation: "self",
      requestId: null,
      profile: { uid: "user-a" },
    });
  });

  it("reports an accepted friendship", async () => {
    const { repository, service } = createService();
    repository.seedFriendship("user-a", "user-b");

    await expect(
      service.searchByEmail("user-a", "bea@example.com"),
    ).resolves.toMatchObject({ relation: "friend", requestId: null });
  });

  it("reports an outgoing pending request", async () => {
    const { repository, service } = createService();
    const request = repository.seedRequest("user-a", "user-b");

    await expect(
      service.searchByEmail("user-a", "bea@example.com"),
    ).resolves.toMatchObject({
      relation: "outgoing",
      requestId: request.id,
    });
  });

  it("reports an incoming pending request", async () => {
    const { repository, service } = createService();
    const request = repository.seedRequest("user-b", "user-a");

    await expect(
      service.searchByEmail("user-a", "bea@example.com"),
    ).resolves.toMatchObject({
      relation: "incoming",
      requestId: request.id,
    });
  });

  it("ignores rejected and cancelled requests", async () => {
    const { repository, service } = createService();
    repository.seedRequest("user-a", "user-b", "rejected");
    repository.seedRequest("user-a", "user-b", "cancelled");

    await expect(
      service.searchByEmail("user-a", "bea@example.com"),
    ).resolves.toMatchObject({ relation: "none", requestId: null });
  });

  it("validates the viewer and the email", async () => {
    const { service } = createService();

    await expect(service.searchByEmail(" ", "bea@example.com")).rejects
      .toBeInstanceOf(FriendValidationError);
    await expect(service.searchByEmail("user-a", "bea")).rejects
      .toBeInstanceOf(FriendValidationError);
  });
});
