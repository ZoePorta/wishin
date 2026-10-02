import React, { useCallback } from "react";
import { Linking, StyleSheet } from "react-native";
import { Portal, Dialog, Button, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { Config } from "../../constants/Config";

/**
 * Props for the "Try the App" dialog.
 */
interface TryAppDialogProps {
  /** Indicates whether the dialog is visible. */
  visible: boolean;
  /** Called when the dialog should be dismissed. */
  onDismiss: () => void;
}

/**
 * Dialog shown from the landing page to download the Android app.
 * Explains that the app is not yet published on the app stores and links
 * to the latest APK on GitHub Releases.
 *
 * @param {TryAppDialogProps} props - The component props.
 * @returns {JSX.Element} The dialog rendered inside a Portal.
 */
export const TryAppDialog: React.FC<TryAppDialogProps> = ({
  visible,
  onDismiss,
}) => {
  const { t } = useTranslation();
  const handleDownload = useCallback(async () => {
    try {
      await Linking.openURL(Config.ANDROID_APK_URL);
    } catch (error: unknown) {
      console.error("Failed to open APK download URL", error);
    }
    onDismiss();
  }, [onDismiss]);

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Icon icon="android" />
        <Dialog.Title style={styles.title}>
          {t("landing.tryApp.title")}
        </Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={styles.paragraph}>
            {t("landing.tryApp.body")}
          </Text>
          <Text variant="bodySmall">{t("landing.tryApp.note")}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>{t("common.cancel")}</Button>
          <Button
            mode="contained"
            icon="download"
            onPress={() => {
              void handleDownload();
            }}
          >
            {t("landing.tryApp.download")}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxWidth: 480,
    width: "90%",
    alignSelf: "center",
  },
  title: {
    textAlign: "center",
  },
  paragraph: {
    marginBottom: 12,
  },
});
