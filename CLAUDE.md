# Parts Relay UI

## Structure

- Repository root: `index.html`, `index.css` and the tool configs (`vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `orval.config.ts`, `tsconfig.json`, `components.json`).
- `public/`: files served from the root as they are: the favicon, the MSW worker and the brand logos, which the `Logo` component shows from `import.meta.env.BASE_URL`.
- `src/`: the app configuration (`env.ts`, `router.ts`, `query-client.ts`, `i18n.ts`) and `main.tsx`. Every form uses `useForm` of TanStack Form with the shared `Form`, `InputField` and `SubmitButton` components, which take the form or the field as a prop. Field validators are zod schemas whose messages are translation keys. A field with a limit of the core, like the 200 characters of the part of a new search, sets that `maxLength` and its schema checks it.
- `src/core/`: TypeScript shared across the whole frontend, including the core API client Orval generates in `src/core/api`. Better Auth is called only through its client in `src/modules/auth/core/auth.client.ts`. Live updates come from the core Transmit channels through the one client in `src/core/transmit.ts`, never by polling; the MSW mocks have no stream, so `mocksEnabled` of `src/mocks/enabled.ts` leaves it off.
- `src/core/errors.ts`: every failure reads as the error body of the core, `{ code, status, message, fields? }` (`ErrorBody` of the Orval client): an axios error, a Better Auth client error, the `?error=` code of a Better Auth redirect, a refused Transmit subscription and a Google sign in failure. Anything else becomes `network-error` or `unknown-error` with status 0. Codes are kebab case and messages English; the UI never shows them, it shows `errors.<code>` of `src/locales/<locale>/errors.json`, else the text of the code of the status, else `errors.unknown-error`. The MSW mocks answer the same codes, statuses, messages and fields as the core.
- `src/locales/<locale>/`: the texts of `en-US` and `it-IT`, one JSON file per area, merged into one catalog per locale by `i18n.ts`.
- `src/mocks/`: the MSW mocks the dev server answers with under `APP_ENV=development`. `browser.ts` puts the stateful ones of Better Auth, the contacts and the searches before the handlers Orval generates, and `main.tsx` starts it only when `mocksEnabled` of `enabled.ts` is on.
- `src/ui/`: `routeTree.gen.ts`.
- `src/ui/components/`: shared components of the app, always built on the shadcn ones.
- `src/ui/components/ui/`: shadcn components, added only with the shadcn CLI.
- `src/ui/hooks/`: shared React hooks, the shadcn ones included.
- `src/ui/routes/`: TanStack Router file based routes, always grouped by module, for example `(auth)` and `(workspaces)`. They mirror the structure of the app and hold no business logic: a route only wires guards, loaders, the page title of `src/core/head.ts` and a component from a module.
- `src/modules/<module>/core/`: TypeScript business logic of that module.
- `src/modules/<module>/ui/`: smart components of that module.
- `src/modules/<module>/ui/hooks/`: React hooks of that module.
- `src/modules/<module>/tests/unit/`: Vitest tests of the `core/` of that module, only `*.test.ts`.
- `src/modules/<module>/tests/e2e/`: Playwright tests of the flows of that module, only `*.spec.ts`.
- `src/core/tests/unit/`: Vitest tests of `src/core`, only `*.test.ts`.

## Tests

- `vitest.config.ts` is the only Vitest config: it runs `tests/unit/**/*.test.ts` of every module and of `src/core` in Node and in UTC, one file per worker in parallel, without the Vite plugins. Keep the test settings there, not in `vite.config.ts`. Import the test API from `vite-plus/test`. Mock `@/modules/auth/core/auth.client` in tests whose imports reach it, the real client needs a browser.
- `playwright.config.ts` is the only Playwright config: it runs `tests/e2e/**/*.spec.ts` of every module, fully parallel, on headless Chromium, Firefox and WebKit (the `chromium`, `firefox` and `webkit` projects, as Chrome, Firefox and Safari), against the dev server it starts on port 5180 with `APP_ENV=development`, so the MSW mocks of `src/mocks` answer. Use role based locators and web first assertions, and wait for a page to show before leaving it: when a navigation cuts off a lazy route chunk, Firefox and WebKit reject its import and TanStack Router reloads the page, which interrupts the next `page.goto`.
- The mocks start signed in as Mark Reed, the owner of Redwood Parts Ltd, and keep their state in `sessionStorage`, so every test starts from the same data. The lookup mocks identify the plates CA770NE, GH482KL, FT915ZR and DK318MP, fail on ER500ER and find no vehicle for any other plate; a search finishes at once, since the mocks have no live stream. Set `mock.user` (`admin`, `viewer` or `new`), `mock.setup` (`pending`) or `mock.invitation` (`1`) in `localStorage` with `page.addInitScript` before the first page load to start as someone else.
- `bun run test:unit` runs the unit tests, `bun run test:e2e` the e2e tests on the three browsers and `bun run test` both. Add `--project=firefox` to `test:e2e` for one browser. CI installs the `node_modules` once in the `install` job, then runs check, build, unit and one e2e job per browser in parallel, as one matrix in the official Playwright image of the installed version (`mcr.microsoft.com/playwright:v<version>-noble`), which already has the browsers and their system packages. The first job that fails cancels the others.
- Playwright needs the headless browsers of its version, without the full Chromium: `bunx playwright install --only-shell chromium firefox webkit`, with `--with-deps` the first time on Linux. `--headed` and `--debug` on the `chromium` project, `--ui` and `show-trace` also need the full Chromium (`bunx playwright install --no-shell chromium`) or an installed Chrome for the last two.
