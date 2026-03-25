import { IconButton, useTheme } from "react-native-paper";
import { type AppTheme } from "../../theme/theme";
import { MotiView, AnimatePresence } from "moti";
import { AuthButtons } from "../common/AuthButtons";
import { router } from "expo-router";
import { type NativeStackHeaderProps } from "@react-navigation/native-stack";
import { StyleSheet, View, Image, Platform, Pressable } from "react-native";
import Logo from "../../../assets/wishinlogo.svg";

interface HeaderProps extends Partial<NativeStackHeaderProps> {
  onLogin?: () => void;
  onGetStarted?: () => void;
}

/**
 * Shared Header component - Replicates the design from landing.html
 * Adapts to navigation state: shows back button if history exists, otherwise logo.
 *
 * @param {HeaderProps} props - The component props
 * @returns {JSX.Element} The rendered header
 */
export const Header = ({
  onLogin,
  onGetStarted,
  navigation,
  back,
}: HeaderProps) => {
  const theme = useTheme<AppTheme>();
  const isBackAvailable = !!back && !!navigation;

  const handleLogoPress = () => {
    if (isBackAvailable) {
      navigation.goBack();
    } else {
      router.push("/");
    }
  };

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
        <View style={styles.logoContainer}>
          <AnimatePresence exitBeforeEnter>
            {isBackAvailable ? (
              <MotiView
                key="back-button"
                from={{ opacity: 0, scale: 0.5, rotate: "-90deg" }}
                animate={{ opacity: 1, scale: 1, rotate: "0deg" }}
                exit={{ opacity: 0, scale: 0.5, rotate: "90deg" }}
                transition={{ type: "spring", damping: 15 }}
              >
                <IconButton
                  icon="arrow-left"
                  size={28}
                  onPress={handleLogoPress}
                  accessibilityLabel="Go back"
                />
              </MotiView>
            ) : (
              <MotiView
                key="logo"
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", damping: 15 }}
              >
                <Pressable
                  onPress={handleLogoPress}
                  accessibilityLabel="Go to home"
                  style={({ pressed }) => [
                    styles.logoPressable,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Image
                    source={Logo}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </Pressable>
              </MotiView>
            )}
          </AnimatePresence>
        </View>

        <View style={styles.navActions}>
          <AuthButtons onLogin={onLogin} onRegister={onGetStarted} />
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
  logoContainer: {
    height: 48,
    minWidth: 48,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  logoPressable: {
    paddingVertical: 4,
  },
  logo: { height: 32, width: 80 },
  navLinks: { flexDirection: "row", gap: 32 },
  navLink: { fontWeight: "700", fontSize: 16 },
  navActions: { flexDirection: "row", alignItems: "center" },
});
