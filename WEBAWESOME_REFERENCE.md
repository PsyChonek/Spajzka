# WebAwesome Quick Reference

## Component Usage Guide

### Button
```tsx
import '@awesome.me/webawesome/dist/components/button/button.js';

<wa-button 
  variant="brand|success|danger|warning|neutral"
  appearance="filled|outlined|plain|accent"
  size="small|medium|large"
  onClick={handler}
>
  Click Me
</wa-button>
```

### Button with Icon
```tsx
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';

<wa-button variant="brand">
  <wa-icon slot="start" name="plus"></wa-icon>
  Add Item
</wa-button>
```

### Input
```tsx
import '@awesome.me/webawesome/dist/components/input/input.js';

<wa-input
  label="Username"
  type="text"
  placeholder="Enter username"
  value={value}
  onWaInput={(e: any) => setValue(e.target.value)}
  appearance="outlined|filled"
  size="small|medium|large"
  required
></wa-input>
```

### Input with Icon
```tsx
<wa-input placeholder="Search...">
  <wa-icon slot="start" name="magnifying-glass"></wa-icon>
</wa-input>
```

### Switch
```tsx
import '@awesome.me/webawesome/dist/components/switch/switch.js';

<wa-switch
  checked={isOn}
  onWaChange={handleChange}
  size="medium"
>
  Label Text
</wa-switch>
```

### Dropdown
```tsx
import '@awesome.me/webawesome/dist/components/dropdown/dropdown.js';

<wa-dropdown>
  <wa-button slot="trigger" with-caret>
    Options
  </wa-button>
  
  <wa-dropdown-item onClick={handler1}>
    <wa-icon slot="start" name="edit"></wa-icon>
    Edit
  </wa-dropdown-item>
  
  <wa-dropdown-item onClick={handler2}>
    <wa-icon slot="start" name="trash"></wa-icon>
    Delete
  </wa-dropdown-item>
</wa-dropdown>
```

### Icon
```tsx
import '@awesome.me/webawesome/dist/components/icon/icon.js';

<wa-icon 
  name="icon-name"
  library="default"
  style={{ fontSize: '1.5rem', color: 'red' }}
></wa-icon>
```

## Common Icons (Font Awesome)

### UI Icons
- `sun`, `moon` - Theme
- `magnifying-glass` - Search
- `xmark`, `x` - Close
- `check` - Confirm
- `plus` - Add
- `minus` - Remove
- `bars` - Menu
- `gear`, `cog` - Settings

### Sort & Navigation
- `sort-up`, `sort-down` - Sort direction
- `arrow-up`, `arrow-down`, `arrow-left`, `arrow-right` - Navigation
- `chevron-up`, `chevron-down`, `chevron-left`, `chevron-right` - Dropdowns

### Actions
- `trash`, `trash-can` - Delete
- `pen`, `pencil`, `edit` - Edit
- `save`, `floppy-disk` - Save
- `share` - Share
- `download`, `upload` - Transfer

### Status
- `circle-check`, `check-circle` - Success
- `circle-xmark`, `times-circle` - Error
- `circle-exclamation`, `exclamation-circle` - Warning
- `circle-info`, `info-circle` - Info

## Event Handling

```tsx
// WebAwesome Events
onWaChange={(e) => handler(e)}      // Switch, checkbox value change
onWaInput={(e) => handler(e)}       // Input keystroke
onWaSelect={(e) => handler(e)}      // Dropdown selection

// Standard Events (still work)
onClick={(e) => handler(e)}
onFocus={(e) => handler(e)}
onBlur={(e) => handler(e)}
```

## Styling

### CSS Custom Properties
```tsx
<wa-button 
  style={{
    '--wa-color-brand': '#FF6B6B',
    fontSize: '1.2rem'
  } as React.CSSProperties}
>
  Custom Button
</wa-button>
```

### CSS Classes
```tsx
<wa-button className="my-custom-class">
  Styled Button
</wa-button>
```

## Variants Cheat Sheet

### Button/Component Variants
- `brand` - Primary brand color (blue/indigo)
- `success` - Green (confirm, save)
- `danger` - Red (delete, cancel)
- `warning` - Orange/yellow (caution)
- `neutral` - Gray (secondary actions)

### Appearance Styles
- `filled` - Solid background
- `outlined` - Border only, transparent bg
- `plain` - Minimal, no border
- `accent` - Both filled and outlined (extra emphasis)

### Sizes
- `small` - Compact UI elements
- `medium` - Default size (most common)
- `large` - Prominent actions

## TypeScript Support

Add to `types/webawesome.d.ts`:
```typescript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'wa-button': any;
      'wa-icon': any;
      'wa-input': any;
      'wa-switch': any;
      'wa-dropdown': any;
      'wa-dropdown-item': any;
    }
  }
}

export {};
```

Reference in `react-app-env.d.ts`:
```typescript
/// <reference types="./types/webawesome" />
```

## Common Patterns

### Form with Input and Button
```tsx
<form onSubmit={handleSubmit}>
  <wa-input
    label="Name"
    type="text"
    value={name}
    onWaInput={(e: any) => setName(e.target.value)}
    required
  ></wa-input>
  
  <wa-button type="submit" variant="brand">
    Submit
  </wa-button>
</form>
```

### Confirm/Cancel Dialog Buttons
```tsx
<div className="dialog-actions">
  <wa-button variant="neutral" onClick={onCancel}>
    Cancel
  </wa-button>
  <wa-button variant="danger" onClick={onConfirm}>
    Delete
  </wa-button>
</div>
```

### Icon Button (No Label)
```tsx
<wa-button variant="neutral" appearance="plain" pill>
  <wa-icon slot="label" name="gear"></wa-icon>
</wa-button>
```

### Loading State
```tsx
<wa-button loading variant="brand">
  Processing...
</wa-button>
```

### Disabled State
```tsx
<wa-button disabled variant="brand">
  Disabled
</wa-button>
```

## Migration Tips

1. **Replace Bootstrap classes:**
   - `btn btn-primary` → `<wa-button variant="brand">`
   - `btn btn-success` → `<wa-button variant="success">`
   - `btn btn-danger` → `<wa-button variant="danger">`

2. **Replace Bootstrap icons:**
   - `<i className="bi bi-check">` → `<wa-icon name="check">`
   - `<i className="bi bi-x">` → `<wa-icon name="xmark">`

3. **Replace inputs:**
   - `<input className="form-control">` → `<wa-input>`

4. **Update events:**
   - `onChange` → `onWaInput` or `onWaChange`

## Resources

- Docs: https://webawesome.com/docs/
- Components: https://webawesome.com/docs/components/
- Icons: https://fontawesome.com/search?o=r&m=free
