import { describe, it, expect } from "vitest";
import { Priority } from "../../value-objects/priority";
import type { WishlistItemOutput } from "../dtos/get-wishlist.dto";
import { projectPurchasedQuantity } from "./project-purchased-quantity";

const makeItem = (
  overrides: Partial<WishlistItemOutput> = {},
): WishlistItemOutput => ({
  id: "item-1",
  name: "Lego",
  priority: Priority.MEDIUM,
  totalQuantity: 4,
  reservedQuantity: 1,
  purchasedQuantity: 1,
  availableQuantity: 2,
  isUnlimited: false,
  ...overrides,
});

describe("projectPurchasedQuantity", () => {
  it("recomputes availability for the new purchased quantity", () => {
    const result = projectPurchasedQuantity(makeItem(), 2);
    expect(result.purchasedQuantity).toBe(2);
    expect(result.availableQuantity).toBe(1);
  });

  it("keeps every other field and does not mutate the input", () => {
    const item = makeItem({ description: "Edited by the owner" });
    const result = projectPurchasedQuantity(item, 0);
    expect(result).toEqual({
      ...item,
      purchasedQuantity: 0,
      availableQuantity: 3,
    });
    expect(item.purchasedQuantity).toBe(1);
  });

  it("never reports a negative purchased quantity", () => {
    expect(projectPurchasedQuantity(makeItem(), -1).purchasedQuantity).toBe(0);
  });

  it("never reports a negative availability", () => {
    expect(projectPurchasedQuantity(makeItem(), 9).availableQuantity).toBe(0);
  });
});
