import {
  Alert as RNAlert,
  Platform,
  type AlertButton,
  type AlertOptions,
} from "react-native";

/**
 * Platform-agnostic Alert utility.
 *
 * On Mobile (iOS/Android): Uses React Native's native Alert.
 * On Web: Uses window.confirm and window.alert as a lightweight fallback.
 */
export const UniversalAlert = {
  /**
   * Displays an alert dialog with the specified title and message.
   *
   * @param title - The title of the alert.
   * @param message - The message body of the alert.
   * @param buttons - An array of buttons to display.
   * @param options - Additional options (mobile only).
   */
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions,
  ) => {
    if (Platform.OS === "web") {
      // Basic Web implementation using native browser dialogs
      const fullMessage = message ? `${title}\n\n${message}` : title;

      if (!buttons || buttons.length === 0) {
        window.alert(fullMessage);
        return;
      }

      // Handle simple confirmation (Cancel/OK pattern)
      if (buttons.length > 0) {
        const confirmButton = buttons.find((b) => b.style !== "cancel");
        const cancelButton = buttons.find((b) => b.style === "cancel");

        if (confirmButton && cancelButton) {
          const confirmed = window.confirm(fullMessage);
          if (confirmed) {
            confirmButton.onPress?.();
          } else {
            cancelButton.onPress?.();
          }
          return;
        }

        // Just one button or simple list - alert and call the first non-cancel button
        window.alert(fullMessage);
        const firstButton =
          buttons.find((b) => b.style !== "cancel") ?? buttons[0];
        firstButton.onPress?.();
      }
    } else {
      // Native Mobile implementation
      RNAlert.alert(title, message, buttons, options);
    }
  },
};
