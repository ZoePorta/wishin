import React, { useState, useCallback, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { Portal, Dialog, Button, Text, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";

interface SpoilerOverlayProps {
  /** Whether the spoiler protection is active */
  isVisible: boolean;
  /** Callback when the user decides to reveal the list */
  onReveal: () => void;
}

/**
 * Overlay component that blurs the content and shows a two-stage confirmation dialog.
 * Used when a user accesses their own public wishlist to prevent spoilers.
 *
 * @param {SpoilerOverlayProps} props - The component props.
 * @param {boolean} props.isVisible - Whether the spoiler protection is active.
 * @param {() => void} props.onReveal - Callback when the user decides to reveal the list.
 * @returns {JSX.Element | null} The rendered spoiler overlay portal, or null if not visible.
 * @throws {never} This component does not throw.
 */
export const SpoilerOverlay: React.FC<SpoilerOverlayProps> = ({
  isVisible,
  onReveal,
}) => {
  const [stage, setStage] = useState<1 | 2>(1);
  const theme = useTheme();
  const router = useRouter();

  // Reset stage to 1 when it becomes visible
  useEffect(() => {
    if (isVisible) {
      setStage(1);
    }
  }, [isVisible]);

  const handleContinue = useCallback(() => {
    if (stage === 1) {
      setStage(2);
    } else {
      onReveal();
    }
  }, [stage, onReveal]);

  const handleGoBack = useCallback(() => {
    router.replace("/owner/dashboard");
  }, [router]);

  if (!isVisible) return null;

  return (
    <Portal>
      <View style={StyleSheet.absoluteFill} pointerEvents="auto">
        <BlurView
          intensity={stage === 1 ? 100 : 80}
          tint={theme.dark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
        <Dialog visible={true} onDismiss={handleGoBack} dismissable={false}>
          <Dialog.Icon icon="eye-off-outline" />
          <Dialog.Title style={styles.title}>
            {stage === 1 ? "Spoiler Alert!" : "Are you sure?"}
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {stage === 1
                ? "Careful! Continuing might spoil the surprise of your own wishlist."
                : "You're about to see everything, including reserved and purchased items. Ready?"}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={handleGoBack}
              contentStyle={styles.actionButtonContent}
            >
              Go Back
            </Button>
            <Button
              mode="contained"
              onPress={handleContinue}
              contentStyle={styles.actionButtonContent}
            >
              Continue
            </Button>
          </Dialog.Actions>
        </Dialog>
      </View>
    </Portal>
  );
};

const styles = StyleSheet.create({
  title: {
    textAlign: "center",
  },
  actionButtonContent: {
    minWidth: 44,
    minHeight: 44,
  },
});
