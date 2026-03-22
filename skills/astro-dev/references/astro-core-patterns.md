# Astro Core Patterns

## Requirements

- **Node 22.12.0+** — Astro 6 dropped Node 18 and 20
- **Vite 7** — upgraded from Vite 6
- **Zod 4** — import from `astro/zod`, not `zod` directly

## Content Collections

The central data layer. See `content-collections.md` for full details.

Collections require an explicit `loader` (glob, file, or custom) and schema is a function.

## Config File

- **Preferred**: `astro.config.ts` (TypeScript, with full type inference)
- **Also works**: `astro.config.mjs`
- **No longer works**: `astro.config.cjs` (CJS removed in Astro 6)

## Rendering Content Entries

```ts
import { render } from 'astro:content'

const post = await getEntry('blog', id)
const { Content, headings, remarkPluginFrontmatter } = await render(post)
```

`render()` is a standalone function imported from `astro:content`, not a method on the entry.

## Static Paths

```ts
// src/pages/blog/[...id].astro
export async function getStaticPaths() {
  const posts = await getCollection('blog')
  return posts.map((post) => ({
    params: { id: post.id },
    props: { post },
  }))
}
```

`post.id` is the full path relative to the collection base (e.g., `my-post` or `series/part-1`).

## View Transitions

```astro
---
import { ClientRouter } from 'astro:transitions'
---
<head>
  <ClientRouter />
</head>
```

- Renamed from `<ViewTransitions />` to `<ClientRouter />` in Astro 5
- Use `transition:persist` on elements that should survive navigation (e.g., audio players, headers)
- Use `transition:name="unique-name"` for matched animations
- Inline scripts re-run on each navigation unless wrapped in `transition:persist`
- **CSP limitation**: `<ClientRouter />` is not compatible with Astro's CSP (`security.csp`) — use native View Transition API instead

## Image Handling

```astro
---
import { Image } from 'astro:assets'
import heroImage from '../assets/hero.png'
---
<Image src={heroImage} alt="Hero" width={800} />
```

- Local images are optimized at build time
- Remote images need `width` and `height` explicitly
- In content collections, use `image()` schema helper for validation
- **Astro 6**: SVG rasterization is now supported — set `format` explicitly to avoid unintended conversion

## Middleware

```ts
// src/middleware.ts
import { defineMiddleware } from 'astro:middleware'

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next()
  return response
})
```

### Chaining multiple middleware with `sequence()`

```ts
import { sequence, defineMiddleware } from 'astro:middleware'

const auth = defineMiddleware(async (context, next) => {
  const token = context.cookies.get('session')
  context.locals.user = token ? await getUser(token.value) : null
  return next()
})

const logging = defineMiddleware(async (context, next) => {
  console.log(`[${context.request.method}] ${context.url.pathname}`)
  return next()
})

export const onRequest = sequence(auth, logging)
```

Middleware executes in order: `auth` → `logging` for requests, reverse for responses.

### Typing `locals`

```ts
// src/env.d.ts
declare namespace App {
  interface Locals {
    user: { id: string; name: string } | null
  }
}
```

## Server Endpoints (API Routes)

```ts
// src/pages/api/data.ts
import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ request }) => {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json()
  return new Response(JSON.stringify({ received: body }))
}
```

For static output, only `GET` endpoints work (pre-rendered at build time).
For `POST`/`PUT`/`DELETE`, set `output: 'server'` or use `export const prerender = false`.

**Astro 6**: Endpoints with file extensions (e.g., `/sitemap.xml`) can no longer be accessed with a trailing slash.

## Output Modes

| Mode | Behavior |
|------|----------|
| `'static'` (default) | All pages pre-rendered; individual pages can opt out with `export const prerender = false` |
| `'server'` | All pages server-rendered by default; opt in to prerender with `export const prerender = true` |

Note: `'hybrid'` mode was removed in Astro 5 — its functionality merged into `'static'` mode. Any page can set `export const prerender = false` regardless of output mode.

## Scoped Styles

Styles in `.astro` files are **automatically scoped** — Astro adds a `data-astro-cid-*` attribute to both the HTML and the CSS selectors.

```astro
<!-- This h1 style only affects THIS component's h1 -->
<h1>Hello</h1>
<style>
  h1 { color: red; }
  /* compiles to: h1[data-astro-cid-xyz] { color: red; } */
</style>
```

### Passing `class` to child components

`class` does **not** pass through to child components automatically. You must accept and apply it:

```astro
---
// Card.astro
interface Props { class?: string }
const { class: className, ...rest } = Astro.props
---
<div class:list={['card', className]} {...rest}>
  <slot />
</div>
```

The `{...rest}` spread is important — it forwards the `data-astro-cid-*` attribute so parent scoped styles can target this component.

### `:global()` for slotted/markdown content

Rendered markdown or content inside `<slot />` doesn't carry the scoping attribute. Use `:global()` to style it:

```astro
<article class="prose">
  <Content />
</article>
<style>
  /* Only targets h2 inside this component's .prose */
  .prose :global(h2) {
    color: var(--color-primary);
  }
</style>
```

### Style gotchas

- **Imported CSS leaks globally** — `import './reset.css'` in a component affects the entire page, even if the component isn't rendered.
- **Scoped styles win on equal specificity** — they load last in cascade order. But higher-specificity selectors from imported CSS will override them.

## Client-Side Scripts

`<script>` tags in `.astro` files are **processed by default**: bundled, deduped, and converted to `type="module"`.

### Default behavior

```astro
<!-- Renders 3 times, but the script runs ONCE (deduped) -->
<Counter />
<Counter />
<Counter />
```

```astro
<!-- Counter.astro -->
<button class="counter">Click</button>
<script>
  // This runs once — use querySelectorAll to handle all instances
  document.querySelectorAll('.counter').forEach((btn) => {
    btn.addEventListener('click', () => { /* ... */ })
  })
</script>
```

### `is:inline` — opt out of processing

```astro
<script is:inline>
  // No bundling, no dedup, no TypeScript, no import resolution
  // DUPLICATES for each component instance
  alert('hello')
</script>
```

Use `is:inline` only for third-party CDN scripts or when you explicitly need per-instance behavior.

### Passing server data to client scripts

Frontmatter variables (between `---`) are **server-only** — they don't exist in `<script>`. Pass data via `data-*` attributes:

```astro
---
const message = 'Hello from the server'
---
<div data-message={message} id="container"></div>
<script>
  const el = document.getElementById('container')
  console.log(el.dataset.message) // 'Hello from the server'
</script>
```

Or use `define:vars` for inline scripts:

```astro
---
const greeting = 'Hello'
---
<script define:vars={{ greeting }}>
  // This becomes an inline script (not bundled, not deduped)
  console.log(greeting)
</script>
```

**Warning**: `define:vars` implies `is:inline` — the script is not bundled or deduped.

### Script/style order (Astro 6 change)

In Astro 6, `<script>` and `<style>` tags render in **declaration order** (Astro 5 reversed them). If you migrated from v5 and styles look wrong, check whether tag order needs reversing.

### Web Components pattern

For multiple-instance components, Web Components scope naturally:

```astro
<my-counter>
  <button>Click</button>
</my-counter>

<script>
  class MyCounter extends HTMLElement {
    connectedCallback() {
      // this.querySelector scopes to THIS element's children
      this.querySelector('button').addEventListener('click', () => { /* ... */ })
    }
  }
  customElements.define('my-counter', MyCounter)
</script>
```

## Data Fetching

### Timing

`fetch()` in `.astro` frontmatter runs at **build time** by default:

```astro
---
// Static mode: this runs ONCE at build time, not per request
const data = await fetch('https://api.example.com/posts').then(r => r.json())
---
```

With SSR (`output: 'server'` or `prerender = false`), the same code runs **per request**.

### Key patterns

- **Top-level `await`** works in `.astro` frontmatter — no async wrapper needed
- **Fetch your own endpoints**: `await fetch(new URL('/api/data', Astro.url))`
- **No client-side re-fetching** — `.astro` frontmatter never re-runs in the browser. For dynamic data updates, use framework components with `client:*` directives.

## Removed APIs

APIs that no longer exist. Agents frequently attempt to use these.

| Removed | Use instead |
|---------|-------------|
| `Astro.glob()` | `getCollection()` from `astro:content` |
| `Astro.fetchContent()` | `getCollection()` from `astro:content` |
| `@astrojs/tailwind` integration | `@tailwindcss/vite` as Vite plugin |
| `getEntryBySlug()` | `getEntry()` with full ID |
| `entry.render()` method | `render(entry)` standalone function |
| `entry.slug` | `entry.id` |
| `<ViewTransitions />` | `<ClientRouter />` from `astro:transitions` |
| `output: 'hybrid'` | Use `'static'` + `export const prerender = false` per page |
| `import { z } from 'astro:content'` | `import { z } from 'astro/zod'` (Astro 6) |
| `import { z } from 'astro:schema'` | `import { z } from 'astro/zod'` (Astro 6) |
| `astro.config.cjs` | Use `.ts` or `.mjs` (CJS removed in Astro 6) |
| `src/content/config.ts` | `src/content.config.ts` (legacy location errors in Astro 6) |
| `defineCollection({ type: 'content' })` | Remove `type` field, use `loader` instead |
| `legacy.collections` flag | Removed — all collections must use Content Layer API |

## Dev Server (Astro 6)

Astro 6 redesigned the dev server using Vite's Environment API. The dev server now runs the **same runtime as production** — fewer "works in dev, breaks in prod" surprises.

- For **Cloudflare** users: `astro dev` now uses `workerd` runtime, matching production exactly
- Dev and prod codepaths are unified — middleware, env vars, and adapters behave identically
- **CSP** only works in `build` + `preview`, not in dev mode

## Experimental Features (Astro 6)

These are opt-in via `experimental` config. Worth knowing about for performance:

```ts
export default defineConfig({
  experimental: {
    // 2x faster rendering — queue-based instead of recursive
    queuedRendering: { enabled: true },

    // Rust compiler — faster builds, better errors
    // requires: npm install @astrojs/compiler-rs
    rustCompiler: true,

    // Route caching — platform-agnostic CDN cache for on-demand pages
    cache: { provider: memoryCache() },

    // SVG optimization via SVGO
    svgo: true,

    // Content collection Intellisense in VS Code
    contentIntellisense: true,
  },
})
```

These are **experimental** — API may change in patch releases.

## Adapters

Pick the right adapter for your deployment target:

| Platform | Adapter | Install |
|---|---|---|
| Node.js / Docker | `@astrojs/node` | `npx astro add node` |
| Vercel | `@astrojs/vercel` | `npx astro add vercel` |
| Netlify | `@astrojs/netlify` | `npx astro add netlify` |
| Cloudflare Workers | `@astrojs/cloudflare` | `npx astro add cloudflare` |

You only need an adapter if you use on-demand rendering, server islands, or Actions. Pure static sites don't need one.
