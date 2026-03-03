import React from "react";
import { View } from "react-native";
import { Text, Surface, useTheme } from "react-native-paper";
import { createSharedErrorStyles } from "./error-screen.styles";

/**
 * Generic fallback screen for uncaught runtime errors.
 * Uses Material Design 3 components.
 *
 * @returns {JSX.Element} The rendered fallback UI for uncaught runtime errors.
 */
export function GeneralErrorScreen() {
  const theme = useTheme();
  const styles = createSharedErrorStyles(theme);

  return (
    <Surface style={styles.container}>
      <Surface style={styles.card} elevation={1}>
        <View style={[styles.iconContainer, styles.iconBackground]}>
          <Text style={styles.icon}>❌</Text>
        </View>
        <Text variant="headlineSmall" style={styles.title}>
          Something went wrong
        </Text>
        <Text variant="bodyMedium" style={styles.message}>
          An unexpected error occurred. Please try restarting the application.
        </Text>
      </Surface>
    </Surface>
  );
}
