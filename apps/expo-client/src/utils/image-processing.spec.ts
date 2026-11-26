import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { manipulate, resize, extent, renderAsync, saveAsync } = vi.hoisted(
  () => ({
    manipulate: vi.fn(),
    resize: vi.fn(),
    extent: vi.fn(),
    renderAsync: vi.fn(),
    saveAsync: vi.fn(),
  }),
);

vi.mock("expo-image-manipulator", () => ({
  ImageManipulator: { manipulate },
  SaveFormat: { JPEG: "jpeg", PNG: "png" },
}));

import {
  MAX_IMAGE_SIDE,
  MAX_PNG_BYTES,
  FLATTEN_BACKGROUND,
  computeResize,
  withExtension,
  assertIsImage,
  isNotAnImageError,
  NotAnImageError,
  prepareImageForUpload,
  releasePreparedImage,
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

  describe("assertIsImage", () => {
    it("should accept images", () => {
      expect(() => {
        assertIsImage({
          uri: "blob:x",
          mimeType: "image/jpeg",
          width: 10,
          height: 10,
        });
      }).not.toThrow();
    });

    it("should accept images with unknown metadata", () => {
      expect(() => {
        assertIsImage({ uri: "file:///x.jpg" });
      }).not.toThrow();
    });

    it("should reject non-image MIME types", () => {
      for (const mimeType of [
        "video/mp4",
        "application/pdf",
        "text/markdown",
      ]) {
        expect(() => {
          assertIsImage({ uri: "blob:x", mimeType });
        }).toThrow(NotAnImageError);
      }
    });

    it("should reject images that could not be decoded (0x0)", () => {
      expect(() => {
        assertIsImage({
          uri: "blob:x",
          mimeType: "image/jpeg",
          width: 0,
          height: 0,
        });
      }).toThrow(NotAnImageError);
    });
  });

  describe("isNotAnImageError", () => {
    it("should recognise NotAnImageError", () => {
      expect(isNotAnImageError(new NotAnImageError("text/plain"))).toBe(true);
    });

    it("should recognise the picker's unsupported type error", () => {
      expect(
        isNotAnImageError(
          new Error(
            "Unsupported file type: text/markdown. Only images and videos are supported.",
          ),
        ),
      ).toBe(true);
    });

    it("should not flag other errors", () => {
      expect(isNotAnImageError(new Error("Network request failed"))).toBe(
        false,
      );
      expect(isNotAnImageError("Unsupported file type")).toBe(false);
      expect(isNotAnImageError(undefined)).toBe(false);
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
      const context = { resize, extent, renderAsync };
      manipulate.mockReturnValue(context);
      resize.mockReturnValue(context);
      extent.mockReturnValue(context);
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          blob: () => Promise.resolve({ size: 500_000 }),
        }),
      );
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

    it("should keep PNG images as PNG to preserve transparency", async () => {
      const result = await prepareImageForUpload({
        uri: "blob:png",
        fileName: "logo.png",
        mimeType: "image/png",
        width: 800,
        height: 600,
      });

      expect(saveAsync).toHaveBeenCalledWith({ format: "png" });
      expect(extent).not.toHaveBeenCalled();
      expect(result.fileName).toBe("logo.png");
      expect(result.mimeType).toBe("image/png");
    });

    it("should flatten oversized PNGs onto white and save them as JPEG on web", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          blob: () => Promise.resolve({ size: MAX_PNG_BYTES + 1 }),
        }),
      );

      const result = await prepareImageForUpload(
        {
          uri: "blob:huge-png",
          fileName: "huge.png",
          mimeType: "image/png",
          width: 4000,
          height: 3000,
        },
        { canFlatten: true },
      );

      expect(extent).toHaveBeenCalledWith({
        backgroundColor: FLATTEN_BACKGROUND,
        width: 1600,
        height: 1200,
      });
      expect(saveAsync).toHaveBeenLastCalledWith({
        compress: 0.8,
        format: "jpeg",
      });
      expect(result.fileName).toBe("huge.jpg");
      expect(result.mimeType).toBe("image/jpeg");
    });

    it("should save oversized PNGs as JPEG without flattening when unsupported", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          blob: () => Promise.resolve({ size: MAX_PNG_BYTES + 1 }),
        }),
      );

      const result = await prepareImageForUpload({
        uri: "file:///huge.png",
        fileName: "huge.png",
        mimeType: "image/png",
        width: 4000,
        height: 3000,
      });

      expect(extent).not.toHaveBeenCalled();
      expect(result.mimeType).toBe("image/jpeg");
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

    describe("temporary blob URLs", () => {
      const revokeObjectURL = vi.fn();
      const hugePng = {
        uri: "blob:original",
        fileName: "huge.png",
        mimeType: "image/png",
        width: 4000,
        height: 3000,
      };
      const revoked = () =>
        revokeObjectURL.mock.calls.map(([uri]) => uri as string).sort();

      beforeEach(() => {
        vi.spyOn(URL, "revokeObjectURL").mockImplementation(revokeObjectURL);
        renderAsync
          .mockResolvedValueOnce({ saveAsync, uri: "blob:rendered-1" })
          .mockResolvedValueOnce({ saveAsync, uri: "blob:rendered-2" });
        saveAsync
          .mockResolvedValueOnce({ uri: "blob:saved-1", width: 1, height: 1 })
          .mockResolvedValueOnce({ uri: "blob:saved-2", width: 1, height: 1 });
      });

      afterEach(() => {
        renderAsync.mockReset();
        saveAsync.mockReset();
        vi.restoreAllMocks();
      });

      it("should release the rendered image but not the output", async () => {
        const result = await prepareImageForUpload({ uri: "blob:original" });

        expect(result.uri).toBe("blob:saved-1");
        expect(revoked()).toEqual(["blob:rendered-1"]);
      });

      it("should release every intermediate of an oversized PNG", async () => {
        vi.stubGlobal(
          "fetch",
          vi.fn().mockResolvedValue({
            blob: () => Promise.resolve({ size: MAX_PNG_BYTES + 1 }),
          }),
        );

        const result = await prepareImageForUpload(hugePng, {
          canFlatten: true,
        });

        expect(result.uri).toBe("blob:saved-2");
        expect(revoked()).toEqual([
          "blob:rendered-1",
          "blob:rendered-2",
          "blob:saved-1",
        ]);
      });

      it("should keep the original but release intermediates when processing fails", async () => {
        vi.spyOn(console, "warn").mockImplementation(() => undefined);
        saveAsync.mockReset().mockRejectedValue(new Error("encode failed"));

        const result = await prepareImageForUpload({ uri: "blob:original" });

        expect(result.uri).toBe("blob:original");
        expect(revoked()).toEqual(["blob:rendered-1"]);
      });

      it("should release a prepared image after use", () => {
        releasePreparedImage({ uri: "blob:saved" }, { uri: "blob:original" });
        expect(revoked()).toEqual(["blob:saved"]);
      });

      it("should never release the caller's original or non-blob URIs", () => {
        releasePreparedImage(
          { uri: "blob:original" },
          { uri: "blob:original" },
        );
        releasePreparedImage(
          { uri: "file:///saved.jpg" },
          { uri: "file:///original.jpg" },
        );
        expect(revoked()).toEqual([]);
      });
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
