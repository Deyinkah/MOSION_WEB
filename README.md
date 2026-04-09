# MOSION Web

Marketing and landing-site repository for MOSION and MOSION Studio.

This repository contains:

- The main consumer-facing MOSION website for `mosion.app`
- The standalone Studio landing/deploy root for `studio.mosion.app`
- Lightweight Node-based local serving for static pages and API previews
- Waitlist submission handling and confirmation email generation
- APK download redirect logic for beta distribution

## Overview

MOSION Web is a static-first web repository with a small Node runtime for local development and API-style routes.

The project is split into two deploy surfaces:

- `public/` contains the main MOSION marketing site
- `studio-site/` contains the Studio landing site and its deploy root

The repository also includes:

- `api/` and `studio-site/api/` Vercel-style serverless entrypoints
- `waitlist-handler.js` for waitlist persistence and email confirmation sending
- `apk-download-handler.js` for signed APK download redirects
- `emails/` for transactional email templates
- `shared/` and `scripts/` for shared legal-page content generation

## Repository Structure

```text
.
|-- public/                     # Main marketing site
|-- studio-site/                # Studio landing site deploy root
|-- api/                        # Root Vercel API handlers
|-- emails/                     # Waitlist email template rendering
|-- shared/                     # Shared HTML fragments
|-- scripts/                    # Utility scripts
|-- server.js                   # Local dev/static server
|-- waitlist-handler.js         # Waitlist persistence + email sending
|-- apk-download-handler.js     # APK redirect/presign logic
|-- render-email-preview.js     # Generates local email preview files
|-- vercel.mjs                  # Root deployment config
```

## Tech Stack

- Static HTML, CSS, and vanilla JavaScript
- Node.js for local serving and API logic
- Resend for waitlist confirmation email delivery
- Vercel routing/serverless handlers for deployment
- Backblaze B2 S3-compatible signed URLs for APK download flow

## Local Development

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Start the local server

```bash
npm start
```

The local server starts on `http://localhost:3000` by default.

Useful local routes:

- `http://localhost:3000/` - main MOSION site
- `http://localhost:3000/about.html` - local redirect stub to the main About page
- `http://localhost:3000/accessibility.html` - local redirect stub to the main Accessibility page
- `http://localhost:3000/studio/` - Studio landing site local preview
- `http://localhost:3000/preview/waitlist-email` - browser preview of the website waitlist email

### Generate standalone email preview files

```bash
npm run preview:email
```

This writes preview HTML files into `preview/`.

## Environment Variables

Create a local `.env` file for development using the variables listed below.

Core email/waitlist variables:

- `PORT`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `WAITLIST_FROM_EMAIL`
- `WAITLIST_FROM_NAME`
- `WAITLIST_REPLY_TO`
- `WAITLIST_BETA_URL`
- `WAITLIST_STUDIO_BETA_URL`
- `WAITLIST_LOGO_URL`

Deployment routing and APK download settings are env-backed:

- `STUDIO_WEB_APP_ORIGIN`
- `BETA_APK_OBJECT_URL`

Additional optional variables used by the APK download flow include the Backblaze B2 / S3-compatible signing configuration, such as:

- `B2_DOWNLOAD_KEY_ID`
- `B2_DOWNLOAD_APPLICATION_KEY`
- `B2_DOWNLOAD_BUCKET`
- `B2_DOWNLOAD_OBJECT_KEY`
- `B2_DOWNLOAD_REGION`
- `B2_DOWNLOAD_ENDPOINT`

## Deployment

### Main site

Deploy the repository root as the main Vercel project for:

- `mosion.app`
- `www.mosion.app`

### Studio landing site

Deploy `studio-site/` as a separate Vercel project.

The repository root and `studio-site/` each include a `vercel.mjs` config. Set `STUDIO_WEB_APP_ORIGIN` in any Vercel project that needs to rewrite Studio app routes to the deployed Studio web app origin.

There is also a focused note in:

- `studio-site/README.md`

Recommended setup:

1. Create a second Vercel project from this same repository.
2. Set the Root Directory to `studio-site`.
3. Attach `studio.mosion.app` to that project.

## Scripts

- `npm start` - start the local static/API server
- `npm run check` - syntax check `server.js`
- `npm run preview:email` - generate local waitlist email preview HTML

## Publishing Notes

Before making the repository public:

- Keep `.env` local only
- Do not commit generated `preview/` files
- Do not commit local editor or agent settings such as `.claude/`
- Keep deploy-time env vars such as `STUDIO_WEB_APP_ORIGIN` and APK storage settings in Vercel project environment variables
- Rotate any secret that may already have existed in a tracked commit history before publishing

## Security and Data Handling

- Waitlist submissions are written to `data/waitlist-signups.jsonl` in local development
- That file is ignored by Git and should remain private
- Email sending relies on environment variables rather than hard-coded credentials

## License

No license file is currently included in this repository. Add one before open-sourcing if you want to define reuse terms explicitly.
