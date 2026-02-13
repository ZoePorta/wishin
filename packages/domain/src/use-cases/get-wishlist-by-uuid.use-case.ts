import { WishlistRepository } from "../repositories/wishlist.repository";
import { GetWishlistInput, WishlistOutput } from "./dtos/get-wishlist.dto";
import { NotFoundError } from "../errors/domain-errors";

/**
 * Use case to fetch a wishlist by its unique identifier.
 */
export class GetWishlistByUUIDUseCase {
  constructor(private readonly wishlistRepo: WishlistRepository) {}

  /**
   * Executes the use case.
   * @param input - The input DTO containing the wishlist ID.
   * @returns A Promise that resolves to the WishlistOutput DTO.
   * @throws {NotFoundError} If the wishlist is not found.
   */
  async execute(input: GetWishlistInput): Promise<WishlistOutput> {
    const wishlist = await this.wishlistRepo.findById(input.id);

    if (!wishlist) {
      throw new NotFoundError("Wishlist not found");
    }

    const props = wishlist.toProps();

    return {
      id: props.id,
      title: props.title,
      description: props.description,
      ownerId: props.ownerId,
      visibility: props.visibility,
      participation: props.participation,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
      items: props.items.map((item) => {
        const itemProps = item.toProps();
        return {
          id: itemProps.id,
          name: itemProps.name,
          description: itemProps.description,
          url: itemProps.url,
          price: itemProps.price,
          currency: itemProps.currency,
          priority: itemProps.priority.toString(),
          imageUrl: itemProps.imageUrl,
          totalQuantity: itemProps.totalQuantity,
          reservedQuantity: itemProps.reservedQuantity,
          purchasedQuantity: itemProps.purchasedQuantity,
          availableQuantity: item.availableQuantity,
          isUnlimited: itemProps.isUnlimited,
        };
      }),
    };
  }
}
