import { defineContentConfig, defineCollection } from '@nuxt/content'
import { z } from 'zod'

export default defineContentConfig({
  
  collections: {
    content: defineCollection({
      type: 'page',
      source: '**/*.md'
    }),
    music: defineCollection({
      type: 'page',
      source: 'music/**/*.md'
    }),
    releases: defineCollection({
      type: 'data',
      schema: z.array(
        z.object({
          slug: z.string(),
          title: z.string(),
          cover: z.string().url(),
          tracks: z.array(z.string()),
          order: z.number().optional()
        })
      ),
      source: 'music/releases.json'
    })
  }
})