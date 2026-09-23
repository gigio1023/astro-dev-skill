# Astro Documentation Endpoints

## Contents

- [Official Astro Docs Search](#primary-official-astro-docs-search)
- [Which Docs for Which Task](#strategy-which-docs-for-which-task)
- [Direct Page URLs](#direct-page-urls)

> **Important**: Astro's AI integration setup may change over time. Before
> relying on an MCP URL or client configuration below, open the live official
> [Build with AI guide](https://docs.astro.build/en/guides/build-with-ai/).
> If it conflicts with this file, trust the live guide.

## Primary: Official Astro Docs Search

As of 2026-07, the official Astro Docs MCP server is a free remote service (no install needed):
- **URL**: `https://mcp.docs.astro.build/mcp`
- **Repo**: `withastro/docs-mcp`
- **Setup guide**: `https://docs.astro.build/en/guides/build-with-ai/`

If the official Astro Docs MCP server is configured in the environment, use its
search capability for the exact topic. Tool names are harness-specific, so use
the fully qualified name exposed by the current environment rather than assuming
an alias from another client.

## Strategy: Which docs for which task

| Task | First check |
|------|-------------|
| **New project setup** | MCP: "install and setup" |
| **Content collections** | MCP: "content collections" |
| **Adding a CMS** | MCP: "[cms name]" |
| **Deployment** | MCP: "[platform] deploy" |
| **Building a blog** | MCP: "blog tutorial" |
| **API route / endpoint** | MCP: "endpoints" |
| **Styling / theming** | MCP: "styling" |
| **Backend integration** | MCP: "[service name]" |
| **SSR / server rendering** | MCP: "on-demand rendering" |

When MCP is unavailable, open the matching page from the direct page URLs below with the environment's web-reading capability. Astro removed its `llms.txt`, `llms-full.txt`, `llms-small.txt`, and `_llms-txt/*.txt` files in April 2026, so do not fall back to them.

## Direct Page URLs

### Routing & Navigation
- Dynamic routes: `https://docs.astro.build/en/guides/routing/`
- Middleware: `https://docs.astro.build/en/guides/middleware/`
- i18n: `https://docs.astro.build/en/guides/internationalization/`
- View transitions: `https://docs.astro.build/en/guides/view-transitions/`

### Server Features
- On-demand rendering: `https://docs.astro.build/en/guides/on-demand-rendering/`
- Server islands: `https://docs.astro.build/en/guides/server-islands/`
- Actions: `https://docs.astro.build/en/guides/actions/`
- Sessions: `https://docs.astro.build/en/guides/sessions/`

### Configuration
- Config reference: `https://docs.astro.build/en/reference/configuration-reference/`
- CLI reference: `https://docs.astro.build/en/reference/cli-reference/`
- Error reference: `https://docs.astro.build/en/reference/error-reference/`

### Migration
- Upgrade to Astro 7: `https://docs.astro.build/en/guides/upgrade-to/v7/`
- Upgrade to Astro 6: `https://docs.astro.build/en/guides/upgrade-to/v6/`
- Upgrade to Astro 5: `https://docs.astro.build/en/guides/upgrade-to/v5/`

### Astro 7 Features
- Markdown processor / Sätteri: `https://docs.astro.build/en/guides/markdown-content/#choosing-a-markdown-processor`
- Route caching: `https://docs.astro.build/en/guides/caching/`
- Advanced routing: `https://docs.astro.build/en/guides/routing/#advanced-routing`
- Fetch routing API: `https://docs.astro.build/en/reference/modules/astro-fetch/`
- Hono routing API: `https://docs.astro.build/en/reference/modules/astro-hono/`
- Background dev server for AI agents: `https://docs.astro.build/en/guides/build-with-ai/#background-mode`

### Astro 6+ Features
- Fonts API: `https://docs.astro.build/en/guides/fonts/`
- Font Provider API: `https://docs.astro.build/en/reference/font-provider-reference/`
- CSP (Content Security Policy): `https://docs.astro.build/en/reference/configuration-reference/#securitycsp`
- Live Content Collections: `https://docs.astro.build/en/guides/content-collections/#live-content-collections`
- Cloudflare adapter: `https://docs.astro.build/en/guides/integrations-guide/cloudflare/`

### Runtime Modules
- `astro:content`: `https://docs.astro.build/en/reference/modules/astro-content/`
- `astro:assets`: `https://docs.astro.build/en/reference/modules/astro-assets/`
- `astro:env`: `https://docs.astro.build/en/reference/modules/astro-env/`
- `astro:transitions`: `https://docs.astro.build/en/reference/modules/astro-transitions/`
- `astro:middleware`: `https://docs.astro.build/en/reference/modules/astro-middleware/`
- `astro/zod` (Zod 4): `https://docs.astro.build/en/reference/modules/astro-zod/`
- `astro/fetch`: `https://docs.astro.build/en/reference/modules/astro-fetch/`
- `astro/hono`: `https://docs.astro.build/en/reference/modules/astro-hono/`
