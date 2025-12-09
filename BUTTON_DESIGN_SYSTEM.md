# Button Design System

## Overview
Tất cả buttons trong website đều sử dụng pill-shaped (rounded-full) để đồng bộ và nhất quán.

## Button Styles

### 1. Primary Button (Purple Gradient - Glossy)
**Class:** `btn-primary`
**Usage:** Primary call-to-action buttons (e.g., "Join Now", "Submit", "Get Started")
```html
<button className="btn-primary">Placeholder</button>
```
- Background: Purple gradient với glossy effect
- Text: White
- Effect: Inset highlight và shadow

### 2. Orange Button (Orange/Golden Gradient - Glossy)
**Class:** `btn-orange`
**Usage:** Special promotions, highlights
```html
<button className="btn-orange">Placeholder</button>
```
- Background: Orange/golden gradient với glossy effect
- Text: Purple-800
- Effect: Inset highlight và shadow

### 3. Dark Purple Button (Darker Purple Gradient - Glossy)
**Class:** `btn-purple-dark`
**Usage:** Alternative primary button, darker variant
```html
<button className="btn-purple-dark">Placeholder</button>
```
- Background: Darker purple gradient với glossy effect
- Text: White
- Effect: Inset highlight và shadow

### 4. White Button (Flat)
**Class:** `btn-white`
**Usage:** Secondary actions trên dark backgrounds
```html
<button className="btn-white">Placeholder</button>
```
- Background: White
- Text: Purple-800
- Style: Flat (no gradient)

### 5. Outline Purple Button (Dark Purple with Border - Flat)
**Class:** `btn-outline-purple`
**Usage:** Alternative secondary button
```html
<button className="btn-outline-purple">Placeholder</button>
```
- Background: Purple-900
- Text: Purple-200
- Border: Purple-300 (2px)

### 6. Outline Black Button (Black with White Border - Flat)
**Class:** `btn-outline-black`
**Usage:** Dark theme buttons
```html
<button className="btn-outline-black">Placeholder</button>
```
- Background: Black
- Text: White
- Border: White (2px)

### 7. Light Purple Button (Flat)
**Class:** `btn-purple-light`
**Usage:** Subtle actions, info buttons
```html
<button className="btn-purple-light">Placeholder</button>
```
- Background: Purple-100
- Text: Purple-800
- Style: Flat

### 8. Light Gray Button (Flat)
**Class:** `btn-gray-light`
**Usage:** Neutral actions, disabled states
```html
<button className="btn-gray-light">Placeholder</button>
```
- Background: Gray-200
- Text: Gray-800
- Style: Flat

### 9. Light Green Button (Flat)
**Class:** `btn-green-light`
**Usage:** Success actions, positive confirmations
```html
<button className="btn-green-light">Placeholder</button>
```
- Background: Green-100
- Text: Green-800
- Style: Flat

### 10. Light Red/Pink Button (Flat)
**Class:** `btn-red-light`
**Usage:** Warning actions, delete confirmations
```html
<button className="btn-red-light">Placeholder</button>
```
- Background: Red-100
- Text: Red-800
- Style: Flat

### Secondary Button (Outline style)
**Class:** `btn-secondary`
**Usage:** Secondary actions (e.g., "Log in", "Cancel")
```html
<button className="btn-secondary">Placeholder</button>
```
- Background: White
- Text: Purple-600
- Border: Purple-600 (2px)
- Style: Flat outline

## Common Properties

Tất cả buttons đều có:
- **Shape:** `rounded-full` (pill-shaped)
- **Padding:** `py-3 px-6`
- **Font:** `font-bold`
- **Transition:** `transition-all duration-200`
- **Hover effects:** Tùy theo style (glossy buttons có shadow changes, flat buttons có background color changes)

## Usage Guidelines

1. **Primary Actions:** Sử dụng `btn-primary` cho main CTA
2. **Secondary Actions:** Sử dụng `btn-secondary` cho secondary actions
3. **Special Promotions:** Sử dụng `btn-orange` cho highlights
4. **Neutral Actions:** Sử dụng `btn-gray-light` hoặc `btn-white`
5. **Status Actions:** 
   - Success: `btn-green-light`
   - Warning/Delete: `btn-red-light`
   - Info: `btn-purple-light`

## Examples

```tsx
// Primary CTA
<button className="btn-primary">Join Now</button>

// Secondary action
<button className="btn-secondary">Log in</button>

// Special promotion
<button className="btn-orange">Limited Offer</button>

// Success action
<button className="btn-green-light">Confirm</button>

// Warning action
<button className="btn-red-light">Delete</button>
```

