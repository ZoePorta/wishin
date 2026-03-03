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
  icon: TextStyle;
  title: TextStyle;
  message: TextStyle;
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
      borderRadius: 24,
      width: "100%",
      maxWidth: 400,
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
    },
    icon: {
      fontSize: 32,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 16,
      textAlign: "center",
      color: theme.colors.onSurface,
    },
    message: {
      fontSize: 16,
      lineHeight: 24,
      textAlign: "center",
      color: theme.colors.onSurfaceVariant,
    },
  });
}
