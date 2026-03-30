import React from "react";
import { StyleProp, ViewStyle, ImageSourcePropType } from "react-native";
import { Avatar as PaperAvatar } from "react-native-paper";
// @ts-expect-error - PNG import might not be recognized by TS but works with loader
import placeholder from "../../assets/avatar_placeholder.png";

/**
 * Props for the Avatar component.
 * @interface AvatarProps
 * @property {string} [uri] - The image URI for the avatar.
 * @property {number} [size] - The diameter of the avatar.
 * @property {StyleProp<ViewStyle>} [style] - Optional styling for the avatar container.
 */
interface AvatarProps {
  uri?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * A reusable Avatar component that uses Material Design 3 principles.
 * If no URI is provided, it falls back to a placeholder image.
 *
 * @param {AvatarProps} props - The component props.
 * @returns {JSX.Element} The rendered Avatar component.
 */
export const Avatar: React.FC<AvatarProps> = ({ uri, size = 40, style }) => {
  if (uri) {
    return <PaperAvatar.Image size={size} source={{ uri }} style={style} />;
  }

  // Fallback to placeholder image
  return (
    <PaperAvatar.Image
      size={size}
      source={placeholder as ImageSourcePropType}
      style={style}
    />
  );
};
