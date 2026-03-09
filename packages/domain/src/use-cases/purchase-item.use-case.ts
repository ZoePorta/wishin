import {
  WishlistNotFoundError,
  InvalidOperationError,
} from "../errors/domain-errors";
import { Wishlist } from "../aggregates/wishlist";
import { Transaction } from "../aggregates/transaction";
import { WishlistOutputMapper } from "./mappers/wishlist-output.mapper";
import type { WishlistRepository } from "../repositories/wishlist.repository";
import type { ProfileRepository } from "../repositories/profile.repository";
import type { TransactionRepository } from "../repositories/transaction.repository";
import type { Logger } from "../common/logger";
import type { PurchaseItemInput } from "./dtos/transaction-actions.dto";
import type { WishlistOutput } from "./dtos/get-wishlist.dto";

/**
 * Use case for purchasing an item from a wishlist.
 *
 * This coordinates:
 * 1. Fetching the wishlist.
 * 2. Updating the wishlist item's purchased quantity.
 * 3. Recording a purchase transaction.
 *
 * NOTE: Advanced reservation promotion and "Smart Consumption" (ADR 024)
 * are deferred per ADR 025. This use-case only handles direct purchases.
 *
 * FIXME: Sequential saves below break atomicity (ADR 023).
 * Mitigation: Multi-stage compensating rollback.
 *
 * @throws {WishlistNotFoundError} If the wishlist is not found.
 * @throws {InvalidOperationError} If the item is missing.
 * @throws {InsufficientStockError} If the requested quantity exceeds available stock.
 * @throws {Error} For unexpected failures.
 */
export class PurchaseItemUseCase {
  constructor(
    private readonly wishlistRepository: WishlistRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly logger: Logger,
    private readonly uuidFn: () => string = () =>
      globalThis.crypto.randomUUID(),
  ) {}

  /**
   * Performs the purchase flow for an item and updates the wishlist.
   *
   * Coordinates wishlist update with transaction synchronization, including
   * smart consumption of existing user reservations.
   *
   * @param {PurchaseItemInput} input - Required fields for the purchase (wishlistId, itemId, userId, quantity).
   * @returns {Promise<WishlistOutput>} Resolved wishlist data after purchase.
   * @throws {WishlistNotFoundError} If wishlist ID is invalid.
   * @throws {InvalidOperationError} If item or quantity is invalid.
   * @throws {RepositoryError} If persistence fails.
   */
  async execute(input: PurchaseItemInput): Promise<WishlistOutput> {
    const wishlist = await this.wishlistRepository.findById(input.wishlistId);
    if (!wishlist) throw new WishlistNotFoundError(input.wishlistId);

    const ownerProfile = await this.profileRepository.findById(
      wishlist.ownerId,
    );
    const ownerUsername = ownerProfile?.username ?? "Unknown User";

    const item = wishlist.items.find((i) => i.id === input.itemId);
    if (!item) {
      throw new InvalidOperationError(
        `Item ${input.itemId} not found in wishlist`,
      );
    }

    // 1. Update Wishlist (Direct Purchase only for MVP - ADR 025)
    // We pass 0 to consumeFromReserved as reservations are deferred.
    const updatedWishlist = wishlist.purchaseItem(
      input.itemId,
      input.quantity,
      0,
    );

    // 2. Prepare Transaction (Always a new purchase)
    const transaction = Transaction.createPurchase({
      id: this.uuidFn(),
      itemId: input.itemId,
      userId: input.userId,
      quantity: input.quantity,
      itemName: item.name,
      itemPrice: item.price ?? null,
      itemCurrency: item.currency ?? null,
      itemDescription: item.description ?? null,
      ownerUsername,
    });

    // 3. Persistence (Sequential saves for MVP)
    await this.wishlistRepository.save(updatedWishlist);

    const rollbackPlan = {
      wishlist: wishlist, // Original state (version check will use this)
      pendingTransactions: [] as Transaction[],
    };

    try {
      await this.transactionRepository.save(transaction);
      rollbackPlan.pendingTransactions.push(transaction);
    } catch (error: unknown) {
      this.logger.error(
        "Purchase failed during transaction save. Attempting rollback.",
        {
          wishlistId: wishlist.id,
          itemId: input.itemId,
          error: error instanceof Error ? error.message : String(error),
        },
      );
      await this.rollback(rollbackPlan, input);
      throw error;
    }

    return WishlistOutputMapper.toDTO(updatedWishlist);
  }

  private async rollback(
    plan: { wishlist: Wishlist; pendingTransactions: Transaction[] },
    input: PurchaseItemInput,
  ): Promise<void> {
    try {
      // 1. Revert Wishlist (optimistic re-fetch)
      try {
        const fresh = await this.wishlistRepository.findById(plan.wishlist.id);
        if (fresh) {
          // Optimistic version check: ensure it's exactly one version ahead (ours)
          if (fresh.version === plan.wishlist.version + 1) {
            const rolledBackWishlist = fresh.cancelItemPurchase(
              input.itemId,
              input.quantity,
            );
            await this.wishlistRepository.save(rolledBackWishlist);
          } else {
            this.logger.warn(
              "Rollback skipped: Wishlist version mismatch (concurrent change detected).",
              {
                wishlistId: plan.wishlist.id,
                itemId: input.itemId,
                originalVersion: plan.wishlist.version,
                freshVersion: fresh.version,
              },
            );
          }
        }
      } catch (wishlistError) {
        this.logger.error("Failed to revert wishlist during rollback", {
          wishlistId: plan.wishlist.id,
          error: wishlistError,
        });
      }

      // 2. Revert Transactions
      for (const tx of plan.pendingTransactions) {
        try {
          await this.transactionRepository.delete(tx.id);
        } catch (txError) {
          this.logger.error("Failed to delete transaction during rollback", {
            transactionId: tx.id,
            error: txError,
          });
        }
      }

      this.logger.info("Compensating rollback finished.", {
        wishlistId: plan.wishlist.id,
      });
    } catch (e: unknown) {
      this.logger.error("CRITICAL: Rollback failed", {
        wishlistId: plan.wishlist.id,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
}
