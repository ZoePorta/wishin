import { Link } from "expo-router";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Colors } from "../src/constants/Colors";
import { MOCK_WISHLIST_DATA } from "@wishin/infrastructure/mocks";

export default function Index() {
  const demoWishlistId = MOCK_WISHLIST_DATA.id;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wishin</Text>
      <Text style={styles.subtitle}>Share your wishes with the world.</Text>

      <Link href={`/wishlist/${demoWishlistId}`} asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>View Demo Wishlist</Text>
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
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 48,
    justifyContent: "center",
  },
  buttonText: {
    color: Colors.light.card, // Using generic white/card color for text on primary
    fontSize: 16,
    fontWeight: "600",
  },
});
