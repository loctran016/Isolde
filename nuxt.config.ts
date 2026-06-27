// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: [
    "@unocss/nuxt",
    "@formkit/auto-animate",
    "@vueuse/nuxt",
    "motion-v/nuxt",
    "@vee-validate/nuxt",
    "@nuxt/image",
    "@nuxtjs/supabase",
  ],
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
    },
  },
  app: {
    pageTransition: { name: "page", mode: "out-in" },
  },
  supabase: {
    useSsrCookies: true // This should be true for SSR support
  }
});
