/**
 * Computes how many units of an item can still be reserved or purchased.
 *
 * Business invariant: availability is never negative, even for over-committed items.
 *
 * @param {number} totalQuantity - Units requested by the owner.
 * @param {number} reservedQuantity - Units currently reserved.
 * @param {number} purchasedQuantity - Units already purchased.
 * @returns {number} The available units (0 or more).
 */
export function computeAvailableQuantity(
  totalQuantity: number,
  reservedQuantity: number,
  purchasedQuantity: number,
): number {
  return Math.max(0, totalQuantity - (reservedQuantity + purchasedQuantity));
}
