import React, { useCallback, useState } from "react";
import { StyleSheet, Platform } from "react-native";
import { Portal, Modal, IconButton, useTheme } from "react-native-paper";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { AuthPanel } from "./AuthPanel";
import {
  useAuthRepository,
  useProfileRepository,
  useLogger,
} from "../../contexts/WishlistRepositoryContext";
import { useUser } from "../../contexts/UserContext";
import { RegisterUserUseCase } from "@wishin/domain";
import { commonStyles } from "../../theme/common-styles";

/**
 * Props for the authentication modal.
 */
interface AuthModalProps {
  /** Indicates whether the modal is visible. */
  visible: boolean;
  /** Called when the modal should be dismissed. */
  onDismiss: () => void;
  /** Optional initial mode to show ('login' or 'register'). */
  initialMode?: "login" | "register";
}

/**
 * Modal that wraps AuthPanel to allow login/registration without page navigation.
 * Supports email/password authentication and Google OAuth2 sign-in.
 */
export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onDismiss,
  initialMode = "login",
}) => {
  const theme = useTheme();
  const authRepo = useAuthRepository();
  const profileRepo = useProfileRepository();
  const logger = useLogger();
  const { refetch } = useUser();
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState(false);

  // Memoize the register use case
  const registerUseCase = React.useMemo(
    () => new RegisterUserUseCase(authRepo, profileRepo, logger),
    [authRepo, profileRepo, logger],
  );

  // Reset state when visibility changes
  React.useEffect(() => {
    if (visible && !lastVisible) {
      setLoginError(null);
      setRegisterError(null);
      setLoading(false);
    }
    setLastVisible(visible);
  }, [visible, lastVisible]);

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setLoginError(null);
      try {
        await authRepo.login(email, password);
        await refetch();
        onDismiss();
      } catch (error: unknown) {
        setLoginError(error instanceof Error ? error.message : String(error));
      } finally {
        setLoading(false);
      }
    },
    [authRepo, refetch, onDismiss],
  );

  const handleRegister = useCallback(
    async (email: string, password: string, username: string) => {
      setLoading(true);
      setRegisterError(null);
      try {
        await registerUseCase.execute({ email, password, username });
        await refetch();
        onDismiss();
      } catch (error: unknown) {
        setRegisterError(
          error instanceof Error ? error.message : String(error),
        );
      } finally {
        setLoading(false);
      }
    },
    [registerUseCase, refetch, onDismiss],
  );

  /**
   * Handles the Google OAuth2 sign-in flow.
   *
   * On Web: Fallbacks to default browser redirection since popups often drop opener context
   * across multiple SSO redirects.
   * On Native: Opens an in-app browser session via `openAuthSessionAsync` with the derived scheme.
   *
   * @throws {Error} If the OAuth URL generation, browser session, or flow completion fails.
   */
  const handleGoogleSignIn = useCallback(async () => {
    const url = await authRepo.getGoogleOAuthUrl();

    if (Platform.OS === "web") {
      // Direct redirect is more reliable on web than popups due to COOP/opener policies
      window.location.href = url;
      // We do not continue here; the app will reload and CoreProvider will handle the redirect payload
      return;
    }

    // Native flow:
    const deepLink = new URL(makeRedirectUri({ preferLocalhost: true }));
    const scheme = `${deepLink.protocol}//`;

    const result = await WebBrowser.openAuthSessionAsync(url, scheme);

    if (result.type !== "success") {
      // User cancelled or the browser session failed
      return;
    }

    await authRepo.completeGoogleOAuth(result.url);
    await refetch();
    onDismiss();
  }, [authRepo, refetch, onDismiss]);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContent,
          commonStyles.modalContent,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <IconButton
          icon="close"
          size={24}
          onPress={onDismiss}
          style={styles.closeButton}
        />
        <AuthPanel
          onLogin={handleLogin}
          onRegister={handleRegister}
          onGoogleSignIn={handleGoogleSignIn}
          loading={loading}
          loginError={loginError}
          registerError={registerError}
          initialMode={initialMode}
        />
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    margin: 20,
    padding: 0,
    borderRadius: 28,
    overflow: "hidden",
    minHeight: 400,
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    margin: 0,
  },
});
