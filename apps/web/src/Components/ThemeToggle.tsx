import React, { useEffect, useState } from 'react';
import { useTheme } from '../Theme';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';

/**
 * Theme Toggle Component
 * Allows users to switch between light and dark themes
 */
const ThemeToggle: React.FC = () => {
  const { mode, toggleTheme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    toggleTheme();
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <div className="theme-toggle-wrapper">
      <wa-button
        key={mode}
        onClick={handleClick}
        variant="neutral"
        appearance="plain"
        size="medium"
        pill
        aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
        title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
        style={{
          background:
            mode === 'light'
              ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))'
              : 'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(59, 130, 246, 0.2))',
          border:
            mode === 'light'
              ? '2px solid rgba(255, 255, 255, 0.4)'
              : '2px solid rgba(147, 51, 234, 0.5)',
          color: 'white',
          padding: '0.875rem',
          borderRadius: '50%',
          cursor: 'pointer',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow:
            mode === 'light'
              ? '0 4px 15px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
              : '0 4px 15px rgba(147, 51, 234, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          '--wa-color-neutral': 'transparent',
          '--wa-color-neutral-hover':
            mode === 'light'
              ? 'rgba(255, 255, 255, 0.25)'
              : 'rgba(147, 51, 234, 0.3)',
          '--wa-color-neutral-active':
            mode === 'light'
              ? 'rgba(255, 255, 255, 0.35)'
              : 'rgba(147, 51, 234, 0.4)',
          position: 'relative',
          overflow: 'hidden',
          animation: isAnimating ? 'themePulse 0.6s ease-out' : 'none'
        } as React.CSSProperties}
      >
        <wa-icon
          slot="label"
          name={mode === 'light' ? 'moon' : 'sun'}
          style={{
            fontSize: '1.5rem',
            color: 'white',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            filter:
              mode === 'light'
                ? 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
                : 'drop-shadow(0 2px 8px rgba(147, 51, 234, 0.3))',
            transform: 'scale(1)',
            animation: isAnimating ? 'iconFlip 0.6s ease-out' : 'none'
          } as React.CSSProperties}
        ></wa-icon>
      </wa-button>
    </div>
  );
};

export default ThemeToggle;
