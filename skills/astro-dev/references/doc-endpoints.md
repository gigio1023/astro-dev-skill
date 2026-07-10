# Astro Documentation Endpoints

## Contents

- [Official Astro Docs Search](#primary-official-astro-docs-search)
- [LLM-Optimized Documentation URLs](#llm-optimized-documentation-urls)
- [Which Docs for Which Task](#strategy-which-docs-for-which-task)
- [Direct Page URLs](#direct-page-urls-for-topics-not-in-llm-docs)

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

## LLM-Optimized Documentation URLs

Astro provides machine-readable documentation. Open these URLs with the
environment's web-reading capability when MCP is unavailable or comprehensive
coverage is needed.

### Full Documentation
| URL | Content | When to use |
|-----|---------|-------------|
| `https://docs.astro.build/llms-full.txt` | Complete Astro docs | Foundation, concepts, full reference |
| `https://docs.astro.build/llms-small.txt` | Abridged quick reference | Quick lookups, overview |

### Topic-Specific
| URL | Content |
|-----|---------|
| `https://docs.astro.build/_llms-txt/api-reference.txt` | Complete API reference |
| `https://docs.astro.build/_llms-txt/how-to-recipes.txt` | Practical recipes & patterns |
| `https://docs.astro.build/_llms-txt/cms-guides.txt` | CMS integrations (40+ systems) |
| `https://docs.astro.build/_llms-txt/backend-services.txt` | Backend: Supabase, Firebase, etc. |
| `https://docs.astro.build/_llms-txt/build-a-blog-tutorial.txt` | Complete blog tutorial |
| `https://docs.astro.build/_llms-txt/deployment-guides.txt` | Deployment platforms (30+) |
| `https://docs.astro.build/_llms-txt/additional-guides.txt` | Advanced topics |

## Strategy: Which docs for which task

| Task | First check | Then |
|------|-------------|------|
| **New project setup** | MCP: "install and setup" | `llms-full.txt` |
| **Content collections** | MCP: "content collections" | `api-reference.txt` |
| **Adding a CMS** | MCP: "[cms name]" | `cms-guides.txt` |
| **Deployment** | MCP: "[platform] deploy" | `deployment-guides.txt` |
| **Building a blog** | MCP: "blog tutorial" | `build-a-blog-tutorial.txt` |
| **API route / endpoint** | MCP: "endpoints" | `api-reference.txt` |
| **Styling / theming** | MCP: "styling" | `how-to-recipes.txt` |
| **Backend integration** | MCP: "[service name]" | `backend-services.txt` |
| **SSR / server rendering** | MCP: "on-demand rendering" | `api-reference.txt` |

## Direct Page URLs (for topics not in LLM docs)

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
