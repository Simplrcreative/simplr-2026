import fs from 'node:fs/promises'
import path from 'node:path'
import http from 'node:http'
import { fileURLToPath } from 'node:url'

// Ensure Playwright looks for browsers in the same location where
// `npm run postinstall` installs them (inside node_modules).
process.env.PLAYWRIGHT_BROWSERS_PATH = '0'
const { chromium } = await import('playwright')

const projectRoot = process.cwd()
const distDir = path.join(projectRoot, 'dist')

/* ------------------------------------------------------------------ */
// Minimal env loader (mirrors generate-seo-assets.mjs logic)
/* ------------------------------------------------------------------ */

async function loadEnv() {
  const files = ['.env', '.env.local']
  const merged = {}

  for (const file of files) {
    try {
      const contents = await fs.readFile(path.join(projectRoot, file), 'utf8')
      contents
        .split(/\r?\n/)
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .forEach((line) => {
          const idx = line.indexOf('=')
          const key = line.slice(0, idx).trim()
          const value = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '')
          merged[key] = value
        })
    } catch {
      // ignore missing env files
    }
  }

  return { ...merged, ...process.env }
}

function resolveGraphQlEndpoint(rawEndpoint, env) {
  const endpoint = String(rawEndpoint || '').trim()
  if (!endpoint) return ''
  if (/^https?:\/\//i.test(endpoint)) return endpoint

  const devProxyTarget = String(env.VITE_WP_DEV_PROXY_TARGET || '').trim()
  if (endpoint.startsWith('/') && /^https?:\/\//i.test(devProxyTarget)) {
    return new URL(endpoint, devProxyTarget).toString()
  }

  const siteUrl = env.VITE_SITE_URL || 'https://simplr.co.za'
  if (endpoint.startsWith('/')) {
    return new URL(endpoint, siteUrl).toString()
  }

  return endpoint
}

/* ------------------------------------------------------------------ */
// Parse sitemap.xml for routes to prerender
/* ------------------------------------------------------------------ */

async function parseSitemap(sitemapPath) {
  const xml = await fs.readFile(sitemapPath, 'utf8')
  const matches = xml.matchAll(/<loc>([^<]+)<\/loc>/g)
  return Array.from(matches).map((m) => m[1])
}

/* ------------------------------------------------------------------ */
// Tiny static file server with SPA fallback and /graphql proxy
/* ------------------------------------------------------------------ */

function createServer(rootDir, graphqlEndpoint) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      // CORS headers so the local app feels like same-origin
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

      if (req.method === 'OPTIONS') {
        res.writeHead(204)
        res.end()
        return
      }

      // Proxy GraphQL requests to the real WordPress endpoint
      if (req.url.startsWith('/graphql')) {
        const chunks = []
        for await (const chunk of req) chunks.push(chunk)
        const body = Buffer.concat(chunks)

        async function proxyRequest(attempt = 1) {
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 15000)

            const proxyRes = await fetch(graphqlEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': req.headers['content-type'] || 'application/json',
              },
              body,
              signal: controller.signal,
            })

            clearTimeout(timeoutId)

            const proxyBody = Buffer.from(await proxyRes.arrayBuffer())
            const headers = {}
            proxyRes.headers.forEach((v, k) => {
              // Skip encoding-related headers because fetch() already decompresses the body
              const lower = k.toLowerCase()
              if (lower === 'content-encoding' || lower === 'transfer-encoding' || lower === 'content-length') {
                return
              }
              headers[k] = v
            })

            res.writeHead(proxyRes.status, headers)
            res.end(proxyBody)
          } catch (err) {
            if (attempt === 1 && (err.name === 'AbortError' || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT')) {
              return proxyRequest(attempt + 1)
            }
            console.error(`GraphQL proxy error (attempt ${attempt}):`, err.message)
            res.writeHead(502, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ errors: [{ message: 'GraphQL proxy failed' }] }))
          }
        }

        await proxyRequest()
        return
      }

      // Static file serving
      const requestPath = new URL(req.url, 'http://127.0.0.1').pathname
      let filePath = path.join(rootDir, decodeURIComponent(requestPath))
      if (requestPath.endsWith('/')) {
        filePath = path.join(filePath, 'index.html')
      }

      try {
        let stat = await fs.stat(filePath)
        if (stat.isDirectory()) {
          filePath = path.join(filePath, 'index.html')
          stat = await fs.stat(filePath)
        }

        if (stat.isFile()) {
          const ext = path.extname(filePath)
          const contentType =
            {
              '.html': 'text/html',
              '.js': 'application/javascript',
              '.css': 'text/css',
              '.json': 'application/json',
              '.svg': 'image/svg+xml',
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.webp': 'image/webp',
              '.woff': 'font/woff',
              '.woff2': 'font/woff2',
              '.ttf': 'font/ttf',
            }[ext] || 'application/octet-stream'

          const content = await fs.readFile(filePath)
          res.writeHead(200, { 'Content-Type': contentType })
          res.end(content)
          return
        }
      } catch {
        // fall through to SPA fallback
      }

      // SPA fallback for any unmatched route
      try {
        const html = await fs.readFile(path.join(rootDir, 'index.html'), 'utf8')
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(html)
      } catch {
        res.writeHead(404)
        res.end('Not found')
      }
    })

    server.listen(0, '127.0.0.1', () => resolve(server))
    server.on('error', reject)
  })
}

function normalizeRoutePath(pathname) {
  if (!pathname || pathname === '/') return '/'
  return pathname.endsWith('/') ? pathname : `${pathname}/`
}

function routePathToOutputDir(rootDir, routePath) {
  const segments = routePath.split('/').filter(Boolean)
  return segments.length ? path.join(rootDir, ...segments) : rootDir
}

function toPrerenderUrl(serverUrl, routePath) {
  const normalized = normalizeRoutePath(routePath)
  return normalized === '/' ? `${serverUrl}/` : `${serverUrl}${normalized}`
}

async function launchBrowser() {
  const isVercel = Boolean(process.env.VERCEL)

  function resolveSparticuzBinPath() {
    const entryPath = fileURLToPath(import.meta.resolve('@sparticuz/chromium'))
    return path.join(path.dirname(entryPath), '..', 'bin')
  }

  function getSystemChromePath() {
    const platform = process.platform
    if (platform === 'darwin') {
      return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    }
    if (platform === 'linux') {
      return '/usr/bin/google-chrome'
    }
    if (platform === 'win32') {
      return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    }
    return null
  }

  // @sparticuz/chromium bundles Linux binaries + AL2023 libs for Vercel/Lambda.
  // Do NOT overwrite LD_LIBRARY_PATH — the package sets it to /tmp/al2023/lib on Vercel.
  try {
    console.log('🔍  Trying @sparticuz/chromium...')
    const chromiumMod = await import('@sparticuz/chromium')
    const sparticuz = chromiumMod.default || chromiumMod
    sparticuz.setGraphicsMode = false

    const binPath = resolveSparticuzBinPath()
    console.log(`   binPath: ${binPath}`)

    const executablePath = await sparticuz.executablePath(binPath)
    console.log(`   executablePath: ${executablePath}`)
    console.log(`   LD_LIBRARY_PATH: ${process.env.LD_LIBRARY_PATH || '(unset)'}`)

    const browser = await chromium.launch({
      args: sparticuz.args,
      executablePath,
      headless: true,
    })

    console.log('✅  @sparticuz/chromium launched successfully')
    return { browser, source: '@sparticuz/chromium' }
  } catch (sparticuzErr) {
    console.error('⚠️  @sparticuz/chromium failed:', sparticuzErr.message)
    if (sparticuzErr.stack) {
      console.error(sparticuzErr.stack.split('\n').slice(0, 6).join('\n'))
    }
  }

  if (isVercel) {
    console.error('⚠️  Skipping Playwright/system Chrome on Vercel (bundled browsers need OS libs).')
    return null
  }

  try {
    console.log('🔍  Falling back to standard Playwright chromium...')
    const browser = await chromium.launch()
    console.log('✅  Standard Playwright chromium launched successfully')
    return { browser, source: 'playwright' }
  } catch (err) {
    console.error('⚠️  Standard Playwright chromium failed:', err.message)
  }

  const systemChrome = getSystemChromePath()
  if (systemChrome) {
    try {
      const browser = await chromium.launch({ executablePath: systemChrome })
      console.log(`🧭  Using system Chrome: ${systemChrome}`)
      return { browser, source: 'system' }
    } catch (systemErr) {
      console.error('⚠️  System Chrome failed:', systemErr.message)
    }
  }

  return null
}

function reportPrerenderSkipped(reason) {
  console.error('\n┌────────────────────────────────────────────────────────────┐')
  console.error('│  ❌  PRERENDER FAILED — BUILD CANNOT SHIP SEO HTML         │')
  console.error('│                                                            │')
  console.error('│  No Chromium browser could be launched during postbuild.  │')
  console.error('│  Live bots will only see the empty SPA shell.             │')
  console.error('│                                                            │')
  console.error('│  Fix on Vercel:                                           │')
  console.error('│    • Project Settings → Node.js Version → 22.x            │')
  console.error('│    • Ensure postinstall runs (playwright + sparticuz)     │')
  console.error('└────────────────────────────────────────────────────────────┘\n')
  console.error(`   Details: ${reason}`)
}

async function waitForRenderedPage(page) {
  await page.waitForFunction(() => {
    const root = document.getElementById('root')
    return Boolean(root?.innerHTML?.trim())
  }, { timeout: 20000 })

  await page.waitForFunction(() => {
    const title = document.title.trim()
    return title.length > 0 && title !== 'Simplr'
  }, { timeout: 20000 }).catch(() => undefined)

  await page.waitForTimeout(500)
}

/* ------------------------------------------------------------------ */
// Main
/* ------------------------------------------------------------------ */

async function main() {
  const sitemapPath = path.join(distDir, 'sitemap.xml')

  try {
    await fs.access(sitemapPath)
  } catch {
    console.error('❌  dist/sitemap.xml not found. Run `npm run build` first.')
    process.exit(1)
  }

  const env = await loadEnv()
  const siteUrl = env.VITE_SITE_URL || 'https://simplr.co.za'
  const graphqlEndpoint = resolveGraphQlEndpoint(env.VITE_WPGRAPHQL_ENDPOINT, env)

  const urls = await parseSitemap(sitemapPath)
  const paths = urls.map((url) => new URL(url).pathname)

  if (!paths.includes('/')) {
    paths.unshift('/')
  }

  console.log(`\n📡  Prerendering ${paths.length} routes`)
  console.log(`🌐  Site URL: ${siteUrl}`)
  console.log(`🔗  GraphQL proxy: ${graphqlEndpoint || '(none)'}`)
  console.log('')

  const launched = await launchBrowser()
  if (!launched) {
    reportPrerenderSkipped('All Chromium launch strategies failed.')
    process.exit(1)
  }

  const { browser, source: browserSource } = launched
  if (browserSource === '@sparticuz/chromium') {
    console.log('🚀  Using @sparticuz/chromium\n')
  }

  const server = await createServer(distDir, graphqlEndpoint)
  const serverAddress = server.address()
  const serverUrl = `http://127.0.0.1:${serverAddress.port}`
  console.log(`🖥️   Local server: ${serverUrl}\n`)

  const context = await browser.newContext()
  await context.addInitScript(() => {
    window.__PRERENDER__ = true
  })

  let successCount = 0
  let failureCount = 0

  for (const routePath of paths) {
    const page = await context.newPage()
    const url = toPrerenderUrl(serverUrl, routePath)

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
      await waitForRenderedPage(page)

      const html = await page.content()
      const outputDir = routePathToOutputDir(distDir, routePath)
      await fs.mkdir(outputDir, { recursive: true })
      await fs.writeFile(path.join(outputDir, 'index.html'), html, 'utf8')

      successCount += 1
      console.log(`✅  ${normalizeRoutePath(routePath)}`)
    } catch (err) {
      failureCount += 1
      console.error(`❌  ${normalizeRoutePath(routePath)}: ${err.message}`)
    } finally {
      await page.close()
    }
  }

  await context.close()
  await browser.close()
  server.close()

  console.log(`\n✨  Prerender complete: ${successCount}/${paths.length} routes.`)

  if (successCount === 0) {
    console.error('❌  No routes were prerendered successfully.')
    process.exit(1)
  }

  if (failureCount > 0) {
    console.error(`⚠️  ${failureCount} route(s) failed to prerender.`)
    process.exit(1)
  }

  console.log('')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
