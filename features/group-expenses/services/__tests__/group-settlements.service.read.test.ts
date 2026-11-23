import { describe, expect, it } from "@jest/globals";

import {
  buildGroupSettlement,
  createDebtHarness,
} from "./group-settlements-service.harness";

describe("GroupSettlementsService.getGroupSettlements", () => {
  it("returns every row of the group, soft-deleted included, newest first", async () => {
    const { repository, service } = createDebtHarness();
    repository.seed(
      buildGroupSettlement({
        id: "b",
        date: "2026-11-09",
        createdAt: "2026-11-09T10:00:00.000Z",
      }),
    );
    repository.seed(
      buildGroupSettlement({
        id: "a",
        date: "2026-11-11",
        createdAt: "2026-11-11T10:00:00.000Z",
      }),
    );
    repository.seed(
      buildGroupSettlement({
        id: "c",
        date: "2026-11-11",
        createdAt: "2026-11-11T10:00:00.000Z",
        deletedAt: "2026-11-12T10:00:00.000Z",
      }),
    );

    const settlements = await service.getGroupSettlements("user-a", "user-a__group-1");

    expect(settlements.map((settlement) => settlement.id)).toEqual([
      "a",
      "c",
      "b",
    ]);
  });

  it("rejects a non-member, an unknown group and an anonymous viewer", async () => {
    const { service } = createDebtHarness();

    await expect(
      service.getGroupSettlements("user-z", "user-a__group-1"),
    ).rejects.toMatchObject({ code: "NOT_GROUP_MEMBER" });
    await expect(
      service.getGroupSettlements("user-a", "user-a__missing"),
    ).rejects.toMatchObject({ code: "GROUP_NOT_FOUND" });
    await expect(
      service.getGroupSettlements(" ", "user-a__group-1"),
    ).rejects.toMatchObject({ code: "SIGN_IN_REQUIRED" });
  });
});

describe("GroupSettlementsService.getGroupSettlement", () => {
  it("returns one settlement to a pair member", async () => {
    const { repository, service } = createDebtHarness();
    repository.seed(buildGroupSettlement());

    await expect(
      service.getGroupSettlement("user-c", "group-settlement-1"),
    ).resolves.toMatchObject({ id: "group-settlement-1" });
  });

  it("rejects a foreign viewer and a missing settlement", async () => {
    const { repository, service } = createDebtHarness();
    repository.seed(buildGroupSettlement());

    await expect(
      service.getGroupSettlement("user-a", "group-settlement-1"),
    ).rejects.toMatchObject({ code: "NOT_SETTLEMENT_PARTICIPANT" });
    await expect(
      service.getGroupSettlement("user-b", "missing"),
    ).rejects.toMatchObject({ code: "SETTLEMENT_NOT_FOUND" });
  });
});
