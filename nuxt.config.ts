// https://nuxt.com/docs/api/configuration/nuxt-config

import { content } from './server/utils/content'
import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  watch: ['~/uno.config.ts'],
  modules: [
    '@unocss/nuxt',
    '@formkit/auto-animate',
    '@vueuse/nuxt',
    'motion-v/nuxt',
    '@nuxtjs/supabase',
    'nuxt-echarts',
    '@nuxt/eslint',
    '@vite-pwa/nuxt',
    '@regle/nuxt', // 'nuxt-easy-lightbox',
    '@nuxtjs/cloudinary',
    '@vercel/speed-insights',
    '@nuxt/fonts',
    '@nuxt/image',
  ],
  image: {
    dir: '~~/content', // src paths are now relative to content/
  },
  nitro: {
    serverAssets: [
      { baseName: 'comark', dir: fileURLToPath(new URL('./.content', import.meta.url)) },
      ],
      publicAssets: [
     { dir: fileURLToPath(new URL('./content', import.meta.url)), baseURL: '/media', maxAge: 60 * 60 * 24 },    ],
  },
  vite: {
    optimizeDeps: {
      include: ['@vue/devtools-core', '@vue/devtools-kit', '@internationalized/date', 'reka-ui'],
    },

    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('echarts') || id.includes('zrender')) return 'vendor-echarts'
            if (id.includes('exceljs')) return 'vendor-excel'
            if (id.includes('@nuxtjs/cloudinary') || id.includes('cloudinary'))
              return 'vendor-cloudinary'
            if (id.includes('reka-ui')) return 'vendor-reka'
          },
        },
      },
    },
  },
  build: {
    analyze: {
      template: 'raw-data', // was 'json' — invalid
      filename: 'stats.json',
    },
  },
  routeRules: {
    '/manifest.webmanifest': { ssr: false, prerender: false },
    '/dev-sw.js': { ssr: false, prerender: false },
    '/sw.js': { ssr: false, prerender: false },
    // ISR on static content pages – regenerate every 2 minutes
    '/musical': { swr: 300 },
    '/gallery': { swr: 300 },
    '/': { swr: 30 },

    // All other pages remain dynamic SSR (default)
    // '/fitness': { ssr: true },   ← implicit, no rule needed
  },
  runtimeConfig: {
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  fonts: {
    families: [
      { name: 'Inter', provider: 'google' },
      { name: 'Space Grotesk', provider: 'google' },
    ],
  },
  echarts: {
    renderer: 'canvas',
    charts: ['LineChart', 'PieChart', 'HeatmapChart'],
    components: [
      'GridComponent',
      'TooltipComponent',
      'LegendComponent',
      'CalendarComponent',
      'VisualMapComponent',
    ],
  },
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },
    head: {
      script: [
        {
          innerHTML: `(function(){var c=document.cookie.match(/theme-preference=([^;]+)/);var p=c?c[1]:'system';var d=p==='dark'||(p==='system'&&window.matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.toggle('dark',d)})()`,
          type: 'text/javascript',
          tagPosition: 'head',
          tagPriority: 'critical',
        },
      ],
      //   link: [
      //     { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      //     { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
      //   ],
    },
  },
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],
  hooks: {
    'prerender:routes': async (ctx) => {
      const pages = await content.list()
      for (const page of pages) {
        ctx.routes.add(page.path)
      }
    },
  },
  supabase: {
    useSsrCookies: true, // This should be true for SSR support
    redirect: false,
  },
  pwa: {
    registerType: 'prompt',
    injectRegister: null, // disable auto-registration — we'll register manually, deferred
    manifest: {
      name: 'Isolde',
      short_name: 'Isolde',
      theme_color: '#a855f7',
      background_color: '#a855f7',
      //   background_color: '#1c1917',
    },
    pwaAssets: {
      image: 'public/logo.svg',
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      navigateFallback: '/',
      navigateFallbackDenylist: [/^\/api\//], // optional, good practice
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600,
    },
    devOptions: {
      enabled: true,
      type: 'module',
      suppressWarnings: true,
    },
  },
})
