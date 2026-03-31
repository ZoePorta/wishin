import { WishlistRepository } from "../repositories/wishlist.repository";
import { ProfileRepository } from "../repositories/profile.repository";
import { GetWishlistInput, WishlistOutput } from "./dtos/get-wishlist.dto";
import { NotFoundError } from "../errors/domain-errors";
import { WishlistOutputMapper } from "./mappers/wishlist-output.mapper";
import { ProfileOutputMapper } from "./mappers/profile-output.mapper";

/**
 * Use case to fetch a wishlist by its unique identifier.
 */
export class GetWishlistByUUIDUseCase {
  constructor(
    private readonly wishlistRepo: WishlistRepository,
    private readonly profileRepo: ProfileRepository,
  ) {}

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

    const ownerProfile = await this.profileRepo.findById(wishlist.ownerId);

    return WishlistOutputMapper.toDTO(
      wishlist,
      ownerProfile ? ProfileOutputMapper.toDTO(ownerProfile) : undefined,
    );
  }
}
