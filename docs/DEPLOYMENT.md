# Deployment

## Build contract

- GitHub repository: https://github.com/JalalGrini/portfolio
- Production branch: `main`.
- Host: the existing Vercel `portfolio` project, linked to this repository.
- Framework: Next.js, declared in `vercel.json` and explicitly set in the project.
- Build: `npm ci` → `npm run build`; Next.js statically exports the site.
- No runtime secrets, API server, external character CDN or authentication required.

Vercel receives repository pushes automatically. A Git push alone does not prove deployment readiness; inspect the deployment state and verify the public routes. The stable production URL and latest verified checkpoint are recorded in `STATUS.md` after verification.

## Security and content privacy

GitHub/Vercel credentials are not committed or bundled. Keep credentials in a private environment and rotate any token previously pasted into a chat. The repository contains public portfolio material only. The CV download is a public-facing copy without the personal phone number. Appearance, theme and discoveries are stored in the visitor's local browser; no analytics or server-side visitor data collection is implemented.

`vercel.json` includes MIME-sniffing protection, a restrictive referrer policy and a permissions policy disabling camera, microphone and geolocation. There are no paid services or backend accounts required by the application.

## Rollback

Use Vercel's existing deployment history to promote a previously verified deployment, or revert the relevant Git commit and let the normal build run. Avoid rewriting `main` history. The local quality gates check source integrity, TypeScript, production export and browser interactions. An equivalent GitHub Actions template is saved in `docs/ci/`, but it is not activated: the provided push credential lacks workflow-management permission.
