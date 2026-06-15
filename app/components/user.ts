import { ref, watch } from 'vue'
import { useStorage } from '@vueuse/core'

type ToriiUser = {
  id: string
  email: string
}

export const activeUser = ref<ToriiUser | null>(null)
export const logout = () => authorizationToken.value = ''
export const redirectURL = `https://id.tori.dog/authorize?redirect=https://tori.dog/torii`

export const authorizationToken = useStorage<string>('authorizationToken', '')

watch(
  authorizationToken,
  (newToken) => {
    if (newToken) {
      console.log(
        `[AUTH] Auth token changed, getting user...`
      )

      fetch(`https://id.tori.dog/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${newToken}`
        }
      }).then(x => x.json()).then((data: any) => {
        activeUser.value = data.user

        console.log(
          `[AUTH] Hello, ${activeUser?.value?.email}!`
        )
      })
    } else {
      activeUser.value = null
    }
  },
  { immediate: true }
)

export const authHeaders = computed(() => {
  if (!authorizationToken.value) return {}

  return {
    'Authorization': `Bearer ${authorizationToken.value}`,
    'X-Client': 'tori-web'
  }
}) as ComputedRef<Record<string, string>>