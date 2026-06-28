import storybooks from '../../content/storybooks.json'

interface SitemapUrl {
  loc: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

export default defineEventHandler((event) => {
  // Derive the site origin from the request so it works in any environment.
  const host = getRequestHost(event, { xForwardedHost: true })
  const forwardedProto = getRequestHeader(event, 'x-forwarded-proto')
  const isEncrypted = (event.node.req.socket as any)?.encrypted
  const protocol = forwardedProto || (isEncrypted ? 'https' : 'http')
  const siteOrigin = `${protocol}://${host}`

  const urls: SitemapUrl[] = []

  // Home page
  urls.push({
    loc: `${siteOrigin}/`,
    changefreq: 'weekly',
    priority: 1.0
  })

  // Lab pages — sourced from storybooks.json (the source of truth for published content)
  for (const storybook of storybooks) {
    for (const page of storybook.pages) {
      urls.push({
        loc: `${siteOrigin}/labs/${page.path}`,
        changefreq: 'monthly',
        priority: 0.8
      })
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>${
      url.lastmod ? `\n    <lastmod>${url.lastmod}</lastmod>` : ''
    }${
      url.changefreq ? `\n    <changefreq>${url.changefreq}</changefreq>` : ''
    }${
      url.priority !== undefined ? `\n    <priority>${url.priority.toFixed(1)}</priority>` : ''
    }
  </url>`
  )
  .join('\n')}
</urlset>`

  setHeader(event, 'cache-control', 'max-age=3600, s-maxage=86400')

  return send(event, xml, 'application/xml; charset=UTF-8')
})
