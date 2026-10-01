import React from "react";
import { StyleSheet, View } from "react-native";
import { Portal, Dialog, Button, Text } from "react-native-paper";
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

const STEPS: Record<ApplePlatform, string[]> = {
  // Since iOS 16.4 any browser (Safari, Chrome, Edge…) can add to the home
  // screen from its share sheet, so Safari is not required here.
  ios: [
    "Tap your browser’s Share button (in Safari it may be inside the ••• menu).",
    "Scroll down and tap “Add to Home Screen”.",
    "Tap “Add”. Wishin will appear on your home screen like any other app.",
  ],
  macos: [
    "Open this page in Safari.",
    "In the menu bar, choose File → Add to Dock.",
    "Click “Add”. Wishin will open in its own window from the Dock.",
  ],
};

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
  const steps = STEPS[platform];

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Icon icon="cellphone-arrow-down" />
        <Dialog.Title style={styles.title}>
          {platform === "ios" ? "Add to Home Screen" : "Add to Dock"}
        </Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={styles.paragraph}>
            Wishin isn&apos;t on the App Store yet, but you can use it as an app
            right now:
          </Text>
          {steps.map((step, index) => (
            <View key={step} style={styles.step}>
              <Text variant="bodyMedium" style={styles.stepNumber}>
                {index + 1}.
              </Text>
              <Text variant="bodyMedium" style={styles.stepText}>
                {step}
              </Text>
            </View>
          ))}
        </Dialog.Content>
        <Dialog.Actions>
          <Button mode="contained" onPress={onDismiss}>
            Got it
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
