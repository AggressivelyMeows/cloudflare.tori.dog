<template>
  <div>
    <div v-if="post && !loading" class="mt-6">
      <div>
        <div v-if="post.meta.category == 'Workers'" class="inline-flex flex-row justify-center rounded-lg py-1.5 px-3 items-center text-stone-200 font-bold text-base mb-1 bg-primary-500/40">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 mr-2 text-primary-500">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
          </svg>

          Workers
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
          Warning
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
import { useRoute, useRouter } from 'vue-router'
import Info from '~/components/content/info.vue'
import Warning from '~/components/content/warning.vue'

const activeStorybook = inject('activeStorybook') as Ref<string>
const activePage = inject('activePage') as Ref<string>
const showGlossary = ref(false)
const glossary = ref<any>(null)
const post = ref<any>(null)
const loading = ref(true)

const route = useRoute()
const router = useRouter()

const slug = computed(() => {
  const slugParam = route.params.slug
  if (Array.isArray(slugParam)) {
    return slugParam.join('/')
  }
  return slugParam || ''
})

const init = async () => {
  const data = await useAsyncData(
    `labs-${slug.value}`, () => queryCollection('content')
      .path(`/${slug.value}`)
      .first()
  )

  post.value = data.data.value

  activeStorybook.value = post.value?.meta?.storybook || ''
  activePage.value = slug.value
  loading.value = false
}

watch(
  () => route.params.slug,
  (newSlug) => {
    init()
  },
  { immediate: true }
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
          glossary.value = result

          document.body.style.overflow = 'hidden' // Prevent background scrolling when glossary is open
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
  document.body.style.overflow = '' // Restore scrolling
}

onKeyStroke('Escape', () => {
  closeGlossary()
})

onUnmounted(() => {
  activeStorybook.value = ''
  activePage.value = ''
})

useHead({
  title: post.value ? `${post.value.title} - Workers Labs` : 'Workers Labs',
  meta: [
    {
      name: 'description',
      content: post.value ? post.value.description : 'Labs, tutorials, and more to help you build cool stuff on Cloudflare.'
    },
    {
      name: 'twitter:image',
      content: `https://tori.dog/api/rendering/open-graph?image=https://images.unsplash.com/photo-1654198340681-a2e0fc449f1b?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&text=${encodeURIComponent(post.value ? post.value.title : 'Workers Labs')}`
    }
  ]
})

await init()
</script>