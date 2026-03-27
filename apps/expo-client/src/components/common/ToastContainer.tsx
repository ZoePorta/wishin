import React from "react";
import {
  StyleSheet,
  View,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ToastItem } from "./ToastItem";
import type { Toast } from "../../contexts/ToastContext";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  // Use LayoutAnimation for smooth stacking transitions
  React.useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [toasts]);

  if (toasts.length === 0) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <SafeAreaView
        edges={["bottom"]}
        style={styles.safeArea}
        pointerEvents="box-none"
      >
        <View style={styles.container} pointerEvents="box-none">
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              id={toast.id}
              message={toast.message}
              onUndo={toast.onUndo}
              onDismiss={onDismiss}
            />
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    zIndex: 9999,
  },
  safeArea: {
    width: "100%",
  },
  container: {
    width: "100%",
    paddingBottom: 16,
  },
});
