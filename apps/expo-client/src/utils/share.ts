/**
 * Content to share: a link plus human-friendly context.
 */
export interface ShareLinkContent {
  /** The link being shared. */
  url: string;
  /** Title shown by share sheets that support it (e.g. email subject). */
  title: string;
  /** Short message accompanying the link. Must not contain the URL. */
  message: string;
}

/**
 * Outcome of a share attempt.
 * - `shared`: the system share sheet completed.
 * - `copied`: no share sheet available; the link was copied to the clipboard.
 * - `dismissed`: the user closed the share sheet without sharing.
 */
export type ShareOutcome = "shared" | "copied" | "dismissed";

/**
 * Platform capabilities required by {@link shareOrCopyLink}, injected so the
 * logic stays free of React Native imports and is unit-testable.
 */
export interface ShareLinkDeps {
  /** Current platform, as reported by `Platform.OS`. */
  platform: string;
  /** React Native's `Share.share`. */
  nativeShare: (content: {
    title: string;
    message: string;
  }) => Promise<{ action: string }>;
  /** Bound `navigator.share`, or `undefined` when the browser lacks it. */
  webShare: ((data: ShareData) => Promise<void>) | undefined;
  /** Copies text to the clipboard (e.g. `Clipboard.setStringAsync`). */
  copy: (text: string) => Promise<unknown>;
}

/** `Share.dismissedAction` value (iOS only; Android always reports shared). */
const DISMISSED_ACTION = "dismissedAction";

/**
 * Opens the system share sheet for a link, falling back to copying it to the
 * clipboard on browsers without the Web Share API (e.g. desktop Firefox).
 *
 * On web, a user cancellation (`AbortError`) is a dismissal, not a failure,
 * so it never triggers the clipboard fallback. Any other Web Share error
 * (e.g. `NotAllowedError`) falls back to copying.
 *
 * @param content - The link, title and message to share.
 * @param deps - Platform share and clipboard implementations.
 * @returns {Promise<ShareOutcome>} What actually happened, so the caller can
 *   decide whether to show feedback (only `copied` needs a snackbar).
 * @throws {Error} When the native share sheet or the clipboard fails.
 */
export async function shareOrCopyLink(
  content: ShareLinkContent,
  deps: ShareLinkDeps,
): Promise<ShareOutcome> {
  if (deps.platform !== "web") {
    // Android ignores `url`, so the link travels inside the message.
    const result = await deps.nativeShare({
      title: content.title,
      message: `${content.message}\n${content.url}`,
    });
    return result.action === DISMISSED_ACTION ? "dismissed" : "shared";
  }

  if (deps.webShare) {
    try {
      await deps.webShare({
        title: content.title,
        text: content.message,
        url: content.url,
      });
      return "shared";
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return "dismissed";
      }
      // Fall through to the clipboard.
    }
  }

  await deps.copy(content.url);
  return "copied";
}
