# Tailwind CSS in Astro

## Setup

Use `@tailwindcss/vite` — the `@astrojs/tailwind` integration is deprecated.

```ts
// astro.config.ts
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
})
```

Install: `npm install tailwindcss @tailwindcss/vite`

## CSS Entry Point

```css
/* src/styles/global.css */
@import "tailwindcss";
```

Import in your layout:
```astro
---
// src/layouts/Layout.astro
import '../styles/global.css'
---
```

## Theme Customization

All configuration is in CSS — there is no `tailwind.config.js`.

```css
@import "tailwindcss";

@theme inline {
  --color-primary: oklch(0.6 0.2 250);
  --color-secondary: oklch(0.7 0.15 200);
  --font-sans: 'Geist', system-ui, sans-serif;
  --font-mono: 'Geist Mono', monospace;
}
```

### Using CSS Custom Properties

```css
@import "tailwindcss";

@theme inline {
  --color-primary: var(--primary);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-muted: var(--muted);
  --color-border: var(--border);
}

:root {
  --primary: oklch(0.6 0.2 250);
  --background: #ffffff;
  --foreground: #0a0a0a;
}

[data-theme='dark'] {
  --primary: oklch(0.7 0.2 250);
  --background: #1c1c1c;
  --foreground: #fafafa;
}
```

Usage: `<div class="bg-background text-foreground border-border">`

## Utility Class Composition (with clsx + tailwind-merge)

```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Usage in components:
```astro
---
interface Props { class?: string }
const { class: className } = Astro.props
import { cn } from '@/lib/utils'
---
<div class={cn('rounded-lg border p-4', className)}>
  <slot />
</div>
```

## Dark Mode

Tailwind v4 respects `prefers-color-scheme` by default. For manual toggle:

```css
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
```

Then toggle via `document.documentElement.dataset.theme = 'dark'`.

## Tips

1. **No `content` array needed** — template files are auto-detected
2. **`@apply` in `.astro` files** works but be aware of specificity in scoped styles
3. **Arbitrary values** work as expected: `bg-[#1a1a1a]`, `text-[14px]`
4. **Container queries** are built-in: `@container`, `@lg:flex`
5. **`theme()` function in CSS** is replaced by direct CSS variable references: `var(--color-primary)`

## Fonts

Astro has a built-in fonts API. Don't manually add `<link>` tags or install `@fontsource/*` packages.

```ts
// astro.config.ts
import { defineConfig, fontProviders } from 'astro/config'

export default defineConfig({
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Inter',
      cssVariable: '--font-inter',
    },
    {
      provider: fontProviders.google(),
      name: 'Fira Code',
      cssVariable: '--font-fira-code',
    },
    {
      provider: fontProviders.local(),
      name: 'CustomFont',
      cssVariable: '--font-custom',
      options: {
        variants: [{ src: ['./src/assets/fonts/Custom.woff2'], weight: 'normal', style: 'normal' }],
      },
    },
  ],
})
```

Add the `<Font />` component in your layout `<head>`:

```astro
---
import { Font } from 'astro:assets'
---
<head>
  <Font cssVariable="--font-inter" />
</head>
```

Wire into Tailwind v4 via `@theme`:

```css
@import "tailwindcss";

@theme inline {
  --font-sans: var(--font-inter);
  --font-mono: var(--font-fira-code);
}
```

Fonts are downloaded locally at build time — no runtime calls to Google/third-party CDNs.

## Common Agent Mistakes

Agents frequently generate these outdated patterns:

| Agents generate | Correct |
|-----------------|---------|
| `@tailwind base; @tailwind components; @tailwind utilities;` | `@import "tailwindcss";` |
| `tailwind.config.js` with `theme.extend` | CSS `@theme inline { --color-*: ... }` |
| `@astrojs/tailwind` integration | `@tailwindcss/vite` as Vite plugin |
| `content: ['./src/**/*.{astro,tsx}']` | Auto-detected (no config needed) |
| `darkMode: 'class'` in config | `@custom-variant dark (...)` in CSS |
| `theme()` function | `var(--color-*)` CSS variables |
