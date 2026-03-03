import { StyleSheet } from "react-native";
import type { MD3Theme } from "react-native-paper";
import { Spacing } from "../../../theme/spacing";

/**
 * Returns a themed StyleSheet for the wishlist dashboard.
 *
 * @param {MD3Theme} theme - The Material Design 3 theme object.
 * @returns {ReturnType<typeof StyleSheet.create>} A StyleSheet object for dashboard layout.
 */
export const createDashboardStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: Spacing.lg,
    },
    sectionTitle: {
      marginBottom: Spacing.lg,
      marginTop: Spacing.xxl,
      color: theme.colors.onSurface,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
    },
    modalContent: {
      margin: Spacing.lg,
      padding: Spacing.xl,
      borderRadius: 28,
    },
    fabPosition: {
      position: "absolute",
      margin: Spacing.lg,
      right: 0,
      bottom: 0,
    },
  });
