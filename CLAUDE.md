# Parts Relay UI

## Structure

- `src/`: the app configuration (`env.ts`, `router.ts`, `query-client.ts`, `i18n.ts`), `main.tsx` and `index.css`. Tool configs (`vite.config.ts`, `orval.config.ts`, `tsconfig.json`) stay at the repository root, where the tools look for them.
- `src/core/`: TypeScript shared across the whole frontend, including the client Orval generates in `src/core/api`.
- `src/ui/`: `routeTree.gen.ts`.
- `src/ui/components/`: shadcn components.
- `src/ui/routes/`: TanStack Router file based routes, always grouped by module, for example `(auth)` and `(workspaces)`. They mirror the structure of the app and hold no business logic: a route only wires guards, loaders and a component from a module.
- `src/modules/<module>/core/`: TypeScript business logic of that module.
- `src/modules/<module>/ui/`: smart components of that module.
