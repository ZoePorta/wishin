import React, { useState } from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { Surface, useTheme } from "react-native-paper";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

/**
 * Props for the AuthPanel component.
 */
interface AuthPanelProps {
  /** Callback function called when the user attempts to log in. Accepts email and password. */
  onLogin: (email: string, password: string) => Promise<void>;
  /** Callback function called when the user attempts to register. Accepts email, password, and username. */
  onRegister: (
    email: string,
    password: string,
    username: string,
  ) => Promise<void>;
  /** Optional loading flag to indicate an ongoing authentication operation. */
  loading?: boolean;
  /** Optional external login error message. */
  loginError?: string | null;
  /** Optional external register error message. */
  registerError?: string | null;
  /** Optional initial mode to show ('login' or 'register'). Defaults to 'login'. */
  initialMode?: "login" | "register";
}

/**
 * Responsive AuthPanel that switches between Login and Register on mobile
 * and shows them side-by-side on desktop.
 */
export const AuthPanel: React.FC<AuthPanelProps> = ({
  onLogin,
  onRegister,
  loading,
  loginError,
  registerError,
  initialMode = "login",
}) => {
  const theme = useTheme();
  const [showLogin, setShowLogin] = useState(initialMode === "login");

  React.useEffect(() => {
    setShowLogin(initialMode === "login");
  }, [initialMode]);

  return (
    <View
      style={[
        styles.mainContainer,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <Surface style={styles.container} elevation={0}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {showLogin ? (
            <LoginForm
              onLogin={onLogin}
              onSwitchToRegister={() => {
                setShowLogin(false);
              }}
              loading={loading}
              authError={loginError}
            />
          ) : (
            <RegisterForm
              onRegister={onRegister}
              onSwitchToLogin={() => {
                setShowLogin(true);
              }}
              loading={loading}
              authError={registerError}
            />
          )}
        </ScrollView>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
    justifyContent: "center",
  },
});
