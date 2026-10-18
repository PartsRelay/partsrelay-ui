import { defineConfig } from 'orval'

const LOCAL_URL = 'http://localhost:3333/openapi.json'

// The local core first, then staging
async function openapiUrl() {
  const local = await fetch(LOCAL_URL, { signal: AbortSignal.timeout(2000) }).catch(() => null)

  if (local?.ok) return LOCAL_URL
  if (process.env.OPENAPI_STAGING_URL) return process.env.OPENAPI_STAGING_URL

  throw new Error('Start the core locally or set OPENAPI_STAGING_URL')
}

const input = await openapiUrl()
const mutator = { path: './src/core/http/client.ts', name: 'http' }

export default defineConfig({
  core: {
    input,
    output: {
      client: 'axios-functions',
      mode: 'tags-split',
      target: './src/core/api/endpoints',
      schemas: './src/core/api/models',
      clean: ['./src/core/api'],
      override: { mutator },
    },
  },
  ui: {
    input,
    output: {
      client: 'react-query',
      httpClient: 'axios',
      mode: 'tags-split',
      target: './src/ui/api/endpoints',
      schemas: './src/core/api/models',
      clean: ['./src/ui/api'],
      mock: { indexMockFiles: true, generators: [{ type: 'msw' }] },
      override: { mutator },
    },
  },
})
