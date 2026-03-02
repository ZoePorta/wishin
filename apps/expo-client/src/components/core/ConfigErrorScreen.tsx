import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, Surface, useTheme } from "react-native-paper";

interface Props {
  /** Callback to retry the operation that failed. */
  onRetry?: () => void;
}

/**
 * Fallback screen for configuration errors.
 * Displays a clear message when environment variables are missing.
 * Uses Material Design 3 components.
 */
export function ConfigErrorScreen({ onRetry }: Props) {
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
          <Text style={styles.icon}>⚠️</Text>
        </View>
        <Text variant="headlineSmall" style={styles.title}>
          Configuration Error
        </Text>
        <Text variant="bodyMedium" style={styles.message}>
          It seems like some required environment variables are missing. Please
          ensure your .env file is correctly configured with Appwrite
          credentials.
        </Text>

        {onRetry && (
          <Button
            mode="contained"
            onPress={onRetry}
            style={styles.button}
            accessibilityLabel="Try Again"
          >
            Try Again
          </Button>
        )}
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
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 20,
  },
  button: {
    width: "100%",
  },
});
