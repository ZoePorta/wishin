/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach, type Mocked } from "vitest";
import { UndoPurchaseUseCase } from "./undo-purchase.use-case";
import type { WishlistRepository } from "../repositories/wishlist.repository";
import type { TransactionRepository } from "../repositories/transaction.repository";
import type { Logger } from "../common/logger";
import type { ObservabilityService } from "../common/observability";
import { Transaction } from "../aggregates/transaction";
import { Wishlist } from "../aggregates/wishlist";
import { WishlistItem } from "../entities/wishlist-item";
import { Priority, Visibility, Participation } from "../value-objects";
import { TransactionStatus } from "../value-objects/transaction-status";
import {
  WishlistNotFoundError,
  TransactionNotFoundError,
  InvalidOperationError,
} from "../errors/domain-errors";

describe("UndoPurchaseUseCase", () => {
  let useCase: UndoPurchaseUseCase;
  let wishlistRepo: Mocked<WishlistRepository>;
  let transactionRepo: Mocked<TransactionRepository>;
  let logger: Mocked<Logger>;
  let observability: Mocked<ObservabilityService>;

  const wishlistId = "00000000-0000-4000-8000-000000000001";
  const itemId = "00000000-0000-4000-8000-000000000002";
  const userId = "00000000-0000-4000-8000-000000000003";
  const transactionId = "00000000-0000-4000-8000-000000000004";

  beforeEach(() => {
    wishlistRepo = {
      findById: vi.fn(),
      save: vi.fn(),
    } as unknown as Mocked<WishlistRepository>;
    transactionRepo = {
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
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

    useCase = new UndoPurchaseUseCase(
      wishlistRepo,
      transactionRepo,
      logger,
      observability,
    );
  });

  it("should fail if transaction is not found", async () => {
    transactionRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ wishlistId, transactionId, userId }),
    ).rejects.toThrow(TransactionNotFoundError);
  });

  it("should fail if userId mismatch", async () => {
    const transaction = Transaction.reconstitute({
      id: transactionId,
      itemId,
      userId: "different-user",
      itemName: "Test Item",
      itemPrice: 10,
      itemCurrency: "EUR",
      itemDescription: "Desc",
      ownerUsername: "owner",
      status: TransactionStatus.PURCHASED,
      quantity: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    transactionRepo.findById.mockResolvedValue(transaction);

    await expect(
      useCase.execute({ wishlistId, transactionId, userId }),
    ).rejects.toThrow(InvalidOperationError);
  });

  it("should fail if status is not PURCHASED", async () => {
    const transaction = Transaction.reconstitute({
      id: transactionId,
      itemId,
      userId,
      itemName: "Test Item",
      itemPrice: 10,
      itemCurrency: "EUR",
      itemDescription: "Desc",
      ownerUsername: "owner",
      status: TransactionStatus.RESERVED,
      quantity: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    transactionRepo.findById.mockResolvedValue(transaction);

    await expect(
      useCase.execute({ wishlistId, transactionId, userId }),
    ).rejects.toThrow(InvalidOperationError);
  });

  it("should fail if wishlist is not found", async () => {
    const transaction = Transaction.reconstitute({
      id: transactionId,
      itemId,
      userId,
      itemName: "Test Item",
      itemPrice: 10,
      itemCurrency: "EUR",
      itemDescription: "Desc",
      ownerUsername: "owner",
      status: TransactionStatus.PURCHASED,
      quantity: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    transactionRepo.findById.mockResolvedValue(transaction);
    wishlistRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ wishlistId, transactionId, userId }),
    ).rejects.toThrow(WishlistNotFoundError);
  });

  it("should successfully undo a purchase", async () => {
    const transaction = Transaction.reconstitute({
      id: transactionId,
      itemId,
      userId,
      itemName: "Test Item",
      itemPrice: 10,
      itemCurrency: "EUR",
      itemDescription: "Desc",
      ownerUsername: "owner",
      status: TransactionStatus.PURCHASED,
      quantity: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const item = WishlistItem.reconstitute({
      id: itemId,
      wishlistId,
      name: "Test Item",
      priority: Priority.MEDIUM,
      isUnlimited: false,
      totalQuantity: 5,
      reservedQuantity: 0,
      purchasedQuantity: 1,
    });

    const wishlist = Wishlist.reconstitute({
      id: wishlistId,
      ownerId: "owner-id",
      title: "Title",
      visibility: Visibility.LINK,
      participation: Participation.ANYONE,
      items: [item.toProps()],
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    transactionRepo.findById.mockResolvedValue(transaction);
    wishlistRepo.findById.mockResolvedValue(wishlist);

    await useCase.execute({ wishlistId, transactionId, userId });

    expect(wishlistRepo.save).not.toHaveBeenCalled();
    expect(transactionRepo.delete).toHaveBeenCalledWith(transactionId);
    expect(observability.trackEvent).toHaveBeenCalledWith(
      "purchase_undone",
      expect.any(Object),
    );
  });

  it("should NOT attempt rollback if transaction deletion fails (delegated to Appwrite Function)", async () => {
    const transaction = Transaction.reconstitute({
      id: transactionId,
      itemId,
      userId,
      itemName: "Test Item",
      itemPrice: 10,
      itemCurrency: "EUR",
      itemDescription: "Desc",
      ownerUsername: "owner",
      status: TransactionStatus.PURCHASED,
      quantity: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const item = WishlistItem.reconstitute({
      id: itemId,
      wishlistId,
      name: "Test Item",
      priority: Priority.MEDIUM,
      isUnlimited: false,
      totalQuantity: 5,
      reservedQuantity: 0,
      purchasedQuantity: 1,
    });

    const wishlist = Wishlist.reconstitute({
      id: wishlistId,
      ownerId: "owner-id",
      title: "Title",
      visibility: Visibility.LINK,
      participation: Participation.ANYONE,
      items: [item.toProps()],
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    transactionRepo.findById.mockResolvedValue(transaction);
    wishlistRepo.findById.mockResolvedValueOnce(wishlist);

    const deletionError = new Error("Deletion failed");
    transactionRepo.delete.mockRejectedValue(deletionError);

    await expect(
      useCase.execute({ wishlistId, transactionId, userId }),
    ).rejects.toThrow(deletionError);

    // Should NOT call wishlist save for rollback anymore
    expect(wishlistRepo.save).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      "Undo failed during transaction deletion.",
      expect.any(Object),
    );
  });
});
