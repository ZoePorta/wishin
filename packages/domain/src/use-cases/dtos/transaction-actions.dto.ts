/**
 * Input DTO for reserving an item.
 */
export interface ReserveItemInput {
  /**
   * UUID of the wishlist containing the item.
   */
  wishlistId: string;
  /**
   * UUID of the item to reserve.
   */
  itemId: string;
  /**
   * ID of the user performing the reservation.
   */
  userId: string;
  /**
   * Amount to reserve.
   */
  quantity: number;
}

/**
 * Input DTO for purchasing an item (Unified).
 */
export interface PurchaseItemInput {
  /**
   * UUID of the wishlist containing the item.
   */
  wishlistId: string;
  /**
   * UUID of the item to purchase.
   */
  itemId: string;
  /**
   * ID of the user performing the purchase.
   */
  userId: string;
  /**
   * Amount of units to purchase.
   */
  quantity: number;
}

/**
 * Input DTO for confirming a previous reservation as a purchase.
 */
export interface ConfirmPurchaseInput {
  /**
   * UUID of the transaction to confirm.
   */
  transactionId: string;
}

/**
 * Input DTO for cancelling a transaction (Reservation or Purchase).
 */
export interface CancelTransactionInput {
  /**
   * UUID of the transaction to cancel.
   */
  transactionId: string;
}

/**
 * Input DTO for undoing a purchase (Immediate deletion).
 */
export interface UndoPurchaseInput {
  /**
   * UUID of the wishlist.
   */
  wishlistId: string;
  /**
   * UUID of the transaction to undo.
   */
  transactionId: string;
  /**
   * ID of the user requesting the undo.
   */
  userId: string;
}
