---
name: astro-dev
description: "Use when editing .astro/.mdx files, modifying astro.config.*, working with content collections (build-time or live), adding Tailwind CSS v4, using client directives (client:load/idle/visible), handling forms/actions with Zod 4, configuring server features (sessions, i18n, env vars, CSP, Cloudflare Workers), using view transitions or ClientRouter (<ClientRouter />), or setting up adapters (Node/Vercel/Netlify/Cloudflare) in an Astro project. Provides correct Astro 6 patterns, hydration guidance, view transition lifecycle, and prevents outdated Astro 3/4/5 code."
---

# Astro Dev

## Documentation Strategy

**This skill works best alongside the Astro Docs MCP** (`search_astro_docs()`). The MCP handles single-concept lookups (API details, config options). This skill handles what MCP can't: **guardrails** that catch wrong code before it's generated, **multi-concept patterns** that require combining several features, and **decision frameworks** for choosing between approaches.

### MCP-first workflow

1. **For "how does X work?"** → Use MCP: `search_astro_docs({ query: "X" })`
2. **For "what's the right pattern for X?"** → Use this skill's reference files
3. **Before generating any Astro code** → Check the guardrails below to avoid known mistakes
4. **No MCP available?** → Fall back to `references/doc-endpoints.md` for LLM-optimized doc URLs

---

## Quick Router — Read the right file for your task

| What you're doing | Read this file |
|---|---|
| **Project setup / core APIs / styles / scripts / middleware** | `references/astro-core-patterns.md` |
| **Content collections** (schema, loader, querying, Zod 4) | `references/content-collections.md` |
| **Blog features** (RSS, pagination, tags, SEO, TOC, Shiki) | `references/blog-recipes.md` |
| **Tailwind CSS** (config, theming, classes, fonts) | `references/tailwind.md` |
| **Client directives / islands / hydration** | `references/islands-and-hydration.md` |
| **Forms, actions, data mutations** | `references/actions-and-forms.md` |
| **View transitions, ClientRouter, script lifecycle** | `references/view-transitions.md` |
| **Sessions, env vars, i18n, CSP, Cloudflare, prerender** | `references/server-features.md` |
| **Doc URLs, MCP fallback** | `references/doc-endpoints.md` |

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

**Alternative:** If the plugin is available as a rehype plugin (e.g., `rehype-expressive-code` instead of `astro-expressive-code`), use it in `markdown.rehypePlugins` directly. Rehype plugins execute in array order, giving you explicit control without the integration wrapper trick. Remark plugins always run before rehype plugins in the markdown pipeline.

**6. Choose the right `client:` directive — both directions matter:**
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
Use `client:idle` for non-critical interactive components, `client:visible` for below-the-fold.

**But don't use `client:idle` on immediately clickable elements either:**
```astro
<!-- WRONG: user clicks before hydration, click is silently lost -->
<SearchButton client:idle />
<MobileMenu client:idle />

<!-- correct: elements users click immediately need client:load -->
<SearchButton client:load />
<MobileMenu client:load />
```
If a user can click it in the first 2 seconds, it must be `client:load`. See `references/islands-and-hydration.md`.

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
    input: z.object({ email: z.email() }),  // Zod 4: z.email(), not z.string().email()
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
Pages are prerendered by default. Any page using cookies, sessions, Actions, or POST handling must opt out. See `references/server-features.md`.

**9. Use `astro:env` for environment variables, not `process.env`:**
```ts
// avoid as the default app pattern for secrets
const secret = process.env.API_KEY

// preferred app pattern: define schema in config, import from virtual module
import { API_KEY } from 'astro:env/server'
```
Note: In Astro 6, `import.meta.env` values are **inlined at build time**. For runtime server env vars, use `astro:env` secrets or `process.env`. See `references/server-features.md`.

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
Use `:global()` to style slotted/markdown content. See `references/astro-core-patterns.md`.

**11. `<script>` is deduplicated — don't expect per-instance behavior:**
```astro
<!-- Script runs ONCE even if component renders 10 times -->
<script>
  document.querySelectorAll('.my-btn').forEach(btn => { ... })
</script>
```
Pass server data to scripts via `data-*` attributes, not template expressions. `define:vars` implies `is:inline` (no bundling). See `references/astro-core-patterns.md`.

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
Note: Astro 6 changed `redirectToDefaultLocale` default to `false`. See `references/server-features.md`.

**14. Import Zod from `astro/zod`, not from `astro:content`:**
```ts
// agents generate this (deprecated in Astro 6)
import { defineCollection, z } from 'astro:content'

// correct pattern
import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'
```
Also `astro:schema` is deprecated. Always use `astro/zod`. Astro 6 ships Zod 4 — `z.string().email()` → `z.email()`, `{message:}` → `{error:}`.

**15. Legacy content collections are fully removed in Astro 6:**
```ts
// ERRORS in Astro 6:
// - src/content/config.ts (must be src/content.config.ts)
// - defineCollection({ type: 'content' }) (type field removed)
// - defineCollection({}) without loader (loader is mandatory)

// correct: every collection needs a loader
import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
})
```

**16. CJS config files are no longer supported:**
```ts
// ERRORS in Astro 6
// astro.config.cjs — CommonJS not supported
// module.exports = { ... }

// correct: use ESM (.ts or .mjs)
// astro.config.ts
import { defineConfig } from 'astro/config'
export default defineConfig({ ... })
```

**17. With `<ClientRouter />`: use `astro:page-load`, not direct calls:**
```ts
// breaks on first load or after navigation
initFeature()
document.addEventListener('astro:after-swap', initFeature)

// correct: covers both initial load AND navigations
document.addEventListener('astro:page-load', initFeature)
```

**18. With `<ClientRouter />`: use event delegation, not direct listeners:**
```ts
// listeners lost when DOM is swapped during navigation
btn.addEventListener('click', handler)

// correct: survives DOM swaps
document.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('.btn')) handler()
})
```

**19. Preserve theme/state in `astro:before-swap`, not `after-swap`:**
```ts
document.addEventListener('astro:before-swap', (e) => {
  e.newDocument.documentElement.setAttribute('data-theme',
    localStorage.getItem('theme-preference') || 'light')
})
```
Setting in `after-swap` causes a flash — the new page renders without the attribute before your handler runs.

**20. Visibility CSS (`display: none`) must be in global.css, not component styles:**
Component `<style is:global>` loads after HTML paint → hidden content briefly visible (FOUC). Put it in `global.css` so it's available on first paint.

See `references/view-transitions.md` for full patterns.

---

## Common Integration Stack

See `templates/` for copy-ready config files.

```ts
// astro.config.ts
import { defineConfig, fontProviders } from 'astro/config'
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
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Inter',
      cssVariable: '--font-inter',
      weights: ['100 900'],
    },
  ],
})
```

---

## Workflow: Explore Before Modifying

1. **Check Astro version**: `package.json` → `"astro"` version determines API surface
2. **Check Node version**: Astro 6 requires Node 22.12.0+
3. **Check config format**: `.ts` or `.mjs` (`.cjs` no longer supported), which integrations are installed
4. **Check content schema**: Must be `src/content.config.ts` (not `src/content/config.ts` — errors in v6)
5. **Check Tailwind setup**: `@tailwindcss/vite` in astro config vs `@astrojs/tailwind`
6. **Then write code** using the correct API for the detected versions
