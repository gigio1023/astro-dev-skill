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
