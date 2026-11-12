import { describe, expect, it } from "@jest/globals";

import { CategoryValidationError } from "../category.errors";
import {
  buildCategory,
  createService,
  captureError,
} from "./category-service.fixtures";

describe("CategoryService.reorderCategories", () => {
  it("persists the requested order", async () => {
    const { repository, service } = createService();
    repository.categories = [
      buildCategory({ id: "a", sortOrder: 0 }),
      buildCategory({ id: "b", sortOrder: 1 }),
      buildCategory({ id: "c", sortOrder: 2 }),
    ];

    await service.reorderCategories("user-1", ["c", "a", "b"]);

    expect(repository.orderCalls).toHaveLength(1);
    expect(repository.orderCalls[0]).toEqual({
      ownerId: "user-1",
      updates: [
        { id: "c", sortOrder: 0 },
        { id: "a", sortOrder: 1 },
        { id: "b", sortOrder: 2 },
      ],
    });
  });

  it("normalizes legacy categories to explicit positions on the first move", async () => {
    const { repository, service } = createService();
    repository.categories = [
      buildCategory({
        id: "a",
        createdAt: "2026-10-30T09:00:00.000Z",
      }),
      buildCategory({
        id: "b",
        createdAt: "2026-10-30T10:00:00.000Z",
      }),
    ];

    await service.reorderCategories("user-1", ["b", "a"]);

    expect(repository.orderCalls[0]?.updates).toEqual([
      { id: "b", sortOrder: 0 },
      { id: "a", sortOrder: 1 },
    ]);
  });

  it("ignores unknown and duplicated ids and appends missing categories", async () => {
    const { repository, service } = createService();
    repository.categories = [
      buildCategory({ id: "a", sortOrder: 0 }),
      buildCategory({ id: "b", sortOrder: 1 }),
      buildCategory({ id: "c", sortOrder: 2 }),
    ];

    await service.reorderCategories("user-1", ["c", "c", " ", "missing", "a"]);

    expect(repository.orderCalls[0]?.updates).toEqual([
      { id: "c", sortOrder: 0 },
      { id: "a", sortOrder: 1 },
      { id: "b", sortOrder: 2 },
    ]);
  });

  it("skips the write when the order did not change", async () => {
    const { repository, service } = createService();
    repository.categories = [
      buildCategory({ id: "a", sortOrder: 0 }),
      buildCategory({ id: "b", sortOrder: 1 }),
    ];

    await service.reorderCategories("user-1", ["a", "b"]);

    expect(repository.orderCalls).toHaveLength(0);
  });

  it("does nothing for an owner without categories", async () => {
    const { repository, service } = createService();

    await service.reorderCategories("user-1", ["a"]);

    expect(repository.orderCalls).toHaveLength(0);
  });

  it("rejects an empty owner", async () => {
    const { repository, service } = createService();

    const error = await captureError(service.reorderCategories(" ", ["a"]));

    expect(error).toBeInstanceOf(CategoryValidationError);
    expect(repository.orderCalls).toHaveLength(0);
  });
});
