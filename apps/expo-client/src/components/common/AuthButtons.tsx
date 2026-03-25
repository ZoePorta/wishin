import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, IconButton, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";
import { useUser } from "../../contexts/UserContext";
import { AuthModal } from "../auth/AuthModal";
import { useAuthRepository } from "../../contexts/WishlistRepositoryContext";

interface AuthButtonsProps {
  /** Optional override for the login action */
  onLogin?: () => void;
  /** Optional override for the register/get-started action */
  onRegister?: () => void;
}

/**
 * Component that displays authentication buttons in the header.
 * Shows "Logout" if the user is registered or has an incomplete profile.
 * Shows "Log In" and "Get Started" links if the user is anonymous.
 *
 * @param {AuthButtonsProps} props - The component props.
 * @returns {JSX.Element} The authentication buttons.
 *
 * @section Exceptions
 * - Throws an error if the logout process fails in the repository layer.
 * - Errors during session refetch or navigation are caught and logged to the console.
 */
export const AuthButtons: React.FC<AuthButtonsProps> = ({
  onLogin,
  onRegister,
}) => {
  const theme = useTheme();
  const router = useRouter();
  const { sessionType, refetch, isSessionReliable } = useUser();
  const authRepo = useAuthRepository();
  const [authModalVisible, setAuthModalVisible] = React.useState(false);
  const [authMode, setAuthMode] = React.useState<"login" | "register">("login");

  const handleLogout = async () => {
    try {
      await authRepo.logout();
      await refetch();
      router.replace("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isAuthenticated =
    isSessionReliable &&
    (sessionType === "registered" || sessionType === "incomplete");

  if (isAuthenticated) {
    return (
      <View style={styles.container}>
        <IconButton
          icon="logout"
          onPress={() => {
            void handleLogout();
          }}
          accessibilityLabel="Logout"
          iconColor={theme.colors.primary}
          size={24}
          style={styles.touchTarget}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        />
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <Button
          mode="text"
          onPress={() => {
            if (onLogin) {
              onLogin();
            } else {
              setAuthMode("login");
              setAuthModalVisible(true);
            }
          }}
          textColor={theme.colors.onSurfaceVariant}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Log in"
          style={styles.touchTarget}
          contentStyle={styles.touchTargetContent}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          Log In
        </Button>
        <Button
          mode="contained"
          onPress={() => {
            if (onRegister) {
              onRegister();
            } else {
              setAuthMode("register");
              setAuthModalVisible(true);
            }
          }}
          style={[styles.getStartedBtn, styles.touchTarget]}
          contentStyle={styles.touchTargetContent}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Get started"
        >
          Get Started
        </Button>
      </View>

      <AuthModal
        visible={authModalVisible}
        onDismiss={() => {
          setAuthModalVisible(false);
        }}
        initialMode={authMode}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    paddingRight: 8,
  },
  getStartedBtn: {
    borderRadius: 100,
    paddingHorizontal: 16,
  },
  touchTarget: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
  },
  touchTargetContent: {
    minHeight: 44,
  },
});
