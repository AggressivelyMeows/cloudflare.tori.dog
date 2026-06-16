<template>
  <div class="font-[400] relative text-stone-200 min-h-screen" :style="theming.labs" >

    <ClientOnly>
      <DotGrid
        :glow-radius="145"
        :enabled="enableGlowGrid"
      />
    </ClientOnly>

    <div class="hidden">
      <div class="bg-red-500 text-red-500"></div>
      <div class="bg-orange-500 text-orange-500"></div>
      <div class="bg-amber-500 text-amber-500"></div>
      <div class="bg-yellow-500 text-yellow-500"></div>
      <div class="bg-lime-500 text-lime-500"></div>
      <div class="bg-green-500 text-green-500"></div>
      <div class="bg-emerald-500 text-emerald-500"></div>
      <div class="bg-teal-500 text-teal-500"></div>
      <div class="bg-cyan-500 text-cyan-500"></div>
      <div class="bg-sky-500 text-sky-500"></div>
      <div class="bg-blue-500 text-blue-500"></div>
      <div class="bg-sky-500 text-sky-500"></div>
      <div class="bg-violet-500 text-violet-500"></div>
      <div class="bg-purple-500 text-purple-500"></div>
      <div class="bg-fuchsia-500 text-fuchsia-500"></div>
      <div class="bg-pink-500 text-pink-500"></div>
      <div class="bg-rose-500 text-rose-500"></div>
    </div>

    <div id="audio-effect" class="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary-600/40 via-primary-600/20 to-transparent animate-gradient-x z-[0] pointer-none" style="opacity:0;pointer-events:none;transition:opacity 0.25s ease-out"></div>

    <div id="visual" class="fixed z-10 bottom-0 left-0 w-full h-[10rem] w-full pointer-none" style="pointer-events:none;"></div>

    <div :class="`grid ${ hideSidebar ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3' } font-mono max-w-4xl mx-auto z-10 relative`"  style="isolation: isolate;">
      <div class="col-span-2 p-3">
        <!-- Main content -->
        <div class="tori-card space-x-3 font-medium flex flex-row" v-if="!isHome && !isAmaRoute">
          <NuxtLink to="/" class="text-primary-500 hover:underline flex flex-row items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 mr-1">
              <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            
            Home
          </NuxtLink>
          
          <div class="flex-grow"></div>

          <div v-if="pageRequestsFullSize"> 
            <a class="text-primary-500 cursor-pointer" @click="toggleSidebar">
              <svg v-if="!hideSidebar" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
              </svg>
            </a>
          </div>
        </div>

        <NuxtPage />
      </div>
      <div class="col-span-1 z-10 relative" v-if="!hideSidebar">
        <div class="tori-card m-3 p-3">
          <a href="https://avatar.tori.dog" target="_blank" rel="noopener">
            <img
              src="https://nyc3.digitaloceanspaces.com/cerulean/screenshots/2025/10/aunn.png"
              class="mb-2 rounded-sm overflow-hidden"
            />
          </a>

          <h1 class="text-4xl font-bold text-primary-500">
            Labs.
          </h1>

          <p class="text-xs text-stone-500 font-medium mb-1 tracking-wide">
            <a class="" href="https://twitter.com/toriannadog" target="_blank" rel="noopener">
              @toriannadog
            </a>
          </p>

          <p class="text-stone-200 font-[600] text-sm mt-1.5">
            Labs, tutorials, and more to help you build cool stuff on Cloudflare.
          </p>
        </div>

        <div class="tori-card mt-6 m-3 p-3 flex flex-col" v-if="storybook && (storybook?.pages || []).length > 0">
          <b class="text-primary-500 mb-3 text-sm">
            {{ storybook.title }}
          </b>
          
          <NuxtLink
            class="text-xs flex flex-row items-center font-medium"
            v-for="book in storybook.pages"
            :key="book"
            :to="`/labs/${book.path}`"
          >
            <div
              class="ml-1 mr-2 h-6 w-[3px]"
              :class="{
                'bg-primary-500': activePage === book.path,
                'bg-stone-800': activePage !== book.path
              }"
            ></div>

            {{ book.title }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { writeAnalytics, getAnalytics } from '~/utils/analytics'
import storybooks from '../content/storybooks.json'
import type { Storybook } from '../content/storybooks.d.ts'

const route = useRoute()
const isHome = ref(route.path === '/')
const isAmaRoute = ref(route.path.startsWith('/ama'))
const routeToTheme = ref('')
const enableGlowGrid = ref(true)
const activeStorybook = ref('')
const activePage = ref('')
const storybook = ref<Storybook | null>(null)

provide('activeStorybook', activeStorybook)
provide('activePage', activePage)

watch(
  activeStorybook,
  (newStorybook) => {
    const found = storybooks.find((s) => s.storybook === newStorybook)

    console.log(`[STORYBOOK] Active storybook changed to: ${newStorybook}`, found)

    if (found) {
      storybook.value = found 
    } else {
      storybook.value = null
    }
  },
  { immediate: true }
)

const pageRequestsFullSize = ref(false) // Pages can set this to true to indicate they wish to use the full size of the page. If true, we offer a button to hide the sidebar.
const hideSidebar = ref(false)

provide('pageRequestsFullSize', pageRequestsFullSize)

watch(pageRequestsFullSize, () => {
  // If this gets set to false, show the sidebar again
  if (!pageRequestsFullSize.value) {
    hideSidebar.value = false
  }
})

onMounted(() => {
  // Disable the glow grid on mobile devices for performance reasons
  if (window.innerWidth < 768) {
    enableGlowGrid.value = false
  }
})

const toggleSidebar = () => {
  hideSidebar.value = !hideSidebar.value
}

watch(() => route.path, (newPath) => {
  isHome.value = newPath === '/'

  routeToTheme.value = {
    '': '', // Default.
    'music': 'music',
    'toys': 'toys'
  }[
    // @ts-expect-error - TS doesnt like this because newPath can be undefined, but it wont be.
    newPath?.split('/')[1]
  ] || ''
}, { immediate: true })

const theming = {
  labs: {
    '--ui-primary': 'var(--color-orange-500)',
    '--ui-color-primary-50': 'var(--color-orange-50)',
    '--ui-color-primary-100': 'var(--color-orange-100)',
    '--ui-color-primary-200': 'var(--color-orange-200)',
    '--ui-color-primary-300': 'var(--color-orange-300)',
    '--ui-color-primary-400': 'var(--color-orange-400)',
    '--ui-color-primary-500': 'var(--color-orange-500)',
    '--ui-color-primary-600': 'var(--color-orange-600)',
    '--ui-color-primary-700': 'var(--color-orange-700)',
    '--ui-color-primary-800': 'var(--color-orange-800)',
    '--ui-color-primary-900': 'var(--color-orange-900)',
    '--ui-color-primary-950': 'var(--color-orange-950)',
  },
} as Record<string, Record<string, string>>

useHead({
  title: 'Workers Labs',
  // Set the favicon
  link: [
    {
      rel: 'icon',
      type: 'image/png',
      href: '/favicon.png'
    }
  ],
  meta: [
    {
      name: 'description',
      content: 'Workers Labs ~ A collection of tutorials, guides, and projects to help you build cool stuff on Cloudflare. By @toriannadog.'
    },
    {
      name: 'theme-color',
      content: '#ff6900'
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image'
    },
    {
      name: 'twitter:image',
      content: 'https://images.unsplash.com/photo-1560837616-fee1f3d8753a?q=80&w=774&h=400&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
      name: 'twitter:creator',
      content: '@toriannadog'
    },
    {
      // Google tags for SEO
      name: 'keywords',
      content: 'Cloudflare, Workers, Tutorials, Serverless, Edge Computing, JavaScript, Python, API, Form Handling, Redirects, Personalization, Static Sites'
    },
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1.0'
    },
  ]
})

watch(
  () => route.path,
  async (newPath) => {
    if (import.meta.client) {
      writeAnalytics(
        'page.view',
        route.path,
        {
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          isMobile: /Mobi|Android/i.test(navigator.userAgent)
        }
      )
    }
  },
  { immediate: true }
)
</script>