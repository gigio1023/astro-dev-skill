---
name: astro-dev
description: "Use when editing .astro/.mdx files, modifying astro.config.*, working with content collections, or adding Tailwind CSS to an Astro project. Provides correct Astro 5 patterns and prevents outdated Astro 3/4 code that agents default to."
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
| **Project setup / core APIs** | `references/astro5-core-patterns.md` |
| **Content collections** (schema, loader, querying) | `references/content-collections.md` |
| **Tailwind CSS** (config, theming, classes) | `references/tailwind.md` |
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
