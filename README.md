# astro-dev-skill

Astro 6 guidance for coding agents.

This repo packages the `astro-dev` skill: a guardrail-heavy skill that catches stale Astro 3/4/5 output and redirects agents toward the Astro 6 patterns that actually work.

It is most useful when an agent starts generating things like `Astro.glob()`, `entry.render()`, `tailwind.config.js`, `src/content/config.ts`, or `import { z } from 'astro:content'` even though the current project should use modern Astro conventions.

Works with Claude Code, Codex CLI, Cursor, Gemini CLI, and other skills-compatible coding agents.

Background: [why I wrote this skill and how I built it](https://sunghogigio.com/blog/en/astro-agent-skill/).

## Installation

Preferred:

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

## What this skill is for

Use `astro-dev` when the task involves any of these:

- editing `.astro` or `.mdx` files
- content collections and `astro:content`
- Tailwind CSS v4 in Astro
- hydration strategy and `client:*` directives
- Actions, forms, and validation
- sessions, `astro:env`, i18n, CSP, or adapters
- view transitions or `ClientRouter`

This skill is especially useful when an agent already “knows Astro,” but keeps reaching for stale patterns.

## What problem this repo solves

Astro Docs MCP is strong when the agent asks the right question. It is much weaker when the model never questions its stale defaults.

That is the gap this skill fills:

- it catches the common wrong snippet before it spreads
- it narrows valid choices such as `Actions` vs API routes or `client:load` vs `client:visible`
- it bundles the working shape of multi-step Astro tasks that are annoying to reconstruct from raw docs alone

## Quick examples of what it catches

| Stale output | Modern Astro shape |
| --- | --- |
| `import { z } from 'astro:content'` | `import { z } from 'astro/zod'` |
| Collection without `loader` | `loader: glob(...)` or `file(...)` |
| `src/content/config.ts` | `src/content.config.ts` |
| `Astro.glob('./posts/*.md')` | `getCollection('blog')` |
| `entry.render()` / `post.render()` | `render(entry)` / `render(post)` |
| `z.string().email()` | `z.email()` |
| `@tailwind base/components/utilities` | `@import "tailwindcss";` |
| `tailwind.config.js` | CSS `@theme inline { ... }` |
| `process.env` for runtime config | `astro:env` with schema |
| `client:load` everywhere | prefer `client:idle` / `client:visible` when possible |

## What's inside

### Guardrails

The skill includes targeted rules for:

- content collections
- Tailwind v4 setup
- hydration strategy
- scripts and client/server boundaries
- Actions and forms
- sessions, env, i18n, CSP, and adapters
- view transitions and `ClientRouter`

### Recipes

The references include working patterns for:

- RSS feeds
- pagination
- nested tags
- SEO layouts
- MDX component overrides
- reading time and table-of-contents extraction
- Shiki dark mode
- prev/next navigation

### Templates

Reusable starting points live in `skills/astro-dev/templates/`:

- `astro.config.ts`
- `content.config.ts`
- `global.css`

## Reference files

| File | What it covers |
| --- | --- |
| `astro-core-patterns.md` | Core Astro APIs, scripts, styles, middleware, adapters |
| `content-collections.md` | Loaders, schemas, querying, Zod 4, live collections |
| `blog-recipes.md` | RSS, pagination, tags, SEO, TOC, reading time, MDX |
| `tailwind.md` | Tailwind v4 integration, theme tokens, fonts, dark mode |
| `islands-and-hydration.md` | `client:*`, islands, server islands, hydration choices |
| `actions-and-forms.md` | Actions API, validation, form handling, route tradeoffs |
| `server-features.md` | sessions, `astro:env`, i18n, CSP, Cloudflare, prerender |
| `view-transitions.md` | view transition lifecycle, `ClientRouter`, pitfalls |
| `doc-endpoints.md` | docs MCP strategy, URLs, fallback lookup guidance |

## Example prompts

- `Build a blog index page with Astro content collections and pagination.`
- `Set up Tailwind v4 in Astro and move theme tokens into CSS.`
- `Should this contact form use Actions or an API route?`
- `Add view transitions and a client router without breaking lifecycle hooks.`
- `Fix this old Astro snippet that still uses Astro.glob().`

## Repo layout

```text
astro-dev-skill/
├── README.md
├── LICENSE
└── skills/
    └── astro-dev/
        ├── SKILL.md
        ├── references/
        ├── templates/
        └── ...
```

## Why the repo stays narrow

This is not an Astro tutorial. It is a stale-pattern prevention layer for coding agents. The goal is to keep the repo small, pointed, and useful during real code generation.

## License

MIT
