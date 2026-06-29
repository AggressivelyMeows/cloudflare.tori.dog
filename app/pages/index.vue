<template>
  <div class="font-medium z-10">
    <h1
      class="text-5xl items-self-center md:text-[5rem] lg:text-[8rem] font-bold bg-clip-text text-transparent bg-cover bg-center tracking-tighter leading-[0.9]"
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

            <div class="flex flex-row items-center mt-3 text-xs">
              Difficulty:
              <div class="flex flex-row items-center text-primary-500 ml-1">
                <!-- Solid star -->
                <svg v-for="n in post.complexity" :key="n" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4">
                  <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
                </svg>

                <!-- Outline star -->
                <svg v-for="n in 5 - post.complexity" :key="n" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                </svg>

              </div>
            </div>
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