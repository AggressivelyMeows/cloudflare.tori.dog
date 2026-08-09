export default defineEventHandler(async (event) => {
  const cloudflare = event.context.cloudflare

  const nodesTotal = 8

  const url = 'https://nyc3.digitaloceanspaces.com/cerulean/screenshots/2026/07/vlc_Clsv7sGCCv.png'

  // Race all of the nodes and get the latency for each one.

  const responses = await Promise.allSettled(
    Array.from({ length: nodesTotal }, async (_, i) => {
      return await cloudflare.env.PROXY.fetch(
          'http://localhost/request',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              url,
              method: 'GET',
              targetNode: i + 1
            })
          }
        ).then(x => {
          return x.headers.get('x-latency') || '0'
        })
    })
  )

  return responses.map((response, i) => {
    if (response.status === 'fulfilled') {
      return {
        node: i + 1,
        latency: parseFloat(response.value)
      }
    } else {
      console.error(`Error fetching from node ${i + 1}:`, response.reason)
      return {
        node: i + 1,
        latency: null,
        error: response.reason
      }
    }
  })
})
