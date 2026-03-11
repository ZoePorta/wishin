import React, { useState } from "react";
import {
  StyleSheet,
  View,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { Surface, Divider } from "react-native-paper";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

interface AuthPanelProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (
    email: string,
    password: string,
    username: string,
  ) => Promise<void>;
  loading?: boolean;
}

/**
 * Responsive AuthPanel that switches between Login and Register on mobile
 * and shows them side-by-side on desktop.
 */
export const AuthPanel: React.FC<AuthPanelProps> = ({
  onLogin,
  onRegister,
  loading,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [showLogin, setShowLogin] = useState(true);

  if (isDesktop) {
    return (
      <Surface style={styles.desktopContainer} elevation={1}>
        <View style={styles.formWrapper}>
          <LoginForm
            onLogin={onLogin}
            onSwitchToRegister={() => {
              setShowLogin(false);
            }}
            loading={loading}
          />
        </View>
        <Divider style={styles.divider} />
        <View style={styles.formWrapper}>
          <RegisterForm
            onRegister={onRegister}
            onSwitchToLogin={() => {
              setShowLogin(true);
            }}
            loading={loading}
          />
        </View>
      </Surface>
    );
  }

  return (
    <Surface style={styles.mobileContainer} elevation={0}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {showLogin ? (
          <LoginForm
            onLogin={onLogin}
            onSwitchToRegister={() => {
              setShowLogin(false);
            }}
            loading={loading}
          />
        ) : (
          <RegisterForm
            onRegister={onRegister}
            onSwitchToLogin={() => {
              setShowLogin(true);
            }}
            loading={loading}
          />
        )}
      </ScrollView>
    </Surface>
  );
};

const styles = StyleSheet.create({
  desktopContainer: {
    flexDirection: "row",
    padding: 32,
    borderRadius: 28,
    width: "100%",
    maxWidth: 1000,
    alignSelf: "center",
    justifyContent: "space-between",
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
  formWrapper: {
    flex: 1,
    paddingHorizontal: 24,
  },
  divider: {
    width: 1,
    height: "100%",
    marginHorizontal: 8,
  },
});
