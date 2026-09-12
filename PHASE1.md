# APIVue Phase 1 — Audit & Stabilize

Phase 1 implementation is complete in `main` at the code/repository level.

## Completed

- [x] Audited and removed the tracked `.env` file.
- [x] Confirmed the exposed Supabase client key was a publishable key; no server secret was intentionally moved into the browser. Server secrets remain server-only.
- [x] Corrected the GitHub Pages project base from the old path to `/APIVue/`.
- [x] Added SPA deep-link fallback handling for GitHub Pages.
- [x] Made authentication redirects base-path aware.
- [x] Protected routes now wait for the initial session check and show a retry state for transient auth/network failures instead of blindly redirecting to login.
- [x] Added a production frontend/backend separation contract with `VITE_API_URL` required for production integration API calls.
- [x] Added `render.yaml` for the Node/Express backend deployment.
- [x] Removed the duplicate `.github/workflowsv/deploy.yml` workflow.
- [x] Added CI for lint, frontend build/typecheck, backend typecheck, and unit tests.
- [x] Added a strict backend TypeScript project configuration.
- [x] Added a checked-in Supabase database type contract and removed the `any` database escape hatch from `use-profiles.ts`.
- [x] Added browser/server/Supabase runtime-aware ESLint configuration.
- [x] Updated environment documentation to separate publishable browser configuration from server-only secrets.

## Integration/auth verification status

The source contracts for GitHub, Codeforces, LeetCode, Codewars, and Stack Overflow remain wired to the existing Express integration routes. The browser client now fails clearly when a production backend URL has not been configured instead of silently trying `localhost`.

A true live end-to-end OAuth/integration test still requires the real deployment credentials and external provider accounts; those cannot be manufactured safely in CI. The codebase now has the correct production boundary and explicit configuration points for that final environment verification.

## Required production configuration

1. Deploy the Node backend using `render.yaml` (or another Node-capable host).
2. Set the backend's server-only environment variables there.
3. Set `VITE_API_URL` to the deployed backend URL when building the frontend.
4. Add the GitHub Pages URL and backend callback URL to the corresponding Supabase/GitHub OAuth allowlists.
5. Run one real sign-in and one real connection/sync test per provider after those external settings are configured.

## Security note

The tracked `.env` file was removed from Git. If any server-only credential was ever placed in that file in a real environment, rotate it in the provider dashboard because deleting a Git commit does not invalidate an already exposed credential.
