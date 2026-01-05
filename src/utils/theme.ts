/**
 * Returns CSS filter style for inverting images in dark mode
 */
export function getDarkModeFilter(isDark: boolean): React.CSSProperties {
  return { filter: isDark ? 'invert(1)' : 'none' };
}
