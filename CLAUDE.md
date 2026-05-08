# tsvwebsite — Claude context

## What this is
TheSeason.nyc showcase site. Four scrolling portrait panels, one per company, with looping video backgrounds and color tints. Deployed at tsvwebsite.vercel.app via Vercel auto-deploy on push to `tartick/tsvwebsite`.

## Deploy workflow
Push to `main` = instant deploy. No build step. Always commit and push after every change.

## Stack
- Pure HTML/CSS/JS, no framework
- `api/videos.js` — Vercel serverless function: GET/POST `data/videos.json` via GitHub API
- `GITHUB_TOKEN` and `ADMIN_PASSWORD` stored as Vercel env vars
- Admin page at `admin.html`, password: `tsv2026`

## Four panels
| id | Name | Role | Tint | Link |
|---|---|---|---|---|
| producing | Producing | Theater and Live Events | black | mailto:mikeandsteven@theseason.nyc |
| 11oclock | 11 O'Clock Studio | Key art & branding | marigold | https://11oclock.com |
| relay | Relay | Influencer Marketing | purple | https://relayinfluence.com |
| flyer | Flyer | Creative production | green | https://flyerweb.com |

## Videos
- Local `.mp4` files in `/assets/{id}.mp4` — drop file in and push to update
- Rendered grayscale via CSS `filter: grayscale(100%)` — color tints overlay on top
- Compress new files before committing: `ffmpeg -i input.mp4 -vf "scale=-2:1080" -c:v libx264 -crf 28 -preset slow -an -movflags +faststart -y output.mp4`

## Key implementation notes
- RAF scroll loop (not CSS keyframes) — avoids loop-reset compositing glitch on second pass
- Panels doubled in DOM (8 total) for seamless infinite scroll
- `isolation: isolate` on each `.panel` for correct z-index stacking with video elements
- `.video-cover` transparent div above each `<video>` blocks iOS native media control taps
- Contact button: fixed top-right, `mailto:hi@theseason.nyc`
- Logo: loaded from theseason.nyc WordPress CDN, falls back to text wordmark
- Mobile: rotate-to-landscape prompt shown when portrait + mobile UA

## Preferences
- No PWA / manifest / install prompts — user explicitly doesn't want them
- User supplies video files directly to `/assets/`; commit and push when updated
