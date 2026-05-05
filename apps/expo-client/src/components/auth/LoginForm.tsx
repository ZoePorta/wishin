import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  TextInput,
  Button,
  Text,
  useTheme,
  Surface,
  Avatar,
  HelperText,
  Divider,
} from "react-native-paper";
import { commonStyles } from "../../theme/common-styles";

/**
 * Props for the LoginForm component.
 *
 * @param onLogin - Callback function called when the user submits their credentials. Accepts email and password. Returns a promise that resolves when login is successful.
 * @param onSwitchToRegister - Callback function to switch the view to the registration form.
 * @param onGoogleSignIn - Optional callback for Google OAuth sign-in flow.
 * @param loading - Optional loading flag to indicate an ongoing login attempt.
 * @param authError - Optional external authentication error message.
 */
interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSwitchToRegister: () => void;
  /**
   * Callback fired when the user taps the Google sign-in button.
   * @returns A Promise that resolves when the OAuth flow completes.
   * @throws {Error} If the OAuth flow fails or is cancelled.
   */
  onGoogleSignIn?: () => Promise<void>;
  loading?: boolean;
  authError?: string | null;
}

/**
 * Premium LoginForm component designed with Material Design 3.
 * Supports email/password login and Google OAuth2 sign-in.
 *
 * @param props - The properties for the LoginForm component.
 * @returns The rendered React element for the login form.
 * @throws {Error} Throws an error if the onLogin callback fails or if required validation logic fails.
 */
export const LoginForm: React.FC<LoginFormProps> = ({
  onLogin,
  onSwitchToRegister,
  onGoogleSignIn,
  loading,
  authError,
}) => {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setError(null);
    try {
      await onLogin(email, password);
    } catch (err: unknown) {
      // Secure logging for developers
      console.error("Login attempt failed:", err);
      // Friendly, non-revealing error message for the user
      setError(
        "We couldn't log you in just now. Please check your details or try again in a moment!",
      );
    }
  };

  /**
   * Handles the Google sign-in button press with independent loading state.
   * @throws {Error} Propagated from `onGoogleSignIn` if the OAuth flow fails.
   */
  const handleGoogleSignIn = async () => {
    if (!onGoogleSignIn) return;
    setGoogleLoading(true);
    setError(null);
    try {
      await onGoogleSignIn();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Google sign-in failed. Please try again!",
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const isAnyLoading = loading || googleLoading;

  return (
    <Surface elevation={0} style={styles.container}>
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

      {onGoogleSignIn && (
        <>
          <Button
            mode="outlined"
            icon="google"
            onPress={() => {
              void handleGoogleSignIn();
            }}
            loading={googleLoading}
            disabled={isAnyLoading}
            style={styles.googleButton}
            contentStyle={styles.buttonContent}
          >
            Sign in with Google
          </Button>

          <View style={styles.dividerRow}>
            <Divider
              style={[
                styles.dividerLine,
                { backgroundColor: theme.colors.outlineVariant },
              ]}
            />
            <Text
              variant="labelMedium"
              style={[
                styles.dividerText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              or
            </Text>
            <Divider
              style={[
                styles.dividerLine,
                { backgroundColor: theme.colors.outlineVariant },
              ]}
            />
          </View>
        </>
      )}

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
            accessibilityLabel="Toggle password visibility"
            accessibilityRole="button"
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
        disabled={isAnyLoading}
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
        contentStyle={commonStyles.minimumTouchTarget}
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
  googleButton: {
    width: "100%",
    borderRadius: 12,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
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
