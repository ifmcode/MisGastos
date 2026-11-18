import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the module under test.
import {
  documentSnapshot,
  missingSnapshot,
  mockCollection,
  mockDoc,
  mockGetDoc,
  mockGetDocs,
  mockSetDoc,
  mockWhere,
  querySnapshot,
  setupNotificationMocks,
} from "./notifications-operations.test-helpers";
import {
  NOTIFICATIONS_COLLECTION,
  createNotificationOperation,
  getNotificationOperation,
  getNotificationsOperation,
} from "../notifications.operations";
import type { NotificationWrite } from "../../types/notification.types";
import { buildNotificationDocument } from "./notifications.fixtures";

beforeEach(setupNotificationMocks);

const input: NotificationWrite = {
  userId: "user-b",
  type: "settlement-created",
  payload: { settlementId: "settlement-1" },
  dedupeKey: "settlement-1:created:user-b",
  createdAt: "2026-11-16T10:00:00.000Z",
};

describe("getNotificationsOperation", () => {
  it("queries by owner and drops unmappable documents", async () => {
    mockGetDocs.mockResolvedValue(
      querySnapshot([
        {
          id: "settlement-1:created:user-b",
          data: () => buildNotificationDocument(),
        },
        { id: "broken", data: () => ({}) },
      ]),
    );

    const notifications = await getNotificationsOperation("user-b");

    expect(mockCollection).toHaveBeenCalledWith({}, NOTIFICATIONS_COLLECTION);
    expect(mockWhere).toHaveBeenCalledWith("userId", "==", "user-b");
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({ id: "settlement-1:created:user-b" });
  });
});

describe("getNotificationOperation", () => {
  it("reads one notification by its deterministic id", async () => {
    mockGetDoc.mockResolvedValue(
      documentSnapshot("settlement-1:created:user-b", buildNotificationDocument()),
    );

    const notification = await getNotificationOperation(
      "settlement-1:created:user-b",
    );

    expect(mockDoc).toHaveBeenCalledWith(
      {},
      NOTIFICATIONS_COLLECTION,
      "settlement-1:created:user-b",
    );
    expect(notification).toMatchObject({ userId: "user-b" });
  });

  it("returns null for a missing or malformed document", async () => {
    mockGetDoc.mockResolvedValueOnce(missingSnapshot());
    await expect(getNotificationOperation("missing")).resolves.toBeNull();

    mockGetDoc.mockResolvedValueOnce(documentSnapshot("broken", {}));
    await expect(getNotificationOperation("broken")).resolves.toBeNull();
  });
});

describe("createNotificationOperation", () => {
  it("skips a notification that already exists", async () => {
    mockGetDoc.mockResolvedValue(
      documentSnapshot(input.dedupeKey, buildNotificationDocument()),
    );

    await expect(createNotificationOperation(input)).resolves.toBeNull();
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it("writes the notification under its dedupe key", async () => {
    mockGetDoc.mockResolvedValue(missingSnapshot());

    const created = await createNotificationOperation(input);

    expect(mockDoc).toHaveBeenCalledWith(
      {},
      NOTIFICATIONS_COLLECTION,
      input.dedupeKey,
    );
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id: input.dedupeKey }),
      expect.objectContaining({
        userId: "user-b",
        type: "settlement-created",
        dedupeKey: input.dedupeKey,
        seenAt: null,
        readAt: null,
      }),
    );
    expect(created).toMatchObject({
      id: input.dedupeKey,
      userId: "user-b",
      seenAt: null,
      readAt: null,
    });
  });
});
