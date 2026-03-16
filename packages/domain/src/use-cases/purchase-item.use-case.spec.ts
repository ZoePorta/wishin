/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach, type Mocked } from "vitest";
import { PurchaseItemUseCase } from "./purchase-item.use-case";
import type { WishlistRepository } from "../repositories/wishlist.repository";
import type { ProfileRepository } from "../repositories/profile.repository";
import type { TransactionRepository } from "../repositories/transaction.repository";
import type { Logger } from "../common/logger";
import type { ObservabilityService } from "../common/observability";
import { Wishlist } from "../aggregates/wishlist";
import { Profile } from "../aggregates/profile";
import { WishlistItem } from "../entities/wishlist-item";
import { Priority, Visibility, Participation } from "../value-objects";
import { TransactionStatus } from "../value-objects/transaction-status";
import {
  WishlistNotFoundError,
  InvalidOperationError,
} from "../errors/domain-errors";

describe("PurchaseItemUseCase", () => {
  let useCase: PurchaseItemUseCase;
  let wishlistRepo: Mocked<WishlistRepository>;
  let profileRepo: Mocked<ProfileRepository>;
  let transactionRepo: Mocked<TransactionRepository>;
  let logger: Mocked<Logger>;
  let observability: Mocked<ObservabilityService>;

  const wishlistId = "00000000-0000-4000-8000-000000000001";
  const itemId = "00000000-0000-4000-8000-000000000002";
  const ownerId = "00000000-0000-4000-8000-000000000003";
  const userId = "00000000-0000-4000-8000-000000000004";
  const transactionId = "00000000-0000-4000-8000-000000000005";

  beforeEach(() => {
    wishlistRepo = {
      findById: vi.fn(),
      save: vi.fn(),
    } as unknown as Mocked<WishlistRepository>;
    profileRepo = {
      findById: vi.fn(),
    } as unknown as Mocked<ProfileRepository>;
    transactionRepo = {
      save: vi.fn(),
      delete: vi.fn(),
      // Intentionally prepared for future reservation logic restoration (Deferred for MVP)
      findByUserIdAndItemId: vi.fn(),
    } as unknown as Mocked<TransactionRepository>;
    logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as unknown as Mocked<Logger>;
    observability = {
      addBreadcrumb: vi.fn(),
      trackEvent: vi.fn(),
    } as unknown as Mocked<ObservabilityService>;

    useCase = new PurchaseItemUseCase(
      wishlistRepo,
      profileRepo,
      transactionRepo,
      logger,
      observability,
      () => transactionId,
    );
  });

  it("should fail if wishlist is not found", async () => {
    wishlistRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ wishlistId, itemId, userId, quantity: 1 }),
    ).rejects.toThrow(WishlistNotFoundError);
  });

  it("should fail if item is not found in wishlist", async () => {
    const wishlist = Wishlist.reconstitute({
      id: wishlistId,
      ownerId,
      title: "My Wishlist",
      visibility: Visibility.LINK,
      participation: Participation.ANYONE,
      items: [],
      version: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    wishlistRepo.findById.mockResolvedValue(wishlist);

    await expect(
      useCase.execute({ wishlistId, itemId, userId, quantity: 1 }),
    ).rejects.toThrow(InvalidOperationError);
  });

  it("should successfully purchase an item (No Reservation)", async () => {
    const item = WishlistItem.reconstitute({
      id: itemId,
      wishlistId,
      name: "Test Item",
      description: "Item desc",
      priority: Priority.MEDIUM,
      price: 10,
      currency: "EUR",
      isUnlimited: false,
      totalQuantity: 5,
      reservedQuantity: 0,
      purchasedQuantity: 0,
    });
    const wishlist = Wishlist.reconstitute({
      id: wishlistId,
      ownerId,
      title: "My Wishlist",
      visibility: Visibility.LINK,
      participation: Participation.ANYONE,
      items: [item.toProps()],
      version: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const ownerProfile = Profile.reconstitute({
      id: ownerId,
      username: "owner",
    });

    wishlistRepo.findById.mockResolvedValue(wishlist);
    profileRepo.findById.mockResolvedValue(ownerProfile);
    // Unused in current MVP flow, but kept for future reservation logic restoration
    transactionRepo.findByUserIdAndItemId.mockResolvedValue([]);

    const result = await useCase.execute({
      wishlistId,
      itemId,
      userId,
      quantity: 2,
    });

    expect(wishlistRepo.save).not.toHaveBeenCalled();
    expect(transactionRepo.save).toHaveBeenCalled();
    const savedTransaction = transactionRepo.save.mock.calls[0][0];
    expect(savedTransaction.toProps().status).toBe(TransactionStatus.PURCHASED);
    expect(savedTransaction.toProps().quantity).toBe(2);
    expect(result.items[0].purchasedQuantity).toBe(2);

    // Verify Observability
    expect(observability.trackEvent).toHaveBeenCalledWith(
      "purchase_completed",
      {
        wishlistId: wishlist.id,
        userId,
        itemId,
        quantity: 2,
      },
    );
    expect(observability.addBreadcrumb).toHaveBeenCalledWith(
      "Purchase completion successful",
      "transaction",
      {
        wishlistId: wishlist.id,
        userId,
        itemId,
      },
    );
  });

  it("should attempt rollback (transaction delete) if transaction save fails", async () => {
    const item = WishlistItem.reconstitute({
      id: itemId,
      wishlistId,
      name: "Test Item",
      isUnlimited: false,
      totalQuantity: 5,
      reservedQuantity: 0,
      purchasedQuantity: 0,
      priority: Priority.MEDIUM,
    });
    const wishlist = Wishlist.reconstitute({
      id: wishlistId,
      ownerId,
      title: "My Wishlist",
      visibility: Visibility.LINK,
      participation: Participation.ANYONE,
      items: [item.toProps()],
      version: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    wishlistRepo.findById.mockResolvedValueOnce(wishlist);
    profileRepo.findById.mockResolvedValue(null);

    const transactionError = new Error("Persistence error");
    transactionRepo.save.mockRejectedValue(transactionError);

    await expect(
      useCase.execute({ wishlistId, itemId, userId, quantity: 1 }),
    ).rejects.toThrow(transactionError);

    // Should NOT call wishlist save
    expect(wishlistRepo.save).not.toHaveBeenCalled();
    // Should call transaction delete for rollback
    expect(transactionRepo.delete).toHaveBeenCalledWith(transactionId);

    // Verify Observability
    expect(observability.addBreadcrumb).toHaveBeenCalledWith(
      "Purchase failed during transaction save",
      "transaction",
      expect.objectContaining({
        wishlistId,
        itemId,
        error: transactionError.message,
      }),
    );
    expect(observability.trackEvent).toHaveBeenCalledWith("purchase_failed", {
      wishlistId,
      itemId,
      reason: "transaction_save_failure",
    });
  });
});
