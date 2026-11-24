import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockGetDocs = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockCollection = jest.fn<(...args: unknown[]) => unknown>();
const mockDoc = jest.fn<(...args: unknown[]) => unknown>();
const mockQuery = jest.fn<(...args: unknown[]) => unknown>();
const mockOrderBy = jest.fn<(...args: unknown[]) => unknown>();
const mockLimit = jest.fn<(...args: unknown[]) => unknown>();
const mockStartAfter = jest.fn<(...args: unknown[]) => unknown>();

jest.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  limit: (...args: unknown[]) => mockLimit(...args),
  startAfter: (...args: unknown[]) => mockStartAfter(...args),
  documentId: () => "__name__",
}));

jest.mock("@/lib/firebase", () => ({ db: {} }));

import {
  getGroupActivityOperation,
  groupActivityCollection,
  newGroupActivityRef,
} from "../group-activity.operations";

const GROUP_ID = "user-a__group-1";

function document(id: string, createdAt: string) {
  return {
    id,
    data: () => ({
      type: "member-joined",
      groupId: GROUP_ID,
      actorId: "user-b",
      targetUserId: null,
      targetName: null,
      expenseId: null,
      settlementId: null,
      amountCents: null,
      currency: null,
      description: null,
      changedFields: [],
      simplifyDebts: null,
      previousOwnerId: null,
      newOwnerId: null,
      createdAt,
    }),
  };
}

function querySnapshot(docs: unknown[]) {
  return { docs };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCollection.mockReturnValue({ path: "collection" });
  mockQuery.mockReturnValue({ path: "query" });
  mockOrderBy.mockImplementation((field, direction) => ({ field, direction }));
  mockLimit.mockImplementation((value) => ({ limit: value }));
  mockStartAfter.mockImplementation((createdAt, id) => ({ createdAt, id }));
  mockGetDocs.mockResolvedValue(querySnapshot([]));
});

describe("groupActivityCollection", () => {
  it("points at the member-only subcollection of the group", () => {
    groupActivityCollection(GROUP_ID);

    expect(mockCollection).toHaveBeenCalledWith(
      {},
      "groups",
      GROUP_ID,
      "activity",
    );
  });

  it("generates a client-side id for a new event", () => {
    mockDoc.mockReturnValue({ id: "activity-new" });

    expect(newGroupActivityRef(GROUP_ID)).toEqual({ id: "activity-new" });
    expect(mockDoc).toHaveBeenCalledWith({ path: "collection" });
  });
});

describe("getGroupActivityOperation", () => {
  it("orders by createdAt and the document id, newest first", async () => {
    await getGroupActivityOperation(GROUP_ID);

    expect(mockOrderBy.mock.calls).toEqual([
      ["createdAt", "desc"],
      ["__name__", "desc"],
    ]);
  });

  it("requests one extra row to compute hasMore", async () => {
    await getGroupActivityOperation(GROUP_ID);

    expect(mockLimit).toHaveBeenCalledWith(21);
    expect(mockStartAfter).not.toHaveBeenCalled();
  });

  it("clamps the page size to 1..50", async () => {
    await getGroupActivityOperation(GROUP_ID, { limit: 100 });
    expect(mockLimit).toHaveBeenLastCalledWith(51);

    await getGroupActivityOperation(GROUP_ID, { limit: 0 });
    expect(mockLimit).toHaveBeenLastCalledWith(2);

    await getGroupActivityOperation(GROUP_ID, { limit: 10 });
    expect(mockLimit).toHaveBeenLastCalledWith(11);
  });

  it("starts after the cursor when one is provided", async () => {
    await getGroupActivityOperation(GROUP_ID, {
      limit: 2,
      after: { createdAt: "2026-11-20T10:00:00.000Z", id: "activity-9" },
    });

    expect(mockStartAfter).toHaveBeenCalledWith(
      "2026-11-20T10:00:00.000Z",
      "activity-9",
    );
  });

  it("reports more rows when the extra document comes back", async () => {
    mockGetDocs.mockResolvedValue(
      querySnapshot([
        document("activity-3", "2026-11-20T12:00:00.000Z"),
        document("activity-2", "2026-11-20T11:00:00.000Z"),
        document("activity-1", "2026-11-20T10:00:00.000Z"),
      ]),
    );

    const page = await getGroupActivityOperation(GROUP_ID, { limit: 2 });

    expect(page.hasMore).toBe(true);
    expect(page.items.map((item) => item.id)).toEqual([
      "activity-3",
      "activity-2",
    ]);
    expect(page.nextCursor).toEqual({
      createdAt: "2026-11-20T11:00:00.000Z",
      id: "activity-2",
    });
  });

  it("reports the last page when nothing extra comes back", async () => {
    mockGetDocs.mockResolvedValue(
      querySnapshot([document("activity-1", "2026-11-20T10:00:00.000Z")]),
    );

    const page = await getGroupActivityOperation(GROUP_ID, { limit: 20 });

    expect(page).toMatchObject({ hasMore: false, nextCursor: null });
    expect(page.items).toHaveLength(1);
  });

  it("takes the cursor from the raw row even when a row maps to nothing", async () => {
    mockGetDocs.mockResolvedValue(
      querySnapshot([
        { id: "broken", data: () => ({ type: "unknown" }) },
        document("activity-2", "2026-11-20T11:00:00.000Z"),
        document("activity-1", "2026-11-20T10:00:00.000Z"),
      ]),
    );

    const page = await getGroupActivityOperation(GROUP_ID, { limit: 2 });

    // The malformed row is dropped from `items`, but the cursor comes from the
    // last raw row of the page, so the next request still advances.
    expect(page.items.map((item) => item.id)).toEqual(["activity-2"]);
    expect(page.hasMore).toBe(true);
    expect(page.nextCursor).toEqual({
      createdAt: "2026-11-20T11:00:00.000Z",
      id: "activity-2",
    });
  });

  it("stops paging when the last raw row has no usable cursor", async () => {
    mockGetDocs.mockResolvedValue(
      querySnapshot([
        { id: "broken", data: () => ({ type: "unknown" }) },
        document("activity-3", "2026-11-20T12:00:00.000Z"),
      ]),
    );

    const page = await getGroupActivityOperation(GROUP_ID, { limit: 1 });

    expect(page).toMatchObject({ hasMore: false, nextCursor: null });
    expect(page.items).toEqual([]);
  });

  it("never duplicates or skips entries that share createdAt", async () => {
    const shared = "2026-11-20T12:00:00.000Z";
    mockGetDocs.mockResolvedValueOnce(
      querySnapshot([
        document("activity-c", shared),
        document("activity-b", shared),
        document("activity-a", shared),
      ]),
    );

    const first = await getGroupActivityOperation(GROUP_ID, { limit: 2 });
    expect(first.items.map((item) => item.id)).toEqual([
      "activity-c",
      "activity-b",
    ]);
    expect(first.nextCursor).toEqual({ createdAt: shared, id: "activity-b" });

    mockGetDocs.mockResolvedValueOnce(
      querySnapshot([document("activity-a", shared)]),
    );
    mockStartAfter.mockClear();

    const second = await getGroupActivityOperation(GROUP_ID, {
      limit: 2,
      after: first.nextCursor,
    });

    // Firestore's `startAfter` is exclusive on the ordered pair, so the second
    // page continues after activity-b: the tie is not repeated nor skipped.
    expect(mockStartAfter).toHaveBeenCalledWith(shared, "activity-b");
    expect(second.items.map((item) => item.id)).toEqual(["activity-a"]);
    expect(second.hasMore).toBe(false);
  });

  it("drops malformed rows instead of half-rendering them", async () => {
    mockGetDocs.mockResolvedValue(
      querySnapshot([
        document("activity-1", "2026-11-20T10:00:00.000Z"),
        { id: "broken", data: () => ({ type: "unknown" }) },
      ]),
    );

    const page = await getGroupActivityOperation(GROUP_ID);

    expect(page.items.map((item) => item.id)).toEqual(["activity-1"]);
  });
});
