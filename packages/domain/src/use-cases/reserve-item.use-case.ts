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
import type { ReserveItemInput } from "./dtos/transaction-actions.dto";
import type { WishlistOutput } from "./dtos/get-wishlist.dto";

/**
 * Use case for reserving an item from a wishlist.
 *
 * This coordinates:
 * 1. Fetching the wishlist.
 * 2. Verifying the performing user is registered.
 * 3. Fetching the wishlist owner's username for denormalization.
 * 4. Updating the wishlist item's reserved quantity.
 * 5. Creating and persisting a reservation transaction.
 *
 * @throws {WishlistNotFoundError} If the wishlist is not found.
 * @throws {InvalidOperationError} If the user is not registered or the item is missing.
 * @throws {NotFoundError} If the wishlist or item not found.
 * @throws {ValidationError} For invalid input (if applicable).
 * @throws {Error} For unexpected failures.
 */
export class ReserveItemUseCase {
  /**
   * Initializes the use case with dependencies.
   *
   * @param wishlistRepository - Repository for wishlist operations.
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
    private readonly uuidFn: () => string = () =>
      globalThis.crypto.randomUUID(),
  ) {}

  /**
   * Executes the reservation logic.
   *
   * @param input - Reservation details.
   * @returns The updated wishlist as a DTO.
   * @throws {WishlistNotFoundError} If the wishlist id does not exist.
   * @throws {NotFoundError} If the wishlist or item not found.
   * @throws {InvalidOperationError} For business rule violations (e.g., non-registered user).
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

    // 1. Update Wishlist state (Inventory check happens inside aggregate)
    const updatedWishlist = wishlist.reserveItem(input.itemId, input.quantity);

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

    // 3. Persist Atomic Changes (Simulated atomicity via repo calls for MVP)
    await Promise.all([
      this.wishlistRepository.save(updatedWishlist),
      this.transactionRepository.save(transaction),
    ]);

    return WishlistOutputMapper.toDTO(updatedWishlist);
  }
}
