# Spajzka Theme System

A comprehensive theming system for the Spajzka application with support for light and dark modes, using CSS variables and React Context.

## Overview

The theme system provides:
- 🎨 **Predefined color palettes** for light and dark modes
- 🔄 **Automatic theme switching** based on system preferences
- 💾 **Persistent theme selection** via localStorage
- 🎯 **Type-safe theme access** through React Context
- ⚡ **Dynamic CSS variables** for instant theme switching
- 🎭 **Smooth transitions** between themes

## Architecture

### Files Structure

```
src/theme/
├── colors.ts           # Color palette definitions
├── ThemeContext.tsx    # React Context provider
├── index.ts           # Public exports
└── README.md          # This file

src/Components/
└── ThemeToggle.tsx    # UI component for theme switching

src/CSS/
└── Global.css         # CSS variables and global styles
```

## Getting Started

### 1. Provider Setup

The `ThemeProvider` is already configured in [src/index.tsx](../index.tsx):

```tsx
import { ThemeProvider } from './theme';

root.render(
  <ThemeProvider>
    <BrowserRouter>
      <Navigation />
    </BrowserRouter>
  </ThemeProvider>
);
```

### 2. Using the Theme Hook

Access theme values and controls in any component:

```tsx
import { useTheme } from '../theme';

function MyComponent() {
  const { mode, colors, toggleTheme, setTheme } = useTheme();

  return (
    <div style={{ backgroundColor: colors.background.paper }}>
      <p>Current theme: {mode}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

### 3. Using CSS Variables

The preferred way to use theme colors is via CSS variables:

```css
.my-component {
  background-color: var(--color-bg-paper);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.my-button {
  background-color: var(--color-primary);
  color: var(--color-primary-contrast);
}

.my-button:hover {
  background-color: var(--color-primary-dark);
}
```

## Color Palette Reference

### Primary Colors
| Variable | Light Mode | Dark Mode | Usage |
|----------|-----------|-----------|-------|
| `--color-primary` | `#6366f1` (Indigo) | `#818cf8` (Light Indigo) | Primary brand color, CTAs |
| `--color-primary-light` | `#818cf8` | `#a5b4fc` | Hover states, highlights |
| `--color-primary-dark` | `#4f46e5` | `#6366f1` | Active states, emphasis |
| `--color-primary-contrast` | `#ffffff` | `#1f1f1f` | Text on primary background |

### Secondary Colors
| Variable | Light Mode | Dark Mode | Usage |
|----------|-----------|-----------|-------|
| `--color-secondary` | `#C5BAEE` | `#C5BAEE` | Secondary actions, accents |
| `--color-secondary-light` | `#e0d9f7` | `#e0d9f7` | Subtle highlights |
| `--color-secondary-dark` | `#a89dd9` | `#a89dd9` | Darker accents |
| `--color-secondary-contrast` | `#1f1f1f` | `#1f1f1f` | Text on secondary |

### Background Colors
| Variable | Light Mode | Dark Mode | Usage |
|----------|-----------|-----------|-------|
| `--color-bg-default` | `#f8f9fa` | `#0f172a` | Base page background |
| `--color-bg-paper` | `#ffffff` | `#1e293b` | Cards, content areas |
| `--color-bg-elevated` | `#ffffff` | `#334155` | Modals, tooltips |
| `--color-bg-navbar` | `#1f2937` | `#020617` | Navigation bar |
| `--color-bg-footer` | `#1f2937` | `#020617` | Footer |

### Text Colors
| Variable | Light Mode | Dark Mode | Usage |
|----------|-----------|-----------|-------|
| `--color-text-primary` | `#1f2937` | `#f8fafc` | Main text content |
| `--color-text-secondary` | `#6b7280` | `#cbd5e1` | Secondary text, labels |
| `--color-text-disabled` | `#9ca3af` | `#64748b` | Disabled text |
| `--color-text-hint` | `#d1d5db` | `#475569` | Placeholder text |

### Status Colors
| Variable | Light Mode | Dark Mode | Usage |
|----------|-----------|-----------|-------|
| `--color-success` | `#10b981` | `#34d399` | Success messages, confirmations |
| `--color-success-light` | `#d1fae5` | `#064e3b` | Success backgrounds |
| `--color-success-dark` | `#059669` | `#10b981` | Success hover states |
| `--color-error` | `#ef4444` | `#f87171` | Error messages, validation |
| `--color-error-light` | `#fee2e2` | `#7f1d1d` | Error backgrounds |
| `--color-error-dark` | `#dc2626` | `#ef4444` | Error hover states |
| `--color-warning` | `#f59e0b` | `#fbbf24` | Warning messages |
| `--color-warning-light` | `#fef3c7` | `#78350f` | Warning backgrounds |
| `--color-warning-dark` | `#d97706` | `#f59e0b` | Warning hover states |
| `--color-info` | `#3b82f6` | `#60a5fa` | Info messages, tips |
| `--color-info-light` | `#dbeafe` | `#1e3a8a` | Info backgrounds |
| `--color-info-dark` | `#2563eb` | `#3b82f6` | Info hover states |

### Border Colors
| Variable | Light Mode | Dark Mode | Usage |
|----------|-----------|-----------|-------|
| `--color-border` | `#e5e7eb` | `#334155` | Default borders |
| `--color-border-light` | `#f3f4f6` | `#475569` | Subtle dividers |
| `--color-border-dark` | `#d1d5db` | `#1e293b` | Emphasized borders |

### Surface Colors
| Variable | Light Mode | Dark Mode | Usage |
|----------|-----------|-----------|-------|
| `--color-surface` | `#ffffff` | `#1e293b` | Interactive surfaces |
| `--color-surface-hover` | `#f9fafb` | `#334155` | Hover states |
| `--color-surface-active` | `#f3f4f6` | `#475569` | Active/pressed states |
| `--color-surface-disabled` | `#e5e7eb` | `#334155` | Disabled surfaces |

### Shadow Colors
| Variable | Light Mode | Dark Mode | Usage |
|----------|-----------|-----------|-------|
| `--color-shadow-light` | `rgba(0,0,0,0.05)` | `rgba(0,0,0,0.2)` | Subtle shadows |
| `--color-shadow-medium` | `rgba(0,0,0,0.1)` | `rgba(0,0,0,0.4)` | Standard shadows |
| `--color-shadow-dark` | `rgba(0,0,0,0.2)` | `rgba(0,0,0,0.6)` | Deep shadows |

## API Reference

### `useTheme()` Hook

Returns a `ThemeContextType` object:

```typescript
interface ThemeContextType {
  mode: 'light' | 'dark';      // Current theme mode
  colors: ThemeColors;          // Current color palette
  toggleTheme: () => void;      // Toggle between light/dark
  setTheme: (mode) => void;     // Set specific theme
}
```

**Example:**
```tsx
const { mode, colors, toggleTheme, setTheme } = useTheme();

// Toggle theme
toggleTheme();

// Set specific theme
setTheme('dark');

// Access colors programmatically (prefer CSS variables)
const bgColor = colors.background.paper;
```

### `ThemeProvider` Component

**Props:**
- `children: ReactNode` - Child components
- `defaultMode?: 'light' | 'dark'` - Default theme (optional, defaults to 'light' or system preference)

**Features:**
- Automatically detects system theme preference
- Persists user selection to localStorage
- Listens for system theme changes
- Applies CSS variables to document root

### `ThemeToggle` Component

Pre-built toggle button component.

**Usage:**
```tsx
import ThemeToggle from '../Components/ThemeToggle';

function Navbar() {
  return (
    <nav>
      <ThemeToggle />
    </nav>
  );
}
```

## Best Practices

### ✅ DO

1. **Use CSS Variables** for styling:
   ```css
   .card {
     background: var(--color-bg-paper);
     color: var(--color-text-primary);
   }
   ```

2. **Add transitions** for smooth theme changes:
   ```css
   .element {
     background-color: var(--color-bg-paper);
     transition: background-color 0.3s ease, color 0.3s ease;
   }
   ```

3. **Use semantic naming**:
   - Use `--color-primary` for main actions
   - Use `--color-success` for success states
   - Use `--color-bg-paper` for content backgrounds

4. **Test both themes** when creating new components

### ❌ DON'T

1. **Don't hardcode colors**:
   ```css
   /* Bad */
   .element { background: #ffffff; }

   /* Good */
   .element { background: var(--color-bg-paper); }
   ```

2. **Don't access colors object in JSX** unless necessary:
   ```tsx
   /* Bad */
   <div style={{ backgroundColor: colors.background.paper }}>

   /* Good */
   <div className="my-component">
   ```
   ```css
   .my-component { background-color: var(--color-bg-paper); }
   ```

3. **Don't forget transitions** on theme-sensitive properties

4. **Don't mix old and new color systems** - migrate gradually but consistently

## Migration Guide

### Migrating Existing Components

1. **Replace hardcoded colors** with CSS variables:
   ```css
   /* Before */
   .navbar {
     background-color: #121212;
     color: white;
   }

   /* After */
   .navbar {
     background-color: var(--color-bg-navbar);
     color: var(--color-primary-contrast);
   }
   ```

2. **Add transitions**:
   ```css
   .element {
     transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
   }
   ```

3. **Update inline styles** to use classes:
   ```tsx
   // Before
   <div style={{ backgroundColor: '#fff' }}>

   // After
   <div className="card-container">
   ```

4. **Test in both themes** to ensure readability

## Examples

### Basic Component with Theme

```tsx
import React from 'react';
import { useTheme } from '../theme';
import './MyComponent.css';

const MyComponent: React.FC = () => {
  const { mode } = useTheme();

  return (
    <div className="my-component" data-theme={mode}>
      <h2>Hello, themed world!</h2>
      <p>This component automatically adapts to light/dark mode</p>
    </div>
  );
};
```

```css
/* MyComponent.css */
.my-component {
  background-color: var(--color-bg-paper);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  padding: 1rem;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

.my-component h2 {
  color: var(--color-primary);
}

.my-component p {
  color: var(--color-text-secondary);
}
```

### Custom Theme-Aware Button

```tsx
import React from 'react';
import './Button.css';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  children: React.ReactNode;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  onClick
}) => {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

```css
/* Button.css */
.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-primary-contrast);
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
}

.btn-success {
  background-color: var(--color-success);
  color: var(--color-primary-contrast);
}

.btn-success:hover {
  background-color: var(--color-success-dark);
}
```

## Troubleshooting

### Theme not applying
- Ensure `ThemeProvider` wraps your app in [src/index.tsx](../index.tsx)
- Check browser console for errors
- Clear localStorage and refresh: `localStorage.removeItem('spajzka-theme-mode')`

### Colors not updating
- Verify CSS variables are used instead of hardcoded colors
- Check that transitions are applied
- Ensure CSS is properly imported

### localStorage errors
- Check browser privacy settings
- Ensure cookies/storage are enabled
- Theme will fall back to default if localStorage fails

## Future Enhancements

Potential improvements:
- [ ] Additional theme variants (high contrast, colorblind-friendly)
- [ ] Per-component theme overrides
- [ ] Theme customization UI
- [ ] Animation preferences (reduced motion)
- [ ] Font size scaling
- [ ] Custom color palette builder

## Resources

- [CSS Variables (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [prefers-color-scheme (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)
- [React Context API](https://react.dev/reference/react/useContext)
- [Color Accessibility](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

## Support

For issues or questions about the theme system:
1. Check this documentation
2. Review [Global.css](../CSS/Global.css) for CSS variable reference
3. Examine [colors.ts](./colors.ts) for palette definitions
4. Open an issue in the project repository
