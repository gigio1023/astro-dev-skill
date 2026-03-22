# Islands & Hydration

Astro's islands architecture renders pages as static HTML and selectively hydrates interactive components. Every framework component (React, Vue, Svelte, etc.) requires an explicit `client:*` directive to become interactive — without one, it renders as static HTML with zero JavaScript.

## Client Directives

| Directive | When it hydrates | Use when |
|---|---|---|
| `client:load` | Immediately on page load | Must be interactive instantly (modals, nav dropdowns) |
| `client:idle` | When browser is idle (`requestIdleCallback`) | Interactive but not urgent (comments, sidebars) |
| `client:visible` | When element enters viewport | Below the fold (carousels, footer widgets) |
| `client:media="(max-width: 768px)"` | When media query matches | Mobile-only interactions |
| `client:only="react"` | Immediately, **skips SSR entirely** | Components that can't render on server (uses `window`, `document`) |

### Decision tree

```
Does the component need interactivity?
├── No  → No directive (static HTML, zero JS)
├── Yes → Must be interactive on first paint?
│   ├── Yes → client:load
│   └── No  → Is it above the fold?
│       ├── Yes → client:idle
│       └── No  → client:visible
│
Does the component break during SSR?
└── Yes → client:only="react" (or vue, svelte, etc.)
```

### Usage

```astro
---
import Counter from '../components/Counter.tsx'
import HeavyChart from '../components/Chart.tsx'
import MobileMenu from '../components/MobileMenu.tsx'
---

<!-- Interactive immediately -->
<Counter client:load />

<!-- Hydrate when scrolled into view -->
<HeavyChart client:visible />

<!-- Hydrate only on mobile -->
<MobileMenu client:media="(max-width: 768px)" />

<!-- Skip SSR — component uses window API -->
<ThemeToggle client:only="react" />
```

## State Sharing Between Islands

Framework context providers (React `Context`, Vue `provide/inject`) **do not work across islands**. Each island is an independent hydration root.

Use [nanostores](https://github.com/nanostores/nanostores) for cross-island state:

```ts
// src/stores/cart.ts
import { map } from 'nanostores'

export const cart = map<Record<string, number>>({})

export function addItem(id: string) {
  cart.setKey(id, (cart.get()[id] || 0) + 1)
}
```

```tsx
// React island — src/components/CartButton.tsx
import { useStore } from '@nanostores/react'
import { cart } from '../stores/cart'

export default function CartButton() {
  const items = useStore(cart)
  return <button>{Object.keys(items).length} items</button>
}
```

```astro
<!-- Svelte island reads the same store -->
<CartButton client:load />
<CartSidebar client:visible />
<!-- Both share state via nanostores, not React context -->
```

Install: `npm install nanostores @nanostores/react` (or `@nanostores/vue`, `@nanostores/svelte`)

## Server Islands (`server:defer`)

Server islands defer rendering of a component to an independent server request. The page loads immediately with fallback content, then the deferred component streams in.

```astro
---
import Avatar from '../components/Avatar.astro'
import GenericAvatar from '../components/GenericAvatar.astro'
---
<Avatar server:defer>
  <GenericAvatar slot="fallback" />
</Avatar>
```

The deferred component has full server access (cookies, database, etc.):

```astro
---
// Avatar.astro — runs server-side on its own request
const session = Astro.cookies.get('session')
const avatarURL = await getUserAvatar(session)
---
<img src={avatarURL} alt="User avatar" />
```

### When to use server:defer vs client:*

| Need | Use |
|---|---|
| Personalized content from server (user data, session) | `server:defer` |
| Interactive UI (clicks, forms, animations) | `client:*` directive |
| Expensive server computation that shouldn't block page | `server:defer` |
| Component that only needs browser APIs | `client:only` |

### Server Islands gotchas

- **Props are encrypted in the request body.** Keep props small. Default body size limit is 1MB — configure via `security.serverIslandBodySizeLimit`.
- **Cannot pass functions or circular references as props.** Only serializable types: objects, strings, numbers, arrays, Date, Map, Set, URL, RegExp.
- **Requires an adapter** — server islands need on-demand rendering.
- **To read the original page URL**, use `Astro.request.headers.get('Referer')` — the island runs in an isolated request.
- **For multi-deployment setups**, set `ASTRO_KEY` env var (generate with `astro create-key`) to keep prop encryption in sync.

## Common Agent Mistakes

| Agents do | Correct |
|---|---|
| Use `client:load` on everything | Use `client:idle` or `client:visible` for non-critical components |
| Wrap multiple islands in React `<Provider>` | Use nanostores for cross-island state |
| Omit `client:*` and expect interactivity | No directive = static HTML, zero JS |
| Use `client:only` without specifying framework | Must specify: `client:only="react"` |
| `client:media` for responsive show/hide | `client:media` controls hydration, not visibility — use CSS for show/hide |
| Don't know `server:defer` exists | Use it for personalized/dynamic content that shouldn't block page load |
