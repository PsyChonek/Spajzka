import React from 'react';
import { useTheme } from '../Theme';

/**
 * Theme Debug Component
 * Shows current theme values to help debug color issues
 */
const ThemeDebug: React.FC = () => {
  const { mode, colors } = useTheme();

  const debugStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '10px',
    right: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '15px',
    borderRadius: '8px',
    fontSize: '11px',
    zIndex: 9999,
    maxWidth: '300px',
    maxHeight: '400px',
    overflow: 'auto',
    fontFamily: 'monospace',
  };

  return (
    <div style={debugStyle}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', borderBottom: '1px solid white', paddingBottom: '5px' }}>
        🎨 Theme Debug
      </h4>
      <div><strong>Mode:</strong> {mode}</div>
      <div style={{ marginTop: '10px' }}>
        <strong>Primary:</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
          <div style={{ width: '20px', height: '20px', backgroundColor: colors.primary.main, border: '1px solid white' }}></div>
          {colors.primary.main}
        </div>
      </div>
      <div style={{ marginTop: '10px' }}>
        <strong>BG Default:</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
          <div style={{ width: '20px', height: '20px', backgroundColor: colors.background.default, border: '1px solid white' }}></div>
          {colors.background.default}
        </div>
      </div>
      <div style={{ marginTop: '10px' }}>
        <strong>BG Navbar:</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
          <div style={{ width: '20px', height: '20px', backgroundColor: colors.background.navbar, border: '1px solid white' }}></div>
          {colors.background.navbar}
        </div>
      </div>
      <div style={{ marginTop: '10px' }}>
        <strong>BG Footer:</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
          <div style={{ width: '20px', height: '20px', backgroundColor: colors.background.footer, border: '1px solid white' }}></div>
          {colors.background.footer}
        </div>
      </div>
      <div style={{ marginTop: '10px' }}>
        <strong>CSS Variables:</strong>
        <div style={{ fontSize: '10px', marginTop: '3px' }}>
          --color-primary: {getComputedStyle(document.documentElement).getPropertyValue('--color-primary')}
        </div>
        <div style={{ fontSize: '10px' }}>
          --color-bg-default: {getComputedStyle(document.documentElement).getPropertyValue('--color-bg-default')}
        </div>
        <div style={{ fontSize: '10px' }}>
          --color-bg-navbar: {getComputedStyle(document.documentElement).getPropertyValue('--color-bg-navbar')}
        </div>
      </div>
    </div>
  );
};

export default ThemeDebug;
