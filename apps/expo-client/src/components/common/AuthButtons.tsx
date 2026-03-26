import React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { Button, IconButton, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";
import { useUser } from "../../contexts/UserContext";
import { AuthModal } from "../auth/AuthModal";
import { useAuthRepository } from "../../contexts/WishlistRepositoryContext";
import { addAlpha } from "../../utils/colors";

/**
 * Configuration props for AuthButtons.
 * These props allow for overriding the default authentication actions (which normally trigger an internal modal).
 *
 * @property {() => void} [onLogin] - Optional callback function called when the "Log In" button is pressed.
 * If provided, this overrides the internal modal trigger for the login flow.
 * @property {() => void} [onRegister] - Optional callback function called when the "Get Started" button is pressed.
 * If provided, this overrides the internal modal trigger for the registration flow.
 *
 * @note Providing only one of these results in "mixed" control behavior, where the missing action
 * still triggers the internal AuthModal. For fully external control, both should be provided.
 */
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
 * - Documentation of exceptions for internal state management is omitted.
 * - Errors during logout, session refetch or navigation are caught and logged to the console.
 */
export const AuthButtons: React.FC<AuthButtonsProps> = ({
  onLogin,
  onRegister,
}) => {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobileS = width <= 360;
  const { sessionType, refetch, isSessionReliable } = useUser();
  const authRepo = useAuthRepository();
  const [authModalVisible, setAuthModalVisible] = React.useState(false);
  const [authMode, setAuthMode] = React.useState<"login" | "register">("login");

  const isRegistered = isSessionReliable && sessionType === "registered";
  const isAuthenticated =
    isSessionReliable &&
    (sessionType === "registered" || sessionType === "incomplete");

  // Determine if the component is being used in controlled vs uncontrolled mode.
  // We require both to be provided to consider the component "fully controlled" externally.
  const isControlled = onLogin !== undefined && onRegister !== undefined;

  React.useEffect(() => {
    // Fire warning only when exactly one callback is provided (partial control).
    const isPartiallyControlled =
      (onLogin !== undefined && onRegister === undefined) ||
      (onLogin === undefined && onRegister !== undefined);

    if (isPartiallyControlled) {
      console.warn(
        "AuthButtons: Detected partial external control. Both 'onLogin' and 'onRegister' should be provided for fully external behavior. Falling back to mixed behavior for the missing handler.",
      );
    }
  }, [onLogin, onRegister]);

  const handleLogout = async () => {
    try {
      await authRepo.logout();
      await refetch();
      router.replace("/");
    } catch (error) {
      console.error("AuthButtons: Logout failed:", error);
    }
  };

  const handleLoginPress = () => {
    if (onLogin) {
      onLogin();
    } else {
      setAuthMode("login");
      setAuthModalVisible(true);
    }
  };

  const handleRegisterPress = () => {
    if (onRegister) {
      onRegister();
    } else {
      setAuthMode("register");
      setAuthModalVisible(true);
    }
  };

  if (isAuthenticated) {
    return (
      <View style={styles.container}>
        {isRegistered && (
          <IconButton
            icon="heart-outline"
            onPress={() => {
              router.push("/owner/dashboard");
            }}
            accessibilityLabel="My wishlist"
            iconColor={theme.colors.primary}
            size={24}
            style={styles.touchTarget}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          />
        )}
        <IconButton
          icon="logout"
          onPress={() => {
            void handleLogout();
          }}
          accessibilityLabel="Logout"
          iconColor={theme.colors.onSurfaceVariant}
          size={24}
          style={styles.touchTarget}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        />
      </View>
    );
  }

  return (
    <>
      <View style={[styles.container, isMobileS && styles.containerMobileS]}>
        <Button
          mode="text"
          onPress={handleLoginPress}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Log in"
          textColor={theme.colors.onSurfaceVariant}
          rippleColor={addAlpha(theme.colors.primary, 0.12)}
          style={styles.touchTarget}
          labelStyle={styles.loginText}
        >
          Log In
        </Button>
        <Button
          mode="contained"
          onPress={handleRegisterPress}
          style={[styles.getStartedBtn, styles.touchTarget]}
          contentStyle={[
            styles.touchTargetContent,
            styles.getStartedContent,
            isMobileS && styles.getStartedContentMobileS,
          ]}
          labelStyle={[
            styles.loginText,
            isMobileS && styles.getStartedLabelMobileS,
          ]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Get started"
        >
          Get Started
        </Button>
      </View>

      {!isControlled && (
        <AuthModal
          visible={authModalVisible}
          onDismiss={() => {
            setAuthModalVisible(false);
          }}
          initialMode={authMode}
        />
      )}
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
  containerMobileS: {
    gap: 12,
    paddingRight: 0,
  },
  getStartedBtn: {
    borderRadius: 100,
  },
  getStartedContent: {
    paddingHorizontal: 16,
  },
  getStartedContentMobileS: {
    paddingHorizontal: 0,
  },
  getStartedLabelMobileS: {
    fontSize: 13,
    marginHorizontal: 8,
  },
  touchTarget: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
  },
  touchTargetContent: {
    minHeight: 44,
  },
  loginRipple: {
    borderRadius: 8,
    overflow: "hidden",
  },
  loginContent: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  loginText: {
    fontWeight: "700",
    fontSize: 16,
  },
});
