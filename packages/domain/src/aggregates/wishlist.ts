import { WishlistItem } from "../entities/wishlist-item";
import {
  InvalidAttributeError,
  LimitExceededError,
  InvalidOperationError,
} from "../errors/domain-errors";
import { ValidationMode } from "../common/validation-mode";

import { isValidUUID } from "../common/validation-utils";

/**
 * Controls who can view the wishlist.
 * - LINK: Anyone with the UUID link can view.
 * - PRIVATE: Only the owner can view.
 */
export enum WishlistVisibility {
  LINK = "LINK",
  PRIVATE = "PRIVATE",
}

/**
 * Controls who can perform actions (reserve/purchase) on wishlist items.
 * - ANYONE: Any viewer can participate.
 * - REGISTERED: Only registered users can participate.
 * - CONTACTS: Only contacts of the owner can participate.
 */
export enum WishlistParticipation {
  ANYONE = "ANYONE",
  REGISTERED = "REGISTERED",
  CONTACTS = "CONTACTS",
}

/**
 * Interface representing the properties of a Wishlist.
 *
 * @property id - Unique identifier (UUID v4) for the wishlist.
 * @property ownerId - UUID of the user who owns the wishlist.
 * @property title - Human-readable title of the wishlist.
 * @property description - Optional detailed description of the wishlist.
 * @property visibility - Visibility setting (e.g., LINK, PRIVATE).
 * @property participation - Participation setting (e.g., ANYONE, REGISTERED).
 * @property items - Collection of WishlistItems included in the list.
 * @property createdAt - Timestamp when the wishlist was created.
 * @property updatedAt - Timestamp when the wishlist was last updated.
 *
 * This interface is a data structure and does not throw exceptions or return values.
 */
export interface WishlistProps {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  visibility: WishlistVisibility;
  participation: WishlistParticipation;
  items: WishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Aggregate Root representing a collection of items (Wishlist).
 *
 * Identity is preserved via UUID v4.
 *
 * Key Invariants:
 * - Max 100 items per wishlist.
 * - Items must belong to this wishlist (wishlistId match).
 * - Title/Description length constraints.
 */
export class Wishlist {
  public get id(): string {
    return this.props.id;
  }
  public get ownerId(): string {
    return this.props.ownerId;
  }
  public get title(): string {
    return this.props.title;
  }
  public get description(): string | undefined {
    return this.props.description;
  }
  public get visibility(): WishlistVisibility {
    return this.props.visibility;
  }
  public get participation(): WishlistParticipation {
    return this.props.participation;
  }
  public get items(): WishlistItem[] {
    return this.props.items;
  }
  public get createdAt(): Date {
    return this.props.createdAt;
  }
  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private readonly props: WishlistProps;

  private constructor(props: WishlistProps, mode: ValidationMode) {
    this.props = props;
    this.validate(mode);
  }

  /**
   * Factory method to create a new Wishlist.
   * Enforces strict business validation.
   * @param props - Initial properties for the wishlist.
   * @returns A new valid Wishlist instance.
   * @throws {InvalidAttributeError} If validation fails (structural or business rules).
   */
  public static create(
    props: Omit<WishlistProps, "items" | "createdAt" | "updatedAt"> & {
      items?: WishlistItem[];
      createdAt?: Date;
      updatedAt?: Date;
    },
  ): Wishlist {
    const now = new Date();
    return Wishlist._createWithMode(
      {
        ...props,
        title:
          typeof props.title === "string" ? props.title.trim() : props.title,
        description:
          typeof props.description === "string"
            ? props.description.trim()
            : props.description,
        items: props.items ?? [],
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      ValidationMode.STRICT,
    );
  }

  /**
   * Reconstitutes a Wishlist from persistence.
   * Bypasses business validation to allow loading legacy data.
   * @param props - The properties to restore.
   * @returns A Wishlist instance.
   * @throws {InvalidAttributeError} If structural integrity fails.
   */
  public static reconstitute(props: WishlistProps): Wishlist {
    return Wishlist._createWithMode(
      {
        ...props,
        items: props.items.map((item) =>
          WishlistItem.reconstitute(
            item instanceof WishlistItem ? item.toProps() : item,
          ),
        ),
      },
      ValidationMode.STRUCTURAL,
    );
  }

  private static _createWithMode(
    props: WishlistProps,
    mode: ValidationMode,
  ): Wishlist {
    const sanitizedProps = {
      ...props,
      title: typeof props.title === "string" ? props.title.trim() : props.title,
      description:
        typeof props.description === "string"
          ? props.description.trim()
          : props.description,
    };
    return new Wishlist(sanitizedProps, mode);
  }

  /**
   * Updates editable properties of the Wishlist.
   * Enforces strict business validation on new values.
   * @param props - Partial properties to update.
   * @returns A new Wishlist instance with updated values.
   * @throws {InvalidAttributeError} If validation of new values fails.
   */
  public update(
    props: Partial<
      Pick<
        WishlistProps,
        "title" | "description" | "visibility" | "participation"
      >
    >,
  ): Wishlist {
    // Only allow specific properties to be updated
    const allowedProps: Partial<WishlistProps> = {};
    if (props.title !== undefined) allowedProps.title = props.title;
    if (props.description !== undefined)
      allowedProps.description = props.description;
    if (props.visibility !== undefined)
      allowedProps.visibility = props.visibility;
    if (props.participation !== undefined)
      allowedProps.participation = props.participation;

    const updated = Wishlist._createWithMode(
      {
        ...this.toProps(),
        ...allowedProps,
        updatedAt: new Date(),
      },
      ValidationMode.STRICT,
    );
    return updated;
  }

  /**
   * Adds an item to the wishlist.
   * Uses item.equals() to prevent duplicates.
   * @param item - The item to add.
   * @returns A new Wishlist instance containing the item.
   * @throws {LimitExceededError} If the 100-item limit is reached.
   * @throws {InvalidOperationError} If the item already exists.
   */
  public addItem(item: WishlistItem): Wishlist {
    if (this.items.length >= 100) {
      throw new LimitExceededError(
        "Cannot add more than 100 items to wishlist",
      );
    }

    // Enforce ownership: Item belongs to this wishlist now.
    const ownedItem = item.updateWishlistId(this.id);

    // Check for duplicates using equals
    if (this.items.some((existing) => existing.equals(ownedItem))) {
      throw new InvalidOperationError("Item already exists in the wishlist");
    }

    return Wishlist._createWithMode(
      {
        ...this.toProps(),
        items: [...this.items, ownedItem],
        updatedAt: new Date(),
      },
      ValidationMode.STRUCTURAL,
    );
  }

  /**
   * Removes an item from the wishlist by ID.
   * Uses item.equals() logic (via identity check mostly) to find the object.
   * @param itemId - The ID of the item to remove.
   * @returns A tuple containing the new Wishlist instance and the removed item (or null if not found).
   */
  public removeItem(itemId: string): {
    wishlist: Wishlist;
    removedItem: WishlistItem | null;
  } {
    const itemToRemove = this.items.find((item) => item.id === itemId);

    if (!itemToRemove) {
      return { wishlist: this, removedItem: null };
    }

    return {
      wishlist: Wishlist._createWithMode(
        {
          ...this.toProps(),
          items: this.items.filter((item) => !item.equals(itemToRemove)), // Use equals
          updatedAt: new Date(),
        },
        ValidationMode.STRUCTURAL,
      ),
      removedItem: itemToRemove,
    };
  }

  /**
   * Updates a specific item in the wishlist.
   * @param itemId - The ID of the item to update.
   * @param props - The properties to update.
   * @returns A new Wishlist instance with the updated item.
   * @throws {InvalidOperationError} If item not found.
   */
  public updateItem(
    itemId: string,
    props: Partial<import("../entities/wishlist-item").WishlistItemProps>,
  ): Wishlist {
    const index = this.items.findIndex((item) => item.id === itemId);
    if (index === -1) {
      throw new InvalidOperationError("Item not found");
    }

    const currentItem = this.items[index];
    const updatedItem = currentItem.update(props);

    const newItems = [...this.items];
    newItems[index] = updatedItem;

    return Wishlist._createWithMode(
      {
        ...this.toProps(),
        items: newItems,
        updatedAt: new Date(),
      },
      ValidationMode.STRUCTURAL,
    );
  }

  /**
   * Reserves quantity of an item.
   * @param itemId - The ID of the item.
   * @param amount - Amount to reserve.
   * @returns A new Wishlist instance.
   */
  public reserveItem(itemId: string, amount: number): Wishlist {
    const index = this.items.findIndex((item) => item.id === itemId);
    if (index === -1) {
      throw new InvalidOperationError("Item not found");
    }

    const currentItem = this.items[index];
    const updatedItem = currentItem.reserve(amount);

    const newItems = [...this.items];
    newItems[index] = updatedItem;

    return Wishlist._createWithMode(
      {
        ...this.toProps(),
        items: newItems,
        updatedAt: new Date(),
      },
      ValidationMode.STRUCTURAL,
    );
  }

  /**
   * Purchases quantity of an item.
   * @param itemId - The ID of the item.
   * @param totalAmount - Total amount to purchase.
   * @param consumeFromReserved - Amount to consume from reserved stock.
   * @returns A new Wishlist instance.
   */
  public purchaseItem(
    itemId: string,
    totalAmount: number,
    consumeFromReserved: number,
  ): Wishlist {
    const index = this.items.findIndex((item) => item.id === itemId);
    if (index === -1) {
      throw new InvalidOperationError("Item not found");
    }

    const currentItem = this.items[index];
    const updatedItem = currentItem.purchase(totalAmount, consumeFromReserved);

    const newItems = [...this.items];
    newItems[index] = updatedItem;

    return Wishlist._createWithMode(
      {
        ...this.toProps(),
        items: newItems,
        updatedAt: new Date(),
      },
      ValidationMode.STRUCTURAL,
    );
  }

  /**
   * Cancels reservation of an item.
   * @param itemId - The ID of the item.
   * @param amount - Amount to cancel.
   * @returns A new Wishlist instance.
   */
  public cancelItemReservation(itemId: string, amount: number): Wishlist {
    const index = this.items.findIndex((item) => item.id === itemId);
    if (index === -1) {
      throw new InvalidOperationError("Item not found");
    }

    const currentItem = this.items[index];
    const updatedItem = currentItem.cancelReservation(amount);

    const newItems = [...this.items];
    newItems[index] = updatedItem;

    return Wishlist._createWithMode(
      {
        ...this.toProps(),
        items: newItems,
        updatedAt: new Date(),
      },
      ValidationMode.STRUCTURAL,
    );
  }

  /**
   * Cancels purchase of an item.
   * @param itemId - The ID of the item.
   * @param amount - Amount to cancel.
   * @returns A new Wishlist instance.
   */
  public cancelItemPurchase(itemId: string, amount: number): Wishlist {
    const index = this.items.findIndex((item) => item.id === itemId);
    if (index === -1) {
      throw new InvalidOperationError("Item not found");
    }

    const currentItem = this.items[index];
    const updatedItem = currentItem.cancelPurchase(amount);

    const newItems = [...this.items];
    newItems[index] = updatedItem;

    return Wishlist._createWithMode(
      {
        ...this.toProps(),
        items: newItems,
        updatedAt: new Date(),
      },
      ValidationMode.STRUCTURAL,
    );
  }

  /**
   * Checks equality based on domain identity (ID).
   * @param other - The other Wishlist to compare.
   * @returns True if IDs match, false otherwise.
   */
  public equals(other: Wishlist): boolean {
    return this.id === other.id;
  }

  private validate(mode: ValidationMode): void {
    // Structural Validation (Always)
    if (!isValidUUID(this.id)) {
      throw new InvalidAttributeError("Invalid id: Must be a valid UUID v4");
    }
    if (!isValidUUID(this.ownerId)) {
      throw new InvalidAttributeError(
        "Invalid ownerId: Must be a valid UUID v4",
      );
    }
    if (typeof this.title !== "string") {
      throw new InvalidAttributeError("Invalid title: Must be a string");
    }
    if (
      this.description !== undefined &&
      typeof this.description !== "string"
    ) {
      throw new InvalidAttributeError("Invalid description: Must be a string");
    }
    if (!Object.values(WishlistVisibility).includes(this.visibility)) {
      throw new InvalidAttributeError("Invalid visibility");
    }
    if (!Object.values(WishlistParticipation).includes(this.participation)) {
      throw new InvalidAttributeError("Invalid participation");
    }

    // Item Ownership Validation (Always)
    for (const item of this.items) {
      if (item.wishlistId !== this.id) {
        throw new InvalidAttributeError(
          `Item ${item.id} belongs to a different wishlist (${item.wishlistId})`,
        );
      }
    }

    // Business Validation (Strict)
    if (mode === ValidationMode.STRICT) {
      if (this.items.length > 100) {
        throw new LimitExceededError(
          "Cannot add more than 100 items to wishlist",
        );
      }

      if (this.title.length < 3) {
        throw new InvalidAttributeError(
          "Invalid title: Must be at least 3 characters",
        );
      }
      if (this.title.length > 100) {
        throw new InvalidAttributeError(
          "Invalid title: Must be at most 100 characters",
        );
      }
      if (this.description && this.description.length > 500) {
        throw new InvalidAttributeError(
          "Invalid description: Must be at most 500 characters",
        );
      }
    }
  }

  public toProps(): WishlistProps {
    return { ...this.props };
  }
}
