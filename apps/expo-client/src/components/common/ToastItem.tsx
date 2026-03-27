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

interface ToastItemProps {
  id: string;
  message: string;
  onUndo?: () => void;
  onDismiss: (id: string) => void;
}

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
