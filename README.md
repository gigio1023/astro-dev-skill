# astro-dev-skill

Astro 7 guardrails for coding agents.

This skill catches stale Astro output before it lands in your codebase: old content collection APIs, `Astro.glob()`, `entry.render()`, `tailwind.config.js`, direct `markdown.remarkPlugins`, oversized `.astro` files, and other patterns agents still reach for from Astro 3/4/5/6.

Background: [why I wrote this skill and how I built it](https://sunghogigio.com/blog/en/astro-agent-skill/).

---

## Why this exists

Astro's official docs are good at answering questions you ask. Coding agents often fail one step earlier: they generate stale Astro code without realizing there is a question to ask.

This skill exists for that gap. The useful unit is the agent failure mode: what goes wrong, how docs/MCP behave on their own, and what this skill changes before code is written.

| Agent failure mode | If you only use docs/MCP | With this skill installed |
|---|---|---|
| The agent does not know there is a question to ask | The stale snippet may ship unchanged | The stale default is flagged before lookup |
| The task spans several Astro APIs | Each direct question can get a correct answer | The pieces are composed into a working Astro pattern |
| Deprecated code still looks plausible | The docs can correct it after someone notices | Known bad defaults become guardrails |
| Several valid options exist | The docs list the options | The skill narrows the choice for the task |
| A file keeps growing because it still builds | The docs rarely stop that drift | The skill pushes route, layout, component, action, loader, and utility boundaries |

Use this when you want agents to produce Astro 7-shaped code by default, not merely search the docs after something breaks.

## What It Changes

### Stale Output

| Work area | Agents still generate | Astro 7-shaped output |
|---|---|---|
| Content imports | `import { defineCollection, z } from 'astro:content'` | `import { defineCollection } from 'astro:content'` plus `import { z } from 'astro/zod'` |
| Collection loading | Collection without `loader` | `loader: glob(...)`, `file(...)`, or a custom loader |
| Content config location | `src/content/config.ts` | `src/content.config.ts` |
| Markdown queries | `Astro.glob('./posts/*.md')` | `getCollection('blog')` |
| Entry rendering | `post.render()` or `entry.render()` | `render(post)` from `astro:content` |
| Zod 4 schemas | `z.string().email()` | `z.email()` |
| Tailwind setup | `@tailwind base/components/utilities` | `@import "tailwindcss";` |
| Tailwind theming | `tailwind.config.js` by default | CSS-native `@theme inline { ... }` |
| Markdown/MDX processors | Direct `markdown.remarkPlugins` | `markdown.processor: unified(...)`, or Sätteri plugins |
| Advanced routing | `src/fetch.ts` as a normal helper file | Advanced routing entrypoint; rename it or set `fetchFile` |
| File organization | One giant page/component file | Split by route, layout, component, action, loader, and utility boundaries |

### Design Choices

| Decision to make | Default this skill pushes | Why it matters |
|---|---|---|
| Hydration | Use `client:load` only when first-paint interactivity matters; prefer `client:idle` or `client:visible` otherwise | Keeps static pages static unless interactivity is actually needed |
| Forms | Prefer Actions for typed mutations and form handling; use API routes when raw Request/Response control matters | Avoids hand-rolled form plumbing when Astro has a typed path |
| Rendering | Use on-demand rendering for cookies, sessions, Actions, POST handling, live collections, and per-request logic | Prevents accidental prerendering of request-dependent pages |
| Markdown/MDX | Use Astro 7's Sätteri default unless the project depends on remark, rehype, or recma behavior | Keeps the default fast path while preserving plugin-heavy projects |
| Caching | Use top-level `cache` and `routeRules`; do not put Astro 7 route caching under `experimental` | Matches Astro 7's stable route-caching API |
| File shape | Split files before they become hard to review or risky for future agents to edit | Makes future human review and AI edits safer |

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
const post = posts[0]
if (!post) throw new Error('No blog entries found')
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

| Task shape | Astro Docs MCP | This skill |
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

| Reference file | Load it when the task needs | Covers |
|---|---|---|
| `astro-core-patterns.md` | Core Astro app structure or version-sensitive APIs | Core APIs, file organization, styles, scripts, middleware, adapters |
| `content-collections.md` | Blog/content collections, schemas, or live content | Loaders, schemas, querying, Zod 4, live collections |
| `blog-recipes.md` | Blog features beyond basic collection reads | RSS, pagination, tags, SEO, Shiki, MDX, TOC, reading time |
| `tailwind.md` | Styling with Tailwind v4 | Vite plugin, CSS theming, dark mode, fonts |
| `islands-and-hydration.md` | Client interactivity or framework islands | Client directives, nanostores, server islands |
| `actions-and-forms.md` | Forms, mutations, and validation | Actions API, validation, Actions vs API routes |
| `server-features.md` | Runtime behavior or deployment-sensitive code | Prerender, sessions, `astro:env`, i18n, CSP, Cloudflare, route caching |
| `view-transitions.md` | ClientRouter or page transitions | ClientRouter lifecycle and transition gotchas |
| `doc-endpoints.md` | Fresh docs or MCP fallback lookup | MCP config, doc URLs, fallback strategy |

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
