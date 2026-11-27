import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the module under test.
import {
  documentSnapshot,
  missingSnapshot,
  mockCollection,
  mockDoc,
  mockGetDoc,
  mockGetDocs,
  mockWhere,
  querySnapshot,
  setupSettlementRepositoryMocks,
  settlementDocument,
} from "./settlements-repository.test-helpers";
import {
  SETTLEMENTS_COLLECTION,
  getSettlementOperation,
  getSettlementsOperation,
} from "../settlements.operations";
import { toSettlementData, toSettlementUpdateData } from "../settlements.data";
import {
  buildCreateSettlementDto,
  buildSettlementUpdateDto,
} from "./settlement-document.fixtures";

beforeEach(setupSettlementRepositoryMocks);

describe("getSettlementOperation", () => {
  it("reads one settlement by id", async () => {
    mockGetDoc.mockResolvedValue(
      documentSnapshot("settlement-1", settlementDocument()),
    );

    const settlement = await getSettlementOperation("settlement-1");

    expect(mockDoc).toHaveBeenCalledWith({}, SETTLEMENTS_COLLECTION, "settlement-1");
    expect(settlement).toMatchObject({ id: "settlement-1", amountCents: 1000 });
  });

  it("returns null for a missing or malformed document", async () => {
    mockGetDoc.mockResolvedValueOnce(missingSnapshot());
    await expect(getSettlementOperation("missing")).resolves.toBeNull();

    mockGetDoc.mockResolvedValueOnce(documentSnapshot("broken", {}));
    await expect(getSettlementOperation("broken")).resolves.toBeNull();
  });
});

describe("getSettlementsOperation", () => {
  it("queries by participant and drops unmappable documents", async () => {
    mockGetDocs.mockResolvedValue(
      querySnapshot([
        { id: "settlement-1", data: () => settlementDocument() },
        { id: "broken", data: () => ({}) },
      ]),
    );

    const settlements = await getSettlementsOperation("user-a");

    expect(mockCollection).toHaveBeenCalledWith({}, SETTLEMENTS_COLLECTION);
    expect(mockWhere).toHaveBeenCalledWith(
      "participantIds",
      "array-contains",
      "user-a",
    );
    expect(settlements).toHaveLength(1);
  });
});

describe("settlement data", () => {
  it("writes every field of a new settlement", () => {
    expect(toSettlementData(buildCreateSettlementDto())).toEqual({
      participantIds: ["user-a", "user-b"],
      pairId: "user-a__user-b",
      fromUserId: "user-a",
      toUserId: "user-b",
      amountCents: 1000,
      currency: "EUR",
      date: "2026-11-10",
      note: "Dinner",
      createdBy: "user-a",
      createdAt: "2026-11-10T20:00:00.000Z",
      updatedAt: "2026-11-10T20:00:00.000Z",
      deletedAt: null,
      receiverWalletId: null,
      receiverCategoryId: null,
      receiverTransactionId: null,
      revision: 0,
    });
  });

  it("omits the movement id when persistence does not own it", () => {
    const data = toSettlementUpdateData(buildSettlementUpdateDto());

    expect(data).not.toHaveProperty("receiverTransactionId");
    expect(data).toMatchObject({ amountCents: 2000, updatedAt: "2026-11-11T10:00:00.000Z" });
  });

  it("includes an explicit movement id, null included", () => {
    expect(
      toSettlementUpdateData(
        buildSettlementUpdateDto({ receiverTransactionId: "movement-1" }),
      ),
    ).toMatchObject({ receiverTransactionId: "movement-1" });
    expect(
      toSettlementUpdateData(buildSettlementUpdateDto({ receiverTransactionId: null })),
    ).toMatchObject({ receiverTransactionId: null });
  });
});
