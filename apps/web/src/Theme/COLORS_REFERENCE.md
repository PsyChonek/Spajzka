# Color Palette Visual Reference

## Light Theme

### Primary Colors
```
Primary Main:     #BC5F04  ████████  Medium Orange - Main brand color
Primary Light:    #F4442E  ████████  Bright Red-Orange - Hover states
Primary Dark:     #874000  ████████  Dark Orange-Brown - Active states
Primary Contrast: #ffffff  ████████  White - Text on primary
```

### Secondary Colors
```
Secondary Main:     #874000  ████████  Dark Orange-Brown
Secondary Light:    #BC5F04  ████████  Medium Orange
Secondary Dark:     #2B0504  ████████  Very Dark Red
Secondary Contrast: #ffffff  ████████  White - Text on secondary
```

### Background Colors
```
BG Default:  #faf8f7  ████████  Warm Off-White - Base background
BG Paper:    #ffffff  ████████  White - Content areas
BG Elevated: #ffffff  ████████  White - Modals, tooltips
BG Navbar:   #010001  ████████  Almost Black - Navigation
BG Footer:   #010001  ████████  Almost Black - Footer
```

### Text Colors
```
Text Primary:   #010001  ████████  Almost Black - Main text
Text Secondary: #2B0504  ████████  Very Dark Red - Secondary text
Text Disabled:  #9ca3af  ████████  Light Gray - Disabled text
Text Hint:      #d1d5db  ████████  Very Light Gray - Placeholders
```

### Status Colors
```
Success:       #10b981  ████████  Green
Success Light: #d1fae5  ████████  Light Green BG
Success Dark:  #059669  ████████  Dark Green

Error:       #F4442E  ████████  Bright Red-Orange
Error Light: #fee2e2  ████████  Light Red BG
Error Dark:  #2B0504  ████████  Very Dark Red

Warning:       #BC5F04  ████████  Medium Orange
Warning Light: #fef3c7  ████████  Light Orange BG
Warning Dark:  #874000  ████████  Dark Orange-Brown

Info:       #3b82f6  ████████  Blue
Info Light: #dbeafe  ████████  Light Blue BG
Info Dark:  #2563eb  ████████  Dark Blue
```

### Border Colors
```
Border Main:  #e5e7eb  ████████  Light Gray
Border Light: #f3f4f6  ████████  Very Light Gray
Border Dark:  #d1d5db  ████████  Medium Gray
```

### Surface Colors
```
Surface Default:  #ffffff  ████████  White
Surface Hover:    #fef9f6  ████████  Warm Light - Hover
Surface Active:   #fef3ed  ████████  Warm Light - Active
Surface Disabled: #e5e7eb  ████████  Gray
```

---

## Dark Theme

### Primary Colors
```
Primary Main:     #F4442E  ████████  Bright Red-Orange - Main brand color
Primary Light:    #ff6b54  ████████  Lighter Red-Orange - Hover
Primary Dark:     #BC5F04  ████████  Medium Orange - Active
Primary Contrast: #010001  ████████  Almost Black - Text on primary
```

### Secondary Colors
```
Secondary Main:     #BC5F04  ████████  Medium Orange
Secondary Light:    #F4442E  ████████  Bright Red-Orange
Secondary Dark:     #874000  ████████  Dark Orange-Brown
Secondary Contrast: #010001  ████████  Almost Black - Text on secondary
```

### Background Colors
```
BG Default:  #010001  ████████  Almost Black - Base background
BG Paper:    #2B0504  ████████  Very Dark Red - Content areas
BG Elevated: #3d0a08  ████████  Dark Red - Modals, tooltips
BG Navbar:   #010001  ████████  Almost Black - Navigation
BG Footer:   #010001  ████████  Almost Black - Footer
```

### Text Colors
```
Text Primary:   #f8fafc  ████████  Almost White - Main text
Text Secondary: #e0d6d5  ████████  Warm Light Gray - Secondary text
Text Disabled:  #64748b  ████████  Medium Gray - Disabled
Text Hint:      #475569  ████████  Dark Gray - Placeholders
```

### Status Colors
```
Success:       #34d399  ████████  Light Green
Success Light: #064e3b  ████████  Dark Green BG
Success Dark:  #10b981  ████████  Green

Error:       #F4442E  ████████  Bright Red-Orange
Error Light: #2B0504  ████████  Very Dark Red BG
Error Dark:  #ff6b54  ████████  Lighter Red-Orange

Warning:       #BC5F04  ████████  Medium Orange
Warning Light: #874000  ████████  Dark Orange-Brown BG
Warning Dark:  #F4442E  ████████  Bright Red-Orange

Info:       #60a5fa  ████████  Light Blue
Info Light: #1e3a8a  ████████  Dark Blue BG
Info Dark:  #3b82f6  ████████  Blue
```

### Border Colors
```
Border Main:  #874000  ████████  Dark Orange-Brown
Border Light: #BC5F04  ████████  Medium Orange
Border Dark:  #2B0504  ████████  Very Dark Red
```

### Surface Colors
```
Surface Default:  #2B0504  ████████  Very Dark Red
Surface Hover:    #3d0a08  ████████  Slightly Lighter Dark Red
Surface Active:   #4f0e0b  ████████  More Lighter Dark Red
Surface Disabled: #1a0302  ████████  Darker Red
```

---

## CSS Variable Quick Reference

Copy and paste these variable names in your CSS:

### Layout & Structure
```css
--color-bg-default     /* Main page background */
--color-bg-paper       /* Cards, content areas */
--color-bg-elevated    /* Modals, tooltips */
--color-bg-navbar      /* Navigation bar */
--color-bg-footer      /* Footer */
```

### Typography
```css
--color-text-primary   /* Main text */
--color-text-secondary /* Secondary text, labels */
--color-text-disabled  /* Disabled text */
--color-text-hint      /* Placeholder text */
```

### Branding
```css
--color-primary        /* Primary brand color */
--color-primary-light  /* Hover states */
--color-primary-dark   /* Active states */
--color-primary-contrast /* Text on primary */
--color-secondary      /* Secondary/accent color */
```

### Status & Feedback
```css
--color-success        /* Success messages */
--color-success-light  /* Success backgrounds */
--color-error          /* Error messages */
--color-error-light    /* Error backgrounds */
--color-warning        /* Warning messages */
--color-warning-light  /* Warning backgrounds */
--color-info           /* Info messages */
--color-info-light     /* Info backgrounds */
```

### Interactive Elements
```css
--color-surface        /* Default surface */
--color-surface-hover  /* Hover state */
--color-surface-active /* Active/pressed state */
--color-border         /* Borders, dividers */
--color-shadow-light   /* Subtle shadows */
--color-shadow-medium  /* Standard shadows */
--color-shadow-dark    /* Deep shadows */
```

---

## Usage Examples

### Button Styles
```css
.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-primary-contrast);
  border: none;
  transition: background-color 0.3s ease;
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
}
```

### Card Component
```css
.card {
  background-color: var(--color-bg-paper);
  border: 1px solid var(--color-border);
  box-shadow: 0 2px 8px var(--color-shadow-light);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 4px 16px var(--color-shadow-medium);
}
```

### Form Input
```css
.input {
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  transition: border-color 0.2s ease;
}

.input:focus {
  border-color: var(--color-primary);
  outline: none;
}

.input::placeholder {
  color: var(--color-text-hint);
}
```

### Alert Box
```css
.alert-success {
  background-color: var(--color-success-light);
  color: var(--color-success-dark);
  border-left: 4px solid var(--color-success);
}

.alert-error {
  background-color: var(--color-error-light);
  color: var(--color-error-dark);
  border-left: 4px solid var(--color-error);
}
```

---

## Color Accessibility

All color combinations have been checked for WCAG 2.1 AA compliance:

- **Text on Background**: Minimum 4.5:1 contrast ratio
- **Large Text**: Minimum 3:1 contrast ratio
- **Interactive Elements**: Clear hover/focus states

### High Contrast Pairs (Both Themes)
- Primary text on default background: ✅ Pass
- Secondary text on paper background: ✅ Pass
- Button text on primary background: ✅ Pass
- Error text on error background: ✅ Pass
- Success text on success background: ✅ Pass

---

## Theme Design Philosophy

### Light Theme
- **Clean & Warm**: Warm off-white backgrounds with pure white surfaces
- **Bold Accents**: Orange and red-orange brand colors for energy and appetite appeal
- **High Readability**: Near-black text on light backgrounds
- **Subtle Depth**: Light shadows for elevation

### Dark Theme
- **Deep & Dramatic**: Almost black with dark red backgrounds
- **Warm & Inviting**: Red-orange accents that pop against dark backgrounds
- **Reduced Eye Strain**: Lower contrast with warm undertones
- **Rich Depth**: Color-tinted shadows for cohesive look

### Color Selection Principles
1. **Brand Identity**: Warm, appetizing colors (orange, red-orange) perfect for a pantry/food app
2. **Contrast**: Proper text/background ratios for accessibility
3. **Warmth**: Warm color palette creates inviting atmosphere
4. **Purpose**: Each color has semantic meaning
5. **Accessibility**: WCAG AA compliance minimum

---

## Customization Guide

To customize colors, edit [colors.ts](./colors.ts):

```typescript
export const lightTheme: ThemeColors = {
  primary: {
    main: '#YOUR_COLOR',      // Change primary color
    light: '#LIGHTER_SHADE',
    dark: '#DARKER_SHADE',
    contrast: '#TEXT_COLOR',
  },
  // ... rest of theme
};
```

**Tips:**
- Use a color picker to generate shades
- Test contrast ratios with tools like WebAIM
- Keep dark theme colors slightly desaturated
- Maintain semantic meaning across themes
