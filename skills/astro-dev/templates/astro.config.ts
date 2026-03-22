import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@astrojs/mdx'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://example.com',
  integrations: [mdx(), react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
})
