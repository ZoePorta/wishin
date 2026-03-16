import {
  TransactionNotFoundError,
  InvalidOperationError,
} from "../errors/domain-errors";
import { TransactionStatus } from "../value-objects/transaction-status";
import type { WishlistRepository } from "../repositories/wishlist.repository";
import type { TransactionRepository } from "../repositories/transaction.repository";
import type { Logger } from "../common/logger";
import type { ObservabilityService } from "../common/observability";
import type { UndoPurchaseInput } from "./dtos/transaction-actions.dto";

/**
 * Use case for undoing a purchase (Immediate deletion).
 *
 * This coordinates:
 * 1. Fetching the transaction to be undone.
 * 2. Validating ownership and status.
 * 3. Fetching the wishlist.
 * 4. Physically deleting the transaction record (ADR 009).
 *
 * NOTE: Item statistics updates (reverting purchasedQuantity) are handled
 * automatically by Appwrite functions triggered by transaction deletion.
 */
export class UndoPurchaseUseCase {
  constructor(
    private readonly wishlistRepository: WishlistRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly logger: Logger,
    private readonly observability: ObservabilityService,
  ) {}

  /**
   * Performs the undo purchase flow.
   *
   * @param {UndoPurchaseInput} input - The payload containing wishlistId, transactionId, and userId.
   * @returns {Promise<void>}
   * @throws {TransactionNotFoundError} If the transaction is not found.
   * @throws {InvalidOperationError} If the user is unauthorized or transaction status is invalid.
   */
  async execute(input: UndoPurchaseInput): Promise<void> {
    const { wishlistId, transactionId, userId } = input;

    const transaction =
      await this.transactionRepository.findById(transactionId);
    if (!transaction) throw new TransactionNotFoundError(transactionId);

    if (transaction.userId !== userId) {
      throw new InvalidOperationError(
        "Unauthorized: Only the purchaser can undo the purchase",
      );
    }

    if (transaction.status !== TransactionStatus.PURCHASED) {
      throw new InvalidOperationError(
        `Cannot undo a transaction in ${transaction.status} status`,
      );
    }

    const itemId = transaction.itemId;
    if (!itemId) {
      throw new InvalidOperationError(
        "Transaction does not have an associated item",
      );
    }

    /**
     * NOTE: We NO LONGER persist the wishlist status here.
     * Deleting the transaction will trigger an Appwrite function that
     * correctly reverts the purchasedQuantity in the item table.
     */

    try {
      // Delete Transaction (Hard Delete per ADR 009)
      // This deletion triggers the sync-item-stats Appwrite function.
      await this.transactionRepository.delete(transactionId);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error("Undo failed during transaction deletion.", {
        wishlistId,
        transactionId,
        error: errorMessage,
      });

      this.observability.addBreadcrumb(
        "Undo failed during transaction deletion",
        "transaction",
        {
          wishlistId,
          transactionId,
          error: errorMessage,
        },
      );

      throw error;
    }

    this.observability.addBreadcrumb(
      "Purchase undo successful",
      "transaction",
      {
        wishlistId,
        transactionId,
        userId,
      },
    );

    this.observability.trackEvent("purchase_undone", {
      wishlistId,
      transactionId,
      userId,
    });
  }
}
