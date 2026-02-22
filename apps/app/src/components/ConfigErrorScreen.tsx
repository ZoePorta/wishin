import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { Colors } from "../constants/Colors";

interface Props {
  onRetry?: () => void;
}

/**
 * Fallback screen for configuration errors.
 * Displays a clear message when environment variables are missing.
 */
export function ConfigErrorScreen({ onRetry }: Props) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <View style={[styles.iconContainer, { backgroundColor: theme.red100 }]}>
          <Text style={styles.icon}>⚠️</Text>
        </View>
        <Text style={[styles.title, { color: theme.text }]}>
          Configuration Error
        </Text>
        <Text style={[styles.message, { color: theme.textMuted }]}>
          It seems like some required environment variables are missing. Please
          ensure your .env file is correctly configured with Appwrite
          credentials.
        </Text>

        {onRetry && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Try Again"
          >
            <Text style={[styles.buttonText, { color: theme.buttonText }]}>
              Try Again
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    padding: 32,
    borderRadius: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 32,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
