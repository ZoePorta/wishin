# ADR 031: Client-Side Image Normalization Before Upload

## Status

Accepted

Amends [ADR 022](022-image-management-via-appwrite-storage.md)

## Context

Users upload images for wishlist items and for their profile avatar. Both flows end in the same pipeline (`useImagePickerAndUpload` → `UploadImageUseCase` → `AppwriteStorageRepository`).

Two problems surfaced in production:

- **Large images failed silently on web.** `react-native-appwrite` uploads files over 5 MB in chunks and reads each chunk with `expo-file-system`, which is not available on web (`UnavailabilityError`). A photo taken with a phone camera (typically 3–10 MB) therefore never uploaded from the web client. The failure alert used React Native's `Alert`, which is a no-op on web, so the user saw nothing.
- **Images were stored at full size.** ADR 022 planned to rely on Appwrite's preview generation for resizing and optimization, but the client stores and displays the `/view` URL, which serves the original file untransformed. Multi-megabyte originals were downloaded wherever an item image or avatar is shown, even though they are displayed at small sizes. Originals also kept their EXIF metadata (including GPS location).

## Decision

Every image is normalized **on the client, before upload**, in a single shared step: `prepareImageForUpload()` (`apps/expo-client/src/utils/image-processing.ts`), implemented with `expo-image-manipulator`.

1. **One shared step for all uploads.** Item images and the avatar go through the same function, called from `useImagePickerAndUpload`. Forms never process images themselves.
2. **Resize.** The longest side is scaled down to **1600 px**, preserving the aspect ratio. Images are never upscaled, and images with unknown dimensions are not resized (they are still re-encoded).
3. **Encoding.**
   - **JPEG at quality 0.8** for everything except PNG.
   - **PNG stays PNG**, so transparency is preserved. The stored file has no background colour baked in; the UI draws it over the current theme surface at render time, so it adapts to light/dark themes and future theme changes.
   - **Oversized PNG guard.** If the re-encoded PNG is larger than **4 MB** (below the SDK's 5 MB chunking threshold), it is converted to JPEG instead. On web it is first flattened onto **white** (`extent` with `backgroundColor`). `extent` is web-only in `expo-image-manipulator`, so on native the JPEG encoder's default is used (transparent areas may turn black). This is an accepted edge case: real photos are rarely PNG.
4. **No theme colour is baked into files.** A stored image is shared by every viewer regardless of their theme, so a background taken from the uploader's theme would look wrong for others. White is used only as the neutral fallback for the oversized-PNG case.
5. **Metadata is stripped.** Re-encoding drops EXIF data, including location.
6. **Fail open.** If processing fails (e.g. a format the platform cannot decode), the original image is uploaded unchanged and any upload error is shown to the user.
7. **Errors are visible on every platform.** The upload pipeline uses `UniversalAlert` instead of React Native's `Alert`.
8. **Extension point.** The pipeline is pick → **prepare** → upload. Future processing steps belong inside `prepareImageForUpload()`. Square cropping for all uploads is planned there (see `docs/roadmap.md`); it will run before the resize.

This amends ADR 022, decision 4: image resizing and optimization happen on the client rather than through Appwrite preview generation. Storage, repository and URL persistence (the rest of ADR 022) are unchanged.

## Consequences

- **Positive**:
  - Camera photos and other large images upload on web; the 5 MB chunked-upload path is avoided in practice on every platform.
  - Stored images are typically a few hundred KB, so they load faster and use less storage and bandwidth.
  - Transparent PNGs keep their transparency and follow the app's theme.
  - Location and other EXIF metadata are removed from item images and avatars whenever re-encoding succeeds.
  - Cropping can be added in one place and applies to every upload.
- **Negative**:
  - New native dependency (`expo-image-manipulator`): Android/iOS builds must be regenerated to include it.
  - Processing runs on the user's device and adds a short delay before upload (mitigated by a "Processing…" loader in `ImagePickerField`).
  - Metadata removal is not guaranteed: the fail-open path (decision 6) uploads the original unchanged, which can retain GPS and other EXIF metadata.
  - Originals are not kept: images are capped at 1600 px, and JPEG compression is lossy.
  - An oversized transparent PNG loses its transparency (white on web, encoder default on native).
  - Images uploaded before this change remain at their original size; they are not migrated.
