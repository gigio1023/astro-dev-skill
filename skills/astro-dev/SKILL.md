---
name: astro-dev
description: "Use when editing .astro/.mdx files, modifying astro.config.*, working with content collections, adding Tailwind CSS, using client directives, handling forms/actions, or configuring server features (sessions, i18n, env vars) in an Astro project. Provides correct Astro 5 patterns, hydration guidance, and prevents outdated code."
---

# Astro Dev

## Documentation Strategy

Before writing Astro code from memory, check the official docs. Astro evolves fast — URLs, MCP setup, and APIs may change between versions. **Always verify against the live source before trusting hardcoded references in this skill.**

### Step 1: Check for MCP tool availability

Search your available tools for anything matching `astro` or `astro_docs`. If found, use it:
```
search_astro_docs({ query: "content collections" })
```

### Step 2: If no MCP tool, fetch the latest AI integration guide

Fetch the live page to get the current MCP server URL and setup instructions:
```
WebFetch("https://docs.astro.build/en/guides/build-with-ai/")
```
This page is maintained by the Astro team and contains the canonical MCP config. If the MCP URL or setup in `references/doc-endpoints.md` differs from this live page, **trust the live page**.

### Step 3: Use LLM-optimized doc endpoints for code reference

```
https://docs.astro.build/llms-full.txt          # Complete docs
https://docs.astro.build/_llms-txt/api-reference.txt  # API reference
```

See `references/doc-endpoints.md` for the full list of endpoints and which to use per task.

### Step 4: Fall back to this skill's reference files

Use the curated reference files in `references/` when web access is unavailable or for quick offline reference. These files are snapshots and may lag behind the latest Astro release.

---

## Quick Router — Read the right file for your task

| What you're doing | Read this file |
|---|---|
| **Project setup / core APIs / styles / scripts / data fetching** | `references/astro5-core-patterns.md` |
| **Content collections** (schema, loader, querying) | `references/content-collections.md` |
| **Tailwind CSS** (config, theming, classes) | `references/tailwind.md` |
| **Client directives / islands / hydration** | `references/islands-and-hydration.md` |
| **Forms, actions, data mutations** | `references/actions-and-forms.md` |
| **Sessions, env vars, i18n, prerender split** | `references/server-features.md` |
| **Finding documentation** (URLs, LLM endpoints) | `references/doc-endpoints.md` |

Load **only the module you need**. Never preload all.

---

## Agent Guardrails

Patterns that agents consistently generate incorrectly. Each was identified from repeated failures.

**1. Content Collections require explicit `loader`:**
```ts
// agents generate this (outdated)
const blog = defineCollection({ schema: z.object({...}) })

// correct pattern
import { glob } from 'astro/loaders'
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) => z.object({...})
})
```
Schema is a **function** receiving helpers like `image()`. See `references/content-collections.md`.

**2. Tailwind uses CSS-native config, not JS:**
```css
/* agents generate this (outdated) */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* correct pattern */
@import "tailwindcss";
@theme inline {
  --color-primary: oklch(0.6 0.2 250);
}
```
Use `@tailwindcss/vite` plugin, NOT `@astrojs/tailwind` (deprecated). See `references/tailwind.md`.

**3. `Astro.glob()` does not exist:**
```ts
// agents generate this (removed API)
const posts = await Astro.glob('./posts/*.md')

// correct pattern
import { getCollection } from 'astro:content'
const posts = await getCollection('blog')
```

**4. `render()` is a standalone function:**
```ts
// agents generate this (outdated)
const { Content } = await post.render()

// correct pattern
import { render } from 'astro:content'
const { Content } = await render(post)
```

**5. Integration plugins run before your remarkPlugins:**
Astro integrations **prepend** their remark/rehype plugins via `astro:config:setup`. Your `markdown.remarkPlugins` run **after** integration plugins, not before.

To run a remark plugin before an integration (e.g., intercepting code blocks before a syntax highlighter processes them), create your own Astro integration that prepends to the existing plugin list:
```ts
export function myIntegration(): AstroIntegration {
  return {
    name: 'my-plugin',
    hooks: {
      'astro:config:setup': ({ config, updateConfig }) => {
        const existing = [...(config.markdown?.remarkPlugins || [])]
        updateConfig({
          markdown: { remarkPlugins: [myRemarkPlugin, ...existing] },
        })
      },
    },
  }
}
```
Place it **after** the target integration in the `integrations[]` array — it reads the current list (which already includes the target's plugins) and prepends yours before them.

**6. Don't use `client:load` on everything:**
```astro
<!-- agents do this (wasteful) -->
<Counter client:load />
<Sidebar client:load />
<Footer client:load />

<!-- correct: choose based on urgency -->
<Counter client:load />
<Sidebar client:idle />
<Footer client:visible />
```
Use `client:idle` for non-critical interactive components, `client:visible` for below-the-fold. See `references/islands-and-hydration.md`.

**7. Use Actions for forms, not manual API routes:**
```ts
// agents build this (verbose, no validation)
// src/pages/api/subscribe.ts
export const POST: APIRoute = async ({ request }) => { ... }

// correct: use Actions (typed, validated, CSRF-protected)
// src/actions/index.ts
export const server = {
  subscribe: defineAction({
    accept: 'form',
    input: z.object({ email: z.string().email() }),
    handler: async (input) => { ... },
  }),
}
```
See `references/actions-and-forms.md`.

**8. Cookies, sessions, and forms require on-demand rendering:**
```astro
---
// agents forget this — the page silently fails or behaves unexpectedly
export const prerender = false  // REQUIRED for dynamic features

const session = Astro.cookies.get('session')
---
```
In `hybrid` mode, pages are prerendered by default. Any page using cookies, sessions, Actions, or POST handling must opt out. See `references/server-features.md`.

**9. Use `astro:env` for environment variables, not `process.env`:**
```ts
// agents do this (unvalidated, no type safety)
const secret = process.env.API_KEY

// correct: define schema in config, import from virtual module
import { API_KEY } from 'astro:env/server'
```
See `references/server-features.md`.

**10. Styles are scoped — `class` doesn't pass through to children:**
```astro
<!-- agents assume class passes through (it doesn't) -->
<Card class="mt-4" />

<!-- correct: Card.astro must accept and apply class -->
---
const { class: className, ...rest } = Astro.props
---
<div class:list={['card', className]} {...rest}>
  <slot />
</div>
```
Use `:global()` to style slotted/markdown content. See `references/astro5-core-patterns.md`.

**11. `<script>` is deduplicated — don't expect per-instance behavior:**
```astro
<!-- Script runs ONCE even if component renders 10 times -->
<script>
  document.querySelectorAll('.my-btn').forEach(btn => { ... })
</script>
```
Pass server data to scripts via `data-*` attributes, not template expressions. `define:vars` implies `is:inline` (no bundling). See `references/astro5-core-patterns.md`.

**12. `fetch()` in frontmatter runs at build time, not per request:**
```astro
---
// In static mode, this runs ONCE at build time
const data = await fetch('https://api.example.com/data').then(r => r.json())
---
```
For per-request data, page must be on-demand (`export const prerender = false`). For client-side re-fetching, use a framework component with `client:*` directive.

**13. Don't build manual locale routing — use Astro's built-in i18n:**
```ts
// astro.config.ts
export default defineConfig({
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ko', 'ja'],
  },
})
```
See `references/server-features.md`.

---

## Common Integration Stack

See `templates/` for copy-ready config files.

```ts
// astro.config.ts
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@astrojs/mdx'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://example.com',
  integrations: [mdx(), react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
})
```

---

## Workflow: Explore Before Modifying

1. **Check Astro version**: `package.json` → `"astro"` version determines API surface
2. **Check config format**: `.ts` vs `.mjs`, which integrations are installed
3. **Check content schema**: `src/content.config.ts` or `src/content/config.ts`
4. **Check Tailwind setup**: `@tailwindcss/vite` in astro config vs `@astrojs/tailwind`
5. **Then write code** using the correct API for the detected versions
