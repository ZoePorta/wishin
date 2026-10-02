import React from "react";
import { StyleSheet, View } from "react-native";
import { Portal, Dialog, Button, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";
import type { ApplePlatform } from "../../utils/platform";

/**
 * Props for the "Add to Home Screen" dialog.
 */
interface AddToHomeScreenDialogProps {
  /** Indicates whether the dialog is visible. */
  visible: boolean;
  /** Called when the dialog should be dismissed. */
  onDismiss: () => void;
  /** Apple platform the instructions are tailored to. */
  platform: ApplePlatform;
}

// Since iOS 16.4 any browser (Safari, Chrome, Edge…) can add to the home
// screen from its share sheet, so Safari is not required on iOS.
const STEP_KEYS = {
  ios: [
    "landing.addToHome.ios.step1",
    "landing.addToHome.ios.step2",
    "landing.addToHome.ios.step3",
  ],
  macos: [
    "landing.addToHome.macos.step1",
    "landing.addToHome.macos.step2",
    "landing.addToHome.macos.step3",
  ],
} as const satisfies Record<ApplePlatform, readonly string[]>;

/**
 * Dialog shown on Apple devices, where the Android APK can't be installed.
 * Explains how to add Wishin as a web app shortcut, since browsers on
 * Apple platforms don't expose an API to trigger this programmatically.
 *
 * @param {AddToHomeScreenDialogProps} props - The component props.
 * @returns {JSX.Element} The dialog rendered inside a Portal.
 */
export const AddToHomeScreenDialog: React.FC<AddToHomeScreenDialogProps> = ({
  visible,
  onDismiss,
  platform,
}) => {
  const { t } = useTranslation();
  const steps = STEP_KEYS[platform];

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Icon icon="cellphone-arrow-down" />
        <Dialog.Title style={styles.title}>
          {platform === "ios"
            ? t("landing.addToHome.titleIos")
            : t("landing.addToHome.titleMacos")}
        </Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={styles.paragraph}>
            {t("landing.addToHome.intro")}
          </Text>
          {steps.map((step, index) => (
            <View key={step} style={styles.step}>
              <Text variant="bodyMedium" style={styles.stepNumber}>
                {index + 1}.
              </Text>
              <Text variant="bodyMedium" style={styles.stepText}>
                {t(step)}
              </Text>
            </View>
          ))}
        </Dialog.Content>
        <Dialog.Actions>
          <Button mode="contained" onPress={onDismiss}>
            {t("common.gotIt")}
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
  step: {
    flexDirection: "row",
    marginBottom: 8,
  },
  stepNumber: {
    width: 20,
  },
  stepText: {
    flex: 1,
  },
});
