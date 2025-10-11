// TypeScript declarations for WebAwesome custom elements
import { ReactNode, CSSProperties } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'wa-button': any;
      'wa-icon': any;
      'wa-input': any;
      'wa-switch': any;
      'wa-dropdown': any;
      'wa-dropdown-item': any;
      'wa-divider': any;
      'wa-dialog': any;
      'wa-card': any;
      'wa-spinner': any;
      'wa-badge': any;
      'wa-tooltip': any;
    }
  }
}

export {};
