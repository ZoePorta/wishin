import { Link } from "expo-router";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Colors } from "../src/constants/Colors";

/**
 * Root screen for the Expo client.
 * Displays the main entry point for the application.
 *
 * @returns {React.ReactElement} The rendered index screen.
 */
export default function Index() {
  // Demo wishlist ID created by the scripts/seed.ts script
  const demoWishlistId = "550e8400-e29b-41d4-a716-446655440003";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wishin</Text>
      <Text style={styles.subtitle}>Share your wishes with the world.</Text>

      <Link href={`/wishlist/${demoWishlistId}`} asChild>
        <Pressable
          style={styles.button}
          accessibilityRole="button"
          accessibilityLabel="View demo wishlist"
        >
          <Text style={styles.buttonText}>View Demo Wishlist</Text>
        </Pressable>
      </Link>

      <View style={styles.spacer} />

      <Link href="/owner/dashboard" asChild>
        <Pressable
          style={styles.secondaryButton}
          accessibilityRole="button"
          accessibilityLabel="Go to owner dashboard"
        >
          <Text style={styles.secondaryButtonText}>Go to Owner Dashboard</Text>
        </Pressable>
      </Link>
    </View>
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
    fontSize: 48,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.light.textMuted,
    marginBottom: 32,
    textAlign: "center",
  },
  button: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: "center",
  },
  buttonText: {
    color: Colors.light.buttonText,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: Colors.light.primary,
    paddingVertical: 10, // Adjust for border width
    paddingHorizontal: 22,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  spacer: {
    height: 16,
  },
});
