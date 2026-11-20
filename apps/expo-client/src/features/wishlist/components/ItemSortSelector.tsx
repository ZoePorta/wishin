import React, { useCallback, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import {
  Button,
  Menu,
  SegmentedButtons,
  Text,
  useTheme,
} from "react-native-paper";
import { useTranslation } from "react-i18next";
import { ITEM_SORT_OPTIONS, type ItemSortOption } from "../utils/item-sort";
import { segmentedButtonsFit } from "../utils/segmented-fit";

interface ItemSortSelectorProps {
  /** Currently selected sort criterion. */
  value: ItemSortOption;
  /** Called when the user picks a different criterion. */
  onChange: (value: ItemSortOption) => void;
}

const SORT_ICONS: Record<ItemSortOption, string> = {
  priority: "flag-outline",
  date: "clock-outline",
  price: "tag-outline",
};

const SORT_LABEL_KEYS = {
  priority: "itemSort.priority",
  date: "itemSort.date",
  price: "itemSort.price",
} as const satisfies Record<ItemSortOption, string>;

const isSortOption = (value: string): value is ItemSortOption =>
  (ITEM_SORT_OPTIONS as readonly string[]).includes(value);

/**
 * Centered control to choose how wishlist items are ordered
 * (priority, date added or price). Shared by the owner dashboard and the
 * public wishlist view.
 *
 * Renders as segmented buttons when every label fits without truncation;
 * otherwise (narrow screens, long translations, large system font) it falls
 * back to a dropdown menu. Fit is decided by measuring the labels' natural
 * width off-screen against the available width.
 *
 * @param {ItemSortSelectorProps} props - The component props.
 * @param {ItemSortOption} props.value - The selected criterion.
 * @param {function} props.onChange - Callback invoked with the new criterion.
 * @returns {JSX.Element} The rendered selector.
 */
export const ItemSortSelector: React.FC<ItemSortSelectorProps> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [availableWidth, setAvailableWidth] = useState(0);
  const [labelWidths, setLabelWidths] = useState<
    Partial<Record<ItemSortOption, number>>
  >({});
  const [menuVisible, setMenuVisible] = useState(false);

  const labelFor = (option: ItemSortOption) => t(SORT_LABEL_KEYS[option]);

  const measuredWidths = ITEM_SORT_OPTIONS.map((o) => labelWidths[o]).filter(
    (w): w is number => w !== undefined,
  );
  const isMeasured =
    availableWidth > 0 && measuredWidths.length === ITEM_SORT_OPTIONS.length;
  const useDropdown =
    isMeasured && !segmentedButtonsFit(availableWidth, measuredWidths);

  const handleContainerLayout = useCallback((e: LayoutChangeEvent) => {
    setAvailableWidth(e.nativeEvent.layout.width);
  }, []);

  const handleLabelLayout = useCallback(
    (option: ItemSortOption) => (e: LayoutChangeEvent) => {
      const width = Math.ceil(e.nativeEvent.layout.width);
      setLabelWidths((prev) =>
        prev[option] === width ? prev : { ...prev, [option]: width },
      );
    },
    [],
  );

  const select = (next: ItemSortOption) => {
    setMenuVisible(false);
    if (next !== value) onChange(next);
  };

  return (
    <View style={styles.container} onLayout={handleContainerLayout}>
      {/* Off-screen copies of the labels, used only to measure their width. */}
      <View style={styles.measureClip} pointerEvents="none" aria-hidden>
        <View style={styles.measureLayer}>
          {ITEM_SORT_OPTIONS.map((option) => (
            <Text
              key={option}
              variant="labelLarge"
              numberOfLines={1}
              style={styles.measureText}
              onLayout={handleLabelLayout(option)}
            >
              {labelFor(option)}
            </Text>
          ))}
        </View>
      </View>

      <Text
        variant="labelLarge"
        style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
      >
        {t("itemSort.label")}
      </Text>

      {/* Hidden until measured to avoid flashing truncated segments. */}
      <View style={[styles.control, !isMeasured && styles.hidden]}>
        {useDropdown ? (
          <Menu
            visible={menuVisible}
            onDismiss={() => {
              setMenuVisible(false);
            }}
            anchorPosition="bottom"
            anchor={
              <Button
                mode="outlined"
                icon="chevron-down"
                onPress={() => {
                  setMenuVisible(true);
                }}
                contentStyle={styles.dropdownContent}
                accessibilityLabel={t("itemSort.optionA11y", {
                  label: labelFor(value),
                })}
              >
                {labelFor(value)}
              </Button>
            }
          >
            {ITEM_SORT_OPTIONS.map((option) => (
              <Menu.Item
                key={option}
                title={labelFor(option)}
                leadingIcon={SORT_ICONS[option]}
                trailingIcon={option === value ? "check" : undefined}
                onPress={() => {
                  select(option);
                }}
                accessibilityState={{ selected: option === value }}
              />
            ))}
          </Menu>
        ) : (
          <SegmentedButtons
            style={styles.segmented}
            density="small"
            value={value}
            onValueChange={(next) => {
              if (isSortOption(next)) select(next);
            }}
            buttons={ITEM_SORT_OPTIONS.map((option) => ({
              value: option,
              label: labelFor(option),
              icon: SORT_ICONS[option],
              accessibilityLabel: t("itemSort.optionA11y", {
                label: labelFor(option),
              }),
            }))}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    textAlign: "center",
  },
  control: {
    width: "100%",
    alignItems: "center",
  },
  hidden: {
    opacity: 0,
  },
  dropdownContent: {
    flexDirection: "row-reverse",
  },
  segmented: {
    width: "100%",
  },
  // Zero-size clipping box so the wide measuring layer never causes scroll.
  measureClip: {
    position: "absolute",
    width: 0,
    height: 0,
    overflow: "hidden",
    opacity: 0,
  },
  // Wide enough that labels lay out at their natural, unwrapped width.
  measureLayer: {
    width: 2000,
    alignItems: "flex-start",
  },
  measureText: {
    alignSelf: "flex-start",
  },
});
