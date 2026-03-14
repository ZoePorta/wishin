import React, { useState } from "react";
import { StyleSheet } from "react-native";
import {
  TextInput,
  Button,
  Text,
  useTheme,
  Surface,
  Avatar,
  HelperText,
} from "react-native-paper";

/**
 * Props for the LoginForm component.
 *
 * @param onLogin - Callback function called when the user submits their credentials. Accepts email and password. Returns a promise that resolves when login is successful.
 * @param onSwitchToRegister - Callback function to switch the view to the registration form.
 * @param loading - Optional loading flag to indicate an ongoing login attempt.
 * @param authError - Optional external authentication error message.
 */
interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSwitchToRegister: () => void;
  loading?: boolean;
  authError?: string | null;
}

/**
 * Premium LoginForm component designed with Material Design 3.
 *
 * @param props - The properties for the LoginForm component.
 * @returns The rendered React element for the login form.
 * @throws {Error} Throws an error if the onLogin callback fails or if required validation logic fails.
 */
export const LoginForm: React.FC<LoginFormProps> = ({
  onLogin,
  onSwitchToRegister,
  loading,
  authError,
}) => {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setError(null);
    try {
      await onLogin(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to login");
    }
  };

  return (
    <Surface
      elevation={0}
      style={[styles.container, { backgroundColor: "transparent" }]}
    >
      <Avatar.Icon
        icon="account-lock"
        size={64}
        style={[
          styles.avatar,
          { backgroundColor: theme.colors.primaryContainer },
        ]}
        color={theme.colors.onPrimaryContainer}
      />

      <Text variant="headlineSmall" style={styles.title}>
        Welcome Back!
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Hi there! Great to see you. Log in to manage your wishlists.
      </Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (error) setError(null);
        }}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        left={<TextInput.Icon icon="email-outline" />}
        error={!!error && !email}
      />

      <TextInput
        label="Password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (error) setError(null);
        }}
        mode="outlined"
        secureTextEntry={!showPassword}
        style={styles.input}
        left={<TextInput.Icon icon="lock-outline" />}
        right={
          <TextInput.Icon
            icon={showPassword ? "eye-off" : "eye"}
            onPress={() => {
              setShowPassword(!showPassword);
            }}
          />
        }
        error={!!error && !password}
      />

      <HelperText
        type="error"
        visible={!!(error ?? authError)}
        style={styles.errorText}
      >
        {error ?? authError}
      </HelperText>

      <Button
        mode="contained"
        onPress={() => {
          void handleSubmit();
        }}
        loading={loading}
        disabled={loading}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        Log In
      </Button>

      <Button
        mode="text"
        onPress={onSwitchToRegister}
        style={styles.switchButton}
        labelStyle={styles.switchButtonLabel}
      >
        Don't have an account yet? Join us!
      </Button>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 16,
  },
  avatar: {
    marginBottom: 16,
  },
  title: {
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    marginBottom: 24,
    textAlign: "center",
    opacity: 0.7,
  },
  input: {
    width: "100%",
    marginBottom: 12,
  },
  errorText: {
    textAlign: "center",
    width: "100%",
    marginBottom: 8,
  },
  button: {
    width: "100%",
    marginTop: 8,
    borderRadius: 12,
  },
  buttonContent: {
    height: 52,
  },
  switchButton: {
    marginTop: 16,
  },
  switchButtonLabel: {
    fontSize: 14,
  },
});
