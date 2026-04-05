# Server Features

## Prerender vs On-Demand Rendering

This is the most important concept to get right. Behavior changes **silently** depending on rendering mode.

### Output modes

| Mode | Default behavior | Opt-out |
|---|---|---|
| `'static'` (default) | All pages prerendered at build time | `export const prerender = false` per page |
| `'server'` | On-demand by default | `export const prerender = true` per page |

Note: `'hybrid'` was removed in Astro 5 — its functionality merged into `'static'`. Any page can opt out of prerendering regardless of mode.

### What changes between prerendered and on-demand

| Feature | Prerendered | On-demand |
|---|---|---|
| Middleware | Runs at **build time** | Runs per request |
| `Astro.cookies` | Not available | Available |
| `Astro.redirect()` | Emits `<meta http-equiv="refresh">` | HTTP 302 response |
| POST/PUT/DELETE | Not supported | Works |
| Sessions | Not available | Available |
| Actions (form) | Not supported | Works |
| `Astro.clientAddress` | Not available | Available |
| `Astro.request.headers` | Partial (build-time only) | Full request headers |
| Live collections | Not available | Available |

**Rule of thumb:** If the page needs cookies, sessions, form handling, live collections, or per-request logic → it must be on-demand.

```astro
---
// This page needs cookies, so it must be on-demand
export const prerender = false

const session = Astro.cookies.get('session')
---
```

## Sessions

Server-side state management for on-demand rendered pages. Stores data server-side — no client-side JavaScript needed. Prefer server-side sessions and HttpOnly cookies for auth state; do not move auth tokens into localStorage/sessionStorage.

### Setup

```ts
// astro.config.ts
import { defineConfig } from 'astro/config'
import node from '@astrojs/node'

export default defineConfig({
  adapter: node({ mode: 'standalone' }),
  session: {
    driver: 'fs',  // Node/Cloudflare/Netlify adapters provide defaults
  },
})
```

For other drivers (Redis, etc.):
```ts
import { defineConfig, sessionDrivers } from 'astro/config'

export default defineConfig({
  session: {
    driver: sessionDrivers.redis({ url: process.env.REDIS_URL }), // config-time exception; prefer typed env access inside app code
  },
})
```

### Usage

```astro
---
// In .astro pages
const cart = await Astro.session.get('cart') ?? []
await Astro.session.set('cart', [...cart, newItem])
---
```

```ts
// In API endpoints, actions, middleware
const cart = await context.session.get('cart')
await context.session.set('cart', updatedCart)

// Regenerate session ID (after login)
await context.session.regenerate()

// Destroy session (logout)
await context.session.destroy()
```

### Type safety

```ts
// src/env.d.ts
declare namespace App {
  interface SessionData {
    user: { id: string; name: string }
    cart: string[]
  }
}
```

### Sessions gotchas

- **On-demand only** — sessions don't work on prerendered pages
- **Not available in edge middleware** — only in standard server middleware
- **Uses devalue serialization** — supports Date, Map, Set, URL, arrays, plain objects

## Content Security Policy (CSP) — Astro 6

Astro 6 has built-in CSP via `security.csp`. Use MCP (`search_astro_docs("security csp")`) for full config reference.

```ts
// Basic: enables with defaults
export default defineConfig({ security: { csp: true } })
```

**Key gotchas agents must know:**
- **Dev mode not supported** — only works in `build` + `preview`
- **`<ClientRouter />` not compatible** — use native View Transition API instead
- **Shiki not supported** — use `<Prism />` for syntax highlighting with CSP
- Runtime API: `Astro.csp?.insertDirective()`, `Astro.csp?.insertScriptHash()`

## Type-Safe Environment Variables (`astro:env`)

### Important: Astro 6 `import.meta.env` change

In Astro 6, `import.meta.env` values are **always inlined at build time**. If you need runtime env vars on the server, use `astro:env` secrets or `process.env`.

### Schema definition

```ts
// astro.config.ts
import { defineConfig, envField } from 'astro/config'

export default defineConfig({
  env: {
    schema: {
      // Public client variable — inlined at build time
      API_URL: envField.string({ context: 'client', access: 'public' }),

      // Public server variable — available in server code
      PORT: envField.number({ context: 'server', access: 'public', default: 4321 }),

      // Secret — runtime only, never bundled
      DB_PASSWORD: envField.string({ context: 'server', access: 'secret' }),

      // Enum with validation
      NODE_ENV: envField.enum({
        context: 'server', access: 'public',
        values: ['development', 'production'],
        default: 'development',
      }),
    },
  },
})
```

### Importing

```ts
// Client variables
import { API_URL } from 'astro:env/client'

// Server variables (public + secret)
import { PORT, DB_PASSWORD } from 'astro:env/server'

// Dynamic secret retrieval (for vars not in schema)
import { getSecret } from 'astro:env/server'
const key = getSecret('DYNAMIC_KEY') // string | undefined
```

### astro:env gotchas

- **Cannot use `astro:env` inside `astro.config.mjs`** — the virtual module isn't available there. Use `process.env` or Vite's `loadEnv()` instead.
- **Secret client variables don't exist** — `context: 'client'` + `access: 'secret'` is not allowed.
- **Variables not in schema are inaccessible** via `astro:env` — use `getSecret()` for dynamic access.
- **Client variables are inlined at build time** — they are not runtime-configurable.
- **Astro 6**: All `import.meta.env` values are build-time inlined. For runtime server env vars, use `astro:env` secrets or `process.env`.

## i18n Routing

Astro has built-in locale routing. Don't build it manually.

### Configuration

```ts
// astro.config.ts
export default defineConfig({
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ko', 'ja'],
    routing: {
      prefixDefaultLocale: false, // /about (en), /ko/about, /ja/about
    },
    fallback: {
      ko: 'en', // Missing ko pages fall back to en
    },
  },
})
```

**Astro 6 change**: `redirectToDefaultLocale` now defaults to `false` (was `true`). It can now only be used when `prefixDefaultLocale` is `true`. If you need the old behavior:
```ts
routing: {
  prefixDefaultLocale: true,
  redirectToDefaultLocale: true,
}
```

### URL helpers

```astro
---
import { getRelativeLocaleUrl } from 'astro:i18n'
---
<a href={getRelativeLocaleUrl('ko', '/about')}>About (Korean)</a>
<!-- outputs: /ko/about -->
```

### Locale detection

```astro
---
const currentLocale = Astro.currentLocale          // from URL
const preferred = Astro.preferredLocale             // browser Accept-Language, if supported
const allPreferred = Astro.preferredLocaleList      // all matching locales
---
```

### i18n content pattern

```
src/content/blog/
├── en/
│   └── hello-world.md
├── ko/
│   └── hello-world.md
```

```ts
// In getStaticPaths or on-demand pages
const post = await getEntry('blog', `${lang}/${slug}`)
```

## Cloudflare Workers (Astro 6)

`@astrojs/cloudflare` v13 uses `workerd` runtime in dev/build/prod. Use MCP for full setup guide.

**Key gotchas only:**
- **Dev server uses `workerd`** — no Node.js APIs like `fs` in on-demand pages
- **Prerender with Node.js**: set `prerenderEnvironment: 'node'` in adapter config if prerendered pages need `node:fs`
- **CJS not supported** — some npm packages need `optimizeDeps.include` pre-compilation
- **Cloudflare Pages deprecated** — use Workers
- Access bindings via `import { env } from 'cloudflare:workers'` (also works with `astro:env`)

## Security Limits (Astro 6)

```ts
export default defineConfig({
  security: {
    checkOrigin: true,  // CSRF protection (default)
    actionBodySizeLimit: 10 * 1024 * 1024,  // 10MB for action request bodies (default: 1MB)
    serverIslandBodySizeLimit: 10 * 1024 * 1024,  // 10MB for server island bodies (default: 1MB)
  },
})
```

## Prefetch

Astro can prefetch links to speed up navigation.

```ts
// astro.config.ts
export default defineConfig({
  prefetch: true, // or prefetch: { prefetchAll: true }
})
```

```html
<a href="/about" data-astro-prefetch>About</a>
<a href="/heavy" data-astro-prefetch="viewport">Heavy page</a>
<a href="/action" data-astro-prefetch="tap">Action page</a>
```

| Strategy | Triggers on |
|---|---|
| `hover` (default) | Mouse hover or focus |
| `tap` | Just before click |
| `viewport` | Element enters viewport |
| `load` | All links after page load |

Falls back to `tap` on slow connections or data-saver mode.

## Common Agent Mistakes

| Agents do | Correct |
|---|---|
| Use `process.env.SECRET` directly throughout app code | Use `astro:env/server` with schema validation (reserve `process.env` for documented config-time exceptions) |
| Use `import.meta.env` for runtime server vars | In Astro 6, `import.meta.env` is build-time inlined — use `astro:env` secrets or `process.env` |
| Try cookies on prerendered pages | Cookies require on-demand rendering |
| Build custom locale routing | Use Astro's built-in `i18n` config |
| Assume middleware runs per-request on static pages | Middleware runs at **build time** for prerendered pages |
| Hand-roll session with cookies | Use `Astro.session` / `context.session` |
| Forget `export const prerender = false` | Required for any page using cookies, sessions, forms, Actions, or live collections |
| Use `output: 'hybrid'` | Removed — use `'static'` + `export const prerender = false` per page |
| Don't know about CSP | Use `security.csp` for Content Security Policy protection |
| Assume `redirectToDefaultLocale` is `true` | Default changed to `false` in Astro 6 |
