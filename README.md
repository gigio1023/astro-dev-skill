# astro-dev-skill

Astro 6 patterns for coding agents.

This skill catches stale output such as `Astro.glob()`, `entry.render()`, `tailwind.config.js`, and `import { z } from 'astro:content'`, then points the agent to the Astro 6 shape that works.

Works with Claude Code, Codex CLI, Cursor, Gemini CLI, and [other skills-compatible coding agents](https://github.com/vercel-labs/skills).

Background: [why I wrote this skill and how I built it](https://sunghogigio.com/blog/en/astro-agent-skill/).

---

## Install

### Skills CLI

```bash
npx skills add gigio1023/astro-dev-skill@astro-dev
```

### Codex

Tell Codex:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/gigio1023/astro-dev-skill/refs/heads/main/.codex/INSTALL.md
```

Detailed docs: `docs/README.codex.md`

### Claude Code

Tell Claude Code:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/gigio1023/astro-dev-skill/refs/heads/main/.claude/INSTALL.md
```

Detailed docs: `docs/README.claude.md`

### Gemini CLI

Tell Gemini CLI:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/gigio1023/astro-dev-skill/refs/heads/main/.gemini/INSTALL.md
```

Detailed docs: `docs/README.gemini.md`

### Cursor

Tell Cursor:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/gigio1023/astro-dev-skill/refs/heads/main/.cursor/INSTALL.md
```

Detailed docs: `docs/README.cursor.md`

---

## Why this exists

Astro 6 changed enough surfaces that agents still fall back to Astro 3/4/5 patterns. The Astro Docs MCP is strong at direct questions, but it cannot catch a stale snippet the agent never asked about.

This skill exists to intercept those bad defaults before they spread through a codebase.

## What it catches

### Content collections

**Astro 6**

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

**Common agent output**

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

### Tailwind v4

**Astro 6**

```css
@import "tailwindcss";

@theme inline {
  --color-primary: oklch(0.6 0.2 250);
}
```

**Common agent output**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* plus tailwind.config.js */
```

### A few high-value decision fixes

| What agents default to | What this skill pushes toward |
|---|---|
| `client:load` on everything | `client:idle` or `client:visible` when interactivity is not first-paint critical |
| manual POST API routes for forms | Actions when the problem is really typed mutations or form handling |
| `src/content/config.ts` | `src/content.config.ts` |
| direct secret access with `process.env` | `astro:env` with schema validation, or documented config-time exceptions only |
| ad-hoc collection patterns | loader-based collections with `glob()` or `file()` |

### Quick fixes

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

## How this works with MCP

| Case | Astro Docs MCP | This skill |
|---|---|---|
| Direct API lookup | Answers correctly | Defers to MCP |
| Stale code the agent never questions | Never triggered | Catches the bad default |
| Multi-step blog patterns | Returns partial pieces | Combines the working pattern |
| Two valid options (`Actions` vs API routes, `client:*`, adapters) | Lists APIs | Narrows the choice |

MCP answers APIs. This skill catches bad defaults and composes the pieces.

---

## What's inside

- `16 guardrails` for content collections, Tailwind v4, hydration, scripts, Actions, server features, environment config, and Astro 6 file locations.
- `Recipes` for RSS, pagination, nested tag pages, SEO layouts, reading time, TOC extraction, MDX component overrides, Shiki dark mode, and prev/next links.
- `Choice guides` for `client:*`, Actions vs API routes, prerender vs on-demand, and adapter selection.
- `Reference notes` trimmed to the gotchas agents miss most often.
- `Templates` for `astro.config.ts`, `content.config.ts`, and `global.css`.

### Reference files

| File | Covers |
|---|---|
| `astro-core-patterns.md` | Core Astro APIs, styles, scripts, middleware, adapters |
| `content-collections.md` | Loaders, schemas, querying, Zod 4, live collections |
| `blog-recipes.md` | RSS, pagination, tags, SEO, Shiki, MDX, TOC, reading time |
| `tailwind.md` | Vite plugin, CSS theming, dark mode, fonts |
| `islands-and-hydration.md` | Client directives, nanostores, server islands |
| `actions-and-forms.md` | Actions API, validation, Actions vs API routes |
| `server-features.md` | Prerender, sessions, `astro:env`, i18n, CSP, Cloudflare |
| `view-transitions.md` | ClientRouter, lifecycle, and transition gotchas |
| `doc-endpoints.md` | MCP config, doc URLs, fallback strategy |

### A few guardrails

| Agents generate | Correct |
|---|---|
| No `loader` in collections | `loader: glob(...)` is required |
| `src/content/config.ts` | `src/content.config.ts` |
| `entry.render()` | `render(entry)` |
| `client:load` on everything | `client:idle` or `client:visible` when possible |
| Cookies on prerendered pages | `export const prerender = false` |
| direct secret access with `process.env` | prefer `astro:env` with schema validation |
| `astro.config.cjs` | `.ts` or `.mjs` |

---

## Structure

```text
skills/astro-dev/
├── SKILL.md
├── references/
│   ├── astro-core-patterns.md
│   ├── content-collections.md
│   ├── blog-recipes.md
│   ├── tailwind.md
│   ├── islands-and-hydration.md
│   ├── actions-and-forms.md
│   ├── server-features.md
│   ├── view-transitions.md
│   └── doc-endpoints.md
└── templates/
    ├── astro.config.ts
    ├── content.config.ts
    └── global.css
```

## License

MIT
