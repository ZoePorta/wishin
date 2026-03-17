import React, { useCallback, useState } from "react";
import { StyleSheet } from "react-native";
import { Portal, Modal, IconButton, useTheme } from "react-native-paper";
import { AuthPanel } from "./AuthPanel";
import { useAuthRepository } from "../../contexts/WishlistRepositoryContext";
import { useUser } from "../../contexts/UserContext";

interface AuthModalProps {
  visible: boolean;
  onDismiss: () => void;
}

/**
 * Modal that wraps AuthPanel to allow login/registration without page navigation.
 */
export const AuthModal: React.FC<AuthModalProps> = ({ visible, onDismiss }) => {
  const theme = useTheme();
  const authRepo = useAuthRepository();
  const { refetch } = useUser();
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

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
        await authRepo.register(email, password, username);
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
    [authRepo, refetch, onDismiss],
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContent,
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
          loading={loading}
          loginError={loginError}
          registerError={registerError}
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
  },
});
