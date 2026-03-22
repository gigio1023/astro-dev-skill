# astro-dev-skill

Agent skill for **Astro 5** web development. Provides correct, up-to-date patterns and prevents outdated code that LLM-based agents default to.

## Why this exists

Most LLM training data and community agent skills still reflect Astro 3/4 patterns. Astro 5 introduced new APIs (Content Collections with loaders, standalone `render()`) and Tailwind CSS v4 replaced JS config with CSS-native `@theme` — but agents consistently generate the old syntax. This skill gives agents the correct patterns so they produce working Astro 5 code without manual correction.

The official [Astro Docs MCP server](https://docs.astro.build/en/guides/build-with-ai/) provides documentation search, but does not include guardrails against common agent mistakes. This skill complements MCP by providing version-aware patterns and failure prevention.

## What it covers

| Area | What the skill provides |
|------|-------------------------|
| **Astro 5 core patterns** | Rendering, routing, view transitions, server endpoints, output modes |
| **Content Collections** | Loader-based setup, schema as function, querying, common patterns |
| **Tailwind CSS** | `@tailwindcss/vite` setup, CSS `@theme`, dark mode, utility composition |
| **Documentation strategy** | MCP → LLM doc endpoints → offline references (progressive fallback) |
| **Agent guardrails** | Patterns agents consistently get wrong, with correct alternatives |
| **Templates** | Copy-ready `astro.config.ts`, `content.config.ts`, `global.css` |

## Install

### Option A: Skills CLI (Vercel)

```bash
# Project-level
npx skills add gigio1023/astro-dev-skill

# Global
npx skills add gigio1023/astro-dev-skill -g
```

Works with Claude Code, Codex CLI, Cursor, and [40+ coding agents](https://github.com/vercel-labs/skills).

### Option B: Manual install

Copy the skill directly into your agent's skill directory.

**Claude Code:**

```bash
mkdir -p ~/.claude/skills && \
git clone https://github.com/gigio1023/astro-dev-skill.git /tmp/astro-dev-skill && \
cp -r /tmp/astro-dev-skill/skills/astro-dev ~/.claude/skills/ && \
rm -rf /tmp/astro-dev-skill
```

**Codex CLI:**

```bash
mkdir -p ~/.codex/skills && \
git clone https://github.com/gigio1023/astro-dev-skill.git /tmp/astro-dev-skill && \
cp -r /tmp/astro-dev-skill/skills/astro-dev ~/.codex/skills/ && \
rm -rf /tmp/astro-dev-skill
```

**Shared path (`~/.agents/skills`):**

```bash
mkdir -p ~/.agents/skills && \
git clone https://github.com/gigio1023/astro-dev-skill.git /tmp/astro-dev-skill && \
cp -r /tmp/astro-dev-skill/skills/astro-dev ~/.agents/skills/ && \
rm -rf /tmp/astro-dev-skill
```

> Adjust the target path to match your agent's skill resolution directory. The skill directory must contain `SKILL.md` at its root.

## Structure

```
skills/astro-dev/
├── SKILL.md                        # Main: guardrails, doc strategy, workflow
├── references/
│   ├── astro5-core-patterns.md     # Core APIs, routing, rendering, endpoints
│   ├── content-collections.md      # Collections setup, loaders, querying
│   ├── tailwind.md                 # Tailwind setup, theming, dark mode
│   └── doc-endpoints.md            # LLM-optimized documentation URLs
└── templates/
    ├── astro.config.ts             # Modern stack boilerplate
    ├── content.config.ts           # Content Collections setup
    └── global.css                  # Tailwind v4 CSS entry point
```

## License

MIT
