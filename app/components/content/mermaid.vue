<template>
  <div class="mermaid" v-if="show">
    <slot mdc-unwrap="p,code,pre,code"></slot>
  </div>
</template>

<script setup>
let show = ref(false)

const { $mermaid, $mermaidConfig } = useNuxtApp()

onMounted(async () => {
  show.value = true
  $mermaid().initialize($mermaidConfig)
  await nextTick()
  $mermaid().run()
})
</script>