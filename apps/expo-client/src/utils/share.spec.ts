import { describe, it, expect, vi } from "vitest";
import { shareOrCopyLink, type ShareLinkDeps } from "./share";

const CONTENT = {
  url: "https://wishin.app/wishlist/abc",
  title: "Birthday",
  message: "Check out my wishlist “Birthday”",
};

function abortError(): Error {
  const err = new Error("Share canceled");
  err.name = "AbortError";
  return err;
}

function makeDeps(overrides: Partial<ShareLinkDeps> = {}): ShareLinkDeps {
  return {
    platform: "android",
    nativeShare: vi.fn().mockResolvedValue({ action: "sharedAction" }),
    webShare: undefined,
    copy: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

describe("shareOrCopyLink", () => {
  describe("on native", () => {
    it("opens the native share sheet with the message and link", async () => {
      const deps = makeDeps();

      await expect(shareOrCopyLink(CONTENT, deps)).resolves.toBe("shared");
      expect(deps.nativeShare).toHaveBeenCalledWith({
        title: CONTENT.title,
        message: `${CONTENT.message}\n${CONTENT.url}`,
      });
      expect(deps.copy).not.toHaveBeenCalled();
    });

    it("reports dismissal when the user closes the sheet (iOS)", async () => {
      const deps = makeDeps({
        platform: "ios",
        nativeShare: vi.fn().mockResolvedValue({ action: "dismissedAction" }),
      });

      await expect(shareOrCopyLink(CONTENT, deps)).resolves.toBe("dismissed");
      expect(deps.copy).not.toHaveBeenCalled();
    });

    it("propagates native share failures", async () => {
      const deps = makeDeps({
        nativeShare: vi.fn().mockRejectedValue(new Error("boom")),
      });

      await expect(shareOrCopyLink(CONTENT, deps)).rejects.toThrow("boom");
    });
  });

  describe("on web", () => {
    it("uses the Web Share API when available", async () => {
      const webShare = vi.fn().mockResolvedValue(undefined);
      const deps = makeDeps({ platform: "web", webShare });

      await expect(shareOrCopyLink(CONTENT, deps)).resolves.toBe("shared");
      expect(webShare).toHaveBeenCalledWith({
        title: CONTENT.title,
        text: CONTENT.message,
        url: CONTENT.url,
      });
      expect(deps.nativeShare).not.toHaveBeenCalled();
      expect(deps.copy).not.toHaveBeenCalled();
    });

    it("does not copy when the user cancels the share sheet", async () => {
      const deps = makeDeps({
        platform: "web",
        webShare: vi.fn().mockRejectedValue(abortError()),
      });

      await expect(shareOrCopyLink(CONTENT, deps)).resolves.toBe("dismissed");
      expect(deps.copy).not.toHaveBeenCalled();
    });

    it("falls back to copying when the Web Share API fails", async () => {
      const err = new Error("not allowed");
      err.name = "NotAllowedError";
      const deps = makeDeps({
        platform: "web",
        webShare: vi.fn().mockRejectedValue(err),
      });

      await expect(shareOrCopyLink(CONTENT, deps)).resolves.toBe("copied");
      expect(deps.copy).toHaveBeenCalledWith(CONTENT.url);
    });

    it("copies the link when the Web Share API is unavailable", async () => {
      const deps = makeDeps({ platform: "web", webShare: undefined });

      await expect(shareOrCopyLink(CONTENT, deps)).resolves.toBe("copied");
      expect(deps.copy).toHaveBeenCalledWith(CONTENT.url);
      expect(deps.nativeShare).not.toHaveBeenCalled();
    });

    it("fails when the clipboard reports that nothing was copied", async () => {
      const deps = makeDeps({
        platform: "web",
        copy: vi.fn().mockResolvedValue(false),
      });

      await expect(shareOrCopyLink(CONTENT, deps)).rejects.toThrow(
        "Could not copy",
      );
    });

    it("propagates clipboard failures", async () => {
      const deps = makeDeps({
        platform: "web",
        copy: vi.fn().mockRejectedValue(new Error("denied")),
      });

      await expect(shareOrCopyLink(CONTENT, deps)).rejects.toThrow("denied");
    });
  });
});
