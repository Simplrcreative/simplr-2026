import fs from 'node:fs/promises'
import path from 'node:path'

const projectRoot = process.cwd()
const publicDir = path.join(projectRoot, 'public')

const staticRoutes = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/work', changefreq: 'weekly', priority: '0.9' },
  { path: '/about', changefreq: 'monthly', priority: '0.7' },
  { path: '/services', changefreq: 'monthly', priority: '0.8' },
  { path: '/thinking', changefreq: 'weekly', priority: '0.9' },
  { path: '/contact', changefreq: 'monthly', priority: '0.7' },
  { path: '/est-2014', changefreq: 'monthly', priority: '0.6' },
]

function normalizeBasePath(value, fallback) {
  const base = String(value || fallback || '').trim()
  if (!base) return fallback
  const withLeadingSlash = base.startsWith('/') ? base : `/${base}`
  return withLeadingSlash.replace(/\/+$/, '')
}

function normalizeTopicSlug(value) {
  const topic = String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return topic || 'news'
}

function uniqueRoutes(routes) {
  const seen = new Set()
  return routes.filter((route) => {
    const key = route.path
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function resolveGraphQlEndpoint(rawEndpoint, env, siteUrl) {
  const endpoint = String(rawEndpoint || '').trim()
  if (!endpoint) return ''

  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint
  }

  const devProxyTarget = String(env.VITE_WP_DEV_PROXY_TARGET || '').trim()
  if (endpoint.startsWith('/') && /^https?:\/\//i.test(devProxyTarget)) {
    return new URL(endpoint, devProxyTarget).toString()
  }

  if (endpoint.startsWith('/')) {
    return new URL(endpoint, siteUrl).toString()
  }

  return endpoint
}

function parseEnvFile(contents) {
  return contents
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .reduce((accumulator, line) => {
      const separatorIndex = line.indexOf('=')
      const key = line.slice(0, separatorIndex).trim()
      const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '')

      accumulator[key] = value
      return accumulator
    }, {})
}

async function loadEnv() {
  const files = ['.env', '.env.local']
  const merged = {}

  for (const file of files) {
    try {
      const contents = await fs.readFile(path.join(projectRoot, file), 'utf8')
      Object.assign(merged, parseEnvFile(contents))
    } catch {
      // Ignore missing env files.
    }
  }

  return { ...merged, ...process.env }
}

async function graphQlRequest(endpoint, query, variables = {}) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    throw new Error(`GraphQL request failed with status ${response.status}.`)
  }

  const payload = await response.json()

  if (payload.errors?.length) {
    throw new Error(payload.errors.map(({ message }) => message).join(' | '))
  }

  return payload.data
}

async function getDynamicRoutes(env) {
  const siteUrl = env.VITE_SITE_URL || 'https://simplr.co.za'
  const endpoint = resolveGraphQlEndpoint(env.VITE_WPGRAPHQL_ENDPOINT, env, siteUrl)

  if (!endpoint) {
    return []
  }

  const workBasePath = normalizeBasePath(env.VITE_WORK_URI_BASE || '/work/', '/work')
  const thinkingBasePath = normalizeBasePath(env.VITE_THINKING_URI_BASE || '/thinking/', '/thinking')

  const query = `
    query SitemapRoutes($workType: ContentTypeEnum!, $first: Int = 100) {
      work: contentNodes(first: 100, where: { contentTypes: [$workType], status: PUBLISH }) {
        nodes {
          slug
        }
      }
      thinking: posts(first: $first, where: { status: PUBLISH }) {
        nodes {
          slug
          topics {
            nodes {
              slug
            }
          }
        }
      }
    }
  `

  try {
    const data = await graphQlRequest(endpoint, query, {
      workType: env.VITE_WORK_CONTENT_TYPE || 'WORK',
      first: 100,
    })

    const workRoutes = (data.work?.nodes || [])
      .map((node) => node?.slug)
      .filter(Boolean)
      .map((slug) => ({
        path: `${workBasePath}/${slug}`,
        changefreq: 'weekly',
        priority: '0.8',
      }))

    const thinkingRoutes = (data.thinking?.nodes || [])
      .map((node) => {
        const slug = node?.slug
        if (!slug) return null
        const topicSlug = normalizeTopicSlug(node?.topics?.nodes?.[0]?.slug)
        return {
          path: `${thinkingBasePath}/${topicSlug}/${slug}`,
          changefreq: 'weekly',
          priority: '0.8',
        }
      })
      .filter(Boolean)

    return uniqueRoutes([...workRoutes, ...thinkingRoutes])
  } catch (error) {
    console.warn('Unable to hydrate dynamic SEO routes from WordPress:', error.message)
    return []
  }
}

function buildSitemap(siteUrl, routes) {
  const urlEntries = routes
    .map((route) => {
      const loc = new URL(route.path || '/', siteUrl).toString()

      return `<url><loc>${loc}</loc><changefreq>${route.changefreq}</changefreq><priority>${route.priority}</priority></url>`
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlEntries}</urlset>`
}

function buildRobots(siteUrl) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', siteUrl).toString()}\n`
}

function buildLlms(siteUrl) {
  return `# ${siteUrl}\n\n- Primary routes: /work, /about, /services, /thinking, /contact, /est-2014\n- Dynamic editorial routes: /work/:slug and /thinking/:topic/:slug\n- Content source: WordPress via WPGraphQL\n- SEO/GEO assets: structured data, canonical URLs, sitemap.xml, robots.txt, llms-full.txt\n`
}

function buildLlmsFull(siteUrl) {
  return `# Simplr\n\nThis website is a headless WordPress front end built with Vite and React.\n\n## Main pages\n- ${new URL('/work', siteUrl).toString()}\n- ${new URL('/about', siteUrl).toString()}\n- ${new URL('/services', siteUrl).toString()}\n- ${new URL('/thinking', siteUrl).toString()}\n- ${new URL('/contact', siteUrl).toString()}\n- ${new URL('/est-2014', siteUrl).toString()}\n\n## Dynamic content\n- Work singles are resolved from /work/:slug\n- Thinking singles are resolved from /thinking/:topic/:slug\n\n## Content model guidance\n- Work should map to a custom post type exposed through WPGraphQL.\n- Thinking should map to posts or another exposed content type.\n- About, Services, Contact, and Est. 2014 should be WordPress pages with matching URIs.\n\n## Technical notes\n- Canonical URLs and Open Graph tags are set per route.\n- JSON-LD is emitted for Organization, WebSite, CollectionPage, WebPage, Article, Service ItemList, and ContactPage where relevant.\n- sitemap.xml and robots.txt are generated at build time.\n`
}

async function main() {
  const env = await loadEnv()
  const siteUrl = env.VITE_SITE_URL || 'https://simplr.co.za'
  const dynamicRoutes = await getDynamicRoutes(env)
  const allRoutes = uniqueRoutes([...staticRoutes, ...dynamicRoutes])

  await fs.mkdir(publicDir, { recursive: true })
  await fs.writeFile(path.join(publicDir, 'sitemap.xml'), buildSitemap(siteUrl, allRoutes), 'utf8')
  await fs.writeFile(path.join(publicDir, 'robots.txt'), buildRobots(siteUrl), 'utf8')
  await fs.writeFile(path.join(publicDir, 'llms.txt'), buildLlms(siteUrl), 'utf8')
  await fs.writeFile(path.join(publicDir, 'llms-full.txt'), buildLlmsFull(siteUrl), 'utf8')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})