import { Category } from "../types/category.types";

export type CategoryMoveDirection = "up" | "down";

export interface CategoryOrderUpdate {
  id: string;
  sortOrder: number;
}

export interface CategoryMoveResult {
  /** Full collection in its new canonical order. */
  categories: Category[];
  /** Documents whose `sortOrder` must be persisted. */
  changed: CategoryOrderUpdate[];
}

function getExplicitOrder(category: Category): number | null {
  const order = category.sortOrder;
  return typeof order === "number" && Number.isFinite(order) ? order : null;
}

function compareLegacy(first: Category, second: Category): number {
  const createdComparison =
    new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime();

  if (createdComparison !== 0) return createdComparison;
  return first.name.localeCompare(second.name);
}

/**
 * Canonical category order: explicit `sortOrder` first, then the legacy
 * `createdAt`/`name` fallback so documents without an explicit order keep
 * their previous position until the owner reorders the list.
 */
export function compareCategories(first: Category, second: Category): number {
  const firstOrder = getExplicitOrder(first);
  const secondOrder = getExplicitOrder(second);

  if (firstOrder !== null && secondOrder !== null) {
    if (firstOrder !== secondOrder) return firstOrder - secondOrder;
    return compareLegacy(first, second);
  }

  if (firstOrder !== null) return -1;
  if (secondOrder !== null) return 1;

  return compareLegacy(first, second);
}

/** Order used when a new category is created so it appends at the end. */
export function getNextSortOrder(categories: readonly Category[]): number {
  const highest = categories.reduce((current, category, index) => {
    const order = getExplicitOrder(category) ?? index;
    return Math.max(current, order);
  }, -1);

  return highest + 1;
}

/**
 * Rewrites `sortOrder` as the array index and reports only the documents that
 * actually change. Legacy categories receive their first explicit order here.
 */
export function renumberCategories(
  categories: readonly Category[],
): CategoryMoveResult {
  const ordered = categories.map((category, index) => ({
    ...category,
    sortOrder: index,
  }));

  const changed = ordered.reduce<CategoryOrderUpdate[]>(
    (updates, category, index) => {
      if (categories[index]?.sortOrder !== category.sortOrder) {
        updates.push({ id: category.id, sortOrder: category.sortOrder });
      }
      return updates;
    },
    [],
  );

  return { categories: ordered, changed };
}

/**
 * Builds the canonical order from a requested id sequence. Unknown and
 * duplicated ids are ignored and categories missing from the sequence keep
 * their current order at the end, so a reorder can never lose one.
 */
export function applyCategoryOrder(
  categories: readonly Category[],
  orderedIds: readonly string[],
): CategoryMoveResult {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const requested: Category[] = [];
  const requestedIds = new Set<string>();

  for (const rawId of orderedIds) {
    const id = rawId.trim();
    if (id.length === 0 || requestedIds.has(id)) continue;

    const category = byId.get(id);
    if (!category) continue;

    requestedIds.add(id);
    requested.push(category);
  }

  const remaining = categories.filter(
    (category) => !requestedIds.has(category.id),
  );

  return renumberCategories([...requested, ...remaining]);
}

/**
 * Moves a category one step inside the visible list. Only the visible
 * neighbours swap, so categories hidden by the current filter keep their
 * relative position.
 */
export function moveCategory(
  categories: readonly Category[],
  categoryId: string,
  direction: CategoryMoveDirection,
  visibleIds: readonly string[],
): CategoryMoveResult | null {
  const visible = visibleIds.filter((id) =>
    categories.some((category) => category.id === id),
  );
  const visibleIndex = visible.indexOf(categoryId);
  if (visibleIndex < 0) return null;

  const targetId = visible[visibleIndex + (direction === "up" ? -1 : 1)];
  if (!targetId) return null;

  const sourceIndex = categories.findIndex(
    (category) => category.id === categoryId,
  );
  const targetIndex = categories.findIndex(
    (category) => category.id === targetId,
  );
  if (sourceIndex < 0 || targetIndex < 0) return null;

  const next = [...categories];
  next[sourceIndex] = categories[targetIndex];
  next[targetIndex] = categories[sourceIndex];

  return renumberCategories(next);
}
