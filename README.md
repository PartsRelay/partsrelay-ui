# PartsRelay UI

React frontend for PartsRelay, based on the [Figma design](https://www.figma.com/design/aRfPsqwI55gGp9TD78AKeS/Parts-Relay---Design?node-id=0-1).

Uses Bun, TypeScript, Vite+, TanStack Router/Query/Form/Store/Pacer/Devtools, axios, Orval, T3 env, react-i18next, Sonner, shadcn/ui, and Tailwind. Authentication and workspace membership use the core API's Better Auth cookie sessions.

## Run locally

Install Bun and Node 24, then run these commands from this repository in PowerShell:

```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
bun install --frozen-lockfile
bun run dev
```

Open [localhost:5173](http://localhost:5173). The port is fixed so callback URLs and trusted origins stay consistent.

The frontend uses the real API by default. Set `API_URL` to your core API origin. The example uses `http://localhost:3335` for an isolated local backend; change it if your backend uses a different port. Start the backend's database, API, and queue worker using its own setup instructions. Its CORS and authentication settings must allow `http://localhost:5173`.

## Environment

| Variable                 | Purpose                                                                       |
| ------------------------ | ----------------------------------------------------------------------------- |
| `APP_ENV`                | `development`, `staging`, or `production`.                                    |
| `APP_NAME`               | App name, including the browser title. Defaults to `PartsRelay`.              |
| `API_URL`                | Core API origin. An empty value uses the frontend origin.                     |
| `GOOGLE_CLIENT_ID`       | Optional public OAuth client ID for Google One Tap.                           |
| `VITE_API_MOCKS`         | Enables the sample-data preview. Defaults to `false`.                         |
| `VITE_LOCAL_REVIEW_AUTH` | Enables sign-in with an existing isolated local session. Defaults to `false`. |
| `CHOKIDAR_USEPOLLING`    | File-watching option for container development.                               |

Existing `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID` values are supported and take precedence over their unprefixed names. Only the validated public variables are included in the browser bundle.

Keep `.env` out of Git. Google client secrets, Resend keys, database passwords, and provider credentials belong in the backend environment.

## Preview without a backend

Set these values in your local `.env`, then restart the frontend:

```dotenv
VITE_API_MOCKS=true
VITE_LOCAL_REVIEW_AUTH=false
```

The app uses sample records and shows a preview notice. Changes stay in the browser; unhandled API requests fail locally. This mode is for reviewing the screens and does not test Google, email, catalog providers, or WhatsApp. Set `VITE_API_MOCKS=false` before testing the real API.

## Preview with an existing local session

The optional local sign-in helper is for an already prepared, isolated workspace. It requires the UI at `http://localhost:5173`, the API at `http://localhost:3335`, and a valid private owner-session fixture at `../partsrelay-core/tmp/local-review-sessions.json`. These runtime files are not included in this repository.

Set `VITE_LOCAL_REVIEW_AUTH=true`, keep `VITE_API_MOCKS=false` and `APP_ENV=development`, then choose **Continue to local preview**. The development server validates the fixture with the API before setting its HttpOnly session cookie. It cannot create a fixture, select another account, or reset a workspace. An absent, expired, or revoked fixture must be refreshed through the local backend setup.

This route accepts only same-origin requests from localhost. Local preview sign-out clears the browser cookie; ordinary sign-out still revokes real account sessions through the backend. Google One Tap is disabled in this mode.

Both preview flags are rejected during builds. They must be `false` for production builds and real authentication testing.

## Checks

```powershell
bun run check
bun run test
bun run build
```

If your `.env` enables local preview, disable it for all three checks in the current terminal:

```powershell
$env:VITE_LOCAL_REVIEW_AUTH = 'false'
$env:VITE_API_MOCKS = 'false'
bun run check
bun run test
bun run build
Remove-Item Env:VITE_LOCAL_REVIEW_AUTH, Env:VITE_API_MOCKS
```

`bun run fix` applies formatting and supported lint fixes. The test suite covers request credentials, session failures, workspace permissions, search submission and recovery, contact validation, language handling, and local preview restrictions.

To regenerate the business API client, start the core and run:

```powershell
$env:API_URL = 'http://localhost:3335'
bun run generate
```

Orval reads `/openapi.json` and writes `src/core/api`. Review the generated changes before committing them. Better Auth uses its own typed client.

## What is included

- Sign-in, workspace setup, profile and company settings, invitations, and team management.
- Search creation, history, requester filters, result details, live updates, and polling recovery. Text/status filters apply to the current page; requester filters go to the API.
- Contacts with active/blocked states and the actions supported by each role.
- English and Italian, including a saved UI language preference. Company WhatsApp language remains a separate setting.
- Responsive layouts and local design assets.

The UI follows the available backend operations. It does not add billing, quotas, join codes, contact approvals, supplier ordering, or WhatsApp channel management. Search results do not invent prices or stock availability. Role changes are limited to ownership transfer.

Google sign-in still requires the correct OAuth callback in Google Cloud. For the example local API, the callback is `http://localhost:3335/api/auth/callback/google`. Email delivery requires the backend's Resend sender configuration and published `magic-link` and `workspace-invitation` templates. Verify these integrations separately before release.

## Review and deployment

Open pull requests against `develop`. The existing workflow runs formatting, lint, type checks, build, and tests when a PR is ready for review; draft PRs skip those jobs.

Pushes to `main` trigger the existing Sevalla deployment workflow. Deployment needs a reachable backend, matching cookie/CORS settings, configured provider credentials, and SPA route fallback. Local preview access is not available in a production build.
