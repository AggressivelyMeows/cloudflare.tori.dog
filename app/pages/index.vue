<template>
  <div class="font-medium z-10">
    <h1
      class="text-6xl items-self-center md:text-[6rem] lg:text-[8rem] font-bold bg-clip-text text-transparent bg-cover bg-center tracking-tighter leading-[0.9]"
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

    <h4 class="text-4xl text-primary-500 font-bold mt-12 mb-3">
      Workers
    </h4>

    <p class="text-stone-300 text-sm">
      The core of Cloudflare's serverless platform, Workers allow you to run JavaScript, Python, and more at the edge.
      With a global network of data centers, Workers provide low latency and high performance for your applications.
    </p>

    <div class="space-y-3 grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <div class="tori-card h-full" v-for="post in storybooks.filter(x => x.category === 'workers')" :key="post.storybook">
        <NuxtLink :to="`/labs/${post?.pages?.[0]?.path}`" class="text-primary-500 mb-1 text-2xl h-full flex flex-col">
          <div class="flex items-center justify-center bg-primary-500/40 rounded-lg w-12 h-12 text-primary-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-8">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
          </div>

          <h2 class="text-xl font-bold mt-3">
            {{ post.title }}
          </h2>

          <div class="flex-grow"></div>

          <p class="text-stone-500 mt-1 text-sm">
            {{ post.description }}
          </p>
        </NuxtLink>
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
import storybooks from '../../content/storybooks.json'

const titleImageSrc = ref('/frame0.webp')

onMounted(() => {
  const animatedTitleImage = new Image()
  animatedTitleImage.src = '/constellations-bg.avif'

  animatedTitleImage.onload = () => {
    titleImageSrc.value = '/constellations-bg.avif'
  }
})
</script>