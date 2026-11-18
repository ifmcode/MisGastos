import { describe, expect, it } from "@jest/globals";

import {
  buildNotificationBanner,
  collectArrivedNotifications,
  isSuppressedNotificationRoute,
} from "../notification-banner";
import { bannerContext, buildNotification } from "./notification-banner.fixtures";

describe("collectArrivedNotifications", () => {
  it("keeps only unseen notifications in arrival order", () => {
    const arrived = collectArrivedNotifications(new Set(["known"]), [
      buildNotification("late", { createdAt: "2026-11-17T10:02:00.000Z" }),
      buildNotification("known"),
      buildNotification("viewed", { seenAt: "2026-11-17T10:03:00.000Z" }),
      buildNotification("early", { createdAt: "2026-11-17T10:01:00.000Z" }),
    ]);

    expect(arrived.map((notification) => notification.id)).toEqual([
      "early",
      "late",
    ]);
  });

  it("breaks a createdAt tie by id", () => {
    const arrived = collectArrivedNotifications(new Set(), [
      buildNotification("b"),
      buildNotification("a"),
    ]);

    expect(arrived.map((notification) => notification.id)).toEqual(["a", "b"]);
  });

  it("returns nothing when nothing is new", () => {
    expect(
      collectArrivedNotifications(new Set(["a"]), [buildNotification("a")]),
    ).toEqual([]);
  });
});

describe("buildNotificationBanner", () => {
  it("reuses the row copy and adds the banner accessibility contract", () => {
    const banner = buildNotificationBanner(
      buildNotification("a"),
      bannerContext,
    );

    expect(banner.id).toBe("a");
    expect(banner.icon).toBe("checkmark-circle-outline");
    expect(banner.meta).toBe("hace 1 minuto");
    expect(banner.title).toContain("Ana");
    expect(banner.title).not.toContain("actorFallback");
    expect(banner.openAccessibilityLabel).toContain("banner.openAccessibility");
    expect(banner.openHint).toBe("banner.openHint");
    expect(banner.closeAccessibilityLabel).toBe("banner.close");
  });
});

describe("isSuppressedNotificationRoute", () => {
  it("suppresses the inbox, sign-in and verification screens", () => {
    expect(isSuppressedNotificationRoute("/notifications")).toBe(true);
    expect(isSuppressedNotificationRoute(" /login ")).toBe(true);
    expect(isSuppressedNotificationRoute("/verify-email")).toBe(true);
  });

  it("allows the banner everywhere else", () => {
    expect(isSuppressedNotificationRoute("/(tabs)")).toBe(false);
    expect(isSuppressedNotificationRoute("/social/friends/user-a")).toBe(false);
  });
});
