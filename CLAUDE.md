# Parts Relay UI

## Structure

- Repository root: `index.html`, `index.css` and the tool configs (`vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `orval.config.ts`, `tsconfig.json`, `components.json`).
- `src/`: the app configuration (`env.ts`, `router.ts`, `query-client.ts`, `i18n.ts`, `form.ts`, `form-context.ts`) and `main.tsx`. Every form uses `useAppForm` from `form.ts`, which registers the shared field and form components and holds the shared validators. The shared components read the form and field contexts from `form-context.ts`. `InputField` caps every input at `MAX_STRING_LENGTH` of `src/core/strings.ts`, the longest string the core accepts.
- `src/core/`: TypeScript shared across the whole frontend, including the core API client Orval generates in `src/core/api`. Better Auth is called only through its client in `src/modules/auth/core/auth.client.ts`. Live updates come from the core Transmit channels through the one client in `src/core/transmit.ts`, never by polling; the MSW mocks have no stream, so `mocksEnabled` of `src/core/mocks/enabled.ts` leaves it off.
- `src/ui/`: `routeTree.gen.ts`.
- `src/ui/assets/`: the brand logos, shown through the `Logo` component.
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
- `playwright.config.ts` is the only Playwright config: it runs `tests/e2e/**/*.spec.ts` of every module, fully parallel, on headless Chromium, Firefox and WebKit (the `chromium`, `firefox` and `webkit` projects, as Chrome, Firefox and Safari), against the dev server it starts on port 5180 with `APP_ENV=development`, so the MSW mocks of `src/core/mocks` answer. Use role based locators and web first assertions, and wait for a page to show before leaving it: when a navigation cuts off a lazy route chunk, Firefox and WebKit reject its import and TanStack Router reloads the page, which interrupts the next `page.goto`.
- The mocks start signed in as Mark Reed, the owner of Redwood Parts Ltd, and keep their state in `sessionStorage`, so every test starts from the same data. Set `mock.user` (`admin`, `viewer` or `new`), `mock.setup` (`pending`) or `mock.invitation` (`1`) in `localStorage` with `page.addInitScript` before the first page load to start as someone else.
- `bun run test:unit` runs the unit tests, `bun run test:e2e` the e2e tests on the three browsers and `bun run test` both. Add `--project=firefox` to `test:e2e` for one browser. CI installs the `node_modules` once in the `install` job, then runs check, build, unit and one e2e job per browser in parallel, as one matrix in the official Playwright image of the installed version (`mcr.microsoft.com/playwright:v<version>-noble`), which already has the browsers and their system packages. The first job that fails cancels the others.
- Playwright needs the headless browsers of its version, without the full Chromium: `bunx playwright install --only-shell chromium firefox webkit`, with `--with-deps` the first time on Linux. `--headed` and `--debug` on the `chromium` project, `--ui` and `show-trace` also need the full Chromium (`bunx playwright install --no-shell chromium`) or an installed Chrome for the last two.
