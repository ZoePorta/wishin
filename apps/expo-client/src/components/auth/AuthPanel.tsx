import React, { useState } from "react";
import {
  StyleSheet,
  View,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { Surface, Divider, useTheme } from "react-native-paper";
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
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const isDesktop = width >= 768;
  const [showLogin, setShowLogin] = useState(initialMode === "login");

  const renderForms = () => {
    if (isDesktop) {
      return (
        <Surface style={styles.desktopCard} elevation={2}>
          <View style={styles.formSection}>
            <LoginForm
              onLogin={onLogin}
              onSwitchToRegister={() => {
                setShowLogin(false);
              }}
              loading={loading}
              authError={loginError}
            />
          </View>
          <Divider style={styles.verticalDivider} />
          <View style={styles.formSection}>
            <RegisterForm
              onRegister={onRegister}
              onSwitchToLogin={() => {
                setShowLogin(true);
              }}
              loading={loading}
              authError={registerError}
            />
          </View>
        </Surface>
      );
    }

    return (
      <Surface style={styles.mobileContainer} elevation={0}>
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
    );
  };

  return (
    <View
      style={[
        styles.mainContainer,
        { backgroundColor: theme.colors.background },
      ]}
    >
      {renderForms()}
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
  desktopCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 28,
    width: "90%",
    maxWidth: 900,
    minHeight: 500,
    alignSelf: "center",
  },
  formSection: {
    flex: 1,
    padding: 32,
    justifyContent: "center",
  },
  verticalDivider: {
    width: 1,
    height: "80%",
    alignSelf: "center",
  },
  mobileContainer: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
    justifyContent: "center",
  },
  errorText: {
    marginBottom: 16,
    textAlign: "center",
    width: "90%",
    maxWidth: 900,
  },
});
