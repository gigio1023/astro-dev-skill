# astro-dev-skill

Astro 6 guardrails for coding agents.

`astro-dev` catches stale Astro 3/4/5 patterns and steers agents toward working Astro 6 shapes.

## Install

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

## Use it for

- `.astro` and `.mdx` editing
- content collections
- Tailwind v4
- `client:*` hydration choices
- Actions and forms
- `astro:env`, sessions, adapters, CSP
- view transitions and `ClientRouter`

## It catches things like

| Stale output | Astro 6 shape |
| --- | --- |
| `import { z } from 'astro:content'` | `import { z } from 'astro/zod'` |
| `Astro.glob('./posts/*.md')` | `getCollection('blog')` |
| `entry.render()` | `render(entry)` |
| `tailwind.config.js` | CSS `@theme inline { ... }` |

## What's inside

- guardrails for collections, Tailwind v4, hydration, Actions, server features, and view transitions
- references under `skills/astro-dev/references/`
- templates under `skills/astro-dev/templates/`

## Repo layout

```text
astro-dev-skill/
└── skills/
    └── astro-dev/
```
