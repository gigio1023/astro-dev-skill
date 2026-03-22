# Astro 5 Core Patterns

## Content Collections

The central data layer in Astro 5. See `content-collections.md` for full details.

Collections require an explicit `loader` (glob, file, or custom) and schema is a function.

## Config File

- **Preferred**: `astro.config.ts` (TypeScript, with full type inference)
- **Also works**: `astro.config.mjs`

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
import { ViewTransitions } from 'astro:transitions'
---
<head>
  <ViewTransitions />
</head>
```

- Use `transition:persist` on elements that should survive navigation (e.g., audio players, headers)
- Use `transition:name="unique-name"` for matched animations
- Inline scripts re-run on each navigation unless wrapped in `transition:persist`

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

## Middleware

```ts
// src/middleware.ts
import { defineMiddleware } from 'astro:middleware'

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next()
  return response
})
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
For `POST`/`PUT`/`DELETE`, set `output: 'server'` or `output: 'hybrid'`.

## Output Modes

| Mode | Behavior |
|------|----------|
| `'static'` (default) | All pages pre-rendered at build time |
| `'server'` | All pages server-rendered by default |
| `'hybrid'` | Static by default, opt-in to server with `export const prerender = false` |

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

APIs that no longer exist in Astro 5. Agents frequently attempt to use these.

| Removed | Use instead |
|---------|-------------|
| `Astro.glob()` | `getCollection()` from `astro:content` |
| `Astro.fetchContent()` | `getCollection()` from `astro:content` |
| `@astrojs/tailwind` integration | `@tailwindcss/vite` as Vite plugin |
| `getEntryBySlug()` | `getEntry()` with full ID |
| `entry.render()` method | `render(entry)` standalone function |
| `entry.slug` | `entry.id` |
