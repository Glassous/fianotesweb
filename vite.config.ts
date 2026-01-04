import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import license from 'rollup-plugin-license'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      license({
        thirdParty: {
          output: {
            file: path.join(__dirname, 'public', 'oss-licenses.json'),
            encoding: 'utf-8',
            template: (dependencies) => {
              return JSON.stringify(dependencies, null, 2);
            },
          },
        },
      }),
    ],
    define: {
      'process.env.NOTES_REPO_PATH': JSON.stringify(env.NOTES_REPO_PATH),
      'process.env.NOTES_PAT': JSON.stringify(env.NOTES_PAT),
      'process.env.VITE_ENABLE_AI_PASSWORD': JSON.stringify(env.VITE_ENABLE_AI_PASSWORD),
      'process.env.VITE_ENABLE_HASH_PASSWORD': JSON.stringify(env.VITE_ENABLE_HASH_PASSWORD),
    }
  }
})
