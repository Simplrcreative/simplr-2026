import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_WP_DEV_PROXY_TARGET

  return {
    plugins: [react(), tailwindcss()],
    server: proxyTarget
      ? {
          proxy: {
            '/graphql': {
              target: proxyTarget,
              changeOrigin: true,
              secure: false,
            },
          },
        }
      : undefined,
  }
})
