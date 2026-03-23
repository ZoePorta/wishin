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
import { commonStyles } from "../../theme/common-styles";

/**
 * Properties for the RegisterForm component.
 */
interface RegisterFormProps {
  /**
   * Callback fired when the user submits the registration form.
   * @param email - The user's email address.
   * @param password - The user's chosen password.
   * @param username - The user's chosen username.
   * @returns A Promise that resolves if registration succeeds.
   * @throws {Error} If registration fails (e.g., email already in use).
   */
  onRegister: (
    email: string,
    password: string,
    username: string,
  ) => Promise<void>;
  /**
   * Callback to navigate back to the login screen.
   */
  onSwitchToLogin: () => void;
  /**
   * Whether the form is currently submitting.
   */
  loading?: boolean;
  /** Optional external authentication error message. */
  authError?: string | null;
}

/**
 * Premium RegisterForm component designed with Material Design 3.
 * Handles user input and validation for new account creation.
 *
 * @param props - The component properties.
 * @returns {JSX.Element} The rendered registration form.
 */
export const RegisterForm: React.FC<RegisterFormProps> = ({
  onRegister,
  onSwitchToLogin,
  loading,
  authError,
}) => {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email || !password || !username) {
      setError("Please fill in all fields.");
      return;
    }
    setError(null);
    try {
      await onRegister(email, password, username);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to register");
    }
  };

  return (
    <Surface elevation={0} style={styles.container}>
      <Avatar.Icon
        icon="account-plus"
        size={64}
        style={[
          styles.avatar,
          { backgroundColor: theme.colors.secondaryContainer },
        ]}
        color={theme.colors.onSecondaryContainer}
      />

      <Text variant="headlineSmall" style={styles.title}>
        Join Wishin
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Don't have an account yet? Join Wishin and start sharing your dreams.
      </Text>

      <TextInput
        label="Username"
        value={username}
        onChangeText={(text) => {
          setUsername(text);
          if (error) setError(null);
        }}
        mode="outlined"
        autoCapitalize="none"
        style={styles.input}
        left={
          <TextInput.Icon
            icon="account-outline"
            focusable={false}
            tabIndex={-1}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden={true}
          />
        }
        error={!!error && !username}
      />

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
        left={
          <TextInput.Icon
            icon="email-outline"
            focusable={false}
            tabIndex={-1}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden={true}
          />
        }
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
        left={
          <TextInput.Icon
            icon="lock-outline"
            focusable={false}
            tabIndex={-1}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden={true}
          />
        }
        right={
          <TextInput.Icon
            icon={showPassword ? "eye-off" : "eye"}
            onPress={() => {
              setShowPassword(!showPassword);
            }}
            focusable={false}
            tabIndex={-1}
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
        Sign Up
      </Button>

      <Button
        mode="text"
        onPress={onSwitchToLogin}
        style={styles.switchButton}
        labelStyle={styles.switchButtonLabel}
        contentStyle={commonStyles.minimumTouchTarget}
      >
        Already have an account? Log in!
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
