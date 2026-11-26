import { computeAvailableQuantity } from "../../common/availability";
import type { WishlistItemOutput } from "../dtos/get-wishlist.dto";

/**
 * Projects an item as it will look once its purchased quantity changes, e.g. while
 * the asynchronous stats update is still in flight (ADR 032).
 *
 * This is a read-side projection: it performs no stock validation, which belongs to
 * the purchase/undo use cases.
 *
 * @param {WishlistItemOutput} item - The item as last read from the repository.
 * @param {number} purchasedQuantity - The expected purchased quantity (clamped to 0).
 * @returns {WishlistItemOutput} A copy with the purchased and available quantities updated.
 */
export function projectPurchasedQuantity(
  item: WishlistItemOutput,
  purchasedQuantity: number,
): WishlistItemOutput {
  const purchased = Math.max(0, purchasedQuantity);
  return {
    ...item,
    purchasedQuantity: purchased,
    availableQuantity: computeAvailableQuantity(
      item.totalQuantity,
      item.reservedQuantity,
      purchased,
    ),
  };
}
