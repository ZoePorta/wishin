import {
  WishlistNotFoundError,
  InvalidOperationError,
} from "../errors/domain-errors";
import { Wishlist } from "../aggregates/wishlist";
import { Transaction } from "../aggregates/transaction";
import { TransactionStatus } from "../value-objects/transaction-status";
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
 * 2. Fetching existing reservations for the user to avoid duplicate commitments (Smart Consumption).
 * 3. Fetching the wishlist owner's username for denormalization.
 * 4. Updating the wishlist item's purchased quantity.
 * 5. Syncing transaction records (Preserving reservation history).
 *
 * Consumption Strategy:
 * - If requested >= totalReserved: Promo oldest reservation to PURCHASED with full quantity. Cancel others.
 * - If requested < totalReserved: Shrink oldest reservation and create NEW purchase record.
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

    // 1. Smart Consumption Calculation
    const reservations = await this.transactionRepository.findByUserIdAndItemId(
      input.userId,
      input.itemId,
      TransactionStatus.RESERVED,
    );
    // Sort by createdAt ASC to prioritize oldest reservation for history preservation
    const sortedReservations = [...reservations].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
    const totalReserved = sortedReservations.reduce(
      (acc, res) => acc + res.quantity,
      0,
    );
    const consumeFromReserved = Math.min(input.quantity, totalReserved);

    // 2. Update Wishlist
    const updatedWishlist = wishlist.purchaseItem(
      input.itemId,
      input.quantity,
      consumeFromReserved,
    );

    // 3. Prepare Transaction Sync Plan
    const transactionsToSave: Transaction[] = [];
    let transactionToRollbackIfFails: {
      wishlist: Wishlist;
      savedTransactions: Transaction[];
      deletedIds: string[];
    } | null = null;

    if (input.quantity >= totalReserved) {
      // Case 1: Convert all and potentially increase quantity
      if (sortedReservations.length > 0) {
        const oldest = sortedReservations[0];
        transactionsToSave.push(oldest.promoteToPurchase(input.quantity));
        // Cancel any other redundant reservations
        for (let i = 1; i < sortedReservations.length; i++) {
          transactionsToSave.push(sortedReservations[i].cancel());
        }
      } else {
        // Direct Purchase (No reservations)
        transactionsToSave.push(
          Transaction.createPurchase({
            id: this.uuidFn(),
            itemId: input.itemId,
            userId: input.userId,
            quantity: input.quantity,
            itemName: item.name,
            itemPrice: item.price ?? null,
            itemCurrency: item.currency ?? null,
            itemDescription: item.description ?? null,
            ownerUsername,
          }),
        );
      }
    } else {
      // Case 2: Partial consumption (requested < totalReserved)
      // Shrink oldest and create new purchase for today
      const oldest = sortedReservations[0];
      transactionsToSave.push(
        oldest.updateQuantity(oldest.quantity - input.quantity),
      );
      transactionsToSave.push(
        Transaction.createPurchase({
          id: this.uuidFn(),
          itemId: input.itemId,
          userId: input.userId,
          quantity: input.quantity,
          itemName: item.name,
          itemPrice: item.price ?? null,
          itemCurrency: item.currency ?? null,
          itemDescription: item.description ?? null,
          ownerUsername,
        }),
      );
    }

    // 4. Persistence (Sequential saves for MVP)
    await this.wishlistRepository.save(updatedWishlist);

    // Track for rollback
    transactionToRollbackIfFails = {
      wishlist: wishlist, // Original state
      savedTransactions: [],
      deletedIds: [],
    };

    try {
      for (const tx of transactionsToSave) {
        await this.transactionRepository.save(tx);
        transactionToRollbackIfFails.savedTransactions.push(tx);
      }
    } catch (error: unknown) {
      this.logger.error(
        "Smart Purchase failed during transaction sync. Attempting rollback.",
        {
          wishlistId: wishlist.id,
          itemId: input.itemId,
          error: error instanceof Error ? error.message : String(error),
        },
      );
      await this.rollback(transactionToRollbackIfFails, input);
      throw error;
    }

    return WishlistOutputMapper.toDTO(updatedWishlist);
  }

  private async rollback(
    plan: { wishlist: Wishlist; savedTransactions: Transaction[] },
    input: PurchaseItemInput,
  ): Promise<void> {
    try {
      // 1. Revert Wishlist (optimistic re-fetch)
      const fresh = await this.wishlistRepository.findById(plan.wishlist.id);
      if (fresh) {
        // Technically we should cancel the specific amount we added.
        // Since purchaseItem added input.quantity, we call cancelItemPurchase.
        const rolledBackWishlist = fresh.cancelItemPurchase(
          input.itemId,
          input.quantity,
        );
        await this.wishlistRepository.save(rolledBackWishlist);
      }

      // 2. Revert Transactions (Simplistic for MVP: we don't hard delete promoted ones, just log it)
      this.logger.info("Compensating rollback finished.", {
        wishlistId: plan.wishlist.id,
      });
    } catch (e: unknown) {
      this.logger.error("CRITICAL: Rollback failed", { e });
    }
  }
}
