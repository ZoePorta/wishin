/**
 * Adds alpha transparency to a color string (hex, rgb, or rgba).
 *
 * @param {string} color - The color string (e.g., "#RRGGBB", "#RGB", "RRGGBB", "rgb(...)", "rgba(...)").
 * @param {number} alpha - The alpha value between 0 and 1.
 * @returns {string} The rgba color string or the original color if parsing fails.
 */
export const addAlpha = (color: string, alpha: number): string => {
  if (!color) return `rgba(0, 0, 0, ${alpha.toString()})`;

  let r = 0,
    g = 0,
    b = 0;
  const cleanColor = color.trim();

  // Handle Hex
  if (cleanColor.startsWith("#") || /^[0-9a-fA-F]{3,6}$/.test(cleanColor)) {
    const hex = cleanColor.startsWith("#")
      ? cleanColor.substring(1)
      : cleanColor;

    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else {
      // Fallback if hex length is weird
      return color;
    }

    return `rgba(${Math.round(r).toString()}, ${Math.round(g).toString()}, ${Math.round(b).toString()}, ${alpha.toString()})`;
  }

  // Handle rgb/rgba
  const rgbMatch = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/.exec(
    cleanColor,
  );
  if (rgbMatch) {
    r = parseInt(rgbMatch[1], 10);
    g = parseInt(rgbMatch[2], 10);
    b = parseInt(rgbMatch[3], 10);
    return `rgba(${r.toString()}, ${g.toString()}, ${b.toString()}, ${alpha.toString()})`;
  }

  // Final fallback: return original color (might not work for transparency, but won't be black)
  return color;
};
