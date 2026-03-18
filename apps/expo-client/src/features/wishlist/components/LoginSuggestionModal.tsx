import React from "react";
import { StyleSheet, View } from "react-native";
import { Portal, Modal, Card, Text, Button } from "react-native-paper";
import { commonStyles } from "../../../theme/common-styles";

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
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <Card style={styles.card} mode="elevated">
          <Card.Title
            title="Almost there!"
            titleVariant="titleLarge"
            subtitle="Ready to gift?"
            subtitleVariant="bodyMedium"
          />
          <Card.Content>
            <Text variant="titleMedium" style={styles.text}>
              Don't lose your progress!
            </Text>
            <Text variant="bodyMedium" style={styles.text}>
              Your gift will be counted for the stats! However, guest info stays
              only on this device. Sign in to make sure you don't lose your
              history or the chance to change your mind later.
            </Text>
          </Card.Content>
          <Card.Actions style={styles.actions}>
            <Button
              mode="outlined"
              onPress={onDismiss}
              disabled={loading}
              contentStyle={commonStyles.minimumTouchTarget}
            >
              Maybe later
            </Button>
            <View style={styles.rightActions}>
              <Button
                mode="text"
                onPress={onGuest}
                loading={loading}
                disabled={loading}
                contentStyle={commonStyles.minimumTouchTarget}
              >
                Guest
              </Button>
              <Button
                mode="contained"
                onPress={onLogin}
                disabled={loading}
                contentStyle={commonStyles.minimumTouchTarget}
              >
                Sign In
              </Button>
            </View>
          </Card.Actions>
        </Card>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    padding: 20,
  },
  card: {
    borderRadius: 16,
    padding: 4,
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