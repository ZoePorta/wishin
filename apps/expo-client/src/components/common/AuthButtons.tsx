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
          compact
          accessible
          accessibilityRole="button"
          accessibilityLabel="Log in"
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
          style={styles.getStartedBtn}
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
});
