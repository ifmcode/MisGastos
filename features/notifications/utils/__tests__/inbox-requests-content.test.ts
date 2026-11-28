import { describe, expect, it } from "@jest/globals";

import {
  hasInboxRequestsContent,
  type InboxRequestsContentState,
} from "../inbox-requests-content";

function state(
  overrides: Partial<InboxRequestsContentState> = {},
): InboxRequestsContentState {
  return {
    total: 0,
    loading: false,
    groupsLoading: false,
    error: null,
    actionError: null,
    groupError: null,
    groupActionError: null,
    ownerJoinRequests: { loading: false, error: null, actionError: null },
    ...overrides,
  };
}

describe("hasInboxRequestsContent", () => {
  it("is false when the queue is empty and idle", () => {
    expect(hasInboxRequestsContent(state())).toBe(false);
  });

  it("is true as soon as the queue has rows", () => {
    expect(hasInboxRequestsContent(state({ total: 1 }))).toBe(true);
  });

  it("is true while any source is loading", () => {
    expect(hasInboxRequestsContent(state({ loading: true }))).toBe(true);
    expect(hasInboxRequestsContent(state({ groupsLoading: true }))).toBe(true);
    expect(
      hasInboxRequestsContent(
        state({
          ownerJoinRequests: { loading: true, error: null, actionError: null },
        }),
      ),
    ).toBe(true);
  });

  it("is true while any source reports an error", () => {
    expect(hasInboxRequestsContent(state({ error: "boom" }))).toBe(true);
    expect(hasInboxRequestsContent(state({ actionError: "boom" }))).toBe(true);
    expect(hasInboxRequestsContent(state({ groupError: "boom" }))).toBe(true);
    expect(hasInboxRequestsContent(state({ groupActionError: "boom" }))).toBe(
      true,
    );
    expect(
      hasInboxRequestsContent(
        state({
          ownerJoinRequests: {
            loading: false,
            error: "boom",
            actionError: null,
          },
        }),
      ),
    ).toBe(true);
    expect(
      hasInboxRequestsContent(
        state({
          ownerJoinRequests: {
            loading: false,
            error: null,
            actionError: "boom",
          },
        }),
      ),
    ).toBe(true);
  });
});
