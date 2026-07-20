import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // El sitio vive en github.io/mi-ticket/, no en la raíz del dominio.
  base: '/mi-ticket/',
})
