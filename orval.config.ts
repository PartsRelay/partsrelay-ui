import { defineConfig, type OutputOptions } from 'orval'

const LOCAL_CORE = 'http://localhost:3333'

// The local core first, then the one at VITE_API_URL
async function coreUrl() {
  const local = await fetch(`${LOCAL_CORE}/openapi.json`, {
    signal: AbortSignal.timeout(2000),
  }).catch(() => null)

  if (local?.ok) return LOCAL_CORE
  if (process.env.VITE_API_URL) return process.env.VITE_API_URL.replace(/\/$/, '')

  throw new Error('Start the core locally or set VITE_API_URL')
}

const core = await coreUrl()

// Orval covers the core API, Better Auth has its own client
const output: OutputOptions = {
  client: 'react-query',
  httpClient: 'axios',
  mode: 'tags-split',
  target: './src/core/api/endpoints',
  schemas: './src/core/api/models',
  clean: true,
  mock: { indexMockFiles: true, generators: [{ type: 'msw' }] },
  override: {
    mutator: { path: './src/core/http/client.ts', name: 'http' },
    query: { useSuspenseQuery: true, signal: true },
  },
}

export default defineConfig({
  api: { input: `${core}/openapi.json`, output },
})
