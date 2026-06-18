# tsvwebsite — Claude context

## What this is
**TheSeason.nyc** — production company umbrella site for The Season and its three sister companies (11 O'Clock Studio, Relay, Flyer). Live at https://theseason.nyc and https://www.theseason.nyc, deployed via Vercel (auto-deploy on push to `main` in `tartick/tsvwebsite` on GitHub). The Vercel preview URL `tsvwebsite.vercel.app` also stays live.

This is the canonical **1.0** release as of May 25, 2026.

> **The proposal tool lives in a separate repo + Vercel project.** As of
> June 2026 the password-protected client proposal builder/viewer was split
> out into its own repo (`tartick/tsv-proposals`, local at
> `~/Documents/Claude/tsv-proposals`) deployed to **proposal.theseason.nyc**.
> This keeps the marketing site clean for homepage editors. Do NOT re-add
> `admin/`, `api/proposal*`, `api/admin/`, `lib/`, `db/`, or `p/` here — that
> all lives in `tsv-proposals` now. This repo is just the public marketing
> site (plus the legacy `api/videos.js` video-admin flow).

## Deploy workflow
Push to `main` = instant deploy. No build step. Always commit and push after every change.

## Pages
- **`index.html`** — homepage. Four panels (one per sister company) with looping grayscale videos + color tint overlays. Desktop: horizontal scroll carousel. Mobile (<1024px or mobile UA): defaults to the stacked 4-panel menu view — no scroll, no logo overlay, no menu button.
- **`theseason.html`** — The Season detail page. Pitch black background, about copy in big Source Sans 3, "Marketing by The Season" lineup with all four logos (Season + 3 sisters), Active Projects list.
- **`index-v1.html`** — archived original homepage (kept for reference only, not linked).
- **`admin.html`** — legacy admin page. Not wired to anything functional on the live site — the videos load directly from `/assets/*.mp4`, ignoring `data/videos.json`. Password: `tsv2026`. Safe to ignore unless we ever rewire it.

## Stack
- Pure HTML / CSS / JS, no framework, no build step
- **Vercel** for hosting
- **Source Sans 3** loaded from Google Fonts (web stand-in for FreightSans Pro, the actual brand typeface from Adobe Fonts)
- **Google Analytics 4** measurement ID: `G-1BF3Y4QWCS`, wired into both pages
- Legacy: `api/videos.js` serverless function + `data/videos.json` for the old admin video-config flow (`GITHUB_TOKEN` and `ADMIN_PASSWORD` in Vercel env vars). Not currently used by the live site.

## Four panels / sister companies
| id | Name | Role label | Tint | Site / Link |
|---|---|---|---|---|
| producing | The Season | Producing and Marketing Direction | black | `theseason.html` (in-tab navigation) |
| 11oclock | 11 O'Clock Studio | Key art & branding | marigold | https://11oclock.com (new tab) |
| relay | Relay | Influencer Marketing | purple | https://relayinfluence.com (new tab) |
| flyer | Flyer | Creative production | blue | https://flyerweb.com (new tab) |

Panel routing logic: if `href` starts with `http` → open in new tab; otherwise → same-tab navigation.

## Brand identity (from `TheSeason_BrandGuide (1).pdf`)
PDF lives at: `/Users/tartick/Documents/Claude/Projects/TSV/TheSeason_BrandGuide (1).pdf`

**Colors:**
- Spotlight Yellow `#FDB913` — accents, eyebrow labels, project tags, hover state
- Pitch Black `#000` — primary background on theseason.html
- Pure White `#FFFFFF` — primary text on dark
- Brand pattern on dark backgrounds: yellow art/logo + white body text (per brand guide page 34)

**Typography:**
- Source Sans 3 (Google Fonts) loaded at weights 400 + 600 as FreightSans Pro stand-in
- Panel name labels: weight 600 (Semibold), wide tracking
- Panel role labels: weight 400 (Medium), tighter
- Body copy: weight 400

## Local brand assets
All extracted from the brand guide PDF using PyMuPDF + Pillow. All ink-tight cropped (no asymmetric padding) so they center cleanly:

- `/assets/theseason-icon.png` — square icon mark only (homepage center)
- `/assets/theseason-wordmark.png` — "THE SEASON" wordmark text (homepage menu button + close button)
- `/assets/theseason-logo.png` — wide icon+wordmark side-by-side (Marketing by The Season row)
- `/assets/11oclock-logo.png` — wide Eleven O'Clock logo
- `/assets/relay-logo.png` — wide Relay logo
- `/assets/flyer-logo.png` — wide Flyer logo

All logos rendered white on dark via CSS `filter: brightness(0) invert(1)`.

To re-extract or pull more logos:
```python
import fitz, io
from PIL import Image
doc = fitz.open("/Users/tartick/Documents/Claude/Projects/TSV/TheSeason_BrandGuide (1).pdf")
pix = doc[PAGE_INDEX].get_pixmap(matrix=fitz.Matrix(4, 4))
img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGBA")
# Hard-edge mask: keep only r,g,b < 60 → opaque black; rest → transparent
# Then bbox-crop and save
```

Brand guide page indices (0-based):
- 1 = The Season stacked/wide
- 7 = Eleven O'Clock stacked/wide
- 13 = Forest stacked/wide (Forest isn't part of the live site)
- 19 = Flyer stacked/wide
- 24 = Relay stacked/wide

## Videos
- Local `.mp4` files in `/assets/{id}.mp4` — drop file in and push to update
- Rendered grayscale via CSS `filter: grayscale(100%)` — color tints overlay on top
- Compress new files before committing:
  ```
  ffmpeg -i input.mp4 -vf "scale=-2:1080" -c:v libx264 -crf 28 -preset slow -an -movflags +faststart -y output.mp4
  ```
- Current sizes: producing 6.7MB, 11oclock 6.6MB, relay 4.7MB, flyer 1.0MB

## Key implementation notes (homepage)
- RAF scroll loop (not CSS keyframes) — avoids loop-reset compositing glitch on second pass
- Panels doubled in DOM (8 total) for seamless infinite scroll
- `isolation: isolate` on each `.panel` for correct z-index stacking with video elements
- `.video-cover` transparent div above each `<video>` blocks iOS native media control taps
- Mobile mode (`body.mobile-mode`): set by `applyLayout()` on load + resize. Hides `#logo` and `#menu-btn-wrap`, forces `body.expanded` + vertical stack.
- Wordmark offset below icon scales via `top: calc(50% + clamp(48px, 5.5vw + 8px, 100px))` so it tracks the icon's own clamp size

## Key implementation notes (theseason.html)
- Pitch black background — no overlays, no patterns
- Nav: Home (top-left) + Contact (top-right), matching homepage Contact button styling exactly
- About copy: 4 sentences with progressive opacity fade (0.93 → 0.82 → 0.72 → 0.62), S4 is a mailto link in Spotlight Yellow
- "Marketing by The Season" section: 4 logos (Season + 3 sisters) in a holding-box frame (`1px solid rgba(255,255,255,0.10)`). 4 cols desktop → 2 cols mid → 1 col mobile.
- Active Projects list: CATS, Proof, Drama Desk Awards, Mr. Leather 1976 — each linked to its show site

## Preferences
- No PWA / manifest / install prompts — user explicitly doesn't want them
- User supplies video files directly to `/assets/`; commit and push when updated
- Brand guide is the source of truth for typography, color, and logo extraction

## Hosting / uploading files to TheSeason.nyc (e.g. email images, assets)
Use this when you need a public URL for an image or file — for example, hosting images for an
email campaign so they render in recipients' inboxes (data-URI / base64 images get stripped by Gmail).

Steps:
1. Put the file(s) in the repo under `/assets/` (use a subfolder to stay organized, e.g.
   `/assets/email/` for email campaign images).
2. Commit and push to `main`:
   ```
   cd ~/Documents/Claude/tsvwebsite
   git add assets/<your-subfolder>/
   git commit -m "Add <description> assets"
   git push origin main
   ```
3. Vercel auto-deploys on push (no build step). Within ~1 minute the files are live at:
   `https://www.theseason.nyc/assets/<your-subfolder>/<filename>`

Notes:
- Keep filenames URL-safe (lowercase, hyphens, no spaces).
- The Cowork sandbox can stage/commit locally but CANNOT push (no GitHub credentials) —
  run the `git push` from your own terminal, or have Claude commit and then you push.
- Optimize before committing: photos as JPEG (quality ~82), graphics/logos as PNG.
  Email images: ~600px display width is plenty (export ~1200px wide for retina).
- Once live, reference each image in HTML as
  `<img src="https://www.theseason.nyc/assets/<subfolder>/<file>">`.
