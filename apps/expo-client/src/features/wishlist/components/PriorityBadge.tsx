import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme, Icon } from "react-native-paper";
import { Priority } from "@wishin/domain";
import { type AppTheme } from "../../../theme/theme";
import { PRIORITY_LABELS, getPriorityColors } from "../utils/priority";

/**
 * Props for the {@link PriorityBadge} component.
 */
interface PriorityBadgeProps {
  /** The priority level to display. */
  priority: Priority;
  /** Optional size for the badge (defaults to 24). */
  size?: number;
}

/**
 * Maps a priority level to a Material Design 3 community icon name.
 *
 * @param {Priority} priority - The priority level to map.
 * @returns {string} The name of the MD3 community icon.
 */
export const getPriorityIcon = (priority: Priority): string => {
  switch (priority) {
    case Priority.URGENT:
      return "fire";
    case Priority.HIGH:
      return "chevron-double-up";
    case Priority.MEDIUM:
      return "chevron-up";
    case Priority.LOW:
      return "chevron-down";
    default:
      return "help";
  }
};

/**
 * Unified component to display an item's priority level.
 * Uses Material Design 3 symbols and theme colors.
 * Accessible to screen readers with proper labels.
 *
 * @param {PriorityBadgeProps} props - The component props.
 * @returns {JSX.Element} The rendered priority badge.
 */
export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = 24,
}) => {
  const theme = useTheme<AppTheme>();
  const { background, foreground } = getPriorityColors(priority, theme);
  const label = PRIORITY_LABELS[priority];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: background,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
      accessibilityLabel={`Priority: ${label}`}
      accessibilityRole="text"
    >
      <Icon
        source={getPriorityIcon(priority)}
        size={size * 0.7}
        color={foreground}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
});
