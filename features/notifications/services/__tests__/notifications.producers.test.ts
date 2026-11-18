import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { buildSettlement } from "@/features/settlements/repositories/__tests__/settlement-document.fixtures";

import { buildNotification } from "../../repositories/__tests__/notifications.fixtures";
import { NotificationsService } from "../notifications.service";
import { FakeNotificationsRepository } from "./notifications.fakes";

let repository: FakeNotificationsRepository;
let service: NotificationsService;

beforeEach(() => {
  repository = new FakeNotificationsRepository();
  service = new NotificationsService(repository);
});

describe("subscribe", () => {
  it("delegates to the repository listener and returns its unsubscribe", () => {
    const onChange = jest.fn();
    const onError = jest.fn();

    const unsubscribe = service.subscribe("user-b", onChange, onError);

    expect(repository.listeners).toEqual([
      { userId: "user-b", onChange, onError },
    ]);

    repository.emit([buildNotification()]);
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: "settlement-1:created:user-b" }),
    ]);

    unsubscribe();
    expect(repository.unsubscribed).toBe(1);
  });

  it("returns a no-op unsubscribe for a blank or non-string viewer", () => {
    const onChange = jest.fn();

    const unsubscribe = service.subscribe("   ", onChange);

    expect(repository.listeners).toEqual([]);
    expect(() => unsubscribe()).not.toThrow();

    service.subscribe(null as never, onChange);
    expect(repository.listeners).toEqual([]);
  });
});

describe("createNotification", () => {
  it("delegates to the repository", async () => {
    const input = {
      userId: "user-b",
      type: "settlement-created" as const,
      payload: { settlementId: "settlement-1" },
      dedupeKey: "settlement-1:created:user-b",
      createdAt: "2026-11-16T10:00:00.000Z",
    };

    await service.createNotification(input);

    expect(repository.created).toEqual([input]);
  });
});

describe("createSettlementNotification", () => {
  it("delegates the write built from the settlement event", async () => {
    await service.createSettlementNotification({
      settlement: buildSettlement(),
      event: "created",
      recipientUid: "user-b",
      actorUid: "user-a",
      isFull: false,
      canLinkWallet: true,
    });

    expect(repository.created).toEqual([
      {
        userId: "user-b",
        type: "settlement-created",
        payload: {
          settlementId: "settlement-1",
          pairId: "user-a__user-b",
          friendUid: "user-a",
          amountCents: 1000,
          currency: "EUR",
          isFull: false,
          canLinkWallet: true,
        },
        dedupeKey: "settlement-1:created:user-b",
        createdAt: "2026-11-10T20:00:00.000Z",
      },
    ]);
  });
});
