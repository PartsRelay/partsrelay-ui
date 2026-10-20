# Parts Relay UI

## Structure

- Repository root: `index.html`, `index.css` and the tool configs (`vite.config.ts`, `orval.config.ts`, `tsconfig.json`, `components.json`).
- `src/`: the app configuration (`env.ts`, `router.ts`, `query-client.ts`, `i18n.ts`) and `main.tsx`.
- `src/core/`: TypeScript shared across the whole frontend, including the REST client Orval generates in `src/core/api`. Better Auth is called only through its client in `src/modules/auth/core/auth.client.ts`.
- `src/ui/`: `routeTree.gen.ts`.
- `src/ui/components/`: shadcn components.
- `src/ui/hooks/`: shared React hooks, the shadcn ones included.
- `src/ui/routes/`: TanStack Router file based routes, always grouped by module, for example `(auth)` and `(workspaces)`. They mirror the structure of the app and hold no business logic: a route only wires guards, loaders and a component from a module.
- `src/modules/<module>/core/`: TypeScript business logic of that module.
- `src/modules/<module>/ui/`: smart components of that module.
