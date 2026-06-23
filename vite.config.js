import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const ROBOTS_INDEX =
  'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
const ROBOTS_NOINDEX = 'noindex,nofollow'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_WP_DEV_PROXY_TARGET
  const robotsContent = env.VITE_ALLOW_INDEXING === 'true' ? ROBOTS_INDEX : ROBOTS_NOINDEX

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'html-robots-meta',
        transformIndexHtml(html) {
          return html.replace(
            /<meta name="robots" content="[^"]*"\s*\/>/,
            `<meta name="robots" content="${robotsContent}" />`,
          )
        },
      },
    ],
    server: {
      host: true, // listen on 0.0.0.0 so LAN devices can connect
      ...(proxyTarget
        ? {
            proxy: {
              '/graphql': {
                target: proxyTarget,
                changeOrigin: true,
                secure: false,
              },
            },
          }
        : {}),
    },
  }
})
