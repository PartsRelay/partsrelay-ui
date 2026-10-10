# openparts-ui

React frontend for OpenParts. Bun, TypeScript, Vite+, TanStack (Router, Query, Store, Pacer, Devtools, Intent), axios, Orval, T3 env, react-i18next, Sonner, shadcn/ui and Tailwind.

## Development

In development the API answers from the MSW mocks that Orval generates from the core OpenAPI, so no core is needed. The Google sign in still redirects to the core at `VITE_API_URL`.

```sh
cp .env.example .env
bun install
bun run dev
```

Opening the repository in the dev container does the same and starts the dev server on http://localhost:5173.

## Commands

```sh
bun run dev
bun run build
bun run test
bun run check
bun run fix
OPENAPI_URL=http://localhost:3333/openapi.json bun run generate
```

`generate` reads the OpenAPI of a running core in development and rewrites the client, the query hooks and the mocks.

## Environment

Variables are validated at startup with T3 env in `src/core/config/env.ts`.

| Variable       | Default | Content                                 |
| -------------- | ------- | --------------------------------------- |
| `VITE_API_URL` | empty   | Core origin, empty uses the same origin |

## Layout

| Folder             | Content                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `src/core`         | TypeScript only: env, axios client, generated API                  |
| `src/modules/core` | TypeScript only: feature logic (session store, bootstrap)          |
| `src/ui`           | React: entry, router, providers, components, generated query hooks |
| `src/ui/routes`    | File based routes, grouped like modules, for example `(auth)`      |
| `src/modules/ui`   | React feature components and hooks                                 |

The core layers never import React or the ui layers, enforced by an Oxlint rule in `vite.config.ts`.

Every Orval client goes through the `http` mutator in `src/core/http/client.ts`.

Texts live in `src/ui/locales` and follow the browser language, with English as fallback. When a query or mutation fails, `src/ui/providers/query-client.ts` shows a toast translated from the core error `code` (`errors.<CODE>`).

## Workflow

Pull requests target `develop` and run oxc, build and test in sequence. A merge into `main` deploys to Sevalla with the `SEVALLA_TOKEN` and `SEVALLA_STATIC_SITE_ID` secrets.
