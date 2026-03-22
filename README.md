# astro-dev-skill

Astro 6 development skill for AI coding agents. Guardrails, patterns, and documentation strategy — so agents write working code instead of guessing from outdated training data.

Works with Claude Code, Codex CLI, Cursor, and [40+ coding agents](https://github.com/vercel-labs/skills).

---

## Why this exists

Agents default to Astro 3/4/5 syntax that no longer works in Astro 6. But fixing deprecated APIs is only half the problem — agents also lack patterns for building real features.

This skill provides three layers:

1. **Guardrails** — Intercepts deprecated patterns and steers toward current APIs
2. **Development patterns** — Routing, content architecture, styling, middleware, API routes
3. **Doc discovery** — Teaches agents how to look up latest docs (MCP → LLM endpoints → offline), so the skill stays useful even after Astro evolves

> The [Astro Docs MCP server](https://docs.astro.build/en/guides/build-with-ai/) provides doc search but no guardrails or patterns. This skill complements it.

---

## What agents get wrong

```ts
// Broken (Astro 5 and earlier)                   // Fixed (Astro 6)
import { defineCollection, z } from 'astro:content' import { defineCollection } from 'astro:content'
                                                   import { z } from 'astro/zod'
const blog = defineCollection({                    const blog = defineCollection({
  schema: z.object({...})                            loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
})                                                   schema: ({ image }) => z.object({...})
                                                   })
const { Content } = await post.render()            const { Content } = await render(post)
const posts = await Astro.glob('./posts/*.md')     const posts = await getCollection('blog')
z.string().email()                                 z.email()  // Zod 4
```

```css
/* Broken (Tailwind v3) */                      /* Fixed (Tailwind v4) */
@tailwind base;                                 @import "tailwindcss";
@tailwind components;                           @theme inline {
@tailwind utilities;                              --color-primary: oklch(0.6 0.2 250);
/* + tailwind.config.js */                      }
```

| Removed / Deprecated | Replacement |
|---|---|
| `Astro.glob()` | `getCollection()` |
| `entry.render()` | `render(entry)` standalone function |
| `entry.slug` | `entry.id` |
| `getEntryBySlug()` | `getEntry()` |
| `@astrojs/tailwind` | `@tailwindcss/vite` plugin |
| `tailwind.config.js` | CSS `@theme inline {}` |
| `import { z } from 'astro:content'` | `import { z } from 'astro/zod'` |
| `output: 'hybrid'` | `'static'` + `export const prerender = false` |
| `astro.config.cjs` | `.ts` or `.mjs` (CJS removed) |
| `src/content/config.ts` | `src/content.config.ts` |
| `<ViewTransitions />` | `<ClientRouter />` |

---

## What's inside

### Guardrails

16 patterns agents consistently get wrong, each caught from repeated failures:

- Content Collections without `loader` → requires explicit `glob`/`file`/custom loader
- Tailwind JS config → CSS-native `@theme inline` (no `tailwind.config.js`)
- `Astro.glob()` → `getCollection()` from `astro:content`
- `entry.render()` method → `render(entry)` standalone function
- **Remark plugin ordering trap** — integration plugins prepend via `astro:config:setup`
- **`client:load` on everything** → use `client:idle`/`client:visible` for non-critical components
- **Manual POST routes for forms** → use Actions (typed, validated, CSRF-protected)
- **Cookies/sessions on prerendered pages** → requires `export const prerender = false`
- **`process.env` for env vars** → use `astro:env` with schema validation; `import.meta.env` is build-time inlined in v6
- **`class` doesn't pass through to children** → must destructure `Astro.props` and apply manually
- **`<script>` is deduplicated** — runs once even with multiple instances; pass data via `data-*` attrs
- **`fetch()` in frontmatter runs at build time** — not per-request unless page is on-demand
- **Manual locale routing** → use Astro's built-in `i18n` config
- **Import `z` from `astro:content`** → deprecated; use `import { z } from 'astro/zod'` (Zod 4)
- **Legacy content collections** → fully removed in v6; no `type` field, no `src/content/config.ts`
- **CJS config files** → `astro.config.cjs` no longer supported

### Development patterns

Full working examples for building real features:

| Topic | What's covered |
|---|---|
| **Scoped styles** | Auto-scoping, `class` prop forwarding, `:global()` for slotted content, imported CSS behavior |
| **Client scripts** | Deduplication, `is:inline`, passing server data via `data-*`/`define:vars`, Web Components pattern |
| **Data fetching** | Build-time vs request-time `fetch()`, top-level await, no client-side re-fetch in `.astro` |
| **Routing** | `getStaticPaths`, dynamic routes, `post.id` shape |
| **Content Collections** | `glob`/`file`/custom loaders, schema functions, querying, rendering |
| **Live Content Collections** | `defineLiveCollection`, `getLiveCollection`/`getLiveEntry`, `src/live.config.ts` |
| **Content architecture** | Draft filtering by env, date sorting, cross-collection references, series/subpost pattern |
| **Islands & hydration** | `client:load`/`idle`/`visible`/`only`/`media` decision tree, nanostores for cross-island state |
| **Server Islands** | `server:defer`, fallback slots, prop serialization limits, `ASTRO_KEY` |
| **Actions & forms** | `defineAction`, Zod 4 validation, form vs JSON, error handling, Actions vs API routes |
| **Prerender vs on-demand** | What breaks on static pages (cookies, sessions, forms), opt-out per page |
| **Sessions** | `Astro.session` API, storage drivers, type safety |
| **Environment variables** | `astro:env` schema, client/server/secret access, `getSecret()`, build-time inlining |
| **i18n routing** | Built-in locale config, `getRelativeLocaleUrl()`, fallback strategies, v6 default changes |
| **Content Security Policy** | `security.csp` config, runtime API (`Astro.csp`), limitations |
| **View Transitions** | `<ClientRouter />`, `transition:persist`, named animations |
| **Image handling** | `astro:assets`, local optimization, remote images, SVG rasterization (v6) |
| **Middleware** | `defineMiddleware`, `sequence()` chaining, typing `locals` |
| **API routes** | GET/POST endpoints, output mode constraints |
| **Adapters** | Node.js, Vercel, Netlify, Cloudflare Workers — when to use each |
| **Cloudflare Workers** | `workerd` runtime, `cloudflare:workers` bindings, `prerenderEnvironment` |
| **Dev server** | Vite Environment API, production-parity runtime, CSP dev limitations |
| **Experimental features** | Queued rendering (2x perf), Rust compiler, route caching, SVG optimization |
| **Tailwind theming** | CSS custom properties, dark mode toggle (`@custom-variant`), `cn()` utility |
| **Fonts** | Built-in `fontProviders` config (Google, Fontsource, local, Adobe, Bunny, etc.), `<Font />` component |
| **Zod 4 migration** | `z.email()`, `{error:}`, `.default()` with transforms, `.prefault()` |

### Documentation discovery

A 4-step fallback strategy so agents always find current information:

```
1. MCP tool available?  →  search_astro_docs({ query: "..." })
2. No MCP?              →  WebFetch the AI integration guide (live source of truth)
3. Need full reference? →  LLM-optimized doc endpoints (llms-full.txt, api-reference.txt, etc.)
4. Offline?             →  Fall back to this skill's reference files
```

Includes a task-to-doc routing table: which doc URL to hit for content collections, CMS integrations, deployment, SSR, and more.

### Templates

Drop-in config files for a modern Astro 6 stack:

- `astro.config.ts` — Tailwind v4 + MDX + React + Sitemap + Fonts API
- `content.config.ts` — Content Collections with glob loader (Zod 4)
- `global.css` — Tailwind v4 CSS entry point

---

## Install

### Skills CLI (recommended)

```bash
npx skills add gigio1023/astro-dev-skill      # project
npx skills add gigio1023/astro-dev-skill -g    # global
```

### Manual

<details>
<summary>Claude Code</summary>

```bash
mkdir -p ~/.claude/skills && \
git clone https://github.com/gigio1023/astro-dev-skill.git /tmp/astro-dev-skill && \
cp -r /tmp/astro-dev-skill/skills/astro-dev ~/.claude/skills/ && \
rm -rf /tmp/astro-dev-skill
```
</details>

<details>
<summary>Codex CLI</summary>

```bash
mkdir -p ~/.codex/skills && \
git clone https://github.com/gigio1023/astro-dev-skill.git /tmp/astro-dev-skill && \
cp -r /tmp/astro-dev-skill/skills/astro-dev ~/.codex/skills/ && \
rm -rf /tmp/astro-dev-skill
```
</details>

<details>
<summary>Other agents (~/.agents/skills)</summary>

```bash
mkdir -p ~/.agents/skills && \
git clone https://github.com/gigio1023/astro-dev-skill.git /tmp/astro-dev-skill && \
cp -r /tmp/astro-dev-skill/skills/astro-dev ~/.agents/skills/ && \
rm -rf /tmp/astro-dev-skill
```
</details>

> Adjust the path to match your agent's skill directory. The directory must contain `SKILL.md` at its root.

---

## Structure

```
skills/astro-dev/
├── SKILL.md                        # Entry point: guardrails, doc strategy, workflow
├── references/
│   ├── astro-core-patterns.md      # Routing, scoped styles, scripts, data fetching, middleware, adapters, experimental features, dev server
│   ├── content-collections.md      # Loaders, schemas, querying, live collections, series patterns
│   ├── tailwind.md                 # Vite plugin setup, CSS theming, dark mode, fonts, cn() utility
│   ├── islands-and-hydration.md    # Client directives, nanostores, server islands (server:defer)
│   ├── actions-and-forms.md        # Actions API, form handling, Zod 4 validation, Actions vs API routes
│   ├── server-features.md          # Prerender split, sessions, astro:env, i18n, CSP, prefetch
│   └── doc-endpoints.md            # MCP server, LLM doc URLs, task-to-doc routing
└── templates/
    ├── astro.config.ts             # Astro 6 + Tailwind v4 + MDX + React + Sitemap + Fonts
    ├── content.config.ts           # Content Collections boilerplate (Zod 4)
    └── global.css                  # Tailwind v4 CSS entry point
```

## How it works

The skill activates when an agent edits `.astro`/`.mdx` files or touches `astro.config.*`. It walks the agent through:

1. Check Astro version in `package.json` (v6 requires Node 22.12.0+)
2. Inspect existing config (format, integrations, Tailwind setup)
3. Look up latest docs (MCP → LLM endpoints → offline references)
4. Generate code using correct APIs and patterns

---

## License

MIT
