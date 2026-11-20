import { describe, it, expect } from "vitest";
import { Priority, type WishlistItemOutput } from "@wishin/domain";
import { DEFAULT_ITEM_SORT, ITEM_SORT_OPTIONS, sortItems } from "./item-sort";

/**
 * Builds a minimal item output for sorting tests.
 *
 * @param {string} id - Item id (also used as the name).
 * @param {Partial<WishlistItemOutput>} overrides - Fields to override.
 * @returns {WishlistItemOutput} The test item.
 */
const item = (
  id: string,
  overrides: Partial<WishlistItemOutput> = {},
): WishlistItemOutput => ({
  id,
  name: id,
  priority: Priority.MEDIUM,
  totalQuantity: 1,
  reservedQuantity: 0,
  purchasedQuantity: 0,
  availableQuantity: 1,
  isUnlimited: false,
  ...overrides,
});

const ids = (items: WishlistItemOutput[]) => items.map((i) => i.id);

describe("item-sort", () => {
  it("defaults to priority", () => {
    expect(DEFAULT_ITEM_SORT).toBe("priority");
    expect(ITEM_SORT_OPTIONS).toEqual(["priority", "date", "price"]);
  });

  it("does not mutate the input array", () => {
    const input = [item("a"), item("b")];
    const copy = [...input];
    sortItems(input, "date");
    expect(input).toEqual(copy);
  });

  describe("date", () => {
    it("puts the most recently added item first (input is chronological)", () => {
      expect(ids(sortItems([item("a"), item("b"), item("c")], "date"))).toEqual(
        ["c", "b", "a"],
      );
    });
  });

  describe("priority", () => {
    it("puts the most urgent items first", () => {
      const result = sortItems(
        [
          item("low", { priority: Priority.LOW }),
          item("urgent", { priority: Priority.URGENT }),
          item("medium", { priority: Priority.MEDIUM }),
          item("high", { priority: Priority.HIGH }),
        ],
        "priority",
      );
      expect(ids(result)).toEqual(["urgent", "high", "medium", "low"]);
    });

    it("breaks ties by most recent first", () => {
      const result = sortItems(
        [
          item("old", { priority: Priority.HIGH }),
          item("low", { priority: Priority.LOW }),
          item("new", { priority: Priority.HIGH }),
        ],
        "priority",
      );
      expect(ids(result)).toEqual(["new", "old", "low"]);
    });
  });

  describe("price", () => {
    it("sorts cheapest first and puts items without price last", () => {
      const result = sortItems(
        [
          item("none1"),
          item("expensive", { price: 100 }),
          item("free", { price: 0 }),
          item("cheap", { price: 10 }),
          item("none2"),
        ],
        "price",
      );
      expect(ids(result)).toEqual([
        "free",
        "cheap",
        "expensive",
        "none2",
        "none1",
      ]);
    });

    it("breaks price ties by most recent first", () => {
      const result = sortItems(
        [item("old", { price: 5 }), item("new", { price: 5 })],
        "price",
      );
      expect(ids(result)).toEqual(["new", "old"]);
    });
  });
});
