import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { Colors, type AppTheme } from "../constants/Colors";
import { createSharedErrorStyles } from "./error-screen.styles";

interface Props {
  /** Callback to retry the operation that failed. */
  onRetry?: () => void;
}

/**
 * Fallback screen for configuration errors.
 * Displays a clear message when environment variables are missing.
 * Adheres to the getThemedStyles(theme) pattern.
 *
 * @param {Props} props - The component props.
 * @param {() => void} [props.onRetry] - Optional callback to retry.
 * @returns {JSX.Element} The rendered error screen.
 */
export function ConfigErrorScreen({ onRetry }: Props) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;
  const styles = getThemedStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>⚠️</Text>
        </View>
        <Text style={styles.title}>Configuration Error</Text>
        <Text style={styles.message}>
          It seems like some required environment variables are missing. Please
          ensure your .env file is correctly configured with Appwrite
          credentials.
        </Text>

        {onRetry && (
          <TouchableOpacity
            style={styles.button}
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Try Again"
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/**
 * Generates themed styles for ConfigErrorScreen.
 * Reuses shared error screen styles and adds component-specific styles.
 *
 * @param {AppTheme} theme - The current theme.
 * @returns {ReturnType<typeof StyleSheet.create>} The themed styles.
 */
function getThemedStyles(theme: AppTheme) {
  const baseStyles = createSharedErrorStyles(theme);

  return StyleSheet.create({
    ...baseStyles,
    iconContainer: {
      ...baseStyles.iconContainer,
      backgroundColor: theme.amber100, // Use semantically correct amber warning token
    },
    message: {
      ...baseStyles.message,
      marginBottom: 32,
    },
    button: {
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: 12,
      width: "100%",
      alignItems: "center",
      backgroundColor: theme.primary,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.buttonText,
    },
  });
}
