import { beforeEach, describe, expect, it, jest } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the module under test.
import {
  mockCollection,
  mockOnSnapshot,
  mockUpdateDoc,
  mockWhere,
  querySnapshot,
  setupNotificationMocks,
} from "./notifications-operations.test-helpers";
import {
  NOTIFICATIONS_COLLECTION,
  listenNotificationsOperation,
  markNotificationReadOperation,
  markNotificationSeenOperation,
} from "../notifications.operations";
import { buildNotificationDocument } from "./notifications.fixtures";

beforeEach(setupNotificationMocks);

const id = "settlement-1:created:user-b";
const seen = "2026-11-16T10:30:00.000Z";
const opened = "2026-11-16T11:00:00.000Z";

describe("markNotificationSeenOperation", () => {
  it("writes only seenAt so the row stays unread", async () => {
    await markNotificationSeenOperation(id, seen);

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id }),
      { seenAt: seen },
    );
  });
});

describe("markNotificationReadOperation", () => {
  it("writes both stamps in a single update", async () => {
    await markNotificationReadOperation(id, opened, seen);

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id }),
      { readAt: opened, seenAt: seen },
    );
  });
});

describe("listenNotificationsOperation", () => {
  it("filters by owner, maps the snapshot and returns unsubscribe", () => {
    const unsubscribe = jest.fn();
    const onChange = jest.fn();
    mockOnSnapshot.mockReturnValue(unsubscribe);

    const detach = listenNotificationsOperation("user-b", onChange);

    expect(mockWhere).toHaveBeenCalledWith("userId", "==", "user-b");
    expect(mockCollection).toHaveBeenCalledWith({}, NOTIFICATIONS_COLLECTION);

    const next = mockOnSnapshot.mock.calls[0][1] as (
      snapshot: unknown,
    ) => void;
    next(
      querySnapshot([
        { id, data: () => buildNotificationDocument() },
        { id: "broken", data: () => ({}) },
      ]),
    );

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ id, userId: "user-b", seenAt: null }),
    ]);
    expect(detach).toBe(unsubscribe);
  });

  it("forwards the listener error when a handler is provided", () => {
    const onError = jest.fn();
    mockOnSnapshot.mockReturnValue(() => {});

    listenNotificationsOperation("user-b", jest.fn(), onError);

    const errorHandler = mockOnSnapshot.mock.calls[0][2] as (
      error: unknown,
    ) => void;
    const error = new Error("permission-denied");
    errorHandler(error);

    expect(onError).toHaveBeenCalledWith(error);
  });

  it("omits the error handler when none is provided", () => {
    mockOnSnapshot.mockReturnValue(() => {});

    listenNotificationsOperation("user-b", jest.fn());

    expect(mockOnSnapshot.mock.calls[0][2]).toBeUndefined();
  });
});
