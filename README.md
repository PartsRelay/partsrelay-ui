# partsrelay-ui

React frontend for PartsRelay. Bun, TypeScript, Vite+, TanStack (Router, Query, Store, Pacer, Devtools, Intent), axios, Orval, T3 env, react-i18next, Sonner, shadcn/ui and Tailwind.

## Development

In development the API answers from MSW mocks, so no core is needed: `src/ui/mocks/auth.ts` plays Better Auth, `src/ui/mocks/contacts.ts` keeps the contacts of each company with the same rules and messages as the core, the rest comes from the mocks Orval generates from the core OpenAPI. A few `localStorage` keys change what the mocks return:

| Key               | Values                              | Effect                                      |
| ----------------- | ----------------------------------- | ------------------------------------------- |
| `mock.user`       | `owner`, `admin`, `viewer` or `new` | Who is signed in, `new` has no name yet     |
| `mock.setup`      | `pending`                           | The company still waits for its setup       |
| `mock.invitation` | `1`                                 | An invitation to another company is waiting |

Set `VITE_API_MOCKS=false` to talk to a core at `VITE_API_URL` instead. The core only trusts its `UI_URL`, so open the UI from that origin.

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
bun run generate
```

`generate` reads the OpenAPI of the core running on http://localhost:3333, or of `OPENAPI_STAGING_URL` when no core runs locally, and rewrites the client, the query hooks and the mocks.

## Environment

`VITE_` variables are validated at startup with T3 env in `src/core/config/env.ts`.

| Variable                | Default | Content                                                                  |
| ----------------------- | ------- | ------------------------------------------------------------------------ |
| `VITE_API_URL`          | empty   | Core origin, empty uses the same origin                                  |
| `VITE_API_MOCKS`        | `true`  | `false` turns the MSW mocks off in development                           |
| `VITE_GOOGLE_CLIENT_ID` | empty   | Google client id of the core, turns Google One Tap on when set           |
| `OPENAPI_STAGING_URL`   | empty   | OpenAPI URL of the staging core, used by `generate` without a local core |

## Layout

| Folder             | Content                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `src/core`         | TypeScript only: env, axios client, generated API                  |
| `src/modules/core` | TypeScript only: feature logic, Better Auth client, queries, forms |
| `src/ui`           | React: entry, router, providers, components, generated query hooks |
| `src/ui/routes`    | File based routes, grouped like modules, for example `(auth)`      |
| `src/modules/ui`   | React feature components and hooks                                 |

The core layers never import React or the ui layers, enforced by an Oxlint rule in `vite.config.ts`.

Every Orval client goes through the `http` mutator in `src/core/http/client.ts`.

## Sign in

Better Auth runs in the core at `/api/auth` and keeps the session in a cookie: the Better Auth client in `src/modules/core/auth/auth.client.ts` and axios both send credentials. People sign in with Google, with a link sent by email or with Google One Tap, and accept invitations at `/invitations/:id` the same way. Every account belongs to one company: owners with a new company go through `/setup` first.

## Texts

Texts live in `src/ui/locales/<language>/<area>.json`. They follow the browser language until sign in, then the company language chosen by the owner, with English as fallback. Only `app.json` holds `errors`, since the area files merge shallowly. When a query or mutation fails, `src/ui/providers/query-client.ts` shows a toast with the `message` of the core, already in the company language, or with the text of the Better Auth error `code` (`errors.<CODE>`). Forms show the `details` of a core validation error under each field.

## Workflow

Pull requests target `develop` and run oxc, build and test in sequence. A merge into `main` deploys to Sevalla with the `SEVALLA_TOKEN` and `SEVALLA_STATIC_SITE_ID` secrets.
