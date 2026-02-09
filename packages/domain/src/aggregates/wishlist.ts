import { WishlistItem } from "../entities/wishlist-item";

export enum WishlistVisibility {
  LINK = "LINK",
  PRIVATE = "PRIVATE",
}

export enum WishlistParticipation {
  ANYONE = "ANYONE",
  REGISTERED = "REGISTERED",
  CONTACTS = "CONTACTS",
}

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

export class Wishlist {
  private constructor(private readonly props: WishlistProps) {}

  public static create(
    _props: Omit<
      WishlistProps,
      "items" | "createdAt" | "updatedAt" | "visibility" | "participation"
    > & {
      items?: WishlistItem[];
      createdAt?: Date;
      updatedAt?: Date;
      visibility?: WishlistVisibility;
      participation?: WishlistParticipation;
    },
  ): Wishlist {
    throw new Error("Not implemented");
  }

  public static reconstitute(_props: WishlistProps): Wishlist {
    throw new Error("Not implemented");
  }

  public update(
    _props: Partial<
      Pick<
        WishlistProps,
        "title" | "description" | "visibility" | "participation"
      >
    >,
  ): Wishlist {
    throw new Error("Not implemented");
  }

  public addItem(_item: WishlistItem): Wishlist {
    throw new Error("Not implemented");
  }

  public removeItem(_itemId: string): Wishlist {
    throw new Error("Not implemented");
  }

  public equals(_other: Wishlist): boolean {
    throw new Error("Not implemented");
  }

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
    return [...this.props.items];
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private toProps(): WishlistProps {
    return { ...this.props };
  }
}
