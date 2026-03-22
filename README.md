# astro-dev-skill

Agent skill that stops AI coding agents from generating broken Astro 3/4 code. Provides correct Astro 5 + Tailwind v4 patterns out of the box.

Works with Claude Code, Codex CLI, Cursor, and [40+ coding agents](https://github.com/vercel-labs/skills).

---

## The problem

Agents generate outdated Astro code because their training data predates Astro 5. The result: builds that fail silently or throw cryptic errors.

### Content Collections

```ts
// What agents generate (broken)
const blog = defineCollection({ schema: z.object({...}) })
const { Content } = await post.render()
const posts = await Astro.glob('./posts/*.md')
```

```ts
// What this skill produces (works)
import { glob } from 'astro/loaders'
import { render } from 'astro:content'

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) => z.object({...})
})
const { Content } = await render(post)
const posts = await getCollection('blog')
```

### Tailwind CSS

```css
/* What agents generate (broken) */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```css
/* What this skill produces (works) */
@import "tailwindcss";
@theme inline {
  --color-primary: oklch(0.6 0.2 250);
}
```

### Deprecated API quick reference

| Removed | Replacement |
|---|---|
| `Astro.glob()` | `getCollection()` |
| `entry.render()` | `render(entry)` standalone function |
| `entry.slug` | `entry.id` |
| `getEntryBySlug()` | `getEntry()` |
| `@astrojs/tailwind` | `@tailwindcss/vite` plugin |
| `tailwind.config.js` | CSS `@theme inline {}` |

---

## What the skill does

- **Guardrails** — Catches common agent mistakes and steers toward Astro 5 patterns
- **Doc strategy** — Falls through MCP server → LLM doc endpoints → offline references
- **Templates** — Drop-in `astro.config.ts`, `content.config.ts`, `global.css`
- **References** — Core patterns, Content Collections, Tailwind v4, doc endpoints

> The [Astro Docs MCP server](https://docs.astro.build/en/guides/build-with-ai/) provides doc search but no guardrails. This skill complements it.

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
│   ├── astro5-core-patterns.md     # Rendering, routing, View Transitions, middleware, API routes
│   ├── content-collections.md      # Loaders, schemas, querying, series patterns
│   ├── tailwind.md                 # @tailwindcss/vite, @theme, dark mode, cn() utility
│   └── doc-endpoints.md            # Official LLM doc URLs and MCP server info
└── templates/
    ├── astro.config.ts             # Astro 5 + Tailwind v4 + MDX + React + Sitemap
    ├── content.config.ts           # Content Collections boilerplate
    └── global.css                  # Tailwind v4 CSS entry point
```

## How it works

The skill activates when an agent edits `.astro`/`.mdx` files or touches `astro.config.*`. It walks the agent through:

1. Check Astro version in `package.json`
2. Inspect existing config (format, integrations, Tailwind setup)
3. Look up latest docs (MCP → LLM endpoints → offline references)
4. Generate code using the correct APIs

---

## License

MIT
