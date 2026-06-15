<template>
  <div v-if="post" class="mt-6">
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
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const activeStorybook = inject('activeStorybook') as Ref<string>
const activePage = inject('activePage') as Ref<string>
const post = ref<any>(null)

const route = useRoute()

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

  console.log(data)

  post.value = data.data.value

  activeStorybook.value = post.value?.meta?.storybook || ''
  activePage.value = slug.value
}

watch(
  () => route.params.slug,
  (newSlug) => {
    init()
  },
  { immediate: true }
)

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
</script>