# Typography System Guide

This document outlines the typography system used throughout the Trustline Fintech application. The system ensures consistent font sizes, weights, and styles across all components.

## Overview

The typography system is defined in `src/utils/designSystem.js` and provides standardized font sizes for headings, subheadings, body text, labels, and captions.

## Font Size Hierarchy

### Headings
- **H1** (`typography.h1()`): `text-3xl font-bold` (30px) - Main page titles
- **H2** (`typography.h2()`): `text-2xl font-bold` (24px) - Section titles
- **H3** (`typography.h3()`): `text-xl font-semibold` (20px) - Subsection titles
- **H4** (`typography.h4()`): `text-lg font-semibold` (18px) - Card titles, small sections
- **H5** (`typography.h5()`): `text-base font-semibold` (16px) - Minor headings
- **H6** (`typography.h6()`): `text-sm font-semibold` (14px) - Small headings

### Subheadings
- **Subheading** (`typography.subheading()`): `text-lg font-medium` (18px) - Subheadings
- **Subheading Small** (`typography.subheadingSmall()`): `text-base font-medium` (16px) - Small subheadings

### Body Text
- **Body** (`typography.body()`): `text-base` (16px) - Regular paragraph text
- **Body Large** (`typography.bodyLarge()`): `text-lg` (18px) - Large body text
- **Body Small** (`typography.bodySmall()`): `text-sm` (14px) - Small body text

### Labels and Captions
- **Label** (`typography.label()`): `text-sm font-medium` (14px) - Form labels
- **Caption** (`typography.caption()`): `text-xs` (12px) - Captions, helper text
- **Caption Small** (`typography.captionSmall()`): `text-xs font-medium` (12px) - Small captions with emphasis

### Special Text
- **Lead** (`typography.lead()`): `text-lg font-normal` (18px) - Lead paragraph
- **Small** (`typography.small()`): `text-sm text-gray-600` (14px) - Secondary text
- **Tiny** (`typography.tiny()`): `text-xs text-gray-500` (12px) - Tiny text, metadata

## Usage

### Import the Typography Helper

```javascript
import { typography } from '../../../utils/designSystem';
```

### Basic Usage

```jsx
// Headings
<h1 className={typography.h1()}>Dashboard Overview</h1>
<h2 className={typography.h2()}>Section Title</h2>
<h3 className={typography.h3()}>Subsection Title</h3>

// Body Text
<p className={typography.body()}>Regular paragraph text</p>
<p className={typography.bodySmall()}>Small body text</p>

// Labels and Captions
<label className={typography.label()}>Form Label</label>
<span className={typography.caption()}>Helper text</span>
```

### Custom Colors

You can pass custom color classes to typography functions:

```jsx
// Heading with custom color
<h1 className={typography.h1("text-blue-900")}>Blue Heading</h1>

// Body text with custom color
<p className={typography.body("text-gray-700")}>Gray body text</p>

// Label with custom color
<label className={typography.label("text-indigo-900")}>Indigo Label</label>
```

### Combining with Other Classes

You can combine typography classes with other Tailwind classes:

```jsx
<h1 className={`${typography.h1()} mb-4`}>Heading with margin</h1>
<p className={`${typography.bodySmall()} mt-2 text-center`}>Centered small text</p>
```

## Examples

### Dashboard Header

```jsx
<div className="mb-6">
  <h1 className={typography.h1()}>Dashboard Overview</h1>
  <p className={`${typography.bodySmall()} mt-2`}>Monitor your business metrics and activities</p>
</div>
```

### Card Title

```jsx
<div className="bg-white rounded-xl p-6">
  <h3 className={typography.h4()}>Card Title</h3>
  <p className={`${typography.caption()} mt-1`}>Card description</p>
</div>
```

### Metric Card

```jsx
<div className="bg-white rounded-xl p-5">
  <p className={`${typography.captionSmall()} uppercase tracking-wider mb-2`}>
    Total Revenue
  </p>
  <p className={`${typography.h2()} mb-1`}>₹1,25,000</p>
  <p className={typography.tiny()}>Total revenue generated</p>
</div>
```

### Form Label

```jsx
<label className={typography.label()} htmlFor="email">
  Email Address
</label>
<input
  type="email"
  id="email"
  className="w-full px-4 py-2 border rounded-lg"
/>
<span className={typography.caption()}>Enter your email address</span>
```

### Activity Item

```jsx
<div className="flex items-start space-x-3">
  <div className="flex-1">
    <p className={typography.label()}>Activity Title</p>
    <p className={`${typography.caption()} line-clamp-2 mb-1`}>
      Activity description goes here
    </p>
    <p className={`${typography.tiny()} font-medium`}>2 hours ago</p>
  </div>
</div>
```

## Migration Guide

### Before (Inconsistent)

```jsx
<h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
<h2 className="text-2xl font-bold">Section</h2>
<p className="text-sm text-gray-600">Description</p>
<span className="text-xs text-gray-500">Helper</span>
```

### After (Consistent)

```jsx
<h1 className={typography.h1()}>Dashboard</h1>
<h2 className={typography.h2()}>Section</h2>
<p className={typography.bodySmall()}>Description</p>
<span className={typography.caption()}>Helper</span>
```

## Best Practices

1. **Always use typography helpers** instead of hardcoded font size classes
2. **Use semantic headings** (h1, h2, h3) for proper document structure
3. **Maintain hierarchy** - Use h1 for main titles, h2 for sections, h3 for subsections
4. **Combine with spacing** - Add margin/padding classes as needed
5. **Use appropriate text sizes** - Don't use h1 for small text or caption for headings
6. **Customize colors when needed** - Pass color classes to typography functions

## Typography Scale Reference

| Type | Function | Size | Weight | Use Case |
|------|----------|------|--------|----------|
| H1 | `typography.h1()` | 30px | Bold | Main page titles |
| H2 | `typography.h2()` | 24px | Bold | Section titles |
| H3 | `typography.h3()` | 20px | Semibold | Subsection titles |
| H4 | `typography.h4()` | 18px | Semibold | Card titles |
| H5 | `typography.h5()` | 16px | Semibold | Minor headings |
| H6 | `typography.h6()` | 14px | Semibold | Small headings |
| Subheading | `typography.subheading()` | 18px | Medium | Subheadings |
| Body | `typography.body()` | 16px | Normal | Regular text |
| Body Small | `typography.bodySmall()` | 14px | Normal | Small text |
| Label | `typography.label()` | 14px | Medium | Form labels |
| Caption | `typography.caption()` | 12px | Normal | Helper text |
| Tiny | `typography.tiny()` | 12px | Normal | Metadata |

## Notes

- All typography functions accept an optional color parameter
- Default colors are set to appropriate text colors (gray-900 for headings, gray-600 for body, etc.)
- The system uses Tailwind CSS utility classes under the hood
- Font sizes are responsive and scale appropriately on different screen sizes

