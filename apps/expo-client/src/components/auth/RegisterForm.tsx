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

interface RegisterFormProps {
  onRegister: (
    email: string,
    password: string,
    username: string,
  ) => Promise<void>;
  onSwitchToLogin: () => void;
  loading?: boolean;
}

/**
 * Premium RegisterForm component designed with Material Design 3.
 */
export const RegisterForm: React.FC<RegisterFormProps> = ({
  onRegister,
  onSwitchToLogin,
  loading,
}) => {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <Surface
      elevation={0}
      style={[styles.container, { backgroundColor: "transparent" }]}
    >
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
        left={<TextInput.Icon icon="account-outline" />}
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
        secureTextEntry
        style={styles.input}
        left={<TextInput.Icon icon="lock-outline" />}
        error={!!error && !password}
      />

      <HelperText type="error" visible={!!error} style={styles.errorText}>
        {error}
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
