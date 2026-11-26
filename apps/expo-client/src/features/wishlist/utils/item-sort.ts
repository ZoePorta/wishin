import type { WishlistItemOutput } from "@wishin/domain";

/**
 * Criteria available to order wishlist items in list views.
 * - `priority`: most urgent first.
 * - `date`: most recently added first.
 * - `price`: cheapest first; items without a price go last.
 */
export type ItemSortOption = "priority" | "date" | "price";

/** Display order of the sort options in the selector. */
export const ITEM_SORT_OPTIONS: readonly ItemSortOption[] = [
  "priority",
  "date",
  "price",
] as const;

/** Sort applied when a list is first shown. */
export const DEFAULT_ITEM_SORT: ItemSortOption = "priority";

/**
 * Returns a new array with the items ordered by the given criterion.
 *
 * Items carry no creation timestamp; the input is assumed to be in
 * chronological order (as returned by Appwrite), so the array index is used
 * as the "date" and as the tie-breaker (newest first) for the other criteria.
 *
 * @param {WishlistItemOutput[]} items - Items in chronological (oldest-first) order.
 * @param {ItemSortOption} sortBy - The criterion to order by.
 * @returns {WishlistItemOutput[]} A new, sorted array. The input is not mutated.
 */
export const sortItems = (
  items: readonly WishlistItemOutput[],
  sortBy: ItemSortOption,
): WishlistItemOutput[] => {
  const indexed = items.map((item, index) => ({ item, index }));

  const compareRecency = (a: { index: number }, b: { index: number }) =>
    b.index - a.index;

  indexed.sort((a, b) => {
    switch (sortBy) {
      case "priority":
        return b.item.priority - a.item.priority || compareRecency(a, b);
      case "price": {
        const pa = a.item.price ?? Number.POSITIVE_INFINITY;
        const pb = b.item.price ?? Number.POSITIVE_INFINITY;
        if (pa !== pb) return pa < pb ? -1 : 1;
        return compareRecency(a, b);
      }
      case "date":
      default:
        return compareRecency(a, b);
    }
  });

  return indexed.map(({ item }) => item);
};
