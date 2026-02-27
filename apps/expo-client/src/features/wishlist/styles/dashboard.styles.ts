import { StyleSheet } from "react-native";
import type { AppTheme } from "../../../constants/Colors";
import { Spacing } from "../../../constants/Spacing";
import { Typography } from "../../../constants/Typography";

/**
 * Returns a themed StyleSheet for the wishlist dashboard.
 *
 * @param {AppTheme} theme - The application theme object containing color tokens.
 * @returns {ReturnType<typeof StyleSheet.create>} A StyleSheet object containing all dashboard styles.
 */
export const createDashboardStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: Spacing.lg,
    },
    sectionTitle: {
      fontSize: Typography.size.xxl,
      fontWeight: Typography.weight.bold,
      marginBottom: Spacing.lg,
      marginTop: Spacing.xxl,
      color: theme.text,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
    },
    removeButton: {
      backgroundColor: theme.red100,
      padding: Spacing.sm,
      borderRadius: 6,
    },
    removeButtonText: {
      color: "#7F1D1D", // Dark red
      fontWeight: Typography.weight.semibold,
      fontSize: Typography.size.sm,
    },
    fab: {
      position: "absolute",
      bottom: Spacing.xxl,
      right: Spacing.xxl,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: "center",
      alignItems: "center",
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    fabPressed: {
      opacity: 0.8,
    },
    fabText: {
      color: "white",
      fontSize: 24,
      fontWeight: Typography.weight.bold,
    },
  });
