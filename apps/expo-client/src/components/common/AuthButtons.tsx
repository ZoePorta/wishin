import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, IconButton, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";
import { useUser } from "../../contexts/UserContext";
import { AuthModal } from "../auth/AuthModal";
import { useAuthRepository } from "../../contexts/WishlistRepositoryContext";
import { commonStyles } from "../../theme/common-styles";

/**
 * Component that displays authentication buttons in the header.
 * Shows "Logout" if the user is registered or has an incomplete profile.
 * Shows "Login" and "Register" links if the user is anonymous.
 *
 * @returns {JSX.Element} The authentication buttons.
 */
export const AuthButtons: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const { sessionType, refetch } = useUser();
  const authRepo = useAuthRepository();
  const [authModalVisible, setAuthModalVisible] = React.useState(false);

  const handleLogout = async () => {
    try {
      await authRepo.logout();
      await refetch();
      router.replace("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isGuest = sessionType === "anonymous";
  const isAuthenticated =
    sessionType === "registered" || sessionType === "incomplete";

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
        {isGuest && (
          <>
            <Button
              mode="text"
              onPress={() => {
                setAuthModalVisible(true);
              }}
              contentStyle={commonStyles.minimumTouchTarget}
              labelStyle={{ color: theme.colors.primary }}
            >
              Login
            </Button>
            <Button
              mode="text"
              onPress={() => {
                setAuthModalVisible(true);
              }}
              contentStyle={commonStyles.minimumTouchTarget}
              labelStyle={{ color: theme.colors.primary }}
            >
              Register
            </Button>
          </>
        )}
      </View>

      <AuthModal
        visible={authModalVisible}
        onDismiss={() => {
          setAuthModalVisible(false);
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
  },
});
