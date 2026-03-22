# astro-dev-skill

Astro 5 development skill for AI coding agents. Guardrails, patterns, and documentation strategy — so agents write working code instead of guessing from outdated training data.

Works with Claude Code, Codex CLI, Cursor, and [40+ coding agents](https://github.com/vercel-labs/skills).

---

## Why this exists

Agents default to Astro 3/4 syntax that no longer works. But fixing deprecated APIs is only half the problem — agents also lack patterns for building real features in Astro 5.

This skill provides three layers:

1. **Guardrails** — Intercepts deprecated patterns and steers toward current APIs
2. **Development patterns** — Routing, content architecture, styling, middleware, API routes
3. **Doc discovery** — Teaches agents how to look up latest docs (MCP → LLM endpoints → offline), so the skill stays useful even after Astro evolves

> The [Astro Docs MCP server](https://docs.astro.build/en/guides/build-with-ai/) provides doc search but no guardrails or patterns. This skill complements it.

---

## What agents get wrong

```ts
// Broken (Astro 3/4)                          // Fixed (Astro 5)
const blog = defineCollection({                 const blog = defineCollection({
  schema: z.object({...})                         loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
})                                                schema: ({ image }) => z.object({...})
                                                })
const { Content } = await post.render()         const { Content } = await render(post)
const posts = await Astro.glob('./posts/*.md')  const posts = await getCollection('blog')
```

```css
/* Broken (Tailwind v3) */                      /* Fixed (Tailwind v4) */
@tailwind base;                                 @import "tailwindcss";
@tailwind components;                           @theme inline {
@tailwind utilities;                              --color-primary: oklch(0.6 0.2 250);
/* + tailwind.config.js */                      }
```

| Removed API | Replacement |
|---|---|
| `Astro.glob()` | `getCollection()` |
| `entry.render()` | `render(entry)` standalone function |
| `entry.slug` | `entry.id` |
| `getEntryBySlug()` | `getEntry()` |
| `@astrojs/tailwind` | `@tailwindcss/vite` plugin |
| `tailwind.config.js` | CSS `@theme inline {}` |

---

## What's inside

### Guardrails

Five patterns agents consistently get wrong, each caught from repeated failures:

- Content Collections without `loader` → requires explicit `glob`/`file`/custom loader
- Tailwind JS config → CSS-native `@theme inline` (no `tailwind.config.js`)
- `Astro.glob()` → `getCollection()` from `astro:content`
- `entry.render()` method → `render(entry)` standalone function
- **Remark plugin ordering trap** — integration plugins prepend via `astro:config:setup`, so your `markdown.remarkPlugins` run *after* them. To run before, you need a custom integration that prepends to the existing list.

### Development patterns

Full working examples for building real features:

| Topic | What's covered |
|---|---|
| **Routing** | `getStaticPaths`, dynamic routes, `post.id` shape |
| **Content Collections** | `glob`/`file`/custom loaders, schema functions, querying, rendering |
| **Content architecture** | Draft filtering by env, date sorting, cross-collection references, series/subpost pattern |
| **View Transitions** | `transition:persist`, named animations, script re-run behavior |
| **Image handling** | `astro:assets`, local optimization, remote images, schema `image()` with `refine()` |
| **Middleware** | `defineMiddleware` pattern |
| **API routes** | GET/POST endpoints, output mode constraints (static vs server vs hybrid) |
| **Tailwind theming** | CSS custom properties, dark mode toggle (`@custom-variant`), `cn()` utility (clsx + tailwind-merge) |

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

Drop-in config files for a modern Astro 5 stack:

- `astro.config.ts` — Tailwind v4 + MDX + React + Sitemap
- `content.config.ts` — Content Collections with glob loader
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
│   ├── astro5-core-patterns.md     # Routing, View Transitions, images, middleware, API routes, output modes
│   ├── content-collections.md      # Loaders, schemas, querying, series patterns, cross-references
│   ├── tailwind.md                 # Vite plugin setup, CSS theming, dark mode, cn() utility
│   └── doc-endpoints.md            # MCP server, LLM doc URLs, task-to-doc routing
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
4. Generate code using correct APIs and patterns

---

## License

MIT
