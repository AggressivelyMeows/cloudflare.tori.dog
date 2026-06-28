<template>
  <div class="mb-12 min-h-screen">
  </div>
</template>

<script setup lang="ts">
// TODO: Finish this editor idea.
// I stopped working on it to focus on the content of the site itself

import { ref } from 'vue'
import { useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router'

const loading = ref(true)

const route = useRoute()
const router = useRouter()
const runtimeConfig = useRuntimeConfig()

const githubRepo = runtimeConfig.public.githubRepo

const slug = computed(() => {
  const slugParam = route.params.slug
  if (Array.isArray(slugParam)) {
    return slugParam.join('/')
  }
  return slugParam || ''
})

const root = {
  '/index.ts': `export default {
    async fetch(request: Request) {
      return new Response('Hello World', {
        headers: { 'content-type': 'text/plain' },
      })  
    } 
  }`
} as Record<string, string>

const code = ref(``)

const currentFile = ref('/index.ts')

watch(currentFile, (newFile) => {
  code.value = root[newFile] || ''
})
</script>