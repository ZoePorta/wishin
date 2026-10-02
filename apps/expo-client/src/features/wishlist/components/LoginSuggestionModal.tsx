import React from "react";
import { StyleSheet, View } from "react-native";
import {
  Portal,
  Modal,
  Card,
  Text,
  Button,
  useTheme,
} from "react-native-paper";
import { type AppTheme } from "../../../theme/theme";
import { commonStyles } from "../../../theme/common-styles";
import { useTranslation } from "react-i18next";

interface LoginSuggestionModalProps {
  visible: boolean;
  onDismiss: () => void;
  onLogin: () => void;
  onGuest: () => void;
  loading?: boolean;
}

/**
 * Modal shown to visitors who try to purchase an item without a session.
 * Encourages registration or staying as a guest to track the purchase.
 */
export const LoginSuggestionModal: React.FC<LoginSuggestionModalProps> = ({
  visible,
  onDismiss,
  onLogin,
  onGuest,
  loading,
}) => {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();
  const styles = React.useMemo(() => makeStyles(theme), [theme]);
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContainer,
          commonStyles.modalContent,
        ]}
      >
        <Card style={styles.card} mode="elevated">
          <Card.Title
            title={t("loginSuggestion.title")}
            titleVariant="titleLarge"
            subtitle={t("loginSuggestion.subtitle")}
            subtitleVariant="bodyMedium"
          />
          <Card.Content>
            <Text variant="titleMedium" style={styles.text}>
              {t("loginSuggestion.heading")}
            </Text>
            <Text variant="bodyMedium" style={styles.text}>
              {t("loginSuggestion.body")}
            </Text>
          </Card.Content>
          <Card.Actions style={styles.actions}>
            <Button
              mode="outlined"
              onPress={onDismiss}
              disabled={loading}
              contentStyle={commonStyles.minimumTouchTarget}
            >
              {t("loginSuggestion.later")}
            </Button>
            <View style={styles.rightActions}>
              <Button
                mode="text"
                onPress={onGuest}
                loading={loading}
                disabled={loading}
                contentStyle={commonStyles.minimumTouchTarget}
              >
                {t("loginSuggestion.guest")}
              </Button>
              <Button
                mode="contained"
                onPress={onLogin}
                disabled={loading}
                contentStyle={commonStyles.minimumTouchTarget}
              >
                {t("loginSuggestion.signIn")}
              </Button>
            </View>
          </Card.Actions>
        </Card>
      </Modal>
    </Portal>
  );
};

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalContainer: {
      padding: 20,
    },
    card: {
      borderRadius: 28,
      padding: 4,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    text: {
      marginBottom: 8,
      lineHeight: 20,
    },
    actions: {
      justifyContent: "space-between",
      paddingHorizontal: 8,
      paddingBottom: 8,
    },
    rightActions: {
      flexDirection: "row",
      gap: 8,
    },
  });
