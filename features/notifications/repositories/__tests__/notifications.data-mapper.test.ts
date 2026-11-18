import { describe, expect, it } from "@jest/globals";

import type { NotificationWrite } from "../../types/notification.types";
import {
  createNotificationDocumentId,
  sanitizeDedupeKey,
  toNotificationData,
} from "../notifications.data";
import { mapNotificationDocument } from "../notifications.mapper";
import {
  buildLegacyNotificationDocument,
  buildNotificationDocument,
} from "./notifications.fixtures";

const write: NotificationWrite = {
  userId: "user-b",
  type: "settlement-created",
  payload: { settlementId: "settlement-1", amountCents: 1000 },
  dedupeKey: " settlement-1:created:user-b ",
  createdAt: "2026-11-16T10:00:00.000Z",
};

describe("sanitizeDedupeKey", () => {
  it("trims and replaces slashes so it is a valid document id", () => {
    expect(sanitizeDedupeKey(" a/b:c ")).toBe("a_b:c");
  });

  it("falls back for an empty key", () => {
    expect(sanitizeDedupeKey("   ")).toBe("notification");
    expect(sanitizeDedupeKey("/")).toBe("_");
  });
});

describe("createNotificationDocumentId", () => {
  it("is the sanitized dedupe key the rules compare against", () => {
    expect(createNotificationDocumentId("settlement-1:created:user-b")).toBe(
      "settlement-1:created:user-b",
    );
  });
});

describe("toNotificationData", () => {
  it("writes every document field and normalizes the key", () => {
    expect(toNotificationData(write)).toEqual({
      userId: "user-b",
      type: "settlement-created",
      payload: { settlementId: "settlement-1", amountCents: 1000 },
      createdAt: "2026-11-16T10:00:00.000Z",
      seenAt: null,
      readAt: null,
      dedupeKey: "settlement-1:created:user-b",
    });
  });
});

describe("mapNotificationDocument", () => {
  it("maps a valid document", () => {
    const notification = mapNotificationDocument(
      "settlement-1:created:user-b",
      buildNotificationDocument(),
    );

    expect(notification).toMatchObject({
      id: "settlement-1:created:user-b",
      userId: "user-b",
      type: "settlement-created",
      seenAt: null,
      readAt: null,
      dedupeKey: "settlement-1:created:user-b",
    });
  });

  it("maps a legacy document without seenAt as Pendiente", () => {
    const notification = mapNotificationDocument(
      "settlement-1:created:user-b",
      buildLegacyNotificationDocument(),
    );

    expect(notification).toMatchObject({ seenAt: null, readAt: null });
  });

  it("maps a seenAt string and normalizes the whitespace", () => {
    const notification = mapNotificationDocument(
      "settlement-1:created:user-b",
      buildNotificationDocument({
        seenAt: " 2026-11-16T10:30:00.000Z ",
        readAt: "2026-11-16T11:00:00.000Z",
      }),
    );

    expect(notification).toMatchObject({
      seenAt: "2026-11-16T10:30:00.000Z",
      readAt: "2026-11-16T11:00:00.000Z",
    });
  });

  it("accepts the reserved TICKET-047 types without a shape change", () => {
    const notification = mapNotificationDocument(
      "friend-request:user-a:user-b",
      buildNotificationDocument({ type: "friend-request" }),
    );

    expect(notification).toMatchObject({ type: "friend-request" });
  });

  it("falls back to the id when the stored key is missing", () => {
    const notification = mapNotificationDocument(
      "settlement-1:created:user-b",
      buildNotificationDocument({ dedupeKey: "" }),
    );

    expect(notification?.dedupeKey).toBe("settlement-1:created:user-b");
  });

  it("normalizes readAt and createdAt", () => {
    const notification = mapNotificationDocument(
      "notification-1",
      buildNotificationDocument({
        readAt: " 2026-11-16T11:00:00.000Z ",
        createdAt: "2026-11-16T10:00:00.000Z",
      }),
    );

    expect(notification).toMatchObject({
      readAt: "2026-11-16T11:00:00.000Z",
      createdAt: "2026-11-16T10:00:00.000Z",
    });
  });

  it("drops malformed documents", () => {
    const document = buildNotificationDocument();

    expect(mapNotificationDocument("", document)).toBeNull();
    expect(
      mapNotificationDocument("id", { ...document, userId: "" }),
    ).toBeNull();
    expect(
      mapNotificationDocument("id", { ...document, type: "unknown-type" }),
    ).toBeNull();
    expect(
      mapNotificationDocument("id", { ...document, payload: "text" }),
    ).toBeNull();
    expect(
      mapNotificationDocument("id", { ...document, payload: ["a"] }),
    ).toBeNull();
    expect(
      mapNotificationDocument("id", { ...document, createdAt: "not-a-date" }),
    ).toBeNull();
  });
});
