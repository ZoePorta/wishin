import { Wishlist } from "../aggregates/wishlist";
import { WishlistRepository } from "../repositories/wishlist.repository";
import { CreateWishlistInput, WishlistOutput } from "./dtos";
import { WishlistOutputMapper } from "./mappers/wishlist-output.mapper";

/**
 * Use case for creating a new wishlist.
 */
export class CreateWishlistUseCase {
  constructor(
    private readonly wishlistRepository: WishlistRepository,
    private readonly uuidFn: () => string = () =>
      globalThis.crypto.randomUUID(),
  ) {}

  /**
   * Executes the use case to create and save a new wishlist.
   *
   * @param input - The data for creating the wishlist.
   * @returns A Promise that resolves to the created WishlistOutput DTO.
   */
  async execute(input: CreateWishlistInput): Promise<WishlistOutput> {
    const wishlist = Wishlist.create({
      id: this.uuidFn(),
      ownerId: input.ownerId,
      title: input.title,
      description: input.description,
      visibility: input.visibility,
      participation: input.participation,
    });

    await this.wishlistRepository.save(wishlist);

    return WishlistOutputMapper.toDTO(wishlist);
  }
}
