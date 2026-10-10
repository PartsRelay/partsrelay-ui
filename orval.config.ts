import { defineConfig } from 'orval'

const input = process.env.OPENAPI_URL ?? 'http://localhost:3333/openapi.json'
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
