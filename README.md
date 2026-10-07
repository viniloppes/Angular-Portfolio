# AmberLink portfolio frontend

Angular 21 application that reads and administers portfolio cases directly through Supabase. The frontend uses only the public Supabase key; database Row Level Security and Storage policies control access.

## Local development

Run `npm ci --legacy-peer-deps` and `npm start`. Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `public/portfolio-config.js`; `npm run build` creates browser output in `dist/portfolio/browser/`.

Apply the SQL files in `supabase/migrations/` to the linked Supabase project. The initial migration preserves every existing case and its text category while adding category IDs and soft-delete state. The frontend queries only active cases and categories. Admin write access is restricted by RLS to the configured administrator UID.

The public `portfolio-covers` bucket accepts JPG, PNG, WebP, and GIF files up to 10 MB. Public reads are limited to that bucket; insert and update policies require the administrator UID. Never put a Supabase secret or service-role key in this repository or browser configuration.

The five existing covers still use their local `/assets/projects/...` paths and remain visible until they are uploaded from the admin case editor. The old text `category` column stays in the database until other ASP.NET API consumers are ruled out.

## Docker and Coolify

Build from this repository root: `docker build -t amberlink-web .`. The image builds Angular and serves the browser files through Nginx on container port `80`, with fallback to `index.html` for Angular routes.

Create a Coolify application from this repository and its root `Dockerfile`. Set the frontend domain and provide these runtime variables:

- `SUPABASE_URL=https://your-project.supabase.co`.
- `SUPABASE_ANON_KEY=sb_publishable_...` (public browser key).

At startup, the container writes `/portfolio-config.js` from those values with `Cache-Control: no-store`. Configure the frontend origin in Supabase Auth redirect URLs for administrator login. The separate ASP.NET Core API is outside this repository's deployment configuration.
