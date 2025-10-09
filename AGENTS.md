# Repository Guidelines

## Project Structure & Module Organization
- `_manager/api` runs the Express + TypeScript manager; keep routes/services/types separated under `src/*` and Swagger docs in `src/swagger`.
- `_manager/web` hosts the Next.js 15/Tailwind UI; colocate features in `src/app` and store static assets in `public/`.
- `_templates/` feeds the provisioning scripts; adjust the placeholder tokens instead of inserting hard-coded paths or ports.
- `_scripts/port-allocator.js` with `_manager/data/*.json` tracks platform and project serials; generated platforms live in `platforms/`, while `_settings/` stores gitignored env files resolved from `.env` (notably `MY_ROOT_PATH` and manager ports).

## Build, Test, and Development Commands
- Manager API: `cd _manager/api && npm run dev` (watch mode), `npm run build && npm run start` (production check), `npm test` (Jest).
- Manager Web: `cd _manager/web && npm run dev` (polling), `npm run build` (compile), `npm run lint` (eslint-config-next).
- Tooling: run `npm run lint` and, for the API, `npm run format` before committing.

## Coding Style & Naming Conventions
- Follow the repo Prettier profile (two-space indent, single quotes, trailing commas) and ESLint defaults; avoid manual tweaks.
- Prefer camelCase for functions and variables, PascalCase for types/React components, and kebab-case for directories or provisioning names such as `ubuntu-ilmac`.
- Read paths and ports via helpers that respect `.env`; never inline `/volume1/...`.

## Testing Guidelines
- The API uses Jest; place specs as `*.test.ts` beside the code they verify and cover routes, services, and data utilities before merging.
- Frontend tests are not wired yet—coordinate before adding tooling, and provide manual verification notes (screenshots, flows) in PRs touching the UI.
- When adding API endpoints, share sample payloads or cURL snippets for reviewers.

## Commit & Pull Request Guidelines
- Git history is unavailable here; default to Conventional Commits (`feat:`, `fix:`, `chore:`) in the imperative mood to stay automation-friendly.
- Reference the tracked issue, summarise behaviour changes, and flag config impacts (`.env`, `_settings/`) in each PR.
- Note the local results of `npm run lint` and the relevant build/test commands to streamline review.

## Provisioning & Configuration Tips
- Keep `.env` authoritative; scripts rely on `MY_ROOT_PATH` and `BASE_PLATFORMS_PORT` for substitutions.
- Create platforms with `./cu.sh` from the repo root and projects with `./cp.sh` inside `platforms/<name>/projects` so port allocation and metadata stay in sync.
- After touching `_templates/`, dry-run the provisioning flow in a disposable platform and delete the generated artifacts before committing.
