# Unidojo

Static, client-side MVP for short daily money lessons. User progress is stored in
the browser's local storage; no account or bank connection is required.

## Run locally

Because the service worker requires HTTP, use any static server from the project
directory:

```bash
python3 -m http.server 8080
```

Open <http://localhost:8080>.

## Deploy

Deploy the repository root as a static site. No build step or environment
variables are required. The host must serve `index.html`, `manifest.json`, and
`sw.js` from the same origin over HTTPS in production. GitHub Pages, Netlify,
Vercel, and Cloudflare Pages all work with their default static settings.

To open a clean onboarding start in a browser with an older cached version, use
`/?start=1` after the site URL. This keeps the stored dojo progress but resets
the onboarding choices for that visit.

Tailwind is loaded from its CDN, so the first visit needs network access. The
service worker caches the app shell after that visit; change the `CACHE` version
in `sw.js` whenever the shell changes and redeploy.

<!-- deployment trigger: keep application files unchanged -->
