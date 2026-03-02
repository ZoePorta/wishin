import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Surface, useTheme } from "react-native-paper";

/**
 * Generic fallback screen for uncaught runtime errors.
 * Uses Material Design 3 components.
 *
 * @returns {JSX.Element} The rendered fallback UI for uncaught runtime errors.
 */
export function GeneralErrorScreen() {
  const theme = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Surface style={styles.card} elevation={1}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: theme.colors.errorContainer },
          ]}
        >
          <Text style={styles.icon}>❌</Text>
        </View>
        <Text variant="headlineSmall" style={styles.title}>
          Something went wrong
        </Text>
        <Text variant="bodyMedium" style={styles.message}>
          An unexpected error occurred. Please try restarting the application.
        </Text>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    padding: 32,
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
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
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    textAlign: "center",
    lineHeight: 20,
  },
});
