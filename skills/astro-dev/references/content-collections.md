# Content Collections

## Config Location

Use `src/content.config.ts` (at src root, NOT `src/content/config.ts`).
**Astro 6 errors** if it finds `src/content/config.ts` — this is no longer a fallback.

## Defining Build-Time Collections

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'
import { glob, file } from 'astro/loaders'

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      image: image().optional(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
    }),
})

const authors = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/authors' }),
  schema: z.object({
    name: z.string(),
    avatar: z.string(),
    bio: z.string().optional(),
  }),
})

export const collections = { blog, authors }
```

Key points:
- `loader` is **required** — there is no implicit directory convention. Astro 6 errors without it.
- `schema` is a **function** when you need helpers like `image()`; plain object also works when helpers are not needed
- Files can live anywhere — the loader `base` specifies the path
- **Import `z` from `astro/zod`**, not from `astro:content` (deprecated in Astro 6)
- **Astro 6 uses Zod 4** — `z.string().email()` → `z.email()`, `{message:}` → `{error:}`

## Loader Types

### `glob` — Markdown/MDX files from filesystem
```ts
import { glob } from 'astro/loaders'
loader: glob({
  pattern: '**/*.{md,mdx}',
  base: './src/content/blog',
})
```

### `file` — JSON/YAML data files
```ts
import { file } from 'astro/loaders'
loader: file('./src/data/navigation.json')
```

### Custom loader — any data source
```ts
import type { Loader } from 'astro/loaders'

// Astro 6: use `satisfies Loader` for proper type inference
const myLoader = {
  name: 'custom-loader',
  load: async ({ store }) => {
    const data = await fetch('https://api.example.com/posts').then(r => r.json())
    for (const item of data) {
      store.set({ id: item.slug, data: item })
    }
  },
} satisfies Loader
```

## Querying Build-Time Collections

```ts
import { getCollection, getEntry, render } from 'astro:content'

// Get all entries (with optional filter)
const posts = await getCollection('blog')
const published = await getCollection('blog', ({ data }) => !data.draft)

// Get single entry by ID
const post = await getEntry('blog', 'my-post-id')

// Render to HTML
const { Content, headings, remarkPluginFrontmatter } = await render(post)
```

## Live Content Collections (Astro 6)

Live collections fetch data at **request time** instead of build time. Use MCP (`search_astro_docs("live content collections")`) for full API.

**Key differences agents must know:**

| | Build-time | Live |
|---|---|---|
| Config file | `src/content.config.ts` | `src/live.config.ts` |
| Define with | `defineCollection()` | `defineLiveCollection()` |
| Query with | `getCollection()` / `getEntry()` | `getLiveCollection()` / `getLiveEntry()` |
| Runs at | Build time | Request time |
| Adapter | Optional | **Required** |
| Built-in loaders | `glob`, `file` | None — must create custom |

**Gotchas:**
- Pages using live collections must have `export const prerender = false`
- No built-in loaders — you must implement `loadCollection` + `loadEntry` methods
- Config is `src/live.config.ts`, NOT in `content.config.ts`

## Entry Shape

```ts
interface CollectionEntry {
  id: string          // relative path without extension (e.g., 'my-post' or 'series/part-1')
  data: z.infer<...>  // validated frontmatter
  body: string         // raw markdown body (undefined for data-only collections)
  collection: string   // collection name
}
```

## Image Validation in Schema

```ts
schema: ({ image }) =>
  z.object({
    cover: image(),
    thumbnail: image().optional(),
  })
```

Note: `image().refine()` is **not supported** in Astro 6 — validate image properties at runtime instead.

## Zod 4 Migration (Astro 6)

Astro 6 ships Zod 4. Key changes that affect content schemas:

```ts
import { z } from 'astro/zod'

// Top-level validators (moved from string methods)
z.email()           // was: z.string().email()
z.url()             // was: z.string().url()

// Error messages
z.string().min(5, { error: "Too short." })   // was: { message: "..." }

// .default() with transforms — must match OUTPUT type
z.string().transform(Number).default(0)      // was: .default("0")
// For old behavior (default parsed through transform): use .prefault()
z.string().transform(Number).prefault("0")

// Custom loaders: use `satisfies Loader` for type inference
const myLoader = { /* ... */ } satisfies Loader
```

## Common Patterns

### Filtering drafts in production
```ts
const posts = await getCollection('blog', ({ data }) => {
  return import.meta.env.PROD ? !data.draft : true
})
```

### Sorting by date
```ts
const posts = (await getCollection('blog'))
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
```

### Referencing between collections
```ts
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    authors: z.array(z.string()).optional(),
  }),
})
```
Then resolve manually:
```ts
const authorEntries = await Promise.all(
  post.data.authors.map((id) => getEntry('authors', id))
)
```

### Subposts / Series pattern
Use directory structure: `blog/series-name/part-1.md`, `blog/series-name/part-2.md`.
The `id` will be `series-name/part-1`, `series-name/part-2`.
Check if a post is a subpost: `id.includes('/')`.

## Common Agent Mistakes

Agents frequently generate these outdated patterns:

| Agents generate | Correct |
|-----------------|---------|
| No `loader` (implicit directory) | `loader: glob({...})` required — errors in Astro 6 |
| `schema: z.object({...})` with `image()` | `schema: ({ image }) => z.object({...})` (function form) |
| `import { z } from 'astro:content'` | `import { z } from 'astro/zod'` (Astro 6) |
| `entry.render()` method | `render(entry)` standalone function |
| `entry.slug` | `entry.id` |
| `getEntryBySlug()` | `getEntry()` |
| Config at `src/content/config.ts` | `src/content.config.ts` (only valid location in Astro 6) |
| `defineCollection({ type: 'content' })` | Remove `type` field — not supported in Astro 6 |
| `image().refine()` | Not supported — validate at runtime instead |
| `z.string().email()` | `z.email()` (Zod 4 syntax) |
| `z.string().url()` | `z.url()` (Zod 4 syntax) |
| `{ message: "..." }` in Zod | `{ error: "..." }` (Zod 4 syntax) |
