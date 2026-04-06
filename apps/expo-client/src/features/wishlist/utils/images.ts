import type { ImageSourcePropType } from "react-native";
import { Config } from "../../../constants/Config";

/**
 * Resolves the image source for a wishlist item.
 * Centralizes the logic for handling relative paths (prepended with Config.baseUrl)
 * and falling back to a global placeholder asset when no image is provided.
 *
 * @param {string | null | undefined} imageUrl - The image URL from the item DTO.
 * @returns {ImageSourcePropType} The resolved image source for React Native components.
 */
export const getItemImageSource = (
  imageUrl: string | null | undefined,
): ImageSourcePropType => {
  const path =
    imageUrl && imageUrl.trim() !== ""
      ? imageUrl
      : "/item_image_placeholder.png";

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return { uri: path };
  }

  // Handle local public assets
  return {
    uri: path.startsWith("/") ? `${Config.baseUrl}${path}` : path,
  };
};
