import { afterEach, describe, expect, it, jest } from "@jest/globals";

import {
  requestSyncTrigger,
  resetSyncTriggers,
  subscribeSyncTrigger,
} from "../sync-trigger";

afterEach(resetSyncTriggers);

describe("sync trigger", () => {
  it("notifies every subscriber", () => {
    const first = jest.fn();
    const second = jest.fn();
    subscribeSyncTrigger(first);
    subscribeSyncTrigger(second);

    requestSyncTrigger();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("stops notifying after unsubscribe", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeSyncTrigger(listener);

    unsubscribe();
    requestSyncTrigger();

    expect(listener).not.toHaveBeenCalled();
  });
});
