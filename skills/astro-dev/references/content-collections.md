# Content Collections

## Config Location

Use `src/content.config.ts` (at src root, NOT `src/content/config.ts`).
Both locations work, but `src/content.config.ts` is the current convention.

## Defining Collections

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content'
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
- `loader` is required — there is no implicit directory convention
- `schema` is a **function** when you need helpers like `image()`; plain object also works when helpers are not needed
- Files can live anywhere — the loader `base` specifies the path

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
loader: {
  name: 'custom-loader',
  load: async ({ store }) => {
    const data = await fetch('https://api.example.com/posts').then(r => r.json())
    for (const item of data) {
      store.set({ id: item.slug, data: item })
    }
  },
}
```

## Querying Collections

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
    ogImage: image().refine((img) => img.width >= 1200, {
      message: 'OG image must be at least 1200px wide',
    }),
  })
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
| No `loader` (implicit directory) | `loader: glob({...})` required |
| `schema: z.object({...})` with `image()` | `schema: ({ image }) => z.object({...})` (function form) |
| `entry.render()` method | `render(entry)` standalone function |
| `entry.slug` | `entry.id` |
| `getEntryBySlug()` | `getEntry()` |
| Config at `src/content/config.ts` | `src/content.config.ts` (preferred) |
