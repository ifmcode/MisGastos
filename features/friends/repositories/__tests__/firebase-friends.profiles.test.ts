import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the modules.
import {
  documentSnapshot,
  missingSnapshot,
  mockGetDoc,
  mockGetDocs,
  mockLimit,
  mockSetDoc,
  mockUpdateDoc,
  mockWhere,
  querySnapshot,
  setupFriendsRepositoryMocks,
} from "./friends-repository.test-helpers";
import { FirebaseFriendsRepository } from "../firebase-friends.repository";

beforeEach(setupFriendsRepositoryMocks);

const profileData = {
  uid: "user-1",
  displayName: "Ada",
  email: "ada@example.com",
  createdAt: "2026-11-14T10:00:00.000Z",
  updatedAt: "2026-11-14T10:00:00.000Z",
};

describe("FirebaseFriendsRepository public profiles", () => {
  it("reads a profile by uid", async () => {
    mockGetDoc.mockResolvedValue(
      documentSnapshot("user-1", profileData),
    );

    const profile = await new FirebaseFriendsRepository().getPublicProfile(
      "user-1",
    );

    expect(profile).toEqual(profileData);
  });

  it("returns null when the profile does not exist", async () => {
    mockGetDoc.mockResolvedValue(missingSnapshot());

    await expect(
      new FirebaseFriendsRepository().getPublicProfile("user-1"),
    ).resolves.toBeNull();
  });

  it("searches by exact normalized email with limit 1", async () => {
    mockGetDocs.mockResolvedValue(
      querySnapshot([
        { id: "user-1", data: () => profileData },
        { id: "user-2", data: () => profileData },
      ]),
    );

    const profile = await new FirebaseFriendsRepository().findPublicProfileByEmail(
      "ada@example.com",
    );

    expect(mockWhere).toHaveBeenCalledWith("email", "==", "ada@example.com");
    expect(mockLimit).toHaveBeenCalledWith(1);
    expect(profile).toEqual(profileData);
  });

  it("returns null when no profile matches the email", async () => {
    mockGetDocs.mockResolvedValue(querySnapshot([]));

    await expect(
      new FirebaseFriendsRepository().findPublicProfileByEmail(
        "nobody@example.com",
      ),
    ).resolves.toBeNull();
  });

  it("resolves several profiles and skips unknown uids", async () => {
    mockGetDoc
      .mockResolvedValueOnce(documentSnapshot("user-1", profileData))
      .mockResolvedValueOnce(missingSnapshot());

    const profiles = await new FirebaseFriendsRepository().getPublicProfiles([
      "user-1",
      "user-2",
    ]);

    expect(profiles).toEqual([profileData]);
  });

  it("creates the profile when the document is missing", async () => {
    mockGetDoc.mockResolvedValue(missingSnapshot());
    mockSetDoc.mockResolvedValue(undefined);

    const profile = await new FirebaseFriendsRepository().ensurePublicProfile({
      uid: "user-1",
      displayName: "Ada",
      email: "ada@example.com",
    });

    expect(mockSetDoc).toHaveBeenCalledWith(
      { path: "publicProfiles/user-1" },
      {
        uid: "user-1",
        displayName: "Ada",
        email: "ada@example.com",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    );
    expect(mockUpdateDoc).not.toHaveBeenCalled();
    expect(profile).toMatchObject({ uid: "user-1", displayName: "Ada" });
  });

  it("refreshes an existing profile without recreating it", async () => {
    mockGetDoc.mockResolvedValue(
      documentSnapshot("user-1", profileData),
    );
    mockUpdateDoc.mockResolvedValue(undefined);

    const profile = await new FirebaseFriendsRepository().ensurePublicProfile({
      uid: "user-1",
      displayName: null,
      email: "ada@example.com",
    });

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { path: "publicProfiles/user-1" },
      {
        displayName: null,
        email: "ada@example.com",
        updatedAt: expect.any(String),
      },
    );
    expect(mockSetDoc).not.toHaveBeenCalled();
    expect(profile).toMatchObject({
      uid: "user-1",
      email: "ada@example.com",
      createdAt: "2026-11-14T10:00:00.000Z",
    });
  });

  it("propagates Firestore failures", async () => {
    const failure = new Error("offline");
    mockGetDoc.mockRejectedValue(failure);

    await expect(
      new FirebaseFriendsRepository().getPublicProfile("user-1"),
    ).rejects.toBe(failure);
  });
});
