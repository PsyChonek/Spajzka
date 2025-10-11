/**
 * Color Palette Configuration for Spajzka App
 * Supports both light and dark themes with semantic color naming
 */

export interface ThemeColors {
  // Primary brand colors
  primary: {
    main: string;
    light: string;
    dark: string;
    contrast: string;
  };

  // Secondary/accent colors
  secondary: {
    main: string;
    light: string;
    dark: string;
    contrast: string;
  };

  // Background colors
  background: {
    default: string;
    paper: string;
    elevated: string;
    navbar: string;
    footer: string;
  };

  // Text colors
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    hint: string;
  };

  // Status colors
  status: {
    success: string;
    successLight: string;
    successDark: string;
    error: string;
    errorLight: string;
    errorDark: string;
    warning: string;
    warningLight: string;
    warningDark: string;
    info: string;
    infoLight: string;
    infoDark: string;
  };

  // Border and divider colors
  border: {
    main: string;
    light: string;
    dark: string;
  };

  // Surface colors (cards, modals, etc.)
  surface: {
    default: string;
    hover: string;
    active: string;
    disabled: string;
  };

  // Shadow colors
  shadow: {
    light: string;
    medium: string;
    dark: string;
  };
}

/**
 * Light Theme Color Palette
 */
export const lightTheme: ThemeColors = {
  primary: {
    main: '#BC5F04',      // Medium orange - Main brand color
    light: '#F4442E',     // Bright red-orange - Hover/lighter variant
    dark: '#874000',      // Dark orange-brown - Active/darker variant
    contrast: '#ffffff',  // White text on primary
  },

  secondary: {
    main: '#874000',      // Dark orange-brown
    light: '#BC5F04',     // Medium orange
    dark: '#2B0504',      // Very dark red
    contrast: '#ffffff',  // White text on secondary
  },

  background: {
    default: '#faf8f7',   // Warm off-white
    paper: '#ffffff',
    elevated: '#ffffff',
    navbar: '#010001',    // Almost black
    footer: '#010001',    // Almost black
  },

  text: {
    primary: '#010001',   // Almost black
    secondary: '#2B0504', // Very dark red
    disabled: '#9ca3af',
    hint: '#d1d5db',
  },

  status: {
    success: '#10b981',
    successLight: '#d1fae5',
    successDark: '#059669',
    error: '#F4442E',     // Using bright red-orange for errors
    errorLight: '#fee2e2',
    errorDark: '#2B0504', // Very dark red
    warning: '#BC5F04',   // Medium orange for warnings
    warningLight: '#fef3c7',
    warningDark: '#874000',
    info: '#3b82f6',
    infoLight: '#dbeafe',
    infoDark: '#2563eb',
  },

  border: {
    main: '#e5e7eb',
    light: '#f3f4f6',
    dark: '#d1d5db',
  },

  surface: {
    default: '#ffffff',
    hover: '#fef9f6',     // Warm light hover
    active: '#fef3ed',    // Warm light active
    disabled: '#e5e7eb',
  },

  shadow: {
    light: 'rgba(1, 0, 1, 0.05)',
    medium: 'rgba(1, 0, 1, 0.1)',
    dark: 'rgba(1, 0, 1, 0.2)',
  },
};

/**
 * Dark Theme Color Palette
 */
export const darkTheme: ThemeColors = {
  primary: {
    main: '#F4442E',      // Bright red-orange - Main brand color for dark mode
    light: '#ff6b54',     // Lighter red-orange - Hover variant
    dark: '#BC5F04',      // Medium orange - Active variant
    contrast: '#010001',  // Almost black text on primary
  },

  secondary: {
    main: '#BC5F04',      // Medium orange
    light: '#F4442E',     // Bright red-orange
    dark: '#874000',      // Dark orange-brown
    contrast: '#010001',  // Almost black text on secondary
  },

  background: {
    default: '#010001',   // Almost black - Base background
    paper: '#2B0504',     // Very dark red - Content areas
    elevated: '#3d0a08',  // Slightly lighter dark red - Modals
    navbar: '#010001',    // Almost black - Navigation
    footer: '#010001',    // Almost black - Footer
  },

  text: {
    primary: '#f8fafc',   // Almost white
    secondary: '#e0d6d5', // Warm light gray
    disabled: '#64748b',
    hint: '#475569',
  },

  status: {
    success: '#34d399',
    successLight: '#064e3b',
    successDark: '#10b981',
    error: '#F4442E',     // Bright red-orange for errors
    errorLight: '#2B0504', // Very dark red background
    errorDark: '#ff6b54',  // Lighter red-orange
    warning: '#BC5F04',   // Medium orange for warnings
    warningLight: '#874000',
    warningDark: '#F4442E',
    info: '#60a5fa',
    infoLight: '#1e3a8a',
    infoDark: '#3b82f6',
  },

  border: {
    main: '#874000',      // Dark orange-brown
    light: '#BC5F04',     // Medium orange
    dark: '#2B0504',      // Very dark red
  },

  surface: {
    default: '#2B0504',   // Very dark red
    hover: '#3d0a08',     // Slightly lighter
    active: '#4f0e0b',    // More lighter
    disabled: '#1a0302',  // Darker
  },

  shadow: {
    light: 'rgba(244, 68, 46, 0.1)',   // Warm shadow with primary color tint
    medium: 'rgba(244, 68, 46, 0.2)',
    dark: 'rgba(244, 68, 46, 0.3)',
  },
};

/**
 * Theme type
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Get theme colors based on mode
 */
export const getThemeColors = (mode: ThemeMode): ThemeColors => {
  return mode === 'dark' ? darkTheme : lightTheme;
};
