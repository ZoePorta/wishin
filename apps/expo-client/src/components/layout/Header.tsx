import React from "react";
import Logo from "../../../assets/wishinlogo.svg";
import { StyleSheet, View, Image, Platform } from "react-native";
import { Button, useTheme } from "react-native-paper";
import { type AppTheme } from "../../theme/theme";
import { MotiView } from "moti";

interface HeaderProps {
  onLogin?: () => void;
  onGetStarted?: () => void;
}

/**
 * Shared Header component - Replicates the design from landing.html
 *
 * @param {HeaderProps} props - The component props
 * @returns {JSX.Element} The rendered header
 */
export const Header = ({ onLogin, onGetStarted }: HeaderProps) => {
  const theme = useTheme<AppTheme>();

  return (
    <View
      style={[
        styles.nav,
        {
          backgroundColor: theme.colors.surfaceContainerLow,
          borderBottomColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <View style={styles.navContent}>
        <MotiView
          from={{ opacity: 0, translateX: -20 }}
          animate={{ opacity: 1, translateX: 0 }}
        >
          <Image source={Logo} style={styles.logo} resizeMode="contain" />
        </MotiView>

        <View style={styles.navActions}>
          <Button
            mode="text"
            onPress={onLogin}
            textColor={theme.colors.onSurfaceVariant}
            labelStyle={styles.loginLabel}
            compact
            accessible
            accessibilityRole="button"
            accessibilityLabel="Log in"
          >
            Log In
          </Button>
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 200 }}
          >
            <Button
              mode="contained"
              style={styles.getStartedBtn}
              labelStyle={styles.getStartedLabel}
              onPress={onGetStarted}
            >
              Get Started
            </Button>
          </MotiView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  nav: {
    paddingHorizontal: 24,
    height: 70,
    justifyContent: "center",
    zIndex: 100,
    borderBottomWidth: 1,
    position: (Platform.OS === "web" ? "fixed" : "relative") as "relative",
    top: 0,
    left: 0,
    right: 0,
  },
  navContent: {
    maxWidth: 1280,
    width: "100%",
    marginHorizontal: "auto",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: { height: 40, width: 100 },
  navLinks: { flexDirection: "row", gap: 32 },
  navLink: { fontWeight: "700", fontSize: 16 },
  navActions: { flexDirection: "row", alignItems: "center", gap: 24 },
  loginLabel: {
    fontWeight: "700",
    fontSize: 16,
  },
  getStartedBtn: { borderRadius: 100, paddingHorizontal: 16 },
  getStartedLabel: { fontWeight: "900", fontSize: 14 },
});
