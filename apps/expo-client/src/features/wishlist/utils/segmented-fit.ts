/**
 * Horizontal space a react-native-paper `SegmentedButtons` segment uses
 * besides its label: 16px padding on each side, an 18px icon plus 5px gap,
 * a 1px border on each side and a small safety margin for rounding.
 */
export const SEGMENT_OVERHEAD = 16 * 2 + 18 + 5 + 2 + 4;

/**
 * Decides whether a row of segmented buttons can show every label without
 * truncating it. Segments share the width equally (`flex: 1`), so the widest
 * label determines the width every segment needs.
 *
 * @param {number} availableWidth - Width of the container, in px.
 * @param {number[]} labelWidths - Natural (unwrapped) width of each label, in px.
 * @returns {boolean} `true` when all labels fit; also `true` while either value
 *   is still unknown (0 / empty), so callers can wait for measurement.
 */
export const segmentedButtonsFit = (
  availableWidth: number,
  labelWidths: readonly number[],
): boolean => {
  if (availableWidth <= 0 || labelWidths.length === 0) return true;
  const widest = Math.max(...labelWidths);
  return labelWidths.length * (widest + SEGMENT_OVERHEAD) <= availableWidth;
};
