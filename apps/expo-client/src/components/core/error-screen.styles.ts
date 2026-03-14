import { StyleSheet } from "react-native";
import type { ViewStyle, TextStyle } from "react-native";
import { type MD3Theme } from "react-native-paper";

/**
 * Shared style definitions for error screens.
 */
export interface ErrorScreenStyles {
  container: ViewStyle;
  card: ViewStyle;
  iconContainer: ViewStyle;
  iconBackground: ViewStyle;
  icon: TextStyle;
  title: TextStyle;
  message: TextStyle;
  button: ViewStyle;
}

/**
 * Creates a shared style factory for error screens.
 *
 * @param {MD3Theme} theme - The current theme.
 * @returns {ErrorScreenStyles} The shared styles.
 */
export function createSharedErrorStyles(theme: MD3Theme): ErrorScreenStyles {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
      backgroundColor: theme.colors.background,
    },
    card: {
      padding: 32,
      borderRadius: 28, // Updated to MD3 standard for large surfaces
      width: "100%",
      maxWidth: 400,
      alignItems: "center",
      backgroundColor: theme.colors.surface,
    },
    iconContainer: {
      width: 72,
      height: 72,
      borderRadius: 36,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
    },
    iconBackground: {
      backgroundColor: theme.colors.errorContainer,
    },
    icon: {
      fontSize: 40,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      marginBottom: 8,
      textAlign: "center",
      color: theme.colors.onSurface,
    },
    message: {
      fontSize: 16,
      lineHeight: 24,
      textAlign: "center",
      color: theme.colors.onSurfaceVariant,
      marginBottom: 32,
    },
    button: {
      width: "100%",
      borderRadius: 12,
    },
  });
}
