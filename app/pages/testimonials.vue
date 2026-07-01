<template>
  <div class="font-medium z-10 mt-6">
    <h1 class="text-4xl font-bold text-primary-500 mb-6">
      Testimonials from the community
    </h1>

    <div>

      <div class="mb-6">
        <textarea class="tori-card ring-none outline-none w-full" placeholder="How has this site helped you?" v-model="newComment"></textarea>
        <div class="flex flex-row items-center mt-3">
          <input class="tori-card w-full ring-none outline-none text-xs mr-3" placeholder="Your name" v-model="author"/>
          <a class="bg-primary-500 px-3 py-1.5 cursor-pointer rounded-lg inline-block flex-shrink-0 flex flex-row" @click="submitComment">
            <svg v-if="loading" class="mr-3 -ml-1 size-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Submit comment
          </a>
        </div>
      </div>

      <div>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div
            v-for="comment in comments"
            :key="comment.Comment"
            class="tori-card p-3 flex-shrink-0 flex flex-col"
          >
            <p class="text-sm text-stone-300">
              {{ comment.Comment }}
            </p>

            <div class="flex-grow"></div>

            <p class="text-xs text-stone-500 mt-2">
              - {{ comment.Author }}
            </p>
          </div>
        </div>
      </div>
    </div>
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

const newComment = ref<string>('')
const author = ref<string>('')
const loading = ref<boolean>(false)

type Comment = {
  Comment: string,
  Author: string
}

const comments = ref<Comment[]>([])

const loadComments = async () => {
  const response = await fetch(`https://horseman.ceru.dev/v1/models/workers-comments/objects?key=-WWzvQ7K-7e1`).then(x => x.json()) as { results: Comment[] }
  comments.value = response.results
}

const submitComment = async () => {
  if (!newComment.value || !author.value || loading.value) return

  loading.value = true

  const response = await fetch(`/api/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      comment: newComment.value,
      author: author.value
    })
  })

  loading.value = false

  if (!response.ok) {
    const result = await response.json() as { message: string }
    alert(`Failed to submit comment: ${result.message}`)
    return
  }

  newComment.value = ''
  author.value = ''

  // Reload comments after successful submission
  await loadComments()
}

onMounted(loadComments)
</script>