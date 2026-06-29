<template>
  <div class="mb-12">
    <div v-if="post && !loading" class="mt-6">
      <div class="flex flex-wrap items-center justify-between mb-3">
        <div v-if="post.meta.category">
          <ContentTag 
            :tag="post.meta.category"
          />
        </div>

        <div class="flex flex-row items-center space-x-3">
          <NuxtLink v-if="author" :to="`/labs${author.path}`" class="flex flex-row border-2 border-stone-900 bg-stone-950 rounded-lg py-1.5 px-3 items-center text-xs">
            Written by

            <img 
              class="rounded-full w-6 h-6 object-cover mx-1.5"
              :src="author.meta.avatar"
              :alt="author.meta.name"
            />

            <p>
              {{ author.meta.name }}
            </p>
          </NuxtLink>

          <a :href="`${githubRepo}/blob/main/content${post.path}.md`" target="_blank" rel="noopener noreferrer" class="border-2 border-stone-900 p-1.5 bg-stone-950 rounded-lg flex items-center justify-center">
            <svg fill="var(--color-stone-200)" class="size-6" viewBox="0 -0.5 25 25" xmlns="http://www.w3.org/2000/svg"><path d="m12.301 0h.093c2.242 0 4.34.613 6.137 1.68l-.055-.031c1.871 1.094 3.386 2.609 4.449 4.422l.031.058c1.04 1.769 1.654 3.896 1.654 6.166 0 5.406-3.483 10-8.327 11.658l-.087.026c-.063.02-.135.031-.209.031-.162 0-.312-.054-.433-.144l.002.001c-.128-.115-.208-.281-.208-.466 0-.005 0-.01 0-.014v.001q0-.048.008-1.226t.008-2.154c.007-.075.011-.161.011-.249 0-.792-.323-1.508-.844-2.025.618-.061 1.176-.163 1.718-.305l-.076.017c.573-.16 1.073-.373 1.537-.642l-.031.017c.508-.28.938-.636 1.292-1.058l.006-.007c.372-.476.663-1.036.84-1.645l.009-.035c.209-.683.329-1.468.329-2.281 0-.045 0-.091-.001-.136v.007c0-.022.001-.047.001-.072 0-1.248-.482-2.383-1.269-3.23l.003.003c.168-.44.265-.948.265-1.479 0-.649-.145-1.263-.404-1.814l.011.026c-.115-.022-.246-.035-.381-.035-.334 0-.649.078-.929.216l.012-.005c-.568.21-1.054.448-1.512.726l.038-.022-.609.384c-.922-.264-1.981-.416-3.075-.416s-2.153.152-3.157.436l.081-.02q-.256-.176-.681-.433c-.373-.214-.814-.421-1.272-.595l-.066-.022c-.293-.154-.64-.244-1.009-.244-.124 0-.246.01-.364.03l.013-.002c-.248.524-.393 1.139-.393 1.788 0 .531.097 1.04.275 1.509l-.01-.029c-.785.844-1.266 1.979-1.266 3.227 0 .025 0 .051.001.076v-.004c-.001.039-.001.084-.001.13 0 .809.12 1.591.344 2.327l-.015-.057c.189.643.476 1.202.85 1.693l-.009-.013c.354.435.782.793 1.267 1.062l.022.011c.432.252.933.465 1.46.614l.046.011c.466.125 1.024.227 1.595.284l.046.004c-.431.428-.718 1-.784 1.638l-.001.012c-.207.101-.448.183-.699.236l-.021.004c-.256.051-.549.08-.85.08-.022 0-.044 0-.066 0h.003c-.394-.008-.756-.136-1.055-.348l.006.004c-.371-.259-.671-.595-.881-.986l-.007-.015c-.198-.336-.459-.614-.768-.827l-.009-.006c-.225-.169-.49-.301-.776-.38l-.016-.004-.32-.048c-.023-.002-.05-.003-.077-.003-.14 0-.273.028-.394.077l.007-.003q-.128.072-.08.184c.039.086.087.16.145.225l-.001-.001c.061.072.13.135.205.19l.003.002.112.08c.283.148.516.354.693.603l.004.006c.191.237.359.505.494.792l.01.024.16.368c.135.402.38.738.7.981l.005.004c.3.234.662.402 1.057.478l.016.002c.33.064.714.104 1.106.112h.007c.045.002.097.002.15.002.261 0 .517-.021.767-.062l-.027.004.368-.064q0 .609.008 1.418t.008.873v.014c0 .185-.08.351-.208.466h-.001c-.119.089-.268.143-.431.143-.075 0-.147-.011-.214-.032l.005.001c-4.929-1.689-8.409-6.283-8.409-11.69 0-2.268.612-4.393 1.681-6.219l-.032.058c1.094-1.871 2.609-3.386 4.422-4.449l.058-.031c1.739-1.034 3.835-1.645 6.073-1.645h.098-.005zm-7.64 17.666q.048-.112-.112-.192-.16-.048-.208.032-.048.112.112.192.144.096.208-.032zm.497.545q.112-.08-.032-.256-.16-.144-.256-.048-.112.08.032.256.159.157.256.047zm.48.72q.144-.112 0-.304-.128-.208-.272-.096-.144.08 0 .288t.272.112zm.672.673q.128-.128-.064-.304-.192-.192-.32-.048-.144.128.064.304.192.192.32.044zm.913.4q.048-.176-.208-.256-.24-.064-.304.112t.208.24q.24.097.304-.096zm1.009.08q0-.208-.272-.176-.256 0-.256.176 0 .208.272.176.256.001.256-.175zm.929-.16q-.032-.176-.288-.144-.256.048-.224.24t.288.128.225-.224z"/></svg>
          </a>
        </div>
      </div>

      <div class="flex flex-col md:flex-row md:items-center mb-3 text-base text-stone-200" v-if="storybook && false">
        {{ storybook.title }}

        <div class="flex-grow"></div>

        Difficulty:
        <div class="flex flex-row items-center text-primary-500 mt-1 md:mt-0 md:ml-1">
          <!-- Solid star -->
          <svg v-for="n in storybook.complexity" :key="n" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4">
            <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
          </svg>

          <!-- Outline star -->
          <svg v-for="n in 5 - storybook.complexity" :key="n" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
          </svg>

        </div>
      </div>

      <h1 class="text-4xl text-primary-500 font-bold">
        {{ post.title }}
      </h1>

      <ContentRenderer
        class="prose prose-invert mt-3 prose-xl"
        :value="post"
        :components="{
          Info,
          Warning,
          Mermaid
        }"
      />
    </div>

    <div v-else class="mt-12 text-center">
      <h1 class="text-primary-500 text-4xl font-bold mb-6">
        We're sorry
      </h1>
      <p>
        The page you're looking for cannot be found! Maybe you followed a broken link, or mistyped the URL? Please check the URL and try again!
      </p>
    </div>

    <!-- Glossary rendering -->
    <div v-if="showGlossary && glossary" class="fixed top-0 left-0 w-full h-full bg-stone-950/70 backdrop-blur-lg p-3 md:p-12 overflow-auto z-50">
      <div class="max-w-4xl mx-auto">
        <a @click="closeGlossary">
          <div class="flex items-center justify-center rounded-full p-3 text-sm bg-stone-900 font-medium text-stone-200 fixed top-4 right-4 cursor-pointer z-50">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 mr-1">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>

            or press esc
          </div>
        </a>

        <h1 class="text-primary-500 text-6xl font-bold mb-6">
          {{ glossary.title }}
        </h1>

        <ContentRenderer
          class="prose prose-invert mt-3 prose-lg max-w-3xl"
          :value="glossary"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onKeyStroke } from '@vueuse/core'
import { useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router'
import Info from '~/components/content/info.vue'
import Warning from '~/components/content/warning.vue'
import ContentTag from '~/components/content-tag.vue'
import Mermaid from '~/components/content/mermaid.vue'

const activeStorybook = inject('activeStorybook') as Ref<string>
const activePage = inject('activePage') as Ref<string>
const storybook = inject('storybook') as Ref<any>
const showGlossary = ref(false)
const glossary = ref<any>(null)
const loading = ref(false)

const route = useRoute()
const router = useRouter()
const runtimeConfig = useRuntimeConfig()

const githubRepo = runtimeConfig.public.githubRepo

const concatSlug = (slugParams: string[] | string) => {
  if (Array.isArray(slugParams)) {
    return slugParams.join('/')
  }
  return slugParams || '/'
}

const slug = computed(() => {
  const slugParam = route.params.slug
  return concatSlug(slugParam || '')
})

// Single source of truth for the post data.
// `watch: [slug]` re-fetches on client-side navigation between lab pages.
const { data: post } = await useAsyncData<any>(
  `labs-${slug.value}`,
  () => queryCollection('content')
    .path(`/${slug.value}`)
    .first(),
  { watch: [slug] }
)

// Author data, re-fetched whenever the post (and thus the author) changes.
const { data: author } = await useAsyncData<any>(
  `author-${slug.value}`,
  () => {
    const authorName = post.value?.meta?.author
    return authorName
      ? queryCollection('content').path(`/authors/${authorName}`).first()
      : Promise.resolve(null)
  },
  { watch: [post] }
)

// Keep the shared layout state (storybook sidebar) in sync.
watch(post, (newPost) => {
  activeStorybook.value = newPost?.meta?.storybook || ''
  activePage.value = slug.value
  loading.value = false
}, { immediate: true })

watch(
  () => route.params.slug,
  () => {
    const concattedSlug = concatSlug(route.params.slug || '')
    if (concattedSlug !== slug.value) {
      loading.value = true
    }
  }
)

watch(
  () => route.query.glossary,
  (newGlossary) => {
    showGlossary.value = !!newGlossary
    if (showGlossary.value) {
      // Load the glossary content
      queryCollection('content')
        .path(`/glossary/${newGlossary}`)
        .first()
        .then((result) => {
          if (!result) {
            // Remove the glossary entry
            closeGlossary()
            return console.error(`[GLOSSARY] No glossary entry found for: ${newGlossary}`)
          }

          glossary.value = result

          if (import.meta.client) document.body.style.overflow = 'hidden' // Prevent background scrolling when glossary is open
        })
    } else {
      glossary.value = null
    }
  },
  {
    immediate: true
  }
)

const closeGlossary = () => {
  router.replace({ query: { ...route.query, glossary: undefined } })
  if (process.client) document.body.style.overflow = '' // Restore scrolling
}

onKeyStroke('Escape', () => {
  closeGlossary()
})

onBeforeRouteLeave((to, from) => {
  console.debug(`[ROUTER] Leaving route ${from.fullPath} to ${to.fullPath}`)
  if (to.name === from.name && to.query.glossary !== from.query.glossary) {
    return
  }

  if (to.name === from.name && to.params.slug !== from.params.slug) {
    return
  }

  if (showGlossary.value) {
    closeGlossary()
  }

  activeStorybook.value = ''
  activePage.value = ''
})

const siteOrigin = 'https://workers.tori.dog'
const canonicalUrl = computed(() => `${siteOrigin}/labs/${slug.value}`)

const ogImage = computed(() =>
  `https://tori.dog/api/rendering/open-graph?image=https://images.unsplash.com/photo-1654198340681-a2e0fc449f1b?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&text=${encodeURIComponent(post.value?.title || 'Workers Labs')}`
)

const seoTitle = computed(() =>
  post.value?.title ? `${post.value.title} - Workers Labs` : 'Workers Labs'
)

const seoDescription = computed(() =>
  post.value?.description || 'Labs, tutorials, and more to help you build cool stuff on Cloudflare.'
)

useSeoMeta({
  title: () => seoTitle.value,
  description: () => seoDescription.value,
  ogTitle: () => seoTitle.value,
  ogDescription: () => seoDescription.value,
  ogImage: () => ogImage.value,
  ogUrl: () => canonicalUrl.value,
  ogType: 'article',
  ogSiteName: 'Workers Labs',
  twitterCard: 'summary_large_image',
  twitterTitle: () => seoTitle.value,
  twitterDescription: () => seoDescription.value,
  twitterImage: () => ogImage.value
})

useHead({
  link: [{ rel: 'canonical', href: () => canonicalUrl.value }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: () => JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: post.value?.title,
        description: post.value?.description,
        author: author.value
          ? { '@type': 'Person', name: author.value.meta?.name }
          : undefined,
        image: ogImage.value,
        url: canonicalUrl.value,
        publisher: {
          '@type': 'Organization',
          name: 'Workers Labs',
          url: siteOrigin
        }
      })
    }
  ]
})
</script>