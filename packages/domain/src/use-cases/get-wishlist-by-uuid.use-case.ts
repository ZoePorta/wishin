import { WishlistRepository } from "../repositories/wishlist.repository";
import { GetWishlistInput, WishlistOutput } from "./dtos/get-wishlist.dto";
import { NotFoundError } from "../errors/domain-errors";
import { WishlistOutputMapper } from "./mappers/wishlist-output.mapper";

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

    return WishlistOutputMapper.toDTO(wishlist);
  }
}
