/**
 * Provides color values based on the active theme (light or dark)
 */

import { useTheme } from './useTheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: string
) {
  const { isDarkMode, colors } = useTheme();
  const theme = isDarkMode ? 'dark' : 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    // Return a default color from our theme colors if the specific color name exists
    return (colors as any)[colorName] || (isDarkMode ? '#ffffff' : '#000000');
  }
}
