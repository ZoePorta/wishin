import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { TextInput, Button, Text } from "react-native-paper";

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
 * Friendly registration form with Material Design 3.
 */
export const RegisterForm: React.FC<RegisterFormProps> = ({
  onRegister,
  onSwitchToLogin,
  loading,
}) => {
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
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Join Wishin
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Don't have an account yet? Join Wishin and start sharing your dreams.
      </Text>

      {error && (
        <Text variant="bodySmall" style={styles.errorText}>
          {error}
        </Text>
      )}

      <TextInput
        label="Username"
        value={username}
        onChangeText={setUsername}
        mode="outlined"
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        secureTextEntry
        style={styles.input}
      />

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

      <Button mode="text" onPress={onSwitchToLogin} style={styles.switchButton}>
        Already have an account? Log in back!
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: 16,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    marginBottom: 24,
    textAlign: "center",
    opacity: 0.7,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  buttonContent: {
    height: 48,
  },
  switchButton: {
    marginTop: 16,
  },
  errorText: {
    color: "#BA1A1A",
    marginBottom: 16,
    textAlign: "center",
  },
});
