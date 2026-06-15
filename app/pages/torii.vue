<template>
  <div class="text-stone-200 py-12 max-w-3xl mx-auto text-lg font-bold">
    Please wait...
  </div>
</template>

<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import { useStorage } from '@vueuse/core'

const route = useRoute()
const router = useRouter()

if (process.client) {
  const token = route.query.token as string | undefined
  const authorizationToken = useStorage('authorizationToken', '')

  authorizationToken.value = token || ''

  console.log(
    `[AUTH] Authorization token set to: ${authorizationToken.value}`
  )

  router.replace({ path: '/', query: {} })
}
</script>