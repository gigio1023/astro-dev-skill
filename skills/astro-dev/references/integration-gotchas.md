# Integration Gotchas

Pitfalls when combining Astro with third-party libraries. Each was discovered from actual build failures or runtime bugs.

## Plugin Execution Order

Astro integrations (like `astro-expressive-code`) modify the remark/rehype pipeline via `astro:config:setup`. They **prepend** their plugins:

```
After expressiveCode() runs:
  remarkPlugins: [ecRemarkPlugin, ...yourPlugins]
  rehypePlugins: [ecRehypePlugin, ...yourPlugins]
```

Your `markdown.remarkPlugins` run **after** integration plugins. If you need a remark plugin to intercept code blocks before expressive-code processes them, you must create an Astro integration and place it **after** expressive-code in the `integrations` array:

```ts
// your-integration.ts
export function myIntegration(): AstroIntegration {
  return {
    name: 'my-integration',
    hooks: {
      'astro:config:setup': ({ config, updateConfig }) => {
        const existing = [...(config.markdown?.remarkPlugins || [])]
        updateConfig({
          markdown: { remarkPlugins: [myRemarkPlugin, ...existing] },
        })
      },
    },
  }
}

// astro.config.ts — order matters
integrations: [
  expressiveCode({...}),   // prepends its plugins first
  myIntegration(),          // then prepends yours before EC's
  mdx(),
]
```

## Mermaid + Expressive Code

Expressive-code processes ALL code blocks, including ` ```mermaid `. It wraps them in `<figure class="expressive-code"><pre data-language="mermaid">` with line numbers and syntax highlighting. The mermaid source becomes unrecoverable from the DOM.

**Solution**: Intercept mermaid blocks at the remark level before expressive-code sees them.

```ts
// src/plugins/remark-mermaid.ts
import type { AstroIntegration } from 'astro'

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function remarkMermaidPlugin() {
  return (tree: any) => {
    const toReplace: { parent: any; index: number; value: string }[] = []
    ;(function walk(node: any, parent?: any, index?: number) {
      if (node.type === 'code' && node.lang === 'mermaid' && parent && typeof index === 'number') {
        toReplace.push({ parent, index, value: node.value })
      }
      if (node.children) {
        for (let i = node.children.length - 1; i >= 0; i--) {
          walk(node.children[i], node, i)
        }
      }
    })(tree)
    for (const { parent, index, value } of toReplace) {
      parent.children[index] = { type: 'html', value: `<pre class="mermaid">${escapeHtml(value)}</pre>` }
    }
  }
}

export function mermaidIntegration(): AstroIntegration {
  return {
    name: 'mermaid',
    hooks: {
      'astro:config:setup': ({ config, updateConfig }) => {
        const existing = [...(config.markdown?.remarkPlugins || [])]
        updateConfig({ markdown: { remarkPlugins: [remarkMermaidPlugin, ...existing] } })
      },
    },
  }
}
```

Then render client-side:
```astro
<script>
  const blocks = document.querySelectorAll('pre.mermaid')
  if (blocks.length > 0) {
    const cdn = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs'
    const { default: mermaid } = await import(/* @vite-ignore */ cdn)
    mermaid.initialize({ startOnLoad: false, theme: isDark ? 'dark' : 'neutral' })
    // render each block...
  }
</script>
```

Key points:
- HTML-escape the mermaid source (`<br/>` in labels would be parsed as HTML otherwise)
- `textContent` on a `<pre>` automatically unescapes entities back to raw mermaid syntax
- Use `/* @vite-ignore */` for CDN dynamic imports to pass `astro check`

### Mermaid Theme Gotchas

- Built-in themes (`default`, `dark`, `neutral`, `forest`) **cannot** be customized via `themeVariables`. Only `theme: 'base'` accepts custom variables.
- Mermaid v11 renders edge labels as HTML inside `<foreignObject>`, not SVG `<rect>`. CSS `background-color` on `.edgeLabel` and `.labelBkg` controls the background, not SVG `fill`.
- Edge label backgrounds are semi-transparent by default (`rgba(..., 0.5)`). Override by injecting CSS into the SVG's `<style>` tag after rendering.
- `themeVariables` only accepts **hex colors** — not CSS color names or `rgb()`/`hsl()`.

## OG Images: Non-Latin Font Support

`astro-og-canvas` (uses Satori) renders text to PNG. Fonts must include all glyphs needed. Latin-only fonts (like Geist) render Korean/CJK as broken boxes.

```ts
// src/pages/og/[...route].ts
getImageOptions: (_path, page) => ({
  font: {
    title: {
      families: ['Geist Mono', 'Noto Sans KR'],  // fallback for Korean
    },
  },
  fonts: [
    './public/fonts/GeistMonoVF.woff2',
    './public/fonts/NotoSansKR-Regular.ttf',  // must be .ttf, not variable woff2
  ],
})
```

Satori resolves fonts in family order — characters not found in the first font fall through to the next.

## CSS Variables in SVG

`var(--my-color)` in SVG `fill` attributes does not work reliably. SVG elements inside `<style>` tags within the SVG can use CSS custom properties, but inline `fill="var(--x)"` attributes are ignored by most renderers.

When overriding SVG colors:
- Modify the SVG's embedded `<style>` tag directly
- Or set inline attributes with explicit hex values via JS after rendering
- Do not rely on CSS custom properties in SVG attributes

## Centralize Configuration

If the same value (like a default language code) appears in multiple components, extract it to a shared constant:

```ts
// src/consts.ts
export const DEFAULT_LANG = 'ko'
```

Scattered magic values across components lead to inconsistent behavior when only some files get updated.
