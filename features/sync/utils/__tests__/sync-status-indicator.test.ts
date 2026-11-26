import { describe, expect, it } from "@jest/globals";

import {
  resolveSyncStatusIndicator,
  type SyncStatusIndicatorInput,
} from "../sync-status-indicator";

function resolve(overrides: Partial<SyncStatusIndicatorInput> = {}) {
  return resolveSyncStatusIndicator({
    enabled: true,
    isOffline: false,
    pendingCount: 0,
    conflictCount: 0,
    ...overrides,
  });
}

describe("resolveSyncStatusIndicator", () => {
  it("hides the button when the offline feature is off", () => {
    expect(resolve({ enabled: false, isOffline: true, pendingCount: 2 })).toBeNull();
  });

  it("hides the button online with nothing pending", () => {
    expect(resolve()).toBeNull();
  });

  it("shows the offline icon without a badge when nothing is queued", () => {
    expect(resolve({ isOffline: true })).toEqual({
      icon: "cloud-offline-outline",
      count: 0,
      labelKey: "headerStatus.offline",
      labelCount: 0,
    });
  });

  it("shows the offline icon with the pending count", () => {
    expect(resolve({ isOffline: true, pendingCount: 3 })).toEqual({
      icon: "cloud-offline-outline",
      count: 3,
      labelKey: "headerStatus.offlinePending",
      labelCount: 3,
    });
  });

  it("shows the upload icon for pending changes while online", () => {
    expect(resolve({ pendingCount: 2 })).toEqual({
      icon: "cloud-upload-outline",
      count: 2,
      labelKey: "headerStatus.pending",
      labelCount: 2,
    });
  });

  it("lets a conflict win over the connection state", () => {
    expect(
      resolve({ isOffline: true, pendingCount: 2, conflictCount: 1 }),
    ).toEqual({
      icon: "alert-circle-outline",
      count: 3,
      labelKey: "headerStatus.conflicts",
      labelCount: 1,
    });
  });

  it("counts both pending and conflicts while announcing the conflicts", () => {
    expect(resolve({ pendingCount: 4, conflictCount: 2 })).toEqual({
      icon: "alert-circle-outline",
      count: 6,
      labelKey: "headerStatus.conflicts",
      labelCount: 2,
    });
  });
});
