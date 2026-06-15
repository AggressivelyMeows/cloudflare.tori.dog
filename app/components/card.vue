<template>
  <div class="border-2 border-stone-900 rounded-lg p-3 font-medium mb-6">
    <p class="text-primary-500 text-sm" v-if="label">{{ label }}</p>
    <h1 :class="`mb-3 ${titleClass}`">
      {{ title }}
    </h1>
    <div class="text-stone-400 text-sm">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  label: {
    type: String,
    required: false,
    default: ''
  },
  title: {
    type: String,
    required: true
  },
  titleClass: {
    type: String,
    required: false,
    default: 'text-3xl font-bold'
  }
})

defineOptions({
  name: 'ToriCard'
})
</script>