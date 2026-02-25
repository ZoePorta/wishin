import { describe, it, expect } from "vitest";
import { Wishlist, type WishlistSnapshot } from "./wishlist";
import { Visibility, Participation } from "../value-objects";
import {
  WishlistItem,
  type WishlistItemProps,
} from "../entities/wishlist-item";
import { Priority } from "../value-objects";
import {
  InvalidAttributeError,
  LimitExceededError,
  InvalidOperationError,
  INVALID_VISIBILITY_ERROR,
  INVALID_PARTICIPATION_ERROR,
} from "../errors/domain-errors";

describe("Wishlist Aggregate", () => {
  // Valid UUID v4s
  const validProps = {
    id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d", // v4
    ownerId: "123e4567-e89b-42d3-a456-426614174001", // v4
    title: "My Birthday List",
    description: "Things I want for my birthday",
    visibility: Visibility.LINK,
    participation: Participation.ANYONE,
  };

  describe("Equality", () => {
    it("should return true if IDs match", () => {
      const w1 = Wishlist.create(validProps);
      const w2 = Wishlist.reconstitute({
        ...w1.toProps(),
        items: [],
      });
      expect(w1.equals(w2)).toBe(true);
    });

    it("should return false if IDs different", () => {
      const w1 = Wishlist.create(validProps);
      const w2 = Wishlist.create({
        ...validProps,
        id: "8c4a1e94-0f1d-4e8a-9a2b-1b0d7b3dcb6e", // distinct v4
      });
      expect(w1.equals(w2)).toBe(false);
    });
  });

  describe("Creation (Strict Validation)", () => {
    it("should create a valid wishlist", () => {
      const wishlist = Wishlist.create(validProps);

      const props = wishlist.toProps();
      expect(wishlist).toBeInstanceOf(Wishlist);
      expect(props).toEqual(
        expect.objectContaining({
          ...validProps,
          items: [],
          createdAt: expect.any(Date) as unknown as Date,
          updatedAt: expect.any(Date) as unknown as Date,
        }),
      );
    });

    it("should create a wishlist with explicit visibility and participation", () => {
      const wishlist = Wishlist.create({
        ...validProps,
        visibility: Visibility.PRIVATE,
        participation: Participation.CONTACTS,
      });

      expect(wishlist.visibility).toBe(Visibility.PRIVATE);
      expect(wishlist.participation).toBe(Participation.CONTACTS);
    });

    it("should throw InvalidAttributeError if title is too short", () => {
      expect(() => {
        Wishlist.create({ ...validProps, title: "Lo" });
      }).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if title is too long", () => {
      expect(() => {
        Wishlist.create({ ...validProps, title: "a".repeat(101) });
      }).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if id is not a valid UUID v4", () => {
      expect(() => {
        Wishlist.create({ ...validProps, id: "invalid-uuid" });
      }).toThrow(InvalidAttributeError);

      expect(() => {
        // v1 UUID (not v4)
        Wishlist.create({
          ...validProps,
          id: "123e4567-e89b-12d3-a456-426614174000",
        });
      }).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if ownerId is not a valid identity", () => {
      expect(() => {
        Wishlist.create({
          ...validProps,
          ownerId: "not-a-uuid-and-too-long-for-appwrite-id-" + "a".repeat(40),
        });
      }).toThrow(InvalidAttributeError);

      expect(() => {
        Wishlist.create({ ...validProps, ownerId: "invalid$character" });
      }).toThrow(InvalidAttributeError);
    });

    it("should allow Appwrite-style IDs as ownerId", () => {
      const appwriteId = "user_123456789_abcdef";
      const wishlist = Wishlist.create({ ...validProps, ownerId: appwriteId });
      expect(wishlist.ownerId).toBe(appwriteId);
    });

    it("should throw InvalidAttributeError if description is too long", () => {
      expect(() => {
        Wishlist.create({ ...validProps, description: "a".repeat(501) });
      }).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if visibility is invalid", () => {
      expect(() =>
        Wishlist.create({
          ...validProps,
          visibility: "INVALID_VISIBILITY" as Visibility,
        }),
      ).toThrow(INVALID_VISIBILITY_ERROR);
    });

    it("should throw InvalidAttributeError if participation is invalid", () => {
      expect(() =>
        Wishlist.create({
          ...validProps,
          participation: "INVALID_PARTICIPATION" as Participation,
        }),
      ).toThrow(INVALID_PARTICIPATION_ERROR);
    });
  });

  describe("Update", () => {
    it("should update editable properties", () => {
      const wishlist = Wishlist.create(validProps);
      const newTitle = "Updated List Title";

      const updatedWishlist = wishlist.update({ title: newTitle });

      expect(updatedWishlist).not.toBe(wishlist); // Immutability
      expect(updatedWishlist.toProps()).toEqual(
        expect.objectContaining({
          ...validProps,
          title: newTitle,
          updatedAt: expect.any(Date) as unknown as Date,
        }),
      );
      expect(updatedWishlist.updatedAt.getTime()).toBeGreaterThanOrEqual(
        wishlist.updatedAt.getTime(),
      );

      // Verify visibility and participation update
      const privacyUpdate = wishlist.update({
        visibility: Visibility.PRIVATE,
        participation: Participation.CONTACTS,
      });
      expect(privacyUpdate.visibility).toBe(Visibility.PRIVATE);
      expect(privacyUpdate.participation).toBe(Participation.CONTACTS);

      // Identity persistence
      expect(updatedWishlist.id).toBe(wishlist.id);
      expect(updatedWishlist.ownerId).toBe(wishlist.ownerId);
      expect(updatedWishlist.items).toEqual(wishlist.items);
      expect(updatedWishlist.equals(wishlist)).toBe(true);
    });

    it("should not allow updating immutable properties via update method", () => {
      const wishlist = Wishlist.create(validProps);
      expect(() =>
        wishlist.update({ id: "new-id" } as Partial<WishlistSnapshot>),
      ).toThrow(InvalidAttributeError);
    });

    it("should update item title via aggregate", () => {
      const wishlist = Wishlist.create(validProps);
      const item = WishlistItem.create({
        id: "123e4567-e89b-42d3-a456-426614174000",
        wishlistId: validProps.id,
        name: "Old Name",
        totalQuantity: 1,
        reservedQuantity: 0,
        purchasedQuantity: 0,
      });
      const validWishlist = wishlist.addItem(item);
      const updatedWishlist = validWishlist.updateItem(item.id, {
        name: "New Name",
      });
      expect(updatedWishlist.items[0].name).toBe("New Name");
    });

    it("should update item description via aggregate", () => {
      const wishlist = Wishlist.create(validProps);
      const item = WishlistItem.create({
        id: "123e4567-e89b-42d3-a456-426614174000",
        wishlistId: validProps.id,
        name: "Base",
        description: "Old Desc",
        totalQuantity: 1,
        reservedQuantity: 0,
        purchasedQuantity: 0,
      });
      const validWishlist = wishlist.addItem(item);

      const updatedWishlist = validWishlist.updateItem(item.id, {
        description: "New Desc",
      });
      expect(updatedWishlist.items[0].description).toBe("New Desc");
    });

    it("should update item url via aggregate", () => {
      const wishlist = Wishlist.create(validProps);
      const item = WishlistItem.create({
        id: "123e4567-e89b-42d3-a456-426614174000",
        wishlistId: validProps.id,
        name: "Base",
        url: "https://old.com",
        totalQuantity: 1,
        reservedQuantity: 0,
        purchasedQuantity: 0,
      });
      const validWishlist = wishlist.addItem(item);

      const updatedWishlist = validWishlist.updateItem(item.id, {
        url: "https://new.com",
      });
      expect(updatedWishlist.items[0].url).toBe("https://new.com");
    });

    it("should update item image url via aggregate", () => {
      const wishlist = Wishlist.create(validProps);
      const item = WishlistItem.create({
        id: "123e4567-e89b-42d3-a456-426614174000",
        wishlistId: validProps.id,
        name: "Base",
        imageUrl: "https://old-img.com",
        totalQuantity: 1,
        reservedQuantity: 0,
        purchasedQuantity: 0,
      });
      const validWishlist = wishlist.addItem(item);

      const updatedWishlist = validWishlist.updateItem(item.id, {
        imageUrl: "https://new-img.com",
      });
      expect(updatedWishlist.items[0].imageUrl).toBe("https://new-img.com");
    });

    it("should update item priority via aggregate", () => {
      const wishlist = Wishlist.create(validProps);
      const item = WishlistItem.create({
        id: "123e4567-e89b-42d3-a456-426614174000",
        wishlistId: validProps.id,
        name: "Base",
        priority: Priority.LOW,
        totalQuantity: 1,
        reservedQuantity: 0,
        purchasedQuantity: 0,
      });
      const validWishlist = wishlist.addItem(item);

      const updatedWishlist = validWishlist.updateItem(item.id, {
        priority: Priority.URGENT,
      });
      expect(updatedWishlist.items[0].priority).toBe(Priority.URGENT);
    });

    it("should reserve item via aggregate", () => {
      const wishlist = Wishlist.create(validProps);
      const item = WishlistItem.create({
        id: "123e4567-e89b-42d3-a456-426614174000",
        wishlistId: validProps.id,
        name: "Base",
        totalQuantity: 5,
        reservedQuantity: 0,
        purchasedQuantity: 0,
      });
      const validWishlist = wishlist.addItem(item);

      const updatedWishlist = validWishlist.reserveItem(item.id, 2);
      expect(updatedWishlist.items[0].reservedQuantity).toBe(2);
    });

    it("should purchase item via aggregate", () => {
      const wishlist = Wishlist.create(validProps);
      const item = WishlistItem.create({
        id: "123e4567-e89b-42d3-a456-426614174000",
        wishlistId: validProps.id,
        name: "Base",
        totalQuantity: 5,
        reservedQuantity: 0,
        purchasedQuantity: 0,
      });
      const validWishlist = wishlist.addItem(item);

      const updatedWishlist = validWishlist.purchaseItem(item.id, 2, 0);
      expect(updatedWishlist.items[0].purchasedQuantity).toBe(2);
    });

    it("should cancel reservation via aggregate", () => {
      const wishlist = Wishlist.create(validProps);
      const item = WishlistItem.create({
        id: "123e4567-e89b-42d3-a456-426614174000",
        wishlistId: validProps.id,
        name: "Base",
        totalQuantity: 5,
        reservedQuantity: 2,
        purchasedQuantity: 0,
      });
      const validWishlist = wishlist.addItem(item);

      const updatedWishlist = validWishlist.cancelItemReservation(item.id, 1);
      expect(updatedWishlist.items[0].reservedQuantity).toBe(1);
    });

    it("should cancel purchase via aggregate", () => {
      const wishlist = Wishlist.create(validProps);
      const item = WishlistItem.create({
        id: "123e4567-e89b-42d3-a456-426614174000",
        wishlistId: validProps.id,
        name: "Base",
        totalQuantity: 5,
        reservedQuantity: 0,
        purchasedQuantity: 2,
      });
      const validWishlist = wishlist.addItem(item);

      const updatedWishlist = validWishlist.cancelItemPurchase(item.id, 1);
      expect(updatedWishlist.items[0].purchasedQuantity).toBe(1);
    });

    it("should throw InvalidOperationError if duplicate item added", () => {
      const wishlist = Wishlist.create(validProps);
      const item = WishlistItem.create({
        id: "123e4567-e89b-42d3-a456-426614174000",
        wishlistId: validProps.id,
        name: "Base",
        totalQuantity: 5,
        reservedQuantity: 0,
        purchasedQuantity: 0,
      });
      const validWishlist = wishlist.addItem(item);

      expect(() => {
        validWishlist.addItem(item);
      }).toThrow(InvalidOperationError); // "Item already exists"
    });

    it("should validate properties during update", () => {
      const wishlist = Wishlist.create(validProps);
      expect(() => {
        wishlist.update({ title: "Lo" });
      }).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if title is not a string", () => {
      const wishlist = Wishlist.create(validProps);
      expect(() => {
        // @ts-expect-error - Testing runtime type check
        wishlist.update({ title: 123 });
      }).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if description is not a string", () => {
      const wishlist = Wishlist.create(validProps);
      expect(() => {
        // @ts-expect-error - Testing runtime type check
        wishlist.update({ description: 123 });
      }).toThrow(InvalidAttributeError);
    });
  });

  describe("Item Management", () => {
    it("should throw LimitExceededError if creating with > 100 items in STRICT mode", () => {
      const items = Array.from({ length: 101 }, (_, i) =>
        WishlistItem.create({
          id: `123e4567-e89b-42d3-a456-426614174${i.toString().padStart(3, "0")}`,
          wishlistId: validProps.id,
          name: `Item ${i.toString()}`,
          totalQuantity: 1,
          reservedQuantity: 0,
          purchasedQuantity: 0,
        }),
      );

      expect(() => {
        Wishlist.create({
          ...validProps,
          items: items,
        });
      }).toThrow(LimitExceededError);
    });

    it("should throw InvalidAttributeError if creating with items belonging to another wishlist", () => {
      const foreignItem = WishlistItem.create({
        id: "123e4567-e89b-42d3-a456-426614174000",
        wishlistId: "111e4567-e89b-42d3-a456-426614174111",
        name: "Foreign Item",
        totalQuantity: 1,
        reservedQuantity: 0,
        purchasedQuantity: 0,
      });

      expect(() => {
        Wishlist.create({
          ...validProps,
          items: [foreignItem],
        });
      }).toThrow(InvalidAttributeError);
    });

    it("should add an item to the wishlist", () => {
      const wishlist = Wishlist.create(validProps);
      const mockItem = WishlistItem.create({
        id: "123e4567-e89b-42d3-a456-426614174000",
        wishlistId: validProps.id,
        name: "Item 1",
        totalQuantity: 1,
        reservedQuantity: 0,
        purchasedQuantity: 0,
      });

      const withItem = wishlist.addItem(mockItem);

      expect(withItem.items).toHaveLength(1);
      expect(withItem.items[0].equals(mockItem)).toBe(true);
    });

    it("should remove an item from the wishlist", () => {
      const wishlist = Wishlist.create(validProps);
      const mockItem = WishlistItem.create({
        id: "123e4567-e89b-42d3-a456-426614174000",
        wishlistId: validProps.id,
        name: "Item 1",
        totalQuantity: 1,
        reservedQuantity: 0,
        purchasedQuantity: 0,
      });
      const withItem = wishlist.addItem(mockItem);

      const result = withItem.removeItem(mockItem.id);
      expect(result.wishlist.items).toHaveLength(0);
      expect(result.removedItem).toEqual(mockItem);
    });

    it("should return null removedItem when removing non-existent item", () => {
      const wishlist = Wishlist.create(validProps);
      const result = wishlist.removeItem("non-existent-item-id");
      expect(result.wishlist.items).toHaveLength(0);
      expect(result.wishlist.items).toEqual(wishlist.items);
      expect(result.removedItem).toBeNull();
    });

    it("should enforce 100 items limit", () => {
      const items = Array.from(
        { length: 100 },
        (_, i) => ({
          id: `123e4567-e89b-42d3-a456-426614174${i.toString().padStart(3, "0")}`,
          wishlistId: validProps.id,
          name: `Item ${i.toString()}`,
          priority: Priority.MEDIUM,
          isUnlimited: false,
          totalQuantity: 1,
          reservedQuantity: 0,
          purchasedQuantity: 0,
        }), // Props, not WishlistItem instance
      ) as WishlistItemProps[]; // No longer unsafe cast

      const fullWishlist = Wishlist.reconstitute({
        ...validProps,
        items: items,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const overflowItem = WishlistItem.create({
        id: "999e4567-e89b-42d3-a456-426614174999",
        wishlistId: validProps.id,
        name: "Overflow",
        totalQuantity: 1,
        reservedQuantity: 0,
        purchasedQuantity: 0,
      });

      expect(() => {
        fullWishlist.addItem(overflowItem);
      }).toThrow(LimitExceededError);
    });

    it("should update item's wishlistId when adding (claim ownership)", () => {
      const wishlist = Wishlist.create(validProps);
      const otherItem = WishlistItem.create({
        id: "123e4567-e89b-42d3-a456-426614174000",
        wishlistId: "111e4567-e89b-42d3-a456-426614174111", // Different ID
        name: "Item 1",
        totalQuantity: 1,
        reservedQuantity: 0,
        purchasedQuantity: 0,
      });

      const updatedWishlist = wishlist.addItem(otherItem);
      const addedItem = updatedWishlist.items.find(
        (i) => i.id === otherItem.id,
      );

      expect(addedItem).toBeDefined();
      expect(addedItem!.wishlistId).toBe(wishlist.id);
      expect(addedItem!.wishlistId).not.toBe(otherItem.wishlistId);
    });
  });

  describe("Reconstitution", () => {
    it("should reconstitute without business validation (bypass item limit)", () => {
      const items = Array.from({ length: 101 }, (_, i) => ({
        id: `123e4567-e89b-42d3-a456-426614174${i.toString().padStart(3, "0")}`,
        wishlistId: validProps.id,
        name: `Item ${i.toString()}`,
        priority: Priority.MEDIUM,
        isUnlimited: false,
        totalQuantity: 1,
        reservedQuantity: 0,
        purchasedQuantity: 0,
      })) as WishlistItemProps[];

      const hugeWishlist = Wishlist.reconstitute({
        ...validProps,
        items: items,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(hugeWishlist.items).toHaveLength(101);
    });

    it("should trim properties during reconstitution", () => {
      const untrimmedProps = {
        ...validProps,
        title: "  untouched  ",
        description: "  untouched  ",
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const wishlist = Wishlist.reconstitute(untrimmedProps);

      expect(wishlist.title).toBe("untouched");
      expect(wishlist.description).toBe("untouched");
    });

    it("should reconstitute with invalid title (bypass validation)", () => {
      const shortTitleProps = {
        ...validProps,
        title: "Hi", // Too short for STRICT, but acceptable for STRUCTURAL
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const wishlist = Wishlist.reconstitute(shortTitleProps);
      expect(wishlist.title).toBe("Hi");
      expect(wishlist.createdAt).toEqual(shortTitleProps.createdAt);
      expect(wishlist.updatedAt).toEqual(shortTitleProps.updatedAt);
    });
  });

  describe("Trimming Logic", () => {
    it("should trim title and description on create", () => {
      const wishlist = Wishlist.create({
        ...validProps,
        title: "  Spaced Title  ",
        description: "  Spaced Description  ",
      });

      expect(wishlist.title).toBe("Spaced Title");
      expect(wishlist.description).toBe("Spaced Description");
    });

    it("should trim title on update", () => {
      const wishlist = Wishlist.create(validProps);
      const updated = wishlist.update({ title: "  Updated Title  " });
      expect(updated.title).toBe("Updated Title");
    });

    it("should trim description on update", () => {
      const wishlist = Wishlist.create(validProps);
      const updated = wishlist.update({
        description: "  Updated Description  ",
      });
      expect(updated.description).toBe("Updated Description");
    });

    it("should validate length AFTER trimming on create", () => {
      expect(() => {
        Wishlist.create({ ...validProps, title: "   ab   " }); // Trims to "ab" (length 2)
      }).toThrow(InvalidAttributeError);
    });
  });

  describe("Defensive Copies", () => {
    it("should return a copy of items array", () => {
      const wishlist = Wishlist.create(validProps);
      const items = wishlist.items;
      expect(items).not.toBe(wishlist.items); // Different references

      const mockItem = WishlistItem.create({
        id: "123e4567-e89b-42d3-a456-426614174000",
        wishlistId: validProps.id,
        name: "Item 1",
        totalQuantity: 1,
        reservedQuantity: 0,
        purchasedQuantity: 0,
      });

      items.push(mockItem);
      expect(wishlist.items).toHaveLength(0); // Aggregate state unaffected
    });

    it("should return a copy of createdAt date", () => {
      const wishlist = Wishlist.create(validProps);
      const createdAt = wishlist.createdAt;
      expect(createdAt).not.toBe(wishlist.createdAt); // Different references

      const originalTime = createdAt.getTime();
      createdAt.setFullYear(2000);

      expect(wishlist.createdAt.getTime()).toBe(originalTime); // Aggregate state unaffected
    });

    it("should return a copy of updatedAt date", () => {
      const wishlist = Wishlist.create(validProps);
      const updatedAt = wishlist.updatedAt;
      expect(updatedAt).not.toBe(wishlist.updatedAt); // Different references

      const originalTime = updatedAt.getTime();
      updatedAt.setFullYear(2000);

      expect(wishlist.updatedAt.getTime()).toBe(originalTime); // Aggregate state unaffected
    });

    it("should return copies in toProps", () => {
      const wishlist = Wishlist.create(validProps);
      const props = wishlist.toProps();

      expect(props.createdAt).not.toBe(wishlist.createdAt);
      expect(props.updatedAt).not.toBe(wishlist.updatedAt);
      expect(props.items).not.toBe(wishlist.items);

      props.createdAt.setFullYear(2000);
      expect(wishlist.createdAt.getFullYear()).not.toBe(2000);

      const mockItem = WishlistItem.create({
        id: "123e4567-e89b-42d3-a456-426614174000",
        wishlistId: validProps.id,
        name: "Item 1",
        totalQuantity: 1,
        reservedQuantity: 0,
        purchasedQuantity: 0,
      });
      props.items.push(mockItem);
      expect(wishlist.items).toHaveLength(0);
    });
  });

  describe("Input Mutation Safety", () => {
    it("should prevent mutation of items array passed to create", () => {
      const items: WishlistItem[] = [];
      const wishlist = Wishlist.create({
        ...validProps,
        items: items,
      });

      const mockItem = WishlistItem.create({
        id: "123e4567-e89b-42d3-a456-426614174000",
        wishlistId: validProps.id,
        name: "Item 1",
        totalQuantity: 1,
        reservedQuantity: 0,
        purchasedQuantity: 0,
      });

      // Mutate the array passed to create
      items.push(mockItem);

      expect(wishlist.items).toHaveLength(0);
    });

    it("should prevent mutation of Date passed to create", () => {
      const createdAt = new Date("2023-01-01");
      const wishlist = Wishlist.create({
        ...validProps,
        createdAt: createdAt,
      });

      // Mutate the date passed to create
      createdAt.setFullYear(2025);

      expect(wishlist.createdAt.getFullYear()).toBe(2023);
    });

    it("should prevent mutation of items array passed to reconstitute", () => {
      const itemProps = {
        id: "123e4567-e89b-42d3-a456-426614174000",
        wishlistId: validProps.id,
        name: "Item 1",
        priority: Priority.MEDIUM,
        isUnlimited: false,
        totalQuantity: 1,
        reservedQuantity: 0,
        purchasedQuantity: 0,
      } as WishlistItemProps;

      const itemsProp = [itemProps];
      const wishlist = Wishlist.reconstitute({
        ...validProps,
        items: itemsProp,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mutate the array passed to reconstitute
      itemsProp.pop();

      expect(wishlist.items).toHaveLength(1);
    });

    it("should prevent mutation of Date passed to reconstitute", () => {
      const createdAt = new Date("2023-01-01");
      const wishlist = Wishlist.reconstitute({
        ...validProps,
        items: [],
        createdAt: createdAt,
        updatedAt: new Date(),
      });

      // Mutate the date passed to reconstitute
      createdAt.setFullYear(2025);

      expect(wishlist.createdAt.getFullYear()).toBe(2023);
    });
  });
});
