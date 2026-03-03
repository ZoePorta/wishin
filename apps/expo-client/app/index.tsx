import { Link } from "expo-router";
import { StyleSheet } from "react-native";
import { Text, Button, Surface } from "react-native-paper";

/**
 * Root screen for the Expo client.
 * Displays the main entry point for the application.
 * Uses Material Design 3 components.
 *
 * @returns {JSX.Element} The root screen React element.
 */
export default function Index() {
  // Demo wishlist ID created by the scripts/seed.ts script
  const demoWishlistId = "550e8400-e29b-41d4-a716-446655440003";

  return (
    <Surface style={styles.container}>
      <Text variant="displayLarge" style={styles.title}>
        Wishin
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Share your wishes with the world.
      </Text>

      <Link href={`/wishlist/${demoWishlistId}`} asChild>
        <Button
          mode="contained"
          style={styles.button}
          accessibilityLabel="View demo wishlist"
        >
          View Demo Wishlist
        </Button>
      </Link>

      <Link href="/owner/dashboard" asChild>
        <Button
          mode="outlined"
          style={styles.secondaryButton}
          accessibilityLabel="Go to owner dashboard"
        >
          Go to Owner Dashboard
        </Button>
      </Link>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 48,
    textAlign: "center",
  },
  button: {
    width: "100%",
    marginBottom: 16,
  },
  secondaryButton: {
    width: "100%",
  },
});
