import { describe, expect, it } from "@jest/globals";

import {
  selectNotificationArrivals,
  shouldPresentArrivals,
} from "../notification-banner";
import { buildNotification } from "./notification-banner.fixtures";

describe("selectNotificationArrivals", () => {
  it("only primes the known ids on the first snapshot", () => {
    const selection = selectNotificationArrivals(new Set(), false, [
      buildNotification("a"),
      buildNotification("b", { seenAt: "2026-11-17T10:03:00.000Z" }),
    ]);

    expect(selection.arrivals).toEqual([]);
    expect([...selection.knownIds].sort()).toEqual(["a", "b"]);
  });

  it("reports only the new pending rows of a later snapshot", () => {
    const selection = selectNotificationArrivals(new Set(["a"]), true, [
      buildNotification("a"),
      buildNotification("b"),
      buildNotification("c", { seenAt: "2026-11-17T10:03:00.000Z" }),
    ]);

    expect(selection.arrivals.map((notification) => notification.id)).toEqual([
      "b",
    ]);
    expect([...selection.knownIds].sort()).toEqual(["a", "b", "c"]);
  });

  it("keeps the previous known ids when a snapshot is empty", () => {
    const selection = selectNotificationArrivals(new Set(["a"]), true, []);

    expect(selection.arrivals).toEqual([]);
    expect([...selection.knownIds]).toEqual(["a"]);
  });
});

describe("shouldPresentArrivals", () => {
  const arrivals = [buildNotification("a")];

  it("presents arrivals in the foreground and away from the inbox", () => {
    expect(
      shouldPresentArrivals({ suppressed: false, foreground: true, arrivals }),
    ).toBe(true);
  });

  it("drops them while the inbox is focused", () => {
    expect(
      shouldPresentArrivals({ suppressed: true, foreground: true, arrivals }),
    ).toBe(false);
  });

  it("drops them in the background", () => {
    expect(
      shouldPresentArrivals({ suppressed: false, foreground: false, arrivals }),
    ).toBe(false);
  });

  it("drops an empty selection", () => {
    expect(
      shouldPresentArrivals({
        suppressed: false,
        foreground: true,
        arrivals: [],
      }),
    ).toBe(false);
  });
});
