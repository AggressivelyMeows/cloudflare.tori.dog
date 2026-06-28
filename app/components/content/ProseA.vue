<template>
  <NuxtLink
    :to="href"
    :target="target"
    class="tori-link"
  >
    <slot/>
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps({
  href: {
    type: String,
    required: true
  },
  target: {
    type: String,
    default: undefined
  }
})
</script>