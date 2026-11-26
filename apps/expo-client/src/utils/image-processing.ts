import {
  ImageManipulator,
  SaveFormat,
  type ImageManipulatorContext,
} from "expo-image-manipulator";

/**
 * Client-side image normalization before upload — see ADR 031.
 */

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
 * Largest PNG (in bytes) uploaded as-is. Above this, the image is converted to JPEG so it stays
 * below the Appwrite SDK's 5 MB chunked-upload threshold, which does not work on web (ADR 031).
 */
export const MAX_PNG_BYTES = 4 * 1024 * 1024;

/**
 * Colour transparent pixels are flattened onto when an oversized PNG is converted to JPEG.
 * This is image data baked into the file (not a UI colour), so it is deliberately not a theme token:
 * the stored file is shared by every viewer regardless of their theme (ADR 031).
 */
export const FLATTEN_BACKGROUND = "#FFFFFF";

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
 * Thrown when the picked file is not an image the app can use.
 */
export class NotAnImageError extends Error {
  /**
   * @param detail - What was wrong (e.g. the MIME type), for logs.
   */
  constructor(detail: string) {
    super(`Not an image: ${detail}`);
    this.name = "NotAnImageError";
  }
}

/**
 * Ensures a picked file is a usable image before it is processed and uploaded.
 *
 * Rejects non-`image/*` MIME types (e.g. a video, PDF or text file picked via "All files") and
 * images the platform could not decode (`expo-image-picker` on web reports 0×0 for those).
 * Missing metadata is accepted, since native pickers always return images.
 *
 * @param image - The picked file.
 * @throws {NotAnImageError} If the file is not a usable image.
 */
export function assertIsImage(image: PickedImage): void {
  if (image.mimeType && !image.mimeType.startsWith("image/")) {
    throw new NotAnImageError(image.mimeType);
  }
  if (image.width === 0 && image.height === 0) {
    throw new NotAnImageError("could not decode image");
  }
}

/**
 * Whether an error means "the user picked something that is not an image".
 * Covers {@link NotAnImageError} and the web picker's own unsupported-type error
 * (surfaced thanks to `patches/expo-image-picker@17.0.10.patch`).
 *
 * @param err - Any thrown value.
 * @returns True for not-an-image errors.
 */
export function isNotAnImageError(err: unknown): boolean {
  if (err instanceof NotAnImageError) return true;
  return err instanceof Error && /unsupported file type/i.test(err.message);
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
 * Measures the size in bytes of a local/blob/data URI.
 *
 * @param uri - The URI to measure.
 * @returns The size in bytes, or `undefined` if it cannot be fetched.
 */
async function getUriSize(uri: string): Promise<number | undefined> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob.size;
  } catch {
    return undefined;
  }
}

/**
 * Frees the memory behind a web Blob URL. Other URIs (native files) are ignored.
 *
 * @param uri - The URI to release.
 */
function revokeBlobUri(uri: string): void {
  if (uri.startsWith("blob:")) URL.revokeObjectURL(uri);
}

/**
 * Releases the output of {@link prepareImageForUpload} once it is no longer needed.
 * The caller-owned original is never released, so this is safe after a fallback.
 *
 * @param prepared - The image returned by {@link prepareImageForUpload}.
 * @param original - The image that was passed to it.
 */
export function releasePreparedImage(
  prepared: PickedImage,
  original: PickedImage,
): void {
  if (prepared.uri !== original.uri) revokeBlobUri(prepared.uri);
}

/**
 * Platform-dependent options for {@link prepareImageForUpload}.
 */
export interface PrepareImageOptions {
  /**
   * Whether the manipulator supports `extent` with a background colour (web only).
   * When false, oversized PNGs are converted to JPEG without flattening.
   */
  canFlatten?: boolean;
}

/**
 * Starts a manipulation of `uri`, scaled down to fit {@link MAX_IMAGE_SIDE}.
 *
 * @param image - The source image.
 * @returns The manipulator context with the resize applied (if needed).
 */
function startResized(image: PickedImage): ImageManipulatorContext {
  const context = ImageManipulator.manipulate(image.uri);
  const resize = computeResize(image.width, image.height);
  if (resize) {
    context.resize(resize);
  }
  return context;
}

/**
 * Prepares a picked image for upload (ADR 031): scales it down to {@link MAX_IMAGE_SIDE} and re-encodes it.
 *
 * - PNGs stay PNG so transparency is preserved and the UI's theme colour shows through.
 *   If the result exceeds {@link MAX_PNG_BYTES}, it is converted to JPEG instead — flattened onto
 *   {@link FLATTEN_BACKGROUND} when `options.canFlatten` is set (`extent` is web-only, so native
 *   keeps the encoder's default).
 * - Everything else becomes JPEG at {@link JPEG_QUALITY}.
 *
 * This keeps uploads below the Appwrite SDK's 5 MB chunking threshold — chunked uploads rely on
 * `expo-file-system`, which is unavailable on web, so large camera photos used to fail there.
 * Successful re-encoding also strips EXIF metadata (e.g. GPS location).
 *
 * Shared by every upload (item images and avatar); future steps such as cropping belong here.
 *
 * @param image - The image picked by the user.
 * @param options - Platform-dependent options (see {@link PrepareImageOptions}).
 * @returns The processed image (without `fileSize`, which is resolved later), or the original
 *   image unchanged if processing fails (e.g. a format the platform cannot decode). Pass it to
 *   {@link releasePreparedImage} when done; intermediate results are released internally.
 */
export async function prepareImageForUpload(
  image: PickedImage,
  options: PrepareImageOptions = {},
): Promise<PickedImage> {
  // Intermediate Blob URLs (web only) that would otherwise live until the page unloads.
  const temporaryUris: string[] = [];
  const render = async (context: ImageManipulatorContext) => {
    const rendered = await context.renderAsync();
    // Web image refs expose a Blob URL that the shared types don't declare.
    const { uri } = rendered as { uri?: string };
    if (uri) temporaryUris.push(uri);
    return rendered;
  };

  try {
    const rendered = await render(startResized(image));

    if (image.mimeType === "image/png") {
      const png = await rendered.saveAsync({ format: SaveFormat.PNG });
      const size = await getUriSize(png.uri);
      if (size !== undefined && size <= MAX_PNG_BYTES) {
        return {
          uri: png.uri,
          fileName: withExtension(image.fileName, "png"),
          mimeType: "image/png",
          fileSize: size,
          width: png.width,
          height: png.height,
        };
      }

      temporaryUris.push(png.uri);

      if (options.canFlatten) {
        const flattened = await render(
          startResized(image).extent({
            backgroundColor: FLATTEN_BACKGROUND,
            width: png.width,
            height: png.height,
          }),
        );
        return await saveAsJpeg(flattened, image);
      }
    }

    return await saveAsJpeg(rendered, image);
  } catch (err) {
    console.warn("Image processing failed, uploading original:", err);
    return image;
  } finally {
    temporaryUris.forEach(revokeBlobUri);
  }
}

/**
 * Encodes a rendered image as JPEG at {@link JPEG_QUALITY}.
 *
 * @param rendered - The rendered image reference.
 * @param source - The original image, used for the file name.
 * @returns The JPEG image.
 */
async function saveAsJpeg(
  rendered: Awaited<ReturnType<ImageManipulatorContext["renderAsync"]>>,
  source: PickedImage,
): Promise<PickedImage> {
  const result = await rendered.saveAsync({
    compress: JPEG_QUALITY,
    format: SaveFormat.JPEG,
  });
  return {
    uri: result.uri,
    fileName: withExtension(source.fileName, "jpg"),
    mimeType: "image/jpeg",
    width: result.width,
    height: result.height,
  };
}
