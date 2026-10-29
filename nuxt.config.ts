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
    '@vite-pwa/nuxt', // 'nuxt-easy-lightbox',
    '@regle/nuxt',
    '@nuxtjs/cloudinary',
    '@vercel/speed-insights',
    '@nuxt/image',
    '@comark/nuxt',
    '@nuxtjs/google-fonts',
  ],
  image: {
    dir: '~~/content', // src paths are now relative to content/
  },
  nitro: {
    serverAssets: [
      { baseName: 'comark', dir: fileURLToPath(new URL('./.content', import.meta.url)) },
    ],
    publicAssets: [
      {
        dir: fileURLToPath(new URL('./content', import.meta.url)),
        baseURL: '/media',
        maxAge: 60 * 60 * 24,
      },
    ],
  },
  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        '@internationalized/date',
        'reka-ui',
        'elkjs',
        'elkjs/lib/elk.bundled.js',
      ],
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
  googleFonts: {
    families: {
      Inter: '100..900',
      'Space Grotesk': '300..700',
    },
    display: 'swap',
    download: true, // self-host the font files at build time
    preload: true,
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
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'theme-color', content: '#9d2f63' },
      ],
      script: [
        {
          innerHTML: `(function(){var c=document.cookie.match(/theme-preference=([^;]+)/);var p=c?c[1]:'system';var d=p==='dark'||(p==='system'&&window.matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.toggle('dark',d)})()`,
          type: 'text/javascript',
          tagPosition: 'head',
          tagPriority: 'critical',
        },
      ],
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
      enabled: false,
      type: 'module',
      suppressWarnings: true,
    },
  },
})