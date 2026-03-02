import { StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import { useMemo } from "react";

/**
 * Custom hook to manage wishlist-specific styles and themed style generation.
 * Uses Material Design 3 theme via react-native-paper.
 *
 * @returns An object containing the current theme and the themed styles.
 */
export function useWishlistStyles() {
  const theme = useTheme();

  const themedStyles = useMemo(() => {
    return StyleSheet.create({
      text: {
        color: theme.colors.onSurface,
      },
      textMuted: {
        color: theme.colors.onSurfaceVariant,
      },
      secondaryText: {
        color: theme.colors.secondary,
      },
      primaryText: {
        color: theme.colors.primary,
      },
      surfaceMuted: {
        backgroundColor: theme.colors.surfaceVariant,
      },
      background: {
        backgroundColor: theme.colors.background,
      },
      card: {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.outlineVariant,
      },
      overlay: {
        backgroundColor: theme.dark
          ? "rgba(0, 0, 0, 0.7)"
          : "rgba(255, 255, 255, 0.7)",
      },
      completedBadge: {
        borderColor: theme.colors.onSurface,
        backgroundColor: theme.colors.surface,
      },
      reservedBadge: {
        borderColor: theme.colors.onSurface,
        borderStyle: "dashed",
        backgroundColor: theme.colors.surface,
      },
      badgeText: {
        color: theme.colors.onSurface,
      },
      priorityHigh: {
        backgroundColor: theme.colors.errorContainer,
      },
      priorityMedium: {
        backgroundColor: theme.colors.tertiaryContainer,
      },
      priorityLow: {
        backgroundColor: theme.colors.secondaryContainer,
      },
    });
  }, [theme]);

  const styles = useMemo(() => {
    return StyleSheet.create({
      centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      },
      pressed: {
        opacity: 0.7,
      },
      errorText: {
        fontSize: 18,
      },
      retryButton: {
        marginTop: 20,
        minWidth: 44,
        minHeight: 44,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 12,
      },
      retryText: {
        fontSize: 16,
        fontWeight: "600",
      },
      listContent: {
        padding: 16,
        flexGrow: 1,
      },
      header: {
        marginBottom: 20,
      },
      wishlistTitle: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 8,
      },
      wishlistDescription: {
        fontSize: 16,
        lineHeight: 22,
      },
      divider: {
        height: 1,
        marginTop: 16,
      },
      card: {
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
        borderWidth: 1,
      },
      itemImage: {
        width: "100%",
        height: 150,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
      },
      cardContent: {
        padding: 16,
      },
      cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 8,
      },
      itemTitle: {
        fontSize: 18,
        fontWeight: "600",
        flex: 1,
        marginRight: 8,
      },
      itemPrice: {
        fontSize: 16,
        fontWeight: "700",
      },
      itemDescription: {
        fontSize: 14,
        marginBottom: 12,
      },
      cardFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      },
      priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
      },
      priorityText: {
        fontSize: 10,
        fontWeight: "bold",
      },
      linkButton: {
        minWidth: 44,
        minHeight: 44,
        justifyContent: "center",
        alignItems: "center",
      },
      linkText: {
        fontWeight: "600",
      },
      overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1,
        borderRadius: 12,
      },
      badge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 2,
        transform: [{ rotate: "-5deg" }],
      },
      badgeText: {
        fontWeight: "bold",
        fontSize: 16,
      },
      emptyContainer: {
        paddingVertical: 40,
        alignItems: "center",
      },
      emptyText: {
        fontSize: 16,
        fontStyle: "italic",
      },
    });
  }, []);

  return { theme, styles, themedStyles };
}

export type WishlistStyles = ReturnType<typeof useWishlistStyles>;
