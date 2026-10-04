import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/** 개발 서버에서 브라우저 요청을 백엔드 API로 전달하도록 Vite를 설정한다. */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const developmentApiUrl = env.VITE_API_DEVELOPMENT_URL || 'http://localhost:8080'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: developmentApiUrl,
          changeOrigin: true,
        },
      },
    },
  }
})
