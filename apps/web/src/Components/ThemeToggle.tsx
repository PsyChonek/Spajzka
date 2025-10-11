import React from 'react';
import { useTheme } from '../Theme';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';

/**
 * Theme Toggle Component
 * Allows users to switch between light and dark themes
 */
const ThemeToggle: React.FC = () => {
  const { mode, toggleTheme } = useTheme();

  return (
    <wa-button
      onClick={toggleTheme}
      variant="neutral"
      appearance="plain"
      size="medium"
      pill
      aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
      className="theme-toggle"
    >
      <wa-icon 
        slot="label"
        name={mode === 'light' ? 'moon' : 'sun'}
        style={{ fontSize: '1.25rem' } as React.CSSProperties}
      ></wa-icon>
    </wa-button>
  );
};

export default ThemeToggle;
