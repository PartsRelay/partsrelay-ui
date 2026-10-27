import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vite-plus'
import { readEnv } from './src/env'

const ignored = [
  '**/dist/**',
  'src/core/api/**',
  'src/ui/routeTree.gen.ts',
  'public/mockServiceWorker.js',
  'src/locales/**',
]

const env = readEnv(loadEnv(process.env.APP_ENV ?? 'development', process.cwd(), ''))

const reactImports = ['react', 'react-dom', '@tanstack/react-*', '@/ui/*', '@/modules/*/ui/*']

export default defineConfig({
  plugins: [
    devtools({ eventBusConfig: { enabled: false } }),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './src/ui/routes',
      generatedRouteTree: './src/ui/routeTree.gen.ts',
    }),
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },

  define: {
    __ENV__: JSON.stringify(env),
  },

  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },

  lint: {
    ignorePatterns: ignored,
    plugins: ['react'],
    env: { browser: true },
    options: { typeAware: true, typeCheck: true },
    overrides: [
      {
        files: ['src/core/**', 'src/mocks/**', 'src/modules/*/core/**'],
        rules: {
          'no-restricted-imports': [
            'error',
            {
              patterns: [
                {
                  group: reactImports,
                  message: 'The core layers cannot import React or the ui layers.',
                },
              ],
            },
          ],
        },
      },
    ],
  },

  fmt: {
    ignorePatterns: ignored,
    printWidth: 100,
    semi: false,
    singleQuote: true,
    trailingComma: 'es5',
    quoteProps: 'consistent',
    bracketSpacing: true,
    arrowParens: 'always',
    useTabs: false,
  },
})
