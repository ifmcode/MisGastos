import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firebase mocks are registered before the auth helpers.
import { mockSignOut, setupAuthMocks } from "./auth.test-helpers";
import { logout } from "../auth";

beforeEach(setupAuthMocks);

describe("logout", () => {
  it("should call signOut", () => {
    logout();

    expect(mockSignOut).toHaveBeenCalledWith({ currentUser: null });
  });
});
