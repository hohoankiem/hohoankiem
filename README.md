# Hoan Kiem Lake – introduction page (bilingual Vietnamese / English)

Static website introducing Hoan Kiem Lake: welcome screen, "swarm rebuild" scene (dozens of virtual cursors rebuild the interface), page scrolling animation, Spotify-style SoundCloud music player, map, and images sourced automatically from **Pexels, Unsplash, Pixabay**. Deploy using GitHub Actions to GitHub Pages.

## Image source
The script `scripts/fetch-images.mjs` tries the sources in order (default `pexels,unsplash,pixabay`). If a source is missing a key, is locked (401/403/429) or has no results, it will automatically move to the next source. If no source is available, the page uses a gradient background.

| Source | Secret needs to be created | Get key |
|---|---|---|
| Pexels | `PEXELS_API_KEY` | https://www.pexels.com/api/ |
| Unsplash | `UNSPLASH_ACCESS_KEY` | https://unsplash.com/developers |
| Pixabay | `PIXABAY_API_KEY` | https://pixabay.com/api/docs/ |

- Pexels and Pixabay: images are downloaded to `dist/images`.
- Unsplash: according to API regulations, images are hotlinked from CDN Unsplash and called the download endpoint.
- Author's name and photo source appear in photo captions and footer.

Change the order or use only some sources: Settings → Secrets and variables → Actions → **Variables** tab → create `IMAGE_PROVIDERS`, for example `unsplash,pixabay,pexels`.

Add new source: create `scripts/providers/<name>.mjs` like `pexels.mjs`, declare in `scripts/providers/index.mjs`.

## Runs on GitHub Actions
1. Push the code to the `main` branch.
2. Create secrets in the table above (only need at least one).
3. Settings → Pages → Source: **GitHub Actions**.
4. Push or run the workflow manually on the Actions tab.

## Run locally
```bash
export UNSPLASH_ACCESS_KEY=... # and/or PEXELS_API_KEY, PIXABAY_API_KEY
npm run build
npm start
```

## Structure
- `src/` – HTML, CSS, JS
  - `js/i18n.js`: English translation
  - `js/motion.js`: page scrolling and motion animation
  - `js/rebuild.js`: swarm rebuild scene (blank and then 28 virtual cursors drag frames, type text, align each layer). Press "Skip" or Esc to stop; button in the footer to review
  - `js/player.js` + `css/player.css`: Spotify-style SoundCloud music player
  - `data/music.json`: list of music sources
- `scripts/build.mjs` – copy `src` → `dist`
- `scripts/fetch-images.mjs` + `scripts/providers/` – fetch images; keyword in object `SLOTS`
- `.github/workflows/deploy.yml` – build and deploy

## Music (SoundCloud)
The player uses the SoundCloud Widget API, no API key required. Edit `src/data/music.json` to change the music: each item has a `url` that is a song link, playlist (`/sets/...`) or artist page on SoundCloud. Some articles may be blocked from embedding by their owners; The player then automatically switches to the next source.