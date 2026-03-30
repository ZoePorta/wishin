import React from "react";
import { StyleSheet, View } from "react-native";
import {
  Surface,
  Text,
  Button,
  IconButton,
  useTheme,
} from "react-native-paper";
import { commonStyles } from "../../theme/common-styles";

/**
 * Props for the ToastItem component.
 */
interface ToastItemProps {
  /** Unique identifier for the toast. */
  id: string;
  /** The message text to display. */
  message: string;
  /** Optional callback for an "Undo" action. */
  onUndo?: () => void;
  /** Callback function to dismiss the toast. */
  onDismiss: (id: string) => void;
}

/**
 * Component that renders an individual toast notification.
 * Includes the message, an optional "Undo" button, and a "Close" icon button.
 *
 * @param {ToastItemProps} props - The component props.
 * @returns {JSX.Element} The rendered toast item.
 */
export const ToastItem: React.FC<ToastItemProps> = ({
  id,
  message,
  onUndo,
  onDismiss,
}) => {
  const theme = useTheme();

  return (
    <Surface
      elevation={3}
      style={[styles.surface, { backgroundColor: theme.colors.inverseSurface }]}
    >
      <View style={styles.content}>
        <Text
          variant="bodyMedium"
          style={[styles.text, { color: theme.colors.inverseOnSurface }]}
        >
          {message}
        </Text>
        <View style={styles.actions}>
          {onUndo && (
            <Button
              mode="text"
              onPress={() => {
                onUndo();
                onDismiss(id);
              }}
              textColor={theme.colors.inversePrimary}
              compact
              contentStyle={commonStyles.minimumTouchTarget}
            >
              Undo
            </Button>
          )}
          <IconButton
            icon="close"
            iconColor={theme.colors.inverseOnSurface}
            size={20}
            onPress={() => {
              onDismiss(id);
            }}
            style={styles.closeButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          />
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  surface: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 16,
    paddingRight: 8,
  },
  text: {
    flex: 1,
    marginRight: 8,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  closeButton: {
    margin: 0,
  },
});
