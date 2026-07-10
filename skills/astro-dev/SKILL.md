---
name: astro-dev
description: >
  Use when editing .astro/.mdx files, astro.config.*, Astro content collections,
  client directives, Actions/forms, Tailwind CSS, view transitions, server
  features, adapters, or upgrades to Astro 7. Routes to current Astro 7 and Zod
  4 patterns while guarding against removed Astro 3/4/5/6 APIs. NOT for generic
  framework-agnostic frontend design or non-Astro projects.
---

# Astro Dev

Use the project's installed Astro version and local conventions as the source of
truth. The references in this skill capture current Astro 7 patterns and common
migration traps; they do not justify broad refactors outside the user's request.

## Quick Start

1. Read `package.json`, the lockfile, `astro.config.*`, and the target files.
2. Confirm the installed Astro, Node, adapter, integration, and content setup
   relevant to the task.
3. Read only the matching reference from the router below.
4. For a version-sensitive or unfamiliar API, verify the exact current behavior
   in official Astro docs using the available official docs capability. Read
   `references/doc-endpoints.md` only when that lookup is needed.
5. Make the smallest change that completes the requested outcome and preserves
   the repo's component, styling, and deployment conventions.
6. Run the relevant type/check/build/test commands. For visible behavior, render
   the affected route and exercise the states in scope.

## Reference Router

| Task | Read |
|---|---|
| Project setup, core APIs, file shape, scripts, middleware, Astro 7 upgrade or advanced routing | `references/astro-core-patterns.md` |
| Build-time or live content collections, loaders, querying, Zod 4 | `references/content-collections.md` |
| RSS, pagination, tags, SEO, TOC, Shiki, Markdown/MDX customization | `references/blog-recipes.md` |
| Tailwind CSS v4, themes, fonts | `references/tailwind.md` |
| Islands and `client:*` hydration | `references/islands-and-hydration.md` |
| Actions, forms, validation, mutations | `references/actions-and-forms.md` |
| `<ClientRouter />`, lifecycle events, state preservation | `references/view-transitions.md` |
| Prerendering, sessions, env, i18n, CSP, caching, Cloudflare | `references/server-features.md` |
| Official docs search and fallback URLs | `references/doc-endpoints.md` |

Do not preload every reference. If a task crosses two domains, read those two;
the router is not a checklist.

## Compatibility Gate

Check only the rows touched by the task.

| Area | Current baseline |
|---|---|
| Content | `src/content.config.ts`; every collection has a loader; import `z` from `astro/zod`; call standalone `render(entry)` |
| Tailwind | Use the installed Tailwind v4 setup, normally `@tailwindcss/vite` plus `@import "tailwindcss"`; do not reintroduce deprecated `@astrojs/tailwind` |
| Markdown/MDX | Astro 7 defaults to Sätteri; use `markdown.processor` and choose Sätteri or unified based on the project's plugin requirements |
| Hydration | `client:load` for immediately interactive UI; `client:idle` or `client:visible` for deferred islands; do not hydrate static markup |
| Mutations | Prefer typed Actions for app forms; pages that need cookies, sessions, Actions, POST handling, or per-request data must render on demand |
| Environment | Prefer schema-backed `astro:env` in app code; distinguish build-time `import.meta.env` from documented runtime/config-time exceptions |
| ClientRouter | Initialize with `astro:page-load`, use delegation for swapped elements, and set pre-paint state in `astro:before-swap` |
| Astro 7 | Node 22.12+, Vite 8, ESM config; strict HTML parsing; JSX whitespace default; reserved `src/fetch.ts`; top-level cache and route rules |

Removed patterns such as `Astro.glob()`, `entry.render()`, legacy collection
locations/types, `output: 'hybrid'`, CJS config, and `<ViewTransitions />` should
not be copied into new code. Use `references/astro-core-patterns.md` for the
complete mapping when a migration touches them.

## Implementation Workflow

### 1. Bound the change

State the requested behavior and the files likely to own it. Preserve public
routes, content IDs, adapter behavior, and design-system conventions unless the
request explicitly changes them. Do not add integrations, client frameworks, or
new abstractions merely because Astro supports them.

### 2. Inspect before choosing an API

- Check package-manager scripts and installed package versions.
- Check whether the route is prerendered or on demand.
- Check the adapter/runtime before using Node APIs or server features.
- Check existing content loaders, Actions, middleware, and style entry points.
- Search the repo for an established solution before introducing another one.

### 3. Implement at the right boundary

Keep route files focused on routing, data loading, and assembly. Reuse existing
layouts/components/helpers. Split a file only when the requested change would
otherwise mix responsibilities or make verification harder; do not turn a small
fix into a repo-wide reorganization.

Choose server-rendered Astro markup by default. Add a client island only when the
browser needs state or immediate interaction, and choose the least eager
directive that still preserves the intended interaction.

### 4. Verify behavior

Use the project's package manager and existing scripts first. In proportion to
the change, verify:

- Astro/type checks and targeted tests
- production build for config, integration, routing, or deployment changes
- the affected route in the target runtime for server behavior
- desktop/mobile rendering and primary interaction for visible UI work
- migration-specific cases such as invalid HTML, inline whitespace, content IDs,
  environment timing, and prerender/on-demand boundaries

Do not claim an upgrade or UI change is complete from static inspection alone.
If the environment cannot run a relevant check, report that exact gap.

## Templates

The files under `templates/` are starting points, not replacements for inspecting
the repo. Copy only the portions compatible with installed integrations and the
deployment target.

## Output Contract

Lead with the completed behavior. Then summarize the scoped files changed and
the checks actually run, including rendered routes or viewports when relevant.
Name any unverified runtime, migration case, or visual state. Add a tutorial only
when the user asks for one.

## Gotchas

- The latest-looking API is not necessarily the installed API. Inspect versions
  before editing and use official docs for exact version-sensitive behavior.
- Static frontmatter runs at build time; per-request logic needs on-demand
  rendering and an appropriate adapter.
- `class` does not automatically pass through Astro components, and scoped styles
  do not automatically reach slotted/Markdown content.
- Processed `<script>` tags are bundled and deduplicated; `define:vars` implies
  inline behavior. Multiple component instances need an instance-safe pattern.
- A passing build does not prove hydration timing, ClientRouter lifecycle, or
  responsive layout. Exercise the behavior that changed.
- Avoid opportunistic migrations, dependency additions, and file splitting
  outside the user's requested outcome.
