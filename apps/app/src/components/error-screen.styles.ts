import { ViewStyle, TextStyle } from "react-native";
import { Colors } from "../constants/Colors";

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
 * @param {typeof Colors.light} theme - The current theme.
 * @returns {ErrorScreenStyles} The shared styles.
 */
export function createSharedErrorStyles(
  theme: typeof Colors.light,
): ErrorScreenStyles {
  return {
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
      backgroundColor: theme.background,
    },
    card: {
      padding: 32,
      borderRadius: 24,
      width: "100%",
      maxWidth: 400,
      alignItems: "center",
      backgroundColor: theme.card,
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
      color: theme.text,
    },
    message: {
      fontSize: 16,
      lineHeight: 24,
      textAlign: "center",
      color: theme.textMuted,
    },
  };
}
