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
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    signIn: handleGoogleSignIn,
    googleLoading,
    googleError,
    setGoogleError,
  } = useGoogleSignIn(onGoogleSignIn, t("auth.login.failed"));

  const combinedError = error ?? googleError;

  const handleSubmit = async () => {
    if (!email || !password) {
      setError(t("auth.login.missingFields"));
      return;
    }
    setError(null);
    setGoogleError(null);
    try {
      await onLogin(email, password);
    } catch (err: unknown) {
      // Secure logging for developers
      console.error("Login attempt failed:", err);
      // Friendly, non-revealing error message for the user
      setError(t("auth.login.failed"));
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
        {t("auth.login.title")}
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        {t("auth.login.subtitle")}
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
            {t("auth.login.googleButton")}
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
        {t("auth.login.submit")}
      </Button>

      <Button
        mode="text"
        onPress={onSwitchToRegister}
        style={styles.switchButton}
        labelStyle={styles.switchButtonLabel}
        contentStyle={commonStyles.minimumTouchTarget}
      >
        {t("auth.login.switchToRegister")}
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
