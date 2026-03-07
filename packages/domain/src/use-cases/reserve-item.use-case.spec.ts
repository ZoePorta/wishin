/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach, type Mocked } from "vitest";
import { ReserveItemUseCase } from "./reserve-item.use-case";
import type { WishlistRepository } from "../repositories/wishlist.repository";
import type { ProfileRepository } from "../repositories/profile.repository";
import type { TransactionRepository } from "../repositories/transaction.repository";
import type { Logger } from "../common/logger";
import { Wishlist } from "../aggregates/wishlist";
import { Profile } from "../aggregates/profile";
import { WishlistItem } from "../entities/wishlist-item";
import { Priority, Visibility, Participation } from "../value-objects";
import {
  WishlistNotFoundError,
  InsufficientStockError,
  InvalidOperationError,
} from "../errors/domain-errors";

describe("ReserveItemUseCase", () => {
  let useCase: ReserveItemUseCase;
  let wishlistRepo: Mocked<WishlistRepository>;
  let profileRepo: Mocked<ProfileRepository>;
  let transactionRepo: Mocked<TransactionRepository>;
  let logger: Mocked<Logger>;

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
    } as unknown as Mocked<TransactionRepository>;
    logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as unknown as Mocked<Logger>;

    useCase = new ReserveItemUseCase(
      wishlistRepo,
      profileRepo,
      transactionRepo,
      logger,
      () => transactionId,
    );
  });

  it("should fail if wishlist is not found", async () => {
    wishlistRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ wishlistId, itemId, userId, quantity: 1 }),
    ).rejects.toThrow(WishlistNotFoundError);
  });

  it("should fail if user is not registered (no profile)", async () => {
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
    profileRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ wishlistId, itemId, userId, quantity: 1 }),
    ).rejects.toThrow(
      "Registration required: user must be a registered member to reserve items",
    );
    expect(logger.warn).toHaveBeenCalledWith(
      "Registration required for reservation",
      { userId },
    );
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
    const profile = Profile.reconstitute({ id: userId, username: "testuser" });
    const ownerProfile = Profile.reconstitute({
      id: ownerId,
      username: "owner",
    });

    wishlistRepo.findById.mockResolvedValue(wishlist);
    profileRepo.findById.mockImplementation(async (id: string) => {
      if (id === userId) return profile;
      if (id === ownerId) return ownerProfile;
      return null;
    });

    await expect(
      useCase.execute({ wishlistId, itemId, userId, quantity: 1 }),
    ).rejects.toThrow(InvalidOperationError);
  });

  it("should fail if stock is insufficient", async () => {
    const item = WishlistItem.reconstitute({
      id: itemId,
      wishlistId,
      name: "Test Item",
      description: "Item desc",
      priority: Priority.MEDIUM,
      price: 10,
      currency: "EUR",
      isUnlimited: false,
      totalQuantity: 1,
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
    const profile = Profile.reconstitute({ id: userId, username: "testuser" });
    const ownerProfile = Profile.reconstitute({
      id: ownerId,
      username: "owner",
    });

    wishlistRepo.findById.mockResolvedValue(wishlist);
    profileRepo.findById.mockImplementation(async (id: string) => {
      if (id === userId) return profile;
      if (id === ownerId) return ownerProfile;
      return null;
    });

    await expect(
      useCase.execute({ wishlistId, itemId, userId, quantity: 2 }),
    ).rejects.toThrow(InsufficientStockError);
  });

  it("should successfully reserve an item", async () => {
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
    const profile = Profile.reconstitute({ id: userId, username: "testuser" });
    const ownerProfile = Profile.reconstitute({
      id: ownerId,
      username: "owner",
    });

    wishlistRepo.findById.mockResolvedValue(wishlist);
    profileRepo.findById.mockImplementation(async (id: string) => {
      if (id === userId) return profile;
      if (id === ownerId) return ownerProfile;
      return null;
    });

    const result = await useCase.execute({
      wishlistId,
      itemId,
      userId,
      quantity: 2,
    });

    expect(wishlistRepo.save).toHaveBeenCalled();
    expect(transactionRepo.save).toHaveBeenCalled();
    const savedTransaction = transactionRepo.save.mock.calls[0][0];
    expect(savedTransaction.toProps().ownerUsername).toBe("owner");
    expect(result.items[0].reservedQuantity).toBe(2);
  });

  it("should fallback to 'Unknown User' if owner profile is missing", async () => {
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
    const profile = Profile.reconstitute({ id: userId, username: "testuser" });

    wishlistRepo.findById.mockResolvedValue(wishlist);
    profileRepo.findById.mockImplementation(async (id: string) => {
      if (id === userId) return profile;
      if (id === ownerId) return null;
      return null;
    });

    await useCase.execute({
      wishlistId,
      itemId,
      userId,
      quantity: 1,
    });

    const savedTransaction = transactionRepo.save.mock.calls[0][0];
    expect(savedTransaction.toProps().ownerUsername).toBe("Unknown User");
  });

  it("should attempt compensating rollback if transaction save fails", async () => {
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
    const profile = Profile.reconstitute({ id: userId, username: "testuser" });
    const ownerProfile = Profile.reconstitute({
      id: ownerId,
      username: "owner",
    });

    wishlistRepo.findById.mockResolvedValueOnce(wishlist);
    profileRepo.findById.mockImplementation(async (id: string) => {
      if (id === userId) return profile;
      if (id === ownerId) return ownerProfile;
      return null;
    });

    // Mock transaction save to fail
    const transactionError = new Error("Database error");
    transactionRepo.save.mockRejectedValue(transactionError);

    // Mock the second findById call during rollback
    // Note: The second findById returns the "fresh" state. In this test, we assume no concurrent modifications.
    // However, after the first wishlistRepo.save, the DB would have version 1.
    const wishlistWithReservation = wishlist.reserveItem(itemId, 1);
    wishlistRepo.findById.mockResolvedValueOnce(wishlistWithReservation);

    await expect(
      useCase.execute({
        wishlistId,
        itemId,
        userId,
        quantity: 1,
      }),
    ).rejects.toThrow(transactionError);

    // Verify 1st save (reservation) and 2nd save (rollback)
    expect(wishlistRepo.save).toHaveBeenCalledTimes(2);

    // Initial save: version 1 (reconstituted with 0, reserveItem increments to 1)
    const firstSave = wishlistRepo.save.mock.calls[0][0];
    expect(firstSave.version).toBe(1);
    expect(firstSave.items[0].reservedQuantity).toBe(1);

    /**
     * NOTE: This test assumes no concurrent modifications between the failed transaction save
     * and the compensating rollback. The mocked repository does not enforce optimistic-locking,
     * so the observed rollback version (secondSave.version === 2) succeeds by coincidence.
     * In the real repository (appwrite-wishlist repository behavior) a concurrent update
     * could cause the rollback to be rejected due to version mismatch if findById is not used
     * to fetch the latest state.
     */
    // Rollback save: version 2
    const secondSave = wishlistRepo.save.mock.calls[1][0];
    expect(secondSave.version).toBe(2);
    expect(secondSave.items[0].reservedQuantity).toBe(0);

    expect(logger.error).toHaveBeenCalledWith(
      "Transaction save failed after wishlist update. Attempting compensating rollback.",
      expect.any(Object),
    );
    expect(logger.info).toHaveBeenCalledWith(
      "Compensating rollback successful",
      expect.any(Object),
    );
  });
});
