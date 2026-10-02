import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, Surface, useTheme, Icon } from "react-native-paper";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
          {t("errorScreens.configTitle")}
        </Text>
        <Text variant="bodyMedium" style={styles.message}>
          {t("errorScreens.configMessage")}
        </Text>

        {onRetry && (
          <Button
            mode="contained"
            onPress={onRetry}
            style={styles.button}
            contentStyle={localStyles.buttonContent}
            accessibilityLabel={t("errorScreens.tryAgain")}
          >
            {t("errorScreens.tryAgain")}
          </Button>
        )}
      </Surface>
    </Surface>
  );
}

const localStyles = StyleSheet.create({
  buttonContent: {
    height: 48,
  },
});
