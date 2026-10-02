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
import { useTranslation } from "react-i18next";
import { useGoogleSignIn } from "../../hooks/useGoogleSignIn";
import { getAuthErrorMessage } from "../../utils/auth-errors";

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
   * Callback fired when the user taps the Google sign-in button.
   * @returns A Promise that resolves when the OAuth flow completes.
   * @throws {Error} If the OAuth flow fails or is cancelled.
   */
  onGoogleSignIn?: () => Promise<void>;
  /**
   * Whether the form is currently submitting.
   */
  loading?: boolean;
  /** Optional external authentication error message. */
  authError?: string | null;
}

/**
 * Premium RegisterForm component designed with Material Design 3.
 * Handles user input and validation for new account creation,
 * including Google OAuth2 sign-up.
 *
 * @param props - The component properties.
 * @returns {JSX.Element} The rendered registration form.
 */
export const RegisterForm: React.FC<RegisterFormProps> = ({
  onRegister,
  onSwitchToLogin,
  onGoogleSignIn,
  loading,
  authError,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  const {
    signIn: handleGoogleSignIn,
    googleLoading,
    googleError,
    setGoogleError,
  } = useGoogleSignIn(onGoogleSignIn, t("auth.register.googleFailed"));

  const combinedError = error ?? googleError;

  const handleSubmit = async () => {
    if (!email || !password || !username) {
      setError(t("auth.register.missingFields"));
      return;
    }
    setError(null);
    setGoogleError(null);
    try {
      await onRegister(email, password, username);
    } catch (err: unknown) {
      console.error("Registration attempt failed:", err);
      setError(getAuthErrorMessage(err, t, "register"));
    }
  };

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const isAnyLoading = loading || googleLoading;

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
        {t("auth.register.title")}
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        {t("auth.register.subtitle")}
      </Text>

      {onGoogleSignIn && (
        <>
          <Button
            mode="outlined"
            icon="google"
            onPress={() => {
              setError(null);
              void handleGoogleSignIn();
            }}
            loading={googleLoading}
            disabled={isAnyLoading}
            style={styles.googleButton}
            contentStyle={styles.buttonContent}
          >
            {t("auth.register.googleButton")}
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
              {t("common.or")}
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
        label={t("auth.usernameLabel")}
        value={username}
        onChangeText={(text) => {
          setUsername(text);
          if (error) setError(null);
          if (googleError) setGoogleError(null);
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
        label={t("auth.emailLabel")}
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (error) setError(null);
          if (googleError) setGoogleError(null);
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
        label={t("auth.passwordLabel")}
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (error) setError(null);
          if (googleError) setGoogleError(null);
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
            accessibilityLabel={t("auth.togglePasswordVisibility")}
            accessibilityRole="button"
            accessible={true}
          />
        }
        error={!!error && !password}
      />

      <HelperText
        type="error"
        visible={!!(combinedError ?? authError)}
        style={styles.errorText}
      >
        {combinedError ?? authError}
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
        {t("auth.register.submit")}
      </Button>

      <Button
        mode="text"
        onPress={onSwitchToLogin}
        style={styles.switchButton}
        labelStyle={styles.switchButtonLabel}
        contentStyle={commonStyles.minimumTouchTarget}
      >
        {t("auth.register.switchToLogin")}
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
