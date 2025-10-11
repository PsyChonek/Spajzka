import React, { useEffect, useRef } from 'react';
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
  const switchRef = useRef<any>(null);

  useEffect(() => {
    const switchElement = switchRef.current;
    if (!switchElement) return;

    const handleChange = () => {
      toggleTheme();
    };

    // Add event listener for the custom web component event
    switchElement.addEventListener('wa-change', handleChange);

    // Cleanup
    return () => {
      switchElement.removeEventListener('wa-change', handleChange);
    };
  }, [toggleTheme]);

  // Update the checked state when mode changes
  useEffect(() => {
    if (switchRef.current) {
      switchRef.current.checked = isDark;
    }
  }, [isDark]);

  return (
    <div className="theme-switch-wrapper">
      <wa-switch
        ref={switchRef}
        checked={isDark ? true : undefined}
        size="medium"
        style={{ 
          marginLeft: '1rem',
          '--wa-color-brand': 'var(--color-primary)',
          '--wa-color-neutral': 'rgba(255, 255, 255, 0.2)',
          '--wa-color-neutral-hover': 'rgba(255, 255, 255, 0.3)',
          '--wa-color-neutral-active': 'rgba(255, 255, 255, 0.4)',
          borderRadius: '20px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
        } as React.CSSProperties}
      >
        <wa-icon 
          name={isDark ? 'moon' : 'sun'} 
          slot="label"
          style={{
            color: 'white',
            fontSize: '1.1rem'
          } as React.CSSProperties}
        ></wa-icon>
      </wa-switch>
    </div>
  );
};

export default ThemeSwitch;
