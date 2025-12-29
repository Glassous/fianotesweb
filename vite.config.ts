import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.NOTES_REPO_PATH': JSON.stringify(env.NOTES_REPO_PATH),
      'process.env.NOTES_PAT': JSON.stringify(env.NOTES_PAT),
      'process.env.VITE_ENABLE_AI_PASSWORD': JSON.stringify(env.VITE_ENABLE_AI_PASSWORD),
      'process.env.VITE_ENABLE_HASH_PASSWORD': JSON.stringify(env.VITE_ENABLE_HASH_PASSWORD),
    }
  }
})
