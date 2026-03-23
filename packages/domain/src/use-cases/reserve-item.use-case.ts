import {
  WishlistNotFoundError,
  InvalidOperationError,
  InsufficientStockError,
} from "../errors/domain-errors";
import { Wishlist } from "../aggregates/wishlist";
import { Transaction } from "../aggregates/transaction";
import { WishlistOutputMapper } from "./mappers/wishlist-output.mapper";
import { generateUUID } from "../common/uuid";
import type { WishlistRepository } from "../repositories/wishlist.repository";
import type { ProfileRepository } from "../repositories/profile.repository";
import type { TransactionRepository } from "../repositories/transaction.repository";
import type { Logger } from "../common/logger";
import type { ReserveItemInput } from "./dtos/transaction-actions.dto";
import type { WishlistOutput } from "./dtos/get-wishlist.dto";

/**
 * Use case for reserving an item from a wishlist.
 *
 * This coordinates:
 * 1. Fetching the wishlist.
 * 2. Verifying the performing user is registered.
 * 3. Fetching the wishlist owner's username for denormalization.
 * 4. Performing domain validation for the reservation.
 * 5. Creating and persisting a reservation transaction.
 *
 * NOTE: Item statistics updates (reservedQuantity) are handled automatically
 * by Appwrite functions triggered by transaction creation/deletion.
 *
 * @throws {WishlistNotFoundError} If the wishlist is not found.
 * @throws {InvalidOperationError} If the user is not registered or the item is missing.
 * @throws {InsufficientStockError} If the requested quantity exceeds available stock.
 * @throws {Error} For unexpected failures.
 */
export class ReserveItemUseCase {
  /**
   * Initializes the use case with dependencies.
   *
   * @param wishlistRepository - Repository for wishlist retrieval.
   * @param profileRepository - Repository for profile metadata.
   * @param transactionRepository - Repository for transaction persistence.
   * @param logger - Logger for operational telemetry.
   * @param uuidFn - Optional factory for unique IDs.
   */
  constructor(
    private readonly wishlistRepository: WishlistRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly logger: Logger,
    private readonly uuidFn: () => string = () => generateUUID(),
  ) {}

  /**
   * Executes the reservation logic.
   *
   * @param input - Reservation details.
   * @returns {Promise<WishlistOutput>} The updated wishlist as a DTO (optimistic).
   * @throws {WishlistNotFoundError} If the wishlist id does not exist.
   * @throws {InvalidOperationError} If the user is not registered or the item is missing.
   * @throws {InsufficientStockError} If the requested quantity exceeds available stock.
   * @throws {Error} For unexpected failures.
   */
  async execute(input: ReserveItemInput): Promise<WishlistOutput> {
    const wishlist = await this.wishlistRepository.findById(input.wishlistId);
    if (!wishlist) {
      throw new WishlistNotFoundError(input.wishlistId);
    }

    // Rule: Only registered users can reserve items
    const userProfile = await this.profileRepository.findById(input.userId);
    if (!userProfile) {
      this.logger.warn("Registration required for reservation", {
        userId: input.userId,
      });
      throw new InvalidOperationError(
        "Registration required: user must be a registered member to reserve items",
      );
    }

    // Rule: Need owner's username for transaction snapshot (ADR 021)
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

    // 1. Domain Validation and Optimistic State
    // We update the aggregate to validate rules, but NO LONGER persist it here.
    let updatedWishlist: Wishlist;
    try {
      updatedWishlist = wishlist.reserveItem(input.itemId, input.quantity);
    } catch (error: unknown) {
      if (error instanceof InsufficientStockError) {
        this.logger.warn("Insufficient stock for reservation", {
          wishlistId: input.wishlistId,
          itemId: input.itemId,
          requested: input.quantity,
        });
      }
      throw error;
    }

    // 2. Create Transaction record (Snapshot Pattern)
    const transaction = Transaction.createReservation({
      id: this.uuidFn(),
      itemId: input.itemId,
      userId: input.userId,
      quantity: input.quantity,
      itemName: item.name,
      itemPrice: item.price ?? null,
      itemCurrency: item.currency ?? null,
      itemDescription: item.description ?? null,
      ownerUsername: ownerUsername,
    });

    // 3. Persist Changes (Transaction save triggers item stats update)
    try {
      await this.transactionRepository.save(transaction);
    } catch (error: unknown) {
      // Compensating Rollback: Attempt to delete the partially saved transaction
      this.logger.error(
        "Transaction save failed. Attempting compensating rollback.",
        { wishlistId: wishlist.id, itemId: input.itemId },
      );

      try {
        await this.transactionRepository.delete(transaction.id);
        this.logger.info("Compensating rollback successful", {
          wishlistId: wishlist.id,
          transactionId: transaction.id,
        });
      } catch (rollbackError: unknown) {
        this.logger.error("CRITICAL: Compensating rollback failed", {
          originalError: error instanceof Error ? error.message : String(error),
          rollbackError:
            rollbackError instanceof Error
              ? rollbackError.message
              : String(rollbackError),
          wishlistId: wishlist.id,
          transactionId: transaction.id,
        });
      }

      throw error; // Rethrow original error
    }

    return WishlistOutputMapper.toDTO(updatedWishlist);
  }
}
