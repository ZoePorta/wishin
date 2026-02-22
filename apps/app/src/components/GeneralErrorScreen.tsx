import { View, Text, StyleSheet, useColorScheme } from "react-native";
import { Colors } from "../constants/Colors";

/**
 * Generic fallback screen for uncaught runtime errors.
 * Adheres to the getThemedStyles(theme) pattern.
 */
export function GeneralErrorScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;
  const styles = getThemedStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>❌</Text>
        </View>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>
          An unexpected error occurred. Please try restarting the application.
        </Text>
      </View>
    </View>
  );
}

/**
 * Generates themed styles for GeneralErrorScreen.
 *
 * @param {typeof Colors.light} theme - The current theme.
 * @returns {object} The themed styles.
 */
function getThemedStyles(theme: typeof Colors.light) {
  return StyleSheet.create({
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
      backgroundColor: theme.red100,
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
  });
}
