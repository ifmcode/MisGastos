import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the modules.
import {
  GROUP_ID,
  documentSnapshot,
  missingSnapshot,
  mockGetDoc,
  mockGetDocs,
  mockDoc,
  mockWhere,
  querySnapshot,
  setupGroupsRepositoryMocks,
} from "./groups-repository.test-helpers";
import {
  getGroupCodeOperation,
  getGroupJoinRequestOperation,
  getGroupJoinRequestsOperation,
} from "../group-join-read.operations";

beforeEach(setupGroupsRepositoryMocks);

const CODE = "ABCD2345";
const REQUEST_ID = `${GROUP_ID}__user-b`;
const CODE_DOCUMENT = { groupId: GROUP_ID, ownerId: "user-a", groupName: "Viaje" };
const REQUEST_DOCUMENT = {
  groupId: GROUP_ID,
  requesterId: "user-b",
  joinCode: CODE,
  status: "pending",
  createdAt: "2026-11-20T10:00:00.000Z",
  updatedAt: "2026-11-20T10:00:00.000Z",
};

describe("getGroupCodeOperation", () => {
  it("reads the code projection by its normalized id", async () => {
    mockGetDoc.mockResolvedValue(documentSnapshot(CODE, CODE_DOCUMENT));

    await expect(getGroupCodeOperation(" abcd-2345 ")).resolves.toEqual({
      code: CODE,
      groupId: GROUP_ID,
      ownerId: "user-a",
      groupName: "Viaje",
    });
    expect(mockDoc).toHaveBeenCalledWith({}, "groupCodes", CODE);
  });

  it("returns null for a malformed or missing code", async () => {
    await expect(getGroupCodeOperation("ABCD2340")).resolves.toBeNull();
    expect(mockGetDoc).not.toHaveBeenCalled();

    mockGetDoc.mockResolvedValue(missingSnapshot());
    await expect(getGroupCodeOperation(CODE)).resolves.toBeNull();
  });
});

describe("getGroupJoinRequestOperation", () => {
  it("maps a request and maps a missing document to null", async () => {
    mockGetDoc.mockResolvedValue(
      documentSnapshot(REQUEST_ID, REQUEST_DOCUMENT),
    );

    await expect(getGroupJoinRequestOperation(REQUEST_ID)).resolves.toMatchObject(
      { id: REQUEST_ID, status: "pending" },
    );

    mockGetDoc.mockResolvedValue(missingSnapshot());
    await expect(
      getGroupJoinRequestOperation(REQUEST_ID),
    ).resolves.toBeNull();
  });
});

describe("getGroupJoinRequestsOperation", () => {
  it("queries by group, drops malformed rows and sorts oldest first", async () => {
    mockGetDocs.mockResolvedValue(
      querySnapshot([
        {
          id: `${GROUP_ID}__user-c`,
          data: () => ({
            ...REQUEST_DOCUMENT,
            requesterId: "user-c",
            createdAt: "2026-11-21T10:00:00.000Z",
          }),
        },
        { id: REQUEST_ID, data: () => REQUEST_DOCUMENT },
        { id: "broken", data: () => ({}) },
      ]),
    );

    const requests = await getGroupJoinRequestsOperation(GROUP_ID);

    expect(mockWhere).toHaveBeenCalledWith("groupId", "==", GROUP_ID);
    expect(requests.map((request) => request.requesterId)).toEqual([
      "user-b",
      "user-c",
    ]);
  });
});
