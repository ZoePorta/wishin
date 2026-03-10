import {
  WishlistNotFoundError,
  TransactionNotFoundError,
  InvalidOperationError,
} from "../errors/domain-errors";
import { TransactionStatus } from "../value-objects/transaction-status";
import type { WishlistRepository } from "../repositories/wishlist.repository";
import type { TransactionRepository } from "../repositories/transaction.repository";
import type { Logger } from "../common/logger";
import type { ObservabilityService } from "../common/observability";
import type { UndoPurchaseInput } from "./dtos/transaction-actions.dto";
import type { Wishlist } from "../aggregates/wishlist";

/**
 * Use case for undoing a purchase (Immediate deletion).
 *
 * This coordinates:
 * 1. Fetching the transaction to be undone.
 * 2. Validating ownership and status.
 * 3. Fetching the wishlist.
 * 4. Reverting the wishlist item's purchased quantity.
 * 5. Physically deleting the transaction record (ADR 009).
 *
 * @throws {TransactionNotFoundError} If the transaction is not found.
 * @throws {WishlistNotFoundError} If the wishlist is not found.
 * @throws {InvalidOperationError} If the user is unauthorized or transaction status is invalid.
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

    const wishlist = await this.wishlistRepository.findById(wishlistId);
    if (!wishlist) throw new WishlistNotFoundError(wishlistId);

    const itemId = transaction.itemId;
    if (!itemId) {
      throw new InvalidOperationError(
        "Transaction does not have an associated item",
      );
    }

    // 1. Revert Wishlist stock
    const updatedWishlist = wishlist.cancelItemPurchase(
      itemId,
      transaction.quantity,
    );

    // 2. Persist updated Wishlist
    await this.wishlistRepository.save(updatedWishlist);

    const rollbackPlan = {
      wishlist: wishlist, // Original state
      transaction: transaction,
    };

    try {
      // 3. Delete Transaction (Hard Delete per ADR 009)
      await this.transactionRepository.delete(transactionId);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        "Undo failed during transaction deletion. Attempting rollback.",
        {
          wishlistId,
          transactionId,
          error: errorMessage,
        },
      );

      this.observability.addBreadcrumb(
        "Undo failed during transaction deletion",
        "transaction",
        {
          wishlistId,
          transactionId,
          error: errorMessage,
        },
      );

      await this.rollback(rollbackPlan);
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

  private async rollback(plan: {
    wishlist: Wishlist;
    transaction: { itemId: string | null; quantity: number };
  }): Promise<void> {
    try {
      const fresh = await this.wishlistRepository.findById(plan.wishlist.id);
      if (
        fresh?.version === plan.wishlist.version + 1 &&
        plan.transaction.itemId
      ) {
        const rolledBackWishlist = fresh.purchaseItem(
          plan.transaction.itemId,
          plan.transaction.quantity,
          0, // Direct purchase restore
        );
        await this.wishlistRepository.save(rolledBackWishlist);
      } else {
        this.logger.warn(
          "Undo rollback skipped: Wishlist version mismatch or missing itemId.",
          {
            wishlistId: plan.wishlist.id,
          },
        );
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      this.logger.error("CRITICAL: Undo rollback failed", {
        wishlistId: plan.wishlist.id,
        error: errorMessage,
      });
    }
  }
}
