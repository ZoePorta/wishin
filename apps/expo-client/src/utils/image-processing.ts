import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

/**
 * Longest side (in px) an uploaded image is scaled down to.
 * Item images and avatars are displayed small, so this keeps them sharp while
 * shrinking multi-megabyte camera photos to a few hundred KB.
 */
export const MAX_IMAGE_SIDE = 1600;

/**
 * JPEG compression applied when re-encoding (0–1).
 */
export const JPEG_QUALITY = 0.8;

/**
 * An image picked by the user, as handed to the upload pipeline.
 * Field names mirror `expo-image-picker`'s `ImagePickerAsset`.
 */
export interface PickedImage {
  uri: string;
  fileName?: string | null;
  mimeType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
}

/**
 * Computes the resize action needed to fit an image within {@link MAX_IMAGE_SIDE}.
 * Only the longest side is constrained, so the aspect ratio is preserved.
 *
 * @param width - Original width in px (0/undefined when unknown).
 * @param height - Original height in px (0/undefined when unknown).
 * @param maxSide - Maximum allowed length of the longest side.
 * @returns The resize action, or `null` if the image already fits or its size is unknown (never upscales).
 */
export function computeResize(
  width: number | undefined,
  height: number | undefined,
  maxSide: number = MAX_IMAGE_SIDE,
): { width: number } | { height: number } | null {
  if (!width || !height) return null;
  if (Math.max(width, height) <= maxSide) return null;
  return width >= height ? { width: maxSide } : { height: maxSide };
}

/**
 * Picks the output encoding for a re-encoded image.
 * PNG is kept to preserve transparency (common in product shots); everything else becomes JPEG.
 *
 * @param mimeType - MIME type of the original image.
 * @returns The manipulator format plus the resulting MIME type and file extension.
 */
export function outputFormatFor(mimeType: string | undefined): {
  format: SaveFormat;
  mimeType: string;
  extension: string;
} {
  if (mimeType === "image/png") {
    return { format: SaveFormat.PNG, mimeType: "image/png", extension: "png" };
  }
  return { format: SaveFormat.JPEG, mimeType: "image/jpeg", extension: "jpg" };
}

/**
 * Replaces (or appends) a file name's extension.
 *
 * @param fileName - Original file name; falls back to `image` when missing.
 * @param extension - New extension, without the dot.
 * @returns The file name with the new extension.
 */
export function withExtension(
  fileName: string | null | undefined,
  extension: string,
): string {
  const base = fileName ? fileName.replace(/\.[^./]*$/, "") : "";
  return `${base || "image"}.${extension}`;
}

/**
 * Prepares a picked image for upload: scales it down to {@link MAX_IMAGE_SIDE} and re-encodes it.
 *
 * This keeps uploads below the Appwrite SDK's 5 MB chunking threshold — chunked uploads rely on
 * `expo-file-system`, which is unavailable on web, so large camera photos used to fail there.
 * Re-encoding also strips EXIF metadata (e.g. GPS location).
 *
 * Shared by every upload (item images and avatar); future steps such as cropping belong here.
 *
 * @param image - The image picked by the user.
 * @returns The processed image (without `fileSize`, which is resolved later), or the original
 *   image unchanged if processing fails (e.g. a format the platform cannot decode).
 */
export async function prepareImageForUpload(
  image: PickedImage,
): Promise<PickedImage> {
  try {
    const output = outputFormatFor(image.mimeType);
    const context = ImageManipulator.manipulate(image.uri);
    const resize = computeResize(image.width, image.height);
    if (resize) {
      context.resize(resize);
    }
    const rendered = await context.renderAsync();
    const result = await rendered.saveAsync({
      compress: JPEG_QUALITY,
      format: output.format,
    });

    return {
      uri: result.uri,
      fileName: withExtension(image.fileName, output.extension),
      mimeType: output.mimeType,
      width: result.width,
      height: result.height,
    };
  } catch (err) {
    console.warn("Image processing failed, uploading original:", err);
    return image;
  }
}
