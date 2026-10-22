import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite-plus'

// Workers inherit it, so fixed dates match on every machine
process.env.TZ = 'UTC'

// Unit tests only, Playwright runs the e2e ones
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },

  test: {
    include: ['src/{core,modules/*}/tests/unit/**/*.test.ts'],
    environment: 'node',
    unstubGlobals: true,
  },
})
