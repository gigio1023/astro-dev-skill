# View Transitions & ClientRouter

Astro's `<ClientRouter />` turns an MPA into an SPA with smooth page transitions. But it changes how scripts, events, and state work. Most bugs come from treating view-transitioned pages like traditional full-page loads.

## Script Initialization

The #1 bug: scripts that work on first load but break after navigation (or vice versa).

```ts
// WRONG: direct call + astro:after-swap
initFeature()
document.addEventListener('astro:after-swap', initFeature)

// CORRECT: astro:page-load covers BOTH initial load and navigations
document.addEventListener('astro:page-load', initFeature)
```

`astro:page-load` fires after the page is fully visible. It replaces both `DOMContentLoaded` and `astro:after-swap` in a single listener.

## Event Delegation

DOM elements are replaced during view transitions. Directly attached listeners are lost.

```ts
// WRONG: listeners lost after navigation
btn.addEventListener('click', handleClick)

// CORRECT: event delegation survives DOM swaps
document.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('.btn')
  if (btn) handleClick(btn)
})
```

Use event delegation for elements that get replaced. Use direct listeners + `astro:page-load` re-init only for `transition:persist` elements.

## Preserving State (Theme, Locale, etc.)

The new page's `<html>` doesn't have your custom attributes. Set them **before** the swap:

```ts
// WRONG: flash of wrong theme between swap and after-swap
document.addEventListener('astro:after-swap', () => {
  document.documentElement.setAttribute('data-theme', storedTheme)
})

// CORRECT: applied before the new page becomes visible
document.addEventListener('astro:before-swap', (e) => {
  const storedTheme = localStorage.getItem('theme') || 'light'
  e.newDocument.documentElement.setAttribute('data-theme', storedTheme)
})
```

## FOUC (Flash of Unstyled Content)

CSS that controls initial visibility must be in the **global stylesheet**, not in component `<style is:global>`.

```css
/* WRONG: in component <style is:global> — loads AFTER HTML paints */

/* CORRECT: in global.css — available on first paint */
.lang-hidden { display: none !important; }
```

Component `<style is:global>` is extracted and loaded asynchronously. Any CSS that prevents content flash (`display: none`, initial state classes) must be in `global.css`.

## Analytics with ClientRouter

GA's `gtag.js` only tracks the initial page load. SPA navigations are invisible.

```ts
gtag('config', gaId, { send_page_view: false })

document.addEventListener('astro:page-load', () => {
  gtag('event', 'page_view', {
    page_path: window.location.pathname,
    page_title: document.title,
  })
})
```

This applies to any analytics tool that relies on full page loads.

## Same-Page Content Swaps

For smooth DOM changes without navigation (language toggle, tabs), use the View Transition API directly:

```ts
if (document.startViewTransition) {
  document.startViewTransition(() => applyNewState())
} else {
  applyNewState()
}
```

Same crossfade as page transitions. No `opacity`/`setTimeout` hacks needed.

## `transition:persist` Gotchas

Persisted elements keep their DOM and event listeners across navigations:
- Scripts may double-bind if re-initialized on every `astro:page-load` — use event delegation instead
- Non-persisted children inside a persisted parent ARE still replaced
