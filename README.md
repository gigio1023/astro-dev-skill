# astro-dev-skill

Agent skill for Astro 6 development. Prevents agents from generating broken code, provides blog-ready recipes, and complements the [Astro Docs MCP](https://docs.astro.build/en/guides/build-with-ai/) with guardrails and multi-concept patterns it can't provide.

Works with Claude Code, Codex CLI, Cursor, and [40+ coding agents](https://github.com/vercel-labs/skills).

---

## Install

### Skills CLI

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
<summary>Other agents</summary>

```bash
mkdir -p ~/.agents/skills && \
git clone https://github.com/gigio1023/astro-dev-skill.git /tmp/astro-dev-skill && \
cp -r /tmp/astro-dev-skill/skills/astro-dev ~/.agents/skills/ && \
rm -rf /tmp/astro-dev-skill
```
</details>

---

## The problem

Agents often generate pre-Astro 6 code that looks plausible but breaks quietly. The Astro Docs MCP answers "how does X work?" but can't intercept the stale pattern the agent never thought to question.

### Astro 6 content collections

```ts
import { defineCollection, getCollection, render } from 'astro:content'
import { z } from 'astro/zod'
import { glob } from 'astro/loaders'

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      cover: image().optional(),
      authorEmail: z.email(),
    }),
})

const posts = await getCollection('blog')
const { Content } = await render(post)
```

### Common agent output

```ts
import { defineCollection, z } from 'astro:content'

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    cover: z.string().optional(),
    authorEmail: z.string().email(),
  }),
})

const posts = await Astro.glob('./posts/*.md')
const { Content } = await post.render()
```

### Astro 6 Tailwind v4

```css
@import "tailwindcss";

@theme inline {
  --color-primary: oklch(0.6 0.2 250);
}
```

### Common agent output

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* plus tailwind.config.js */
```

### Fast correction map

| Agents still generate | Astro 6 / Tailwind v4 |
|---|---|
| `import { z } from 'astro:content'` | `import { z } from 'astro/zod'` |
| Collection without `loader` | `loader: glob(...)` or `file(...)` |
| `schema: z.object({...})` when using `image()` | `schema: ({ image }) => z.object({...})` |
| `Astro.glob('./posts/*.md')` | `getCollection('blog')` |
| `post.render()` | `render(post)` |
| `z.string().email()` | `z.email()` |
| `@tailwind base/components/utilities` | `@import "tailwindcss";` |
| `tailwind.config.js` | CSS `@theme inline { ... }` |

---

## How this skill complements MCP

| | Astro Docs MCP | This skill |
|---|---|---|
| **"How does paginate() work?"** | Answers correctly | Defers to MCP |
| **Agent writes `entry.render()`** | Never triggered (agent didn't ask) | Catches it via guardrail |
| **"Build tag pages with pagination"** | Returns partial info from one search | Provides the full `flatMap` + `paginate()` + `params` recipe |
| **"Should I use Actions or API routes?"** | Lists both, doesn't decide | Provides decision framework |

**MCP handles lookups. This skill handles interception and composition.**

---

## What's inside

### 16 Guardrails

Patterns agents generate incorrectly. Each was identified from repeated failures:

| # | What agents do wrong | What the guardrail corrects |
|---|---|---|
| 1 | Collections without `loader` | Explicit `glob`/`file`/custom loader required |
| 2 | `tailwind.config.js` | CSS-native `@theme inline` — no JS config |
| 3 | `Astro.glob()` | `getCollection()` from `astro:content` |
| 4 | `entry.render()` method | `render(entry)` standalone function |
| 5 | Remark plugin ordering | Integration plugins prepend; must use `astro:config:setup` to run first |
| 6 | `client:load` on everything | `client:idle` / `client:visible` for non-critical |
| 7 | Manual POST API routes | Actions — typed, validated, CSRF-protected |
| 8 | Cookies on prerendered pages | Requires `export const prerender = false` |
| 9 | `process.env` / `import.meta.env` | `astro:env` with schema; `import.meta.env` is build-time inlined in v6 |
| 10 | `class` passes to children | Must destructure `Astro.props` and apply manually |
| 11 | Script runs per instance | `<script>` is deduplicated — use `data-*` for data |
| 12 | `fetch()` runs per request | Runs at build time unless page is on-demand |
| 13 | Manual locale routing | Use Astro's built-in `i18n` config |
| 14 | `import { z } from 'astro:content'` | `import { z } from 'astro/zod'` — Zod 4 |
| 15 | Legacy `src/content/config.ts` | Must be `src/content.config.ts` with `loader` — v6 errors otherwise |
| 16 | `astro.config.cjs` | CJS removed — use `.ts` or `.mjs` |

### Blog recipes (MCP can't provide these)

Multi-concept patterns that require combining several features correctly:

| Recipe | Why MCP alone fails |
|---|---|
| **RSS + Content Collections** | Agents use `pagesGlobToRssItems()` (wrong for collections); correct is `getCollection()` + `map()` |
| **Pagination** | Agents do manual array slicing; correct is `paginate()` from `getStaticPaths` |
| **Tag pages + nested pagination** | Requires `flatMap` + `paginate()` + `params: { tag }` — 3 concepts in one |
| **Shiki dark mode** | Agents use `.shiki` class and wrong CSS variable names; Astro uses `.astro-code` and `--astro-code-*` |
| **MDX component overrides** | Agents don't know `<Content components={{ h2: Custom }} />` exists |
| **SEO meta layout** | Agents put OG tags in every page; correct is a layout component with props |
| **Reading time** | Agents install npm packages; a 10-line remark plugin with `mdast-util-to-string` suffices |
| **TOC from headings** | Agents rebuild parsing from scratch; `render()` already returns `headings` |
| **Prev/next navigation** | Sort all posts, find neighbors by index |

### Decision frameworks

| Decision | Guidance |
|---|---|
| Which `client:*` directive? | Decision tree: needs interactivity? → first paint? → above fold? |
| Actions vs API routes? | Actions for forms/mutations; API routes for webhooks/streaming |
| Prerender vs on-demand? | Cookies, sessions, forms, live collections → must be on-demand |
| Adapter selection? | Node/Vercel/Netlify/Cloudflare — only needed for on-demand features |

### Reference files

Core patterns, Tailwind v4, Content Collections, islands/hydration, Actions/forms, server features, and doc endpoint URLs. **Trimmed for gotchas only** — detailed API docs are deferred to MCP.

### Templates

Drop-in config files for Astro 6 + Tailwind v4 + MDX + Fonts API + Content Collections (Zod 4).

---

## Structure

```
skills/astro-dev/
├── SKILL.md                        # Entry point: MCP-first workflow, guardrails, router
├── references/
│   ├── astro-core-patterns.md      # Core APIs, styles, scripts, middleware, adapters
│   ├── content-collections.md      # Loaders, schemas, querying, Zod 4, live collections
│   ├── blog-recipes.md             # RSS, pagination, tags, SEO, Shiki, MDX, TOC, reading time
│   ├── tailwind.md                 # Vite plugin, CSS theming, dark mode, fonts
│   ├── islands-and-hydration.md    # Client directives, nanostores, server islands
│   ├── actions-and-forms.md        # Actions API, Zod 4 validation, Actions vs API routes
│   ├── server-features.md          # Prerender, sessions, astro:env, i18n, CSP, Cloudflare
│   └── doc-endpoints.md            # MCP config, LLM doc URLs, fallback strategy
└── templates/
    ├── astro.config.ts             # Astro 6 + Tailwind v4 + Fonts API
    ├── content.config.ts           # Content Collections (Zod 4)
    └── global.css                  # Tailwind v4 entry point
```

## License

MIT
