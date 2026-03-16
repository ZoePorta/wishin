import {
  WishlistNotFoundError,
  InvalidOperationError,
} from "../errors/domain-errors";
import { Transaction } from "../aggregates/transaction";
import { WishlistOutputMapper } from "./mappers/wishlist-output.mapper";
import type { WishlistRepository } from "../repositories/wishlist.repository";
import type { ProfileRepository } from "../repositories/profile.repository";
import type { TransactionRepository } from "../repositories/transaction.repository";
import type { Logger } from "../common/logger";
import type { ObservabilityService } from "../common/observability";
import type { PurchaseItemInput } from "./dtos/transaction-actions.dto";
import type { WishlistOutput } from "./dtos/get-wishlist.dto";

/**
 * Use case for purchasing an item from a wishlist.
 *
 * This coordinates:
 * 1. Fetching the wishlist.
 * 2. Performing domain validation for the purchase.
 * 3. Recording a purchase transaction.
 *
 * NOTE: Item statistics updates (purchasedQuantity) are handled automatically
 * by Appwrite functions triggered by transaction creation/deletion.
 *
 * @throws {WishlistNotFoundError} If the wishlist is not found.
 * @throws {InvalidOperationError} If the item is missing.
 * @throws {InsufficientStockError} If the requested quantity exceeds available stock.
 * @throws {Error} For unexpected failures.
 */
export class PurchaseItemUseCase {
  /**
   * @param {WishlistRepository} wishlistRepository - Repository for wishlist retrieval.
   * @param {ProfileRepository} profileRepository - Repository for user profile data.
   * @param {TransactionRepository} transactionRepository - Repository for recording purchase transactions.
   * @param {Logger} logger - Logger for technical/operational logs.
   * @param {ObservabilityService} observability - Service for breadcrumbs and telemetry events.
   * @param {() => string} [uuidFn] - Optional function to generate UUIDs (defaults to crypto.randomUUID).
   */
  constructor(
    private readonly wishlistRepository: WishlistRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly logger: Logger,
    private readonly observability: ObservabilityService,
    private readonly uuidFn: () => string = () =>
      globalThis.crypto.randomUUID(),
  ) {}

  /**
   * Performs a direct purchase flow for an item.
   *
   * This method coordinates:
   * 1. Fetching the wishlist and owner profile.
   * 2. Performing domain validation for the purchase.
   * 3. Recording a new purchase transaction.
   *
   * @param {PurchaseItemInput} input - The payload containing wishlistId, itemId, userId, and quantity.
   * @returns {Promise<WishlistOutput>} A promise that resolves to the updated wishlist data (optimistic DTO).
   * @throws {WishlistNotFoundError} If the wishlist is not found.
   * @throws {InvalidOperationError} If the item is missing or quantity is invalid.
   * @throws {Error} If persistence or other operations fail.
   */
  async execute(input: PurchaseItemInput): Promise<WishlistOutput> {
    const { wishlistId, itemId, userId, quantity } = input;

    const wishlist = await this.wishlistRepository.findById(wishlistId);
    if (!wishlist) throw new WishlistNotFoundError(wishlistId);

    const ownerProfile = await this.profileRepository.findById(
      wishlist.ownerId,
    );
    const ownerUsername = ownerProfile?.username ?? "Unknown User";

    const item = wishlist.items.find((i) => i.id === itemId);
    if (!item) {
      throw new InvalidOperationError(`Item ${itemId} not found in wishlist`);
    }

    // 1. Domain Validation and Optimistic State (ADR 025)
    // We update the domain object to validate logic and return the updated state,
    // but we NO LONGER persist the wishlist here. Appwrite functions will handle it.
    const updatedWishlist = wishlist.purchaseItem(itemId, quantity, 0);

    // 2. Prepare Transaction
    const transaction = Transaction.createPurchase({
      id: this.uuidFn(),
      itemId: itemId,
      userId: userId,
      quantity: quantity,
      itemName: item.name,
      itemPrice: item.price ?? null,
      itemCurrency: item.currency ?? null,
      itemDescription: item.description ?? null,
      ownerUsername,
    });

    // 3. Persistence (Transaction save triggers item stats update via Appwrite Function)
    try {
      await this.transactionRepository.save(transaction);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        "Purchase failed during transaction save. Attempting rollback.",
        {
          wishlistId: wishlist.id,
          itemId: itemId,
          error: errorMessage,
        },
      );

      this.observability.addBreadcrumb(
        "Purchase failed during transaction save",
        "transaction",
        {
          wishlistId: wishlist.id,
          itemId: itemId,
          itemQuantity: quantity,
          error: errorMessage,
        },
      );

      this.observability.trackEvent("purchase_failed", {
        wishlistId: wishlist.id,
        itemId: itemId,
        reason: "transaction_save_failure",
      });

      await this.rollback(transaction.id, input);
      throw error;
    }

    // Success telemetry signal
    this.observability.addBreadcrumb(
      "Purchase completion successful",
      "transaction",
      {
        wishlistId: updatedWishlist.id,
        userId: userId,
        itemId: itemId,
      },
    );
    this.observability.trackEvent("purchase_completed", {
      wishlistId: updatedWishlist.id,
      userId: userId,
      itemId: itemId,
      quantity: quantity,
    });

    return WishlistOutputMapper.toDTO(updatedWishlist);
  }

  /**
   * Performs a compensating rollback by deleting the partially saved transaction.
   *
   * @param {string} transactionId - The ID of the transaction to delete.
   * @param {PurchaseItemInput} input - Original input for context.
   */
  private async rollback(
    transactionId: string,
    input: PurchaseItemInput,
  ): Promise<void> {
    try {
      await this.transactionRepository.delete(transactionId);

      this.logger.info("Compensating rollback finished.", {
        wishlistId: input.wishlistId,
        transactionId,
      });

      this.observability.addBreadcrumb(
        "Compensating rollback finished",
        "transaction",
        {
          wishlistId: input.wishlistId,
          itemId: input.itemId,
          transactionId,
        },
      );

      this.observability.trackEvent("purchase_rollback_completed", {
        wishlistId: input.wishlistId,
        itemId: input.itemId,
      });
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      this.logger.error("CRITICAL: Rollback failed", {
        wishlistId: input.wishlistId,
        transactionId,
        error: errorMessage,
      });

      this.observability.trackEvent("purchase_rollback_failed", {
        wishlistId: input.wishlistId,
        itemId: input.itemId,
        error: errorMessage,
      });
    }
  }
}
