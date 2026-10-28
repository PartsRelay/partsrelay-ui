# Parts Relay UI

The web app of Parts Relay. It talks to [PartsRelay/core](https://github.com/PartsRelay/core) and reads every text from [PartsRelay/locales](https://github.com/PartsRelay/locales), mounted as a git submodule at `src/locales`.

## Run it

```sh
git clone --recurse-submodules https://github.com/PartsRelay/ui.git
cd ui
bun install
cp .env.example .env
bun run dev
```

A clone made without `--recurse-submodules` needs `git submodule update --init`.

The dev container of `.devcontainer` does the same: it checks out the submodule, copies `.env`, installs and starts `bun run dev`. In GitHub Codespaces it also makes port 5173 public, so the UI opens from outside the codespace.

With `MOCKS=true`, the default of `.env.example`, the MSW mocks of `src/mocks` answer every request, signed in as Mark Reed, the owner of Redwood Parts Ltd.

To use a core running on your machine, start it with `UI_URL=http://localhost:5173`, then run the UI without the mocks:

```sh
MOCKS=false API_URL=http://localhost:3333 bun run dev
```

## Checks

- `bun run check`: format, lint and types.
- `bun run build`: the production bundle in `dist`.
- `bun run test:unit` and `bun run test:e2e`: Vitest and Playwright, as described in `CLAUDE.md`.
- `API_URL=http://localhost:3333 bun run generate`: regenerates the Orval client in `src/core/api` from a running core.
