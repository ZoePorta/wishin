import React from "react";
import { View } from "react-native";
import { Text, Button, Surface, useTheme, Icon } from "react-native-paper";
import { createSharedErrorStyles } from "./error-screen.styles";

interface Props {
  /** Callback to retry the operation that failed. */
  onRetry?: () => void;
}

/**
 * Fallback screen for configuration errors.
 * Displays a clear message when environment variables are missing.
 * Uses Material Design 3 components.
 *
 * @param {Props} props - The component props.
 * @param {() => void} [props.onRetry] - Optional callback to retry the configuration or app initialization.
 * @returns {JSX.Element} The rendered error screen.
 */
export function ConfigErrorScreen({ onRetry }: Props) {
  const theme = useTheme();
  const styles = createSharedErrorStyles(theme);

  return (
    <Surface style={styles.container}>
      <Surface style={styles.card} elevation={2}>
        <View style={[styles.iconContainer, styles.iconBackground]}>
          <Icon
            source="alert-circle-outline"
            size={40}
            color={theme.colors.error}
          />
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
            contentStyle={{ height: 48 }}
            accessibilityLabel="Try Again"
          >
            Try Again
          </Button>
        )}
      </Surface>
    </Surface>
  );
}
