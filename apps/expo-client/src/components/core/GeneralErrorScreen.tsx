import React from "react";
import { View } from "react-native";
import { Text, Surface, useTheme, Icon } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { createSharedErrorStyles } from "./error-screen.styles";

/**
 * Generic fallback screen for uncaught runtime errors.
 * Uses Material Design 3 components.
 *
 * @returns {JSX.Element} The rendered fallback UI for uncaught runtime errors.
 */
export function GeneralErrorScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = createSharedErrorStyles(theme);

  return (
    <Surface style={styles.container}>
      <Surface style={styles.card} elevation={2}>
        <View style={[styles.iconContainer, styles.iconBackground]}>
          <Icon source="alert-outline" size={40} color={theme.colors.error} />
        </View>
        <Text variant="headlineSmall" style={styles.title}>
          {t("errorScreens.generalTitle")}
        </Text>
        <Text variant="bodyMedium" style={styles.message}>
          {t("errorScreens.generalMessage")}
        </Text>
      </Surface>
    </Surface>
  );
}
