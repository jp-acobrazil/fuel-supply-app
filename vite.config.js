import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/abastecimento/',
  server: {
    port: 6020,
    host: true,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8091/abastecimento',
        changeOrigin: true,
        logLevel: 'debug',
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
      '/auth/api': {
        target: 'https://api.acobrazil.com.br/authenticate/auth/user-details',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
