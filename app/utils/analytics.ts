import { activeUser } from '~/components/user'

type AnalyticsResponse = {
  success: boolean
  data: Array<any>
  metadata: Record<string, any>
}

export const writeAnalytics = (type: string, source: string, metadata: Record<string, any>) => {
  return
  // Only run this on the client.
  if (import.meta.client) {
    console.debug(
      `[Analytics] Event: ${type}`,
      {
        source,
        ...metadata
      }
    )

    const user = activeUser.value

    return $fetch('/api/data', {
      method: 'POST',
      body: {
        source,
        type,
        metadata: {
          ...metadata,
          user: user ? user.id : 'anonymous',
          deviceScreenHeight: window.screen.height,
          deviceScreenWidth: window.screen.width,
          devicePixelRatio: window.devicePixelRatio,
          // Track other items we might need to segment by later.
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      }
    })
  }
}

export const getAnalytics = async (type: string, filters: Record<string, any>): Promise<AnalyticsResponse> => {
  if (import.meta.client) {
    const params = new URLSearchParams({ type })

    for (const key in filters) {
      params.append(key, filters[key])
    }

    const { data, error, metadata } = await $fetch('/api/data?' + params.toString(), {
      method: 'GET'
    }) as any

    if (error) {
      throw new Error(`Failed to fetch analytics data: ${error.statusMessage}`)
    }

    return {
      success: true,
      data,
      metadata
    } as {
      success: true
      data: Array<any>
      metadata: Record<string, any>
    }
  }

  return {
    success: false,
    data: [],
    metadata: {}
  }
}

export const getTotals = async (type: string, filters: Record<string, any>): Promise<number> => {
  const params = new URLSearchParams({ type })

  for (const key in filters) {
    params.append(key, filters[key])
  }

  params.append('onlyTotals', '1')

  const { metadata } = await $fetch('/api/data?' + params.toString(), {
    method: 'GET'
  }) as any

  console.log(metadata)

  return metadata?.totalAllTime || 0
}

if (import.meta.client) {
  // @ts-expect-error - Dont worry about window type errors.
  window.analytics = {
    writeAnalytics,
    getAnalytics,
    getTotals
  }
}