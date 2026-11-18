import { describe, expect, it } from "@jest/globals";

import { getNotificationErrorCode } from "../notification.errors";
import { NotificationsService } from "../notifications.service";
import { FakeNotificationsRepository } from "./notifications.fakes";

describe("getNotificationErrorCode", () => {
  it("maps domain codes, Firebase codes and the fallback", () => {
    expect(
      getNotificationErrorCode(
        Object.assign(new Error(""), { code: "NOT_OWNER" }),
      ),
    ).toBe("LOAD_FAILED");

    const domainError = { name: "NotificationOperationError", code: "NOT_OWNER" };
    expect(getNotificationErrorCode(domainError, "SAVE_FAILED")).toBe(
      "SAVE_FAILED",
    );
    expect(
      getNotificationErrorCode(
        Object.assign(new Error("x"), { code: "permission-denied" }),
      ),
    ).toBe("PERMISSION_DENIED");
    expect(
      getNotificationErrorCode(
        Object.assign(new Error("x"), { code: "unavailable" }),
      ),
    ).toBe("NETWORK");
    expect(
      getNotificationErrorCode(
        Object.assign(new Error("x"), { code: "network-request-failed" }),
      ),
    ).toBe("NETWORK");
    expect(getNotificationErrorCode(new Error("boom"), "SAVE_FAILED")).toBe(
      "SAVE_FAILED",
    );
  });

  it("maps a NotificationOperationError by its code", async () => {
    const service = new NotificationsService(new FakeNotificationsRepository());

    await expect(service.getNotifications("")).rejects.toMatchObject({
      code: "SIGN_IN_REQUIRED",
    });

    try {
      await service.getNotifications("");
    } catch (error) {
      expect(getNotificationErrorCode(error)).toBe("SIGN_IN_REQUIRED");
    }
  });
});
