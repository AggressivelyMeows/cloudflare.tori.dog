import { OpenRouter } from '@openrouter/sdk'

export default defineEventHandler(async (event) => {
  const body = await readBody(event) as { comment: string, author: string }

  const env = useRuntimeConfig()

  if (!body.comment || !body.author) {
    return createError({
      statusCode: 400,
      statusMessage: 'Comment and author are required'
    })
  }

  // Check if this comment and author are using bad language etc.

  const openRouter = new OpenRouter({ apiKey: env.openrouterKey })

  const prompt = `Check the following comment and author for bad language, spam, or any other inappropriate content. Return a JSON object with the following keys: { allow: boolean, reasonIfRejected: string | null }. Reject a comment if its hostile, offensive, or isnt relevent to Cloudflare Workers or Tori. Comment: "${body.comment}", Author: "${body.author}"`

  const moderationResponse = await openRouter.chat.send({
    chatRequest: {
      model: 'deepseek/deepseek-v4-flash',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    }
  })

  const moderationResult = JSON.parse(moderationResponse.choices[0].message?.content)

  if (!moderationResult.allow) {
    return createError({
      statusCode: 400,
      statusMessage: `Comment rejected: ${moderationResult.reasonIfRejected}`
    })
  }

  const comment = {
    Comment: body.comment,
    Author: body.author
  }

  const url = `https://horseman.ceru.dev/v1/models/workers-comments/objects?key=${env.horsemanKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(comment)
  })

  if (!response.ok) {
    return createError({
      statusCode: 400,
      statusMessage: 'Failed to submit comment'
    })
  }

  return {
    success: true,
    message: 'Comment submitted successfully'
  }
})
