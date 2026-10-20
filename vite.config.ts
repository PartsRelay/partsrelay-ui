import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vite-plus'
import { readEnv } from './src/env'

const generated = [
  '**/dist/**',
  'src/core/api/**',
  'src/ui/routeTree.gen.ts',
  'public/mockServiceWorker.js',
]

const reactImports = ['react', 'react-dom', '@tanstack/react-*', '@/ui/*', '@/modules/*/ui/*']

export default defineConfig({
  plugins: [
    devtools(),
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

  // Every variable of the environment, without prefixes
  define: {
    __ENV__: JSON.stringify(
      readEnv(loadEnv(process.env.APP_ENV ?? 'development', process.cwd(), ''))
    ),
  },

  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },

  lint: {
    ignorePatterns: generated,
    plugins: ['react'],
    env: { browser: true },
    options: { typeAware: true, typeCheck: true },
    overrides: [
      {
        files: ['src/core/**', 'src/modules/*/core/**'],
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
    ignorePatterns: generated,
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
