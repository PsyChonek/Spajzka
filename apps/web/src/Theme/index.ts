/**
 * Theme module exports
 * Provides easy access to theme context, colors, and utilities
 */

export { ThemeProvider, useTheme } from './ThemeContext';
export { lightTheme, darkTheme, getThemeColors } from './colors';
export type { ThemeMode, ThemeColors } from './colors';