import { defineConfig, type OutputOptions } from 'orval'

const LOCAL_CORE = 'http://localhost:3333'

// The local core first, then staging
async function coreUrl() {
  const local = await fetch(`${LOCAL_CORE}/openapi.json`, {
    signal: AbortSignal.timeout(2000),
  }).catch(() => null)

  if (local?.ok) return LOCAL_CORE
  if (process.env.CORE_STAGING_URL) return process.env.CORE_STAGING_URL.replace(/\/$/, '')

  throw new Error('Start the core locally or set CORE_STAGING_URL')
}

const core = await coreUrl()

// Better Auth has its own client, Orval covers the REST API
const output: OutputOptions = {
  client: 'react-query',
  httpClient: 'axios',
  mode: 'tags-split',
  target: './src/core/api/rest/endpoints',
  schemas: './src/core/api/rest/models',
  clean: true,
  mock: { indexMockFiles: true, generators: [{ type: 'msw' }] },
  override: {
    mutator: { path: './src/core/http/client.ts', name: 'http' },
    query: { useSuspenseQuery: true, signal: true },
  },
}

export default defineConfig({
  rest: { input: `${core}/openapi.json`, output },
})
