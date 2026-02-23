import { View, Text, StyleSheet, useColorScheme } from "react-native";
import { Colors } from "../constants/Colors";
import { createSharedErrorStyles } from "./error-screen.styles";

/**
 * Generic fallback screen for uncaught runtime errors.
 * Adheres to the getThemedStyles(theme) pattern.
 *
 * @returns {JSX.Element} The rendered fallback UI for uncaught runtime errors.
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
 * Reuses shared error screen styles.
 *
 * @param {typeof Colors.light} theme - The current theme.
 * @returns {ReturnType<typeof StyleSheet.create>} The themed styles.
 */
function getThemedStyles(theme: typeof Colors.light) {
  const baseStyles = createSharedErrorStyles(theme);

  return StyleSheet.create({
    ...baseStyles,
    iconContainer: {
      ...baseStyles.iconContainer,
      backgroundColor: theme.red100,
    },
  });
}
