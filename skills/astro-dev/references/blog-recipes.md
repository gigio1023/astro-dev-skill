# Blog Development Recipes

Patterns that agents consistently get wrong when building Astro blogs. These are **multi-concept combinations** that a single MCP doc search won't produce correctly.

For single-concept lookups (e.g., "how does paginate() work?"), use `search_astro_docs()` MCP instead.

## RSS Feed with Content Collections

Agents use the outdated `pagesGlobToRssItems()` pattern. For Content Collections, use `getCollection()`:

```ts
// src/pages/rss.xml.ts
import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'

export async function GET(context) {
  const posts = await getCollection('blog', ({ data }) => !data.draft)
  return rss({
    title: 'My Blog',
    description: 'Blog description',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/blog/${post.id}/`,
    })),
  })
}
```

**Gotchas:**
- `site` must be set in `astro.config.ts` — RSS errors without it
- Don't use `pagesGlobToRssItems()` with Content Collections — it's for `src/pages/*.md` only
- For full content in RSS, render with `markdown-it` + `sanitize-html`, not `render()` (which returns components, not HTML strings)

Add auto-discovery in layout `<head>`:
```html
<link rel="alternate" type="application/rss+xml" title="My Blog" href={new URL('rss.xml', Astro.site)} />
```

## Pagination

Agents forget `paginate()` exists and build manual pagination with array slicing.

```astro
---
// src/pages/blog/[page].astro
import { getCollection } from 'astro:content'

export async function getStaticPaths({ paginate }) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
  return paginate(posts, { pageSize: 10 })
}

const { page } = Astro.props
---
{page.data.map(post => <PostCard post={post} />)}

<nav>
  {page.url.prev && <a href={page.url.prev}>Previous</a>}
  <span>Page {page.currentPage} of {page.lastPage}</span>
  {page.url.next && <a href={page.url.next}>Next</a>}
</nav>
```

Use `[...page].astro` (rest param) if you want `/blog` for page 1 instead of `/blog/1`.

## Tag Pages with Nested Pagination

Agents build this incorrectly almost every time. The key is `flatMap` + `paginate()`:

```astro
---
// src/pages/tag/[tag]/[...page].astro
import { getCollection } from 'astro:content'

export async function getStaticPaths({ paginate }) {
  const posts = await getCollection('blog', ({ data }) => !data.draft)
  const tags = [...new Set(posts.flatMap(post => post.data.tags))]

  return tags.flatMap(tag => {
    const filtered = posts.filter(post => post.data.tags.includes(tag))
      .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    return paginate(filtered, { params: { tag }, pageSize: 10 })
  })
}

const { page } = Astro.props
const { tag } = Astro.params
---
<h1>Tag: {tag}</h1>
{page.data.map(post => <PostCard post={post} />)}
```

**Key:** `params: { tag }` must be passed to `paginate()` — agents always forget this.

## Shiki Dark Mode

Agents use wrong CSS variable names. Astro uses `--astro-code-*` prefix, NOT `--shiki-*`:

```ts
// astro.config.ts
export default defineConfig({
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
})
```

```css
/* CSS for dark mode toggle — note: .astro-code, NOT .shiki */
@media (prefers-color-scheme: dark) {
  .astro-code,
  .astro-code span {
    color: var(--shiki-dark) !important;
    background-color: var(--shiki-dark-bg) !important;
  }
}
```

**Gotchas:**
- Class is `.astro-code`, NOT `.shiki`
- CSS variable names: `--astro-code-foreground` / `--astro-code-background` (not `--astro-code-color-text` — renamed in v5)
- Shiki v4 in Astro 6 — `transformers` `postprocess` hook doesn't work in `.md`/`.mdx`
- CSP + Shiki don't work together — use `<Prism />` instead if CSP is needed

## MDX Component Overrides

Agents don't know `<Content />` accepts a `components` prop for overriding HTML elements:

```astro
---
// src/pages/blog/[...id].astro
import { getEntry, render } from 'astro:content'
import CustomH2 from '../../components/CustomH2.astro'
import CustomImage from '../../components/CustomImage.astro'
import CustomCode from '../../components/CustomCode.astro'

const post = await getEntry('blog', Astro.params.id)
const { Content, headings } = await render(post)
---
<Content components={{ h2: CustomH2, img: CustomImage, code: CustomCode }} />
```

This only works with **MDX** files. Plain `.md` files don't support component overrides.

## Table of Contents from Headings

Agents rebuild TOC parsing from scratch. `render()` already returns `headings`:

```astro
---
const { Content, headings } = await render(post)
// headings = [{ depth: 2, slug: 'intro', text: 'Introduction' }, ...]
---
<nav class="toc">
  <ul>
    {headings
      .filter(h => h.depth <= 3)
      .map(h => (
        <li style={`margin-left: ${(h.depth - 2) * 1}rem`}>
          <a href={`#${h.slug}`}>{h.text}</a>
        </li>
      ))}
  </ul>
</nav>
<Content />
```

Requires `rehype-slug` (installed by default) for `#slug` anchors to work.

## SEO Meta in Layout

Agents put `<meta>` tags in every page. Use a layout component:

```astro
---
// src/layouts/BlogPost.astro
interface Props {
  title: string
  description: string
  image?: string
  date?: Date
}
const { title, description, image, date } = Astro.props
const ogImage = image || '/default-og.png'
const canonicalURL = new URL(Astro.url.pathname, Astro.site)
---
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonicalURL} />

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={new URL(ogImage, Astro.site)} />
  <meta property="og:url" content={canonicalURL} />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={new URL(ogImage, Astro.site)} />

  {date && <meta property="article:published_time" content={date.toISOString()} />}
</head>
<body>
  <slot />
</body>
</html>
```

Usage: `<BlogPost title={post.data.title} description={post.data.description} date={post.data.date}>`

## Reading Time

Agents install random npm packages. A simple remark plugin works:

```ts
// src/plugins/reading-time.ts
import { toString } from 'mdast-util-to-string'

export function remarkReadingTime() {
  return (tree, { data }) => {
    const text = toString(tree)
    const words = text.split(/\s+/).length
    const minutes = Math.ceil(words / 200)
    data.astro.frontmatter.readingTime = `${minutes} min read`
  }
}
```

```ts
// astro.config.ts
import { remarkReadingTime } from './src/plugins/reading-time'

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkReadingTime],
  },
})
```

Access via `remarkPluginFrontmatter`:
```astro
---
const { remarkPluginFrontmatter } = await render(post)
---
<span>{remarkPluginFrontmatter.readingTime}</span>
```

## Previous / Next Post Navigation

Agents try to query by index. Sort first, then find neighbors:

```astro
---
const allPosts = (await getCollection('blog', ({ data }) => !data.draft))
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())

const currentIndex = allPosts.findIndex(p => p.id === post.id)
const prev = allPosts[currentIndex + 1] // older post
const next = allPosts[currentIndex - 1] // newer post
---
<nav>
  {prev && <a href={`/blog/${prev.id}`}>← {prev.data.title}</a>}
  {next && <a href={`/blog/${next.id}`}>{next.data.title} →</a>}
</nav>
```

## Common Agent Mistakes (Blog)

| Agents do | Correct |
|---|---|
| Use `pagesGlobToRssItems()` with Collections | Use `getCollection()` + `map()` for RSS items |
| Manual array slicing for pagination | Use `paginate()` from `getStaticPaths` |
| Forget `params: { tag }` in nested pagination | Must pass to `paginate()` for each tag group |
| Use `.shiki` CSS class for code blocks | Astro uses `.astro-code` class |
| Use `--astro-code-color-text` | Renamed to `--astro-code-foreground` in v5 |
| Rebuild TOC with regex/parsing | `render()` returns `headings` array |
| Put OG meta tags in every page file | Use a layout component with props |
| Install `reading-time` npm package | Use a simple remark plugin with `mdast-util-to-string` |
| Try `<Content components={}>` with `.md` | Only works with MDX files |
