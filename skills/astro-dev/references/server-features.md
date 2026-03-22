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

Server-side state management for on-demand rendered pages. Stores data server-side — no client-side JavaScript needed.

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
    driver: sessionDrivers.redis({ url: process.env.REDIS_URL }),
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

Astro 6 provides built-in CSP support to protect against XSS attacks. It auto-generates `<meta>` tags with hashes for bundled scripts and styles.

### Basic setup

```ts
// astro.config.ts
export default defineConfig({
  security: {
    csp: true,  // enables with defaults
  },
})
```

### Advanced configuration

```ts
export default defineConfig({
  security: {
    csp: {
      algorithm: 'SHA-256',  // or SHA-384, SHA-512
      directives: [
        "default-src 'self'",
        "img-src 'self' https://images.cdn.example.com",
      ],
      scriptDirective: {
        hashes: ['sha256-externalScriptHash'],
        resources: ["'self'", 'https://cdn.example.com'],
        strictDynamic: false,
      },
      styleDirective: {
        hashes: ['sha256-externalStyleHash'],
        resources: ["'self'"],
      },
    },
  },
})
```

### Runtime CSP API

Per-page customization via `Astro.csp`:

```astro
---
Astro.csp?.insertDirective("img-src 'self' https://images.cdn.example.com")
Astro.csp?.insertScriptResource('https://cdn.example.com')
Astro.csp?.insertStyleHash('sha256-someHash')
---
```

### CSP limitations

- **Dev mode not supported** — only works in `build` + `preview`
- **`<ClientRouter />` not compatible** — use native View Transition API instead
- **Shiki not supported** — use `<Prism />` for syntax highlighting with CSP
- **`unsafe-inline` incompatible** — Astro emits hashes, browsers auto-reject `unsafe-inline` with hashes
- **External scripts/styles** need manual hashes

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

Astro 6 has first-class Cloudflare support. The `@astrojs/cloudflare` v13 adapter uses `workerd` runtime in dev, build, and production.

### Setup

```ts
// astro.config.ts
import cloudflare from '@astrojs/cloudflare'

export default defineConfig({
  adapter: cloudflare(),
})
```

### Accessing Cloudflare APIs

```astro
---
import { env } from 'cloudflare:workers'

const myKV = env.MY_KV           // KV binding
const myVar = env.MY_VARIABLE    // environment variable
const country = Astro.request.cf?.country  // geolocation
---
```

Cloudflare env vars are also compatible with `astro:env`:
```ts
import { MY_VARIABLE } from 'astro:env/server'
```

### Cloudflare gotchas

- **Dev server uses `workerd`** — no Node.js APIs like `fs` in on-demand pages
- **Prerender with Node.js**: If prerendered pages need `node:fs`, set `prerenderEnvironment: 'node'`
- **CJS not supported in `workerd`** — some npm packages may need pre-compilation via `optimizeDeps.include`
- **Cloudflare Pages deprecated** — migrate to Workers (see Cloudflare migration guide)

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
| Use `process.env.SECRET` directly | Use `astro:env/server` with schema validation |
| Use `import.meta.env` for runtime server vars | In Astro 6, `import.meta.env` is build-time inlined — use `astro:env` secrets or `process.env` |
| Try cookies on prerendered pages | Cookies require on-demand rendering |
| Build custom locale routing | Use Astro's built-in `i18n` config |
| Assume middleware runs per-request on static pages | Middleware runs at **build time** for prerendered pages |
| Hand-roll session with cookies | Use `Astro.session` / `context.session` |
| Forget `export const prerender = false` | Required for any page using cookies, sessions, forms, Actions, or live collections |
| Use `output: 'hybrid'` | Removed — use `'static'` + `export const prerender = false` per page |
| Don't know about CSP | Use `security.csp` for Content Security Policy protection |
| Assume `redirectToDefaultLocale` is `true` | Default changed to `false` in Astro 6 |
