import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the module.
import {
  mockAddDoc,
  mockGetDocs,
  mockUpdateDoc,
  setupProfileRepositoryMocks,
} from "./firebase-profile-repository.test-helpers";
import { FirebaseProfileRepository } from "../firebase-profile.repository";

beforeEach(setupProfileRepositoryMocks);

const existingDocument = {
  id: "doc-1",
  data: () => ({
    uid: "user-1",
    name: "Ada",
    email: "ada@example.com",
    preferredCurrency: "EUR",
  }),
};

const input = {
  uid: "user-1",
  email: "ada@example.com",
  displayName: "Ada Lovelace",
  preferredCurrency: "USD" as const,
};

describe("FirebaseProfileRepository", () => {
  it("reads the profile by uid without relying on the document id", async () => {
    mockGetDocs.mockResolvedValue({ docs: [existingDocument] });

    const profile = await new FirebaseProfileRepository().getProfile("user-1");

    expect(profile).toEqual({
      id: "doc-1",
      uid: "user-1",
      email: "ada@example.com",
      displayName: "Ada",
      preferredCurrency: "EUR",
    });
  });

  it("returns null when the account has no profile document", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await expect(
      new FirebaseProfileRepository().getProfile("user-1"),
    ).resolves.toBeNull();
  });

  it("updates the existing profile instead of creating a duplicate", async () => {
    mockGetDocs.mockResolvedValue({ docs: [existingDocument] });
    mockUpdateDoc.mockResolvedValue(undefined);

    const profile = await new FirebaseProfileRepository().saveProfile(input);

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { path: "users/doc-1" },
      expect.objectContaining({
        name: "Ada Lovelace",
        preferredCurrency: "USD",
        email: "ada@example.com",
        updatedAt: expect.any(String),
      }),
    );
    expect(mockAddDoc).not.toHaveBeenCalled();
    expect(profile).toMatchObject({
      id: "doc-1",
      displayName: "Ada Lovelace",
      preferredCurrency: "USD",
    });
  });

  it("does not overwrite the stored email when the auth email is missing", async () => {
    mockGetDocs.mockResolvedValue({ docs: [existingDocument] });
    mockUpdateDoc.mockResolvedValue(undefined);

    await new FirebaseProfileRepository().saveProfile({
      ...input,
      email: null,
    });

    expect(mockUpdateDoc.mock.calls[0]?.[1]).not.toHaveProperty("email");
  });

  it("creates a profile when the document is missing", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });
    mockAddDoc.mockResolvedValue({ id: "new-doc" });

    const profile = await new FirebaseProfileRepository().saveProfile(input);

    expect(mockAddDoc).toHaveBeenCalledWith(
      { path: "collection" },
      expect.objectContaining({
        uid: "user-1",
        name: "Ada Lovelace",
        email: "ada@example.com",
        preferredCurrency: "USD",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );
    expect(profile).toMatchObject({
      id: "new-doc",
      uid: "user-1",
      displayName: "Ada Lovelace",
      preferredCurrency: "USD",
    });
  });

  it("propagates read and write failures", async () => {
    const failure = new Error("offline");
    mockGetDocs.mockRejectedValue(failure);

    await expect(
      new FirebaseProfileRepository().getProfile("user-1"),
    ).rejects.toBe(failure);
    await expect(
      new FirebaseProfileRepository().saveProfile(input),
    ).rejects.toBe(failure);
  });
});
