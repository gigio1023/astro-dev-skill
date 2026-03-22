# astro-dev-skill

Agent skill for **Astro 5** web development. Prevents outdated Astro 3/4 patterns that LLM-based coding agents default to.

## Why this exists

Astro 5 introduced significant breaking changes — Content Collections v3, Tailwind CSS v4 migration, removed APIs like `Astro.glob()` — but most community-maintained agent skills and LLM training data still reflect Astro 3/4 patterns. This skill provides up-to-date reference material so coding agents produce correct Astro 5 code without manual correction.

## What it covers

| Area | Key changes |
|------|-------------|
| **Astro 5 breaking changes** | Removed `Astro.glob()`, new config format, updated API surface |
| **Content Collections v3** | Explicit `glob` loader, schema as function, standalone `render()` |
| **Tailwind CSS v4** | `@tailwindcss/vite` plugin, CSS-based `@theme`, no config file |
| **Documentation strategy** | MCP server integration, LLM-optimized doc endpoints, live verification |

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
├── SKILL.md                          # Main: gotchas, doc strategy, workflow
└── references/
    ├── astro5-breaking-changes.md    # Removed APIs & new patterns
    ├── content-collections-v3.md     # Content Collections new API
    ├── tailwind-v4.md                # Tailwind v4 migration
    └── doc-endpoints.md              # LLM-optimized documentation URLs
```

## License

MIT
