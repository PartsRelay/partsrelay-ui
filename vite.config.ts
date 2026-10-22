import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vite-plus'
import { readEnv } from './src/env'
import { localReviewAuth } from './tools/local-review-auth'

const generated = [
  '**/dist/**',
  'src/core/api/**',
  'src/ui/routeTree.gen.ts',
  'public/mockServiceWorker.js',
]

const reactImports = ['react', 'react-dom', '@tanstack/react-*', '@/ui/*', '@/modules/*/ui/*']

export default defineConfig(({ mode, command }) => {
  const environment = readEnv(loadEnv(mode, process.cwd(), ''), {
    mode,
    isBuild: command === 'build',
  })

  return {
    plugins: [
      devtools(),
      localReviewAuth(environment.LOCAL_REVIEW_AUTH),
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
        routesDirectory: './src/ui/routes',
        generatedRouteTree: './src/ui/routeTree.gen.ts',
      }),
      react(),
      tailwindcss(),
      {
        name: 'app-title',
        transformIndexHtml(html) {
          const title = environment.APP_NAME.replace(/[&<>"']/g, (character) => {
            const escaped: Record<string, string> = {
              '&': '&amp;',
              '<': '&lt;',
              '>': '&gt;',
              '"': '&quot;',
              "'": '&#39;',
            }
            return escaped[character]!
          })
          return html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
        },
      },
    ],

    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },

    // readEnv supplies the public allowlist; do not expose arbitrary VITE_* values.
    envPrefix: [],

    // Expose only the validated public allowlist, never provider secrets.
    define: {
      __ENV__: JSON.stringify(environment),
    },

    server: {
      host: 'localhost',
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
  }
})
