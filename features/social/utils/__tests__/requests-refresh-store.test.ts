import { describe, expect, it, jest } from "@jest/globals";

import {
  notifyRequestsRefresh,
  subscribeToRequestsRefresh,
} from "../requests-refresh-store";

describe("requests-refresh-store", () => {
  it("notifies every subscriber", () => {
    const first = jest.fn();
    const second = jest.fn();
    const unsubscribeFirst = subscribeToRequestsRefresh(first);
    const unsubscribeSecond = subscribeToRequestsRefresh(second);

    notifyRequestsRefresh();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);

    unsubscribeFirst();
    unsubscribeSecond();
  });

  it("stops notifying after unsubscribe", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToRequestsRefresh(listener);

    unsubscribe();
    notifyRequestsRefresh();

    expect(listener).not.toHaveBeenCalled();
  });

  it("is safe to notify without subscribers", () => {
    expect(() => notifyRequestsRefresh()).not.toThrow();
  });
});
