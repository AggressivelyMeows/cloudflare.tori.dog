<template>
  <div class="font-mono font-medium text-stone-200 p-12" v-if="error">

    <NuxtLink to="/" class="text-primary-500 mb-6 inline-block text-xl">
      Home
    </NuxtLink>
    
    <img 
      class="mb-3 rounded-lg shadow-lg max-w-full h-[500px] bg-stone-800"
      :src="dog"
    />
    <b class="text-primary-500 block mb-1 text-xl">Error</b>
    <h1 class="text-8xl font-bold">{{ error.statusCode }}</h1>
    <p class="text-3xl">
      {{ error.statusMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps({
  error: Object as () => NuxtError,
})

const dog = ref('')
onMounted(() => {
  fetch('https://dog.ceo/api/breeds/image/random')
    .then(x => x.json())
    .then((data: any) => {
      dog.value = data.message
    })
})

useHead({
  title: props.error ? `${props.error.statusCode} - ${props.error.statusMessage}` : 'Error',
  meta: [
    {
      name: 'twitter:title',
      content: props.error ? `${props.error.statusCode} - ${props.error.statusMessage}` : 'Error'
    },
    {
      property: 'theme-color',
      content: '#b91c1c'
    },
    {
      name: 'twitter:description',
      content: props.error ? `${props.error.statusCode} - ${props.error.statusMessage}` : 'Error'
    }
  ]
})
</script>