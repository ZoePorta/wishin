import { describe, it, expect, vi, beforeEach } from "vitest";

const { manipulate, resize, renderAsync, saveAsync } = vi.hoisted(() => ({
  manipulate: vi.fn(),
  resize: vi.fn(),
  renderAsync: vi.fn(),
  saveAsync: vi.fn(),
}));

vi.mock("expo-image-manipulator", () => ({
  ImageManipulator: { manipulate },
  SaveFormat: { JPEG: "jpeg", PNG: "png" },
}));

import {
  MAX_IMAGE_SIDE,
  computeResize,
  outputFormatFor,
  withExtension,
  prepareImageForUpload,
} from "./image-processing";

describe("image-processing", () => {
  describe("computeResize", () => {
    it("should not resize images that already fit", () => {
      expect(computeResize(800, 600)).toBeNull();
      expect(computeResize(MAX_IMAGE_SIDE, MAX_IMAGE_SIDE)).toBeNull();
    });

    it("should constrain the width of landscape images", () => {
      expect(computeResize(4000, 3000)).toEqual({ width: MAX_IMAGE_SIDE });
    });

    it("should constrain the height of portrait images", () => {
      expect(computeResize(3000, 4000)).toEqual({ height: MAX_IMAGE_SIDE });
    });

    it("should not resize when dimensions are unknown", () => {
      expect(computeResize(0, 0)).toBeNull();
      expect(computeResize(undefined, 4000)).toBeNull();
    });
  });

  describe("outputFormatFor", () => {
    it("should keep PNG to preserve transparency", () => {
      expect(outputFormatFor("image/png")).toEqual({
        format: "png",
        mimeType: "image/png",
        extension: "png",
      });
    });

    it("should use JPEG for everything else", () => {
      for (const mime of [
        "image/jpeg",
        "image/webp",
        "image/heic",
        undefined,
      ]) {
        expect(outputFormatFor(mime)).toEqual({
          format: "jpeg",
          mimeType: "image/jpeg",
          extension: "jpg",
        });
      }
    });
  });

  describe("withExtension", () => {
    it("should replace the existing extension", () => {
      expect(withExtension("photo.HEIC", "jpg")).toBe("photo.jpg");
      expect(withExtension("my.cat.png", "jpg")).toBe("my.cat.jpg");
    });

    it("should append an extension when there is none", () => {
      expect(withExtension("photo", "jpg")).toBe("photo.jpg");
    });

    it("should fall back to a default name", () => {
      expect(withExtension(undefined, "png")).toBe("image.png");
      expect(withExtension("", "jpg")).toBe("image.jpg");
    });
  });

  describe("prepareImageForUpload", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      const context = { resize, renderAsync };
      manipulate.mockReturnValue(context);
      resize.mockReturnValue(context);
      renderAsync.mockResolvedValue({ saveAsync });
      saveAsync.mockResolvedValue({
        uri: "blob:resized",
        width: 1600,
        height: 1200,
      });
    });

    it("should resize and re-encode large photos as JPEG", async () => {
      const result = await prepareImageForUpload({
        uri: "blob:original",
        fileName: "camera.jpeg",
        mimeType: "image/jpeg",
        fileSize: 8_000_000,
        width: 4000,
        height: 3000,
      });

      expect(manipulate).toHaveBeenCalledWith("blob:original");
      expect(resize).toHaveBeenCalledWith({ width: MAX_IMAGE_SIDE });
      expect(saveAsync).toHaveBeenCalledWith({
        compress: 0.8,
        format: "jpeg",
      });
      expect(result).toEqual({
        uri: "blob:resized",
        fileName: "camera.jpg",
        mimeType: "image/jpeg",
        width: 1600,
        height: 1200,
      });
    });

    it("should re-encode without resizing when the image already fits", async () => {
      await prepareImageForUpload({
        uri: "blob:small",
        width: 800,
        height: 600,
      });

      expect(resize).not.toHaveBeenCalled();
      expect(saveAsync).toHaveBeenCalled();
    });

    it("should fall back to the original image if processing fails", async () => {
      const original = {
        uri: "blob:weird",
        fileName: "weird.heic",
        mimeType: "image/heic",
        width: 4000,
        height: 3000,
      };
      renderAsync.mockRejectedValue(new Error("decode failed"));
      vi.spyOn(console, "warn").mockImplementation(() => undefined);

      await expect(prepareImageForUpload(original)).resolves.toEqual(original);
    });
  });
});
