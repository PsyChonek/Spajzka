import React from 'react';
import { useTheme } from '../Theme';
import '@awesome.me/webawesome/dist/components/switch/switch.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';

/**
 * Theme Switch Component  
 * A modern toggle switch for light/dark mode using WebAwesome
 */
const ThemeSwitch: React.FC = () => {
  const { mode, toggleTheme } = useTheme();
  const isDark = mode === 'dark';

  return (
    <div className="theme-switch-wrapper">
      <wa-switch
        checked={isDark}
        onWaChange={toggleTheme}
        size="medium"
        style={{ 
          marginLeft: '1rem',
          '--wa-color-brand': 'var(--primary-color)'
        } as React.CSSProperties}
      >
        <wa-icon name={isDark ? 'moon' : 'sun'} slot="label"></wa-icon>
      </wa-switch>
    </div>
  );
};

export default ThemeSwitch;
