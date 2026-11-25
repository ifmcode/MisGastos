import { describe, expect, it } from "@jest/globals";

import { resolveNetworkStatus } from "../network-status";

describe("resolveNetworkStatus", () => {
  it("is online when connected and reachability is true", () => {
    expect(
      resolveNetworkStatus({ isConnected: true, isInternetReachable: true }),
    ).toBe("online");
  });

  it("stays online when the reachability probe is still unknown", () => {
    expect(
      resolveNetworkStatus({ isConnected: true, isInternetReachable: null }),
    ).toBe("online");
  });

  it("is offline when the device reports no connection", () => {
    expect(
      resolveNetworkStatus({ isConnected: false, isInternetReachable: null }),
    ).toBe("offline");
  });

  it("is offline when connected but the internet is unreachable", () => {
    expect(
      resolveNetworkStatus({ isConnected: true, isInternetReachable: false }),
    ).toBe("offline");
  });

  it("is unknown while NetInfo has not measured connectivity yet", () => {
    expect(
      resolveNetworkStatus({ isConnected: null, isInternetReachable: null }),
    ).toBe("unknown");
  });
});
