# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary audience is potential clients evaluating Vinícius Lopes's work. No specific client industry or organization size is established.

## Product Purpose

Showcase selected work and provide enough context and working links for potential clients to evaluate it. Success means presenting the work clearly; generating inquiries is not a product goal.

## Positioning

Position the portfolio around cross-discipline creative development, with work and studies spanning web development, games, and interaction. The repository contains both practical client work and studies or prototypes.

## Operating Context

- Visitors browse featured cases, filter projects by category, and follow project, video, game, or repository links where available.
- An authenticated administrator manages case titles, descriptions, categories, cover images, optional links, and display order in the admin area.
- The Angular frontend is deployed separately from an ASP.NET Core API. Current deployment notes describe Docker/Nginx and Coolify; treat these as the existing setup, not permanent product requirements.

## Capabilities and Constraints

- The public case gallery loads published cases from the API. The home page displays up to three featured cases; the projects page offers category filters.
- The admin area uses Supabase authentication and API-backed case create, update, delete, cover upload, and ordering workflows.
- The contact page currently links to LinkedIn and GitHub; no email or inquiry form is present in the repository. These links are contact information, not an inquiry conversion goal.
- Existing stack: Angular 21 web frontend and a separately deployed ASP.NET Core API.

## Brand Commitments

The brand is “AmberLink” (replaces “Crazy Lab” as of 2026-10-05; identity in Figma file i8tMqSiTvDdwRxfHRS5L6N). Preserve the identity “Vinícius Lopes” and Portuguese as the default content language. Some older project descriptions are in English.

## Evidence on Hand

- Public case records are fetched from `/api/cases`; the admin area manages records through `/api/admin/cases` (`src/app/core/portfolio-api.service.ts`).
- The repository contains local project thumbnails in `src/assets/projects/` and a legacy static project list in `src/app/pages/projects-page/projects.ts`. The live gallery is API-backed, so its current published inventory must be checked against the API.
- The contact page contains LinkedIn and GitHub links (`src/app/pages/contact-page/contact-page.html`).
- No testimonials, client outcome metrics, or formal case-study results are established in the repository; do not fabricate them.

## Product Principles

- Showcase work across web development, games, and interaction.
- Give each case enough context and a real project link for a prospective client to assess it.
- Label studies and prototypes accurately; do not present them as client engagements.
- Treat the portfolio as a showcase; do not optimize its purpose around generating inquiries.
