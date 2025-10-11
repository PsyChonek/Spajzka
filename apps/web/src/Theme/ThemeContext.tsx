import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ThemeMode, ThemeColors, getThemeColors } from './colors';

/**
 * Theme Context Interface
 */
interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

/**
 * Theme Context
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Local storage key for theme preference
 */
const THEME_STORAGE_KEY = 'spajzka-theme-mode';

/**
 * Theme Provider Props
 */
interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
}

/**
 * Theme Provider Component
 * Manages theme state and applies CSS variables to the document
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultMode = 'light'
}) => {
  // Get initial theme from localStorage or use default
  const getInitialTheme = (): ThemeMode => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }

      // Check system preference if no stored value
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (error) {
      console.error('Error reading theme from localStorage:', error);
    }
    return defaultMode;
  };

  const [mode, setMode] = useState<ThemeMode>(getInitialTheme);
  const [colors, setColors] = useState<ThemeColors>(getThemeColors(mode));

  /**
   * Apply CSS variables to the document root
   */
  const applyThemeVariables = (themeColors: ThemeColors) => {
    const root = document.documentElement;

    // Primary colors
    root.style.setProperty('--color-primary', themeColors.primary.main);
    root.style.setProperty('--color-primary-light', themeColors.primary.light);
    root.style.setProperty('--color-primary-dark', themeColors.primary.dark);
    root.style.setProperty('--color-primary-contrast', themeColors.primary.contrast);

    // Secondary colors
    root.style.setProperty('--color-secondary', themeColors.secondary.main);
    root.style.setProperty('--color-secondary-light', themeColors.secondary.light);
    root.style.setProperty('--color-secondary-dark', themeColors.secondary.dark);
    root.style.setProperty('--color-secondary-contrast', themeColors.secondary.contrast);

    // Background colors
    root.style.setProperty('--color-bg-default', themeColors.background.default);
    root.style.setProperty('--color-bg-paper', themeColors.background.paper);
    root.style.setProperty('--color-bg-elevated', themeColors.background.elevated);
    root.style.setProperty('--color-bg-navbar', themeColors.background.navbar);
    root.style.setProperty('--color-bg-footer', themeColors.background.footer);

    // Text colors
    root.style.setProperty('--color-text-primary', themeColors.text.primary);
    root.style.setProperty('--color-text-secondary', themeColors.text.secondary);
    root.style.setProperty('--color-text-disabled', themeColors.text.disabled);
    root.style.setProperty('--color-text-hint', themeColors.text.hint);

    // Status colors
    root.style.setProperty('--color-success', themeColors.status.success);
    root.style.setProperty('--color-success-light', themeColors.status.successLight);
    root.style.setProperty('--color-success-dark', themeColors.status.successDark);
    root.style.setProperty('--color-error', themeColors.status.error);
    root.style.setProperty('--color-error-light', themeColors.status.errorLight);
    root.style.setProperty('--color-error-dark', themeColors.status.errorDark);
    root.style.setProperty('--color-warning', themeColors.status.warning);
    root.style.setProperty('--color-warning-light', themeColors.status.warningLight);
    root.style.setProperty('--color-warning-dark', themeColors.status.warningDark);
    root.style.setProperty('--color-info', themeColors.status.info);
    root.style.setProperty('--color-info-light', themeColors.status.infoLight);
    root.style.setProperty('--color-info-dark', themeColors.status.infoDark);

    // Border colors
    root.style.setProperty('--color-border', themeColors.border.main);
    root.style.setProperty('--color-border-light', themeColors.border.light);
    root.style.setProperty('--color-border-dark', themeColors.border.dark);

    // Surface colors
    root.style.setProperty('--color-surface', themeColors.surface.default);
    root.style.setProperty('--color-surface-hover', themeColors.surface.hover);
    root.style.setProperty('--color-surface-active', themeColors.surface.active);
    root.style.setProperty('--color-surface-disabled', themeColors.surface.disabled);

    // Shadow colors
    root.style.setProperty('--color-shadow-light', themeColors.shadow.light);
    root.style.setProperty('--color-shadow-medium', themeColors.shadow.medium);
    root.style.setProperty('--color-shadow-dark', themeColors.shadow.dark);

    // Set theme mode data attribute for potential CSS selectors
    root.setAttribute('data-theme', mode);
  };

  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  /**
   * Set specific theme mode
   */
  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  /**
   * Update colors and CSS variables when mode changes
   */
  useEffect(() => {
    const newColors = getThemeColors(mode);
    setColors(newColors);
    applyThemeVariables(newColors);

    // Save to localStorage
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme to localStorage:', error);
    }
  }, [mode]);

  /**
   * Listen for system theme changes
   */
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set a preference
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (!stored) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  const value: ThemeContextType = {
    mode,
    colors,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to use theme context
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
