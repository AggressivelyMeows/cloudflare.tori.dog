<template>
  <div class="font-medium z-10">
    <h1
      class="text-4xl items-self-center md:text-[5rem] lg:text-[8rem] font-bold bg-clip-text text-transparent bg-cover bg-center tracking-tighter leading-[0.9]"
      :style="`background-color: var(--ui-color-primary-500);background-image: url('${titleImageSrc}');`"
    >
      Workers<br/>Labs. 
    </h1>

    <div class="tori-card mt-6">
      <p class="text-sm text-stone-300">
        <a href="https://www.cloudflare.com/" rel="noopener noreferrer" target="_blank" class="tori-link">Cloudflare</a> offers a powerful set of serverless tools that allow developers to build and deploy applications at the edge of the network.
        <br/><br/>
        Our goal is to provide a comprehensive set of tutorials and resources to help developers get started with Cloudflare's serverless platform, including Workers, Durable Objects, R2, and more!
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 mt-6" v-show="false">
      <div class="border-2 p-3 rounded-lg bg-green-500/50 border-green-500">
        Interviews with the team.
      </div>
    </div>

    <div v-for="category in categories" :key="category.title" class="mt-12">
      <div class="flex flex-row items-center mb-3">
        <div class="flex items-center justify-center bg-primary-500/40 rounded-lg w-12 h-12 text-primary-500 mr-3">
          <ContentTag 
            :tag="category.title"
            icon-only
          />
        </div>

        <h2 class="text-4xl text-primary-500 font-bold">
          {{ category.title }}
        </h2>
      </div>

      <p class="text-stone-300">
        {{ category.description }}
      </p>

      <div class="space-y-3 grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div class="tori-card h-full" v-for="post in storybooks.filter(x => x.category === category.id)" :key="post.storybook">
          <NuxtLink :to="`/labs/${post?.pages?.[0]?.path}`" class="text-primary-500 mb-1 text-2xl h-full flex flex-col">
            <h2 class="text-xl font-bold">
              {{ post.title }}
            </h2>

            <div class="flex-grow"></div>

            <p class="text-stone-500 mt-1 text-sm">
              {{ post.description }}
            </p>
          </NuxtLink>
        </div>
      </div>
    </div>

    <small class="text-xs text-stone-600 mt-3 block">
      No LLMs were used in the making of this website.
    </small>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useStorage } from '@vueuse/core'
import { writeAnalytics, getAnalytics, getTotals } from '~/utils/analytics'
import Card from '~/components/card.vue'
import ContentTag from '~/components/content-tag.vue'
import storybooks from '../../content/storybooks.json'
import categories from '../../content/categories.json'

const titleImageSrc = ref('/frame0.webp')

onMounted(() => {
  const animatedTitleImage = new Image()
  animatedTitleImage.src = '/constellations-bg.avif'

  animatedTitleImage.onload = () => {
    titleImageSrc.value = '/constellations-bg.avif'
  }
})
</script>