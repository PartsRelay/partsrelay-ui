import { defineConfig, type OutputOptions } from 'orval'

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
  api: { input: `${process.env.API_URL}/openapi.json`, output },
})
