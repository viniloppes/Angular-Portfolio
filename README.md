# Crazy Lab frontend

Angular 21 application deployed separately from the ASP.NET Core API.

## Local development

Run `npm ci --legacy-peer-deps` and `npm start`. The app reads public settings from `public/portfolio-config.js`; set `apiBaseUrl` to the local API URL and keep Supabase secrets out of this file. `npm run build` creates the production browser output in `dist/portfolio/browser/`.

## Docker and Coolify

Build from this repository root: `docker build -t crazy-lab-web .`. The image builds Angular and serves the browser files through Nginx on container port `80`, with fallback to `index.html` for Angular routes.

Create a separate Coolify application using this repository and its root `Dockerfile`. Set the frontend domain to `https://your-domain.example` and provide these runtime variables:

- `API_BASE_URL=https://api.your-domain.example` (the public API origin, without `/api`).
- `SUPABASE_URL=https://your-project.supabase.co`.
- `SUPABASE_ANON_KEY=sb_publishable_...` (public browser key).

At startup, the container writes `/portfolio-config.js` from those values with `Cache-Control: no-store`. The API must allow the exact frontend origin through `Cors__AllowedOrigins__0`. Configure the frontend origin in Supabase Auth redirect URLs for administrator login. Never put `SUPABASE_SECRET_KEY` in this repository or its Coolify variables.
