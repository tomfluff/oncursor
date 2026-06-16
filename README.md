# On-Cursor Visual Context — Interactive Demo

Interactive demo accompanying our work on **improving low-vision chart
accessibility via on-cursor visual context**. When low-vision users magnify a
chart, they lose sight of axes, labels, and the legend. These techniques bring
that context to where the cursor is looking.

**Live demo:** https://tomfluff.github.io/oncursor/

## Interaction methods

- **Mini-map** — a scaled-down copy of the whole chart with an indicator of the
  cursor's position.
- **Dynamic Context** — the nearest axis labels and the legend follow the
  cursor, with a crosshair for alignment.

Plus a movable focus box, click-to-pin focus point, and full zoom / pan
magnification — all configurable live.

## Structure

```
frontend/   React + TypeScript (Vite) demo  → GitHub Pages
backend/    Reference chart-analysis proxy   → Cloud Run (optional)
```

The demo is fully self-contained: example charts and their annotations are
bundled, with images in `frontend/public/demo-charts/`. No backend is required
to run or deploy it.

## Run the demo locally

```bash
cd frontend
npm install
npm run dev      # http://localhost:3000
```

## Deploy (GitHub Pages)

Pushing to `main` builds `frontend/` and deploys via
[`.github/workflows/pages.yml`](.github/workflows/pages.yml). Enable Pages in
the repo settings with **Source: GitHub Actions**. The Vite `base` is
`/oncursor/` to match the repo path.

The app uses clean URLs (e.g. `…/oncursor/?viz=…`, and later `…/oncursor/embed`).
On a static host that needs a fallback, so the build copies `index.html` to
`404.html` (see `vite.config.ts`) — GitHub Pages then serves the SPA for any
path, and React Router resolves it client-side.

## Optional: upload & analyze your own chart

The demo includes a disabled-by-default "Upload" control. To enable it, deploy
the reference analyzer in [`backend/`](backend/README.md) (it produces the same
annotation format as the bundled examples) and set, in `frontend/.env`:

```
VITE_ANALYZE_URL=https://<your-cloud-run-service>/analyze
```

The analysis approach (prompt + endpoint) is included as a reference; the API
key stays server-side and is never part of this repo.

## Credits

Created with care by [Yotam Sechayk](https://tomfluff.github.io/).
Project page: https://visual-context.github.io/
