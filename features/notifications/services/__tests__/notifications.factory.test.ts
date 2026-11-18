import { describe, expect, it, jest } from "@jest/globals";

jest.mock(
  "../../repositories/firebase-notifications.repository",
  () => ({
    FirebaseNotificationsRepository: jest.fn(() => ({ kind: "notifications" })),
  }),
);

import { FirebaseNotificationsRepository } from "../../repositories/firebase-notifications.repository";
import { getNotificationsService } from "../notifications.factory";

describe("getNotificationsService", () => {
  it("reuses one service wired to Firestore", () => {
    const service = getNotificationsService();

    expect(getNotificationsService()).toBe(service);
    expect(FirebaseNotificationsRepository).toHaveBeenCalledTimes(1);
  });
});
