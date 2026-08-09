// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  runtimeConfig: {
    horsemanKey: '',
    openrouterKey: '',
    public: {
      githubRepo: 'https://github.com/AggressivelyMeows/cloudflare.tori.dog'
    }
  },

  nitro: {
    preset: "cloudflare_module",

    cloudflare: {
      deployConfig: true,
      nodeCompat: true
    },

    prerender: {
      crawlLinks: true
    }
  },

  modules: [
    "nitro-cloudflare-dev",
    '@nuxt/ui',
    '@nuxt/fonts',
    '@nuxt/content'
  ],
  css: ['~/main.css'],
  routeRules: {
    '/': { prerender: true },
    // Prerender everything under /labs so that the sitemap.xml route can be generated correctly.
    '/labs/**': { prerender: true },
  },

  content: {
    build: {
      markdown: {
        highlight: {
          theme: 'github-dark',
          langs: ['javascript', 'typescript']
        }
      }
    }
  }
})