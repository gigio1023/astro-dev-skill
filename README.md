# astro-dev-skill

Astro 7 guardrails for coding agents.

This skill catches stale Astro output before it lands in your codebase: old content collection APIs, `Astro.glob()`, `entry.render()`, `tailwind.config.js`, direct `markdown.remarkPlugins`, oversized `.astro` files, and other patterns agents still reach for from Astro 3/4/5/6.

Background: [why I wrote this skill and how I built it](https://sunghogigio.com/blog/en/astro-agent-skill/).

---

## Why this exists

Astro's official docs are good at answering questions you ask. Coding agents often fail one step earlier: they generate stale Astro code without realizing there is a question to ask.

This skill exists for that gap.

| If you only use docs/MCP | With this skill installed |
|---|---|
| The agent must know which API to look up | Stale snippets are intercepted before lookup |
| Direct questions get accurate answers | Multi-step Astro patterns get composed into working code |
| Deprecated code can slip through if it looks plausible | Known bad defaults are called out as guardrails |
| The docs describe valid options | The skill nudges toward the right choice for the task |
| Large files may keep growing because they still build | The skill pushes directory structure and focused file boundaries |

Use this when you want agents to produce Astro 7-shaped code by default, not merely search the docs after something breaks.

## What changes

### Stale output gets corrected

| Agents still generate | Astro 7 pattern |
|---|---|
| `import { defineCollection, z } from 'astro:content'` | `import { defineCollection } from 'astro:content'` + `import { z } from 'astro/zod'` |
| Collection without `loader` | `loader: glob(...)`, `file(...)`, or a custom loader |
| `src/content/config.ts` | `src/content.config.ts` |
| `Astro.glob('./posts/*.md')` | `getCollection('blog')` |
| `post.render()` / `entry.render()` | `render(post)` from `astro:content` |
| `z.string().email()` | `z.email()` |
| `@tailwind base/components/utilities` | `@import "tailwindcss";` |
| `tailwind.config.js` by default | CSS-native `@theme inline { ... }` |
| direct `markdown.remarkPlugins` | `markdown.processor: unified(...)`, or Sätteri plugins |
| `src/fetch.ts` as a normal helper file | advanced routing entrypoint; rename it or set `fetchFile` |
| one giant page/component file | split by route, layout, component, action, loader, and utility boundaries |

### Better decisions get made

| Decision point | Skill guidance |
|---|---|
| Hydration | Use `client:load` only when first-paint interactivity matters; prefer `client:idle` or `client:visible` otherwise |
| Forms | Prefer Actions for typed mutations and form handling; use API routes when raw Request/Response control matters |
| Rendering | Use on-demand rendering for cookies, sessions, Actions, POST handling, live collections, and per-request logic |
| Markdown/MDX | Astro 7 defaults to Sätteri; use unified only when the project depends on remark/rehype/recma behavior |
| Caching | Use top-level `cache` and `routeRules`; do not put Astro 7 route caching under `experimental` |
| File shape | Split files before they become hard to review or risky for future agents to edit |

## Quick example

### Content collections

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

### Tailwind v4

```css
@import "tailwindcss";

@theme inline {
  --color-primary: oklch(0.6 0.2 250);
}
```

## How this works with Astro Docs MCP

This skill is not a replacement for the Astro Docs MCP. It is the layer that tells the agent when to consult docs and what stale habits to avoid.

| Case | Astro Docs MCP | This skill |
|---|---|---|
| Direct API lookup | Answers the API question | Defers to MCP |
| Stale code the agent never questions | Usually not triggered | Catches the bad default |
| Blog/features spanning several APIs | Returns partial docs | Combines working patterns |
| Multiple valid options | Lists options | Narrows the choice |
| Project structure | Documents conventions | Pushes maintainable split boundaries |

MCP answers APIs. This skill catches bad defaults and composes the pieces.

---

## Install

Works with Claude Code, Codex CLI, Cursor, Gemini CLI, and [other skills-compatible coding agents](https://github.com/vercel-labs/skills).

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

## What's inside

- `25 guardrails` for content collections, Tailwind v4, hydration, scripts, Actions, server features, environment config, Astro 7 routing, Markdown processing, file organization, and file locations.
- `Recipes` for RSS, pagination, nested tag pages, SEO layouts, reading time, TOC extraction, MDX component overrides, Shiki dark mode, and prev/next links.
- `Choice guides` for `client:*`, Actions vs API routes, prerender vs on-demand, and adapter selection.
- `Reference notes` trimmed to the gotchas agents miss most often.
- `Templates` for `astro.config.ts`, `content.config.ts`, and `global.css`.

### Reference map

| File | Covers |
|---|---|
| `astro-core-patterns.md` | Core Astro APIs, file organization, styles, scripts, middleware, adapters |
| `content-collections.md` | Loaders, schemas, querying, Zod 4, live collections |
| `blog-recipes.md` | RSS, pagination, tags, SEO, Shiki, MDX, TOC, reading time |
| `tailwind.md` | Vite plugin, CSS theming, dark mode, fonts |
| `islands-and-hydration.md` | Client directives, nanostores, server islands |
| `actions-and-forms.md` | Actions API, validation, Actions vs API routes |
| `server-features.md` | Prerender, sessions, `astro:env`, i18n, CSP, Cloudflare, route caching |
| `view-transitions.md` | ClientRouter, lifecycle, and transition gotchas |
| `doc-endpoints.md` | MCP config, doc URLs, fallback strategy |

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
