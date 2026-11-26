import { describe, expect, it } from "@jest/globals";

import {
  getConflictResolutionOptions,
  planConflictResolution,
  readRemoteRevision,
} from "../sync.conflict-policy";
import { buildConflict, buildMutation } from "./sync.fixtures";

describe("readRemoteRevision", () => {
  it("reads the stored revision with a legacy default of 0", () => {
    expect(readRemoteRevision({ revision: 7 })).toBe(7);
    expect(readRemoteRevision({})).toBe(0);
  });
});

describe("getConflictResolutionOptions", () => {
  it("lets the user keep either side of a concurrent edit or delete", () => {
    expect(getConflictResolutionOptions("REMOTE_CHANGED")).toEqual([
      "keep-mine",
      "keep-remote",
    ]);
    expect(getConflictResolutionOptions("DELETED_REMOTELY")).toEqual([
      "keep-mine",
      "keep-remote",
    ]);
  });

  it("only allows discarding a wallet or payload problem", () => {
    expect(getConflictResolutionOptions("WALLET_UNAVAILABLE")).toEqual([
      "keep-remote",
    ]);
    expect(getConflictResolutionOptions("INSUFFICIENT_FUNDS")).toEqual([
      "keep-remote",
    ]);
    expect(getConflictResolutionOptions("INVALID")).toEqual(["keep-remote"]);
  });
});

describe("planConflictResolution", () => {
  it("keep-remote applies the remote snapshot over the local row", () => {
    const plan = planConflictResolution({
      conflict: buildConflict(),
      mutation: buildMutation(),
      choice: "keep-remote",
    });

    expect(plan).toEqual({
      ok: true,
      requeue: null,
      applyRemote: true,
      removeLocal: false,
      markLocalSynced: false,
    });
  });

  it("keep-remote deletes the local row when the remote document is gone", () => {
    const plan = planConflictResolution({
      conflict: buildConflict({
        kind: "DELETED_REMOTELY",
        remoteSnapshot: {},
      }),
      mutation: buildMutation(),
      choice: "keep-remote",
    });

    expect(plan).toMatchObject({ removeLocal: true, applyRemote: false });
  });

  it("keep-mine rebases a concurrent edit to the remote revision", () => {
    const plan = planConflictResolution({
      conflict: buildConflict(),
      mutation: buildMutation({ operation: "update" }),
      choice: "keep-mine",
    });

    expect(plan).toEqual({
      ok: true,
      requeue: {
        operation: "update",
        baseRevision: 4,
        serverSnapshot: { id: "tx-1", amount: 30, revision: 4 },
      },
      applyRemote: false,
      removeLocal: false,
      markLocalSynced: false,
    });
  });

  it("refuses to rebase without a remote snapshot", () => {
    const plan = planConflictResolution({
      conflict: buildConflict({ remoteSnapshot: {} }),
      mutation: buildMutation(),
      choice: "keep-mine",
    });

    expect(plan).toEqual({
      ok: false,
      errorCode: "SYNC_CONFLICT_MISSING_REMOTE",
    });
  });

  it("keep-mine re-creates an edit whose record was deleted remotely", () => {
    const plan = planConflictResolution({
      conflict: buildConflict({ kind: "DELETED_REMOTELY", remoteSnapshot: {} }),
      mutation: buildMutation({ operation: "update" }),
      choice: "keep-mine",
    });

    expect(plan).toMatchObject({
      ok: true,
      requeue: { operation: "create", baseRevision: 0, serverSnapshot: {} },
      markLocalSynced: false,
    });
  });

  it("keep-mine on a queued delete accepts the remote delete", () => {
    const plan = planConflictResolution({
      conflict: buildConflict({ kind: "DELETED_REMOTELY", remoteSnapshot: {} }),
      mutation: buildMutation({ operation: "delete" }),
      choice: "keep-mine",
    });

    expect(plan).toMatchObject({
      ok: true,
      requeue: null,
      markLocalSynced: true,
    });
  });

  it("rejects keep-mine for a conflict that needs an edit", () => {
    expect(
      planConflictResolution({
        conflict: buildConflict({ kind: "INSUFFICIENT_FUNDS" }),
        mutation: buildMutation(),
        choice: "keep-mine",
      }),
    ).toEqual({ ok: false, errorCode: "SYNC_RESOLUTION_UNSUPPORTED" });
  });
});
