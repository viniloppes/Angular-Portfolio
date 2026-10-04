# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm ci --legacy-peer-deps` — install (the flag is required; see README)
- `npm start` — dev server (`ng serve`)
- `npm run build` — production build into `dist/portfolio/browser/`
- `npm test` — unit tests via `ng test` (Angular `unit-test` builder with Vitest + jsdom)
- Single spec: `npx ng test --include src/app/pages/projects-page/projects-page.spec.ts`
- `npm run serve:ssr:portfolio` — serve the SSR build (`node dist/portfolio/server/server.mjs`)

## Architecture

Angular 21 standalone-component app (no NgModules), PrimeNG 21 + Tailwind 4 (`tailwindcss-primeui`). Frontend only: the backend is a separately deployed ASP.NET Core API. Product context (audience, brand commitments: name "Crazy Lab", identity "Vinícius Lopes", Portuguese as default content language) lives in `PRODUCT.md`; design tokens/pages in `design-system/personal-portfolio/`.

- **Routing** (`src/app/app.routes.ts`): public pages (`home`, `projects`, `articles`, `contact`) are children of the `Layout` shell; `admin` (login) and `admin/cases` (guarded by `adminGuard`) sit outside it and are lazy-loaded. SSR is configured to prerender all routes (`app.routes.server.ts`), so code touching `window`/browser APIs must be SSR-safe.
- **Runtime config, not build-time env**: `core/portfolio-config.ts` reads `window.__PORTFOLIO_CONFIG__` (`apiBaseUrl`, `supabaseUrl`, `supabaseAnonKey`) from `public/portfolio-config.js`. In Docker, `docker-entrypoint.d/40-portfolio-config.sh` generates that file at container start from `API_BASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` env vars. Never put Supabase secret keys here.
- **Data flow**: `core/portfolio-api.service.ts` talks to the API — public `GET /api/cases`, admin CRUD/upload/ordering under `/api/admin/cases` (multipart `FormData` for cover images). `core/auth.interceptor.ts` attaches the Supabase access token (from `AdminAuthService`) as a Bearer header only for `/api/admin` URLs.
- **Case gallery**: `components/case-gallery` renders API cases and is shared by the home page (up to 3 featured) and the projects page (category filters). `pages/projects-page/projects.ts` holds older hardcoded project data (some descriptions in English).
- **Theming**: PrimeNG Aura preset with primary palette overridden to violet in `app.config.ts`; dark mode via the `.my-app-dark` selector; PrimeNG CSS layer order is set explicitly so Tailwind utilities override components.

## Deployment

Two separate pipelines exist: `Dockerfile` + `nginx.conf` (Coolify; Angular build served by Nginx with `index.html` fallback, config file served `no-store`), and `.github/workflows/deploy.yml` (GitHub Pages, triggered on pushes to `master`). The API must list the frontend origin in `Cors__AllowedOrigins__0`, and the origin must be in Supabase Auth redirect URLs.
