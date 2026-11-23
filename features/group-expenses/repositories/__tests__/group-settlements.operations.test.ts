import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the module under test.
import {
  GROUP_ID,
  mockGetDoc,
  mockGetDocs,
  mockQuery,
  mockWhere,
  missingSnapshot,
  querySnapshot,
  setupGroupSettlementMocks,
  snapshot,
  groupSettlementDocument,
} from "./group-settlements-repository.test-helpers";
import {
  getGroupSettlementOperation,
  getGroupSettlementsOperation,
} from "../group-settlements.operations";

beforeEach(setupGroupSettlementMocks);

describe("getGroupSettlementOperation", () => {
  it("maps one document", async () => {
    mockGetDoc.mockResolvedValue(
      snapshot("settlement-1", groupSettlementDocument()),
    );

    expect(await getGroupSettlementOperation("settlement-1")).toMatchObject({
      id: "settlement-1",
      groupId: GROUP_ID,
    });
  });

  it("returns null for a missing or malformed document", async () => {
    mockGetDoc.mockResolvedValue(missingSnapshot("settlement-1"));
    expect(await getGroupSettlementOperation("settlement-1")).toBeNull();

    mockGetDoc.mockResolvedValue(
      snapshot("settlement-1", groupSettlementDocument({ amountCents: 0 })),
    );
    expect(await getGroupSettlementOperation("settlement-1")).toBeNull();
  });
});

describe("getGroupSettlementsOperation", () => {
  it("queries by group id and keeps every valid row", async () => {
    mockGetDocs.mockResolvedValue(
      querySnapshot([
        {
          id: "settlement-1",
          data: () => groupSettlementDocument(),
        },
        {
          id: "settlement-2",
          data: () =>
            groupSettlementDocument({
              participantIds: ["user-a", "user-b"],
              pairId: "user-a__user-b",
              fromUserId: "user-a",
              toUserId: "user-b",
              deletedAt: "2026-11-12T10:00:00.000Z",
            }),
        },
        { id: "broken", data: () => groupSettlementDocument({ groupId: "" }) },
      ]),
    );

    const settlements = await getGroupSettlementsOperation(GROUP_ID);

    expect(mockWhere).toHaveBeenCalledWith("groupId", "==", GROUP_ID);
    expect(mockQuery).toHaveBeenCalled();
    expect(settlements.map((settlement) => settlement.id)).toEqual([
      "settlement-1",
      "settlement-2",
    ]);
  });
});
