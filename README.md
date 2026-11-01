# On-Cursor Visual Context — Interactive Demo

Interactive demo accompanying our work on **improving low-vision chart
accessibility via on-cursor visual context**. When low-vision users magnify a
chart, they lose sight of axes, labels, and the legend. These techniques bring
that context to where the cursor is looking.

**Live demo:** https://visual-context.github.io/app/

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
backend/    Reference chart-analysis proxy   (not used by the demo)
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

## Build & deploy

Pushing to `main` builds `frontend/` and publishes it to
[visual-context.github.io/app](https://visual-context.github.io/app/) via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). The source lives
here; the workflow pushes the build to the `gh-pages` branch of
`visual-context/app`, using an SSH deploy key stored as the `APP_DEPLOY_KEY`
secret. The Vite `base` is `/app/` to match that path.

The app uses clean URLs (e.g. `…/app/?viz=…`, and later `…/app/embed`). On a
static host that needs a fallback, so the build copies `index.html` to
`404.html` (see `vite.config.ts`). GitHub Pages then serves the SPA for any path,
and React Router resolves it client-side.

## Upload your own chart

Choose **Upload your own…** in the Chart Library, then drag boxes around the
chart's horizontal axis, vertical axis, and legend. Dynamic Context shows the
parts you mark; Mini-map and magnification work without any boxes. This all
happens in the browser, and the image is never sent anywhere.

## Reference: AI chart analysis

[`backend/`](backend/README.md) holds an AI chart-analysis service that produces
the same annotation format as the bundled examples. The demo doesn't call it.
It's kept as a reference for automating annotation, and the API key stays
server-side.

## Example charts

The bundled example charts are based on the Mini-VLAT and VLAT visualization
literacy assessments. We recreated all of the charts manually.

- S. Pandey and A. Ottley. [Mini-VLAT: A Short and Effective Measure of
  Visualization Literacy](https://doi.org/10.1111/cgf.14809). *Computer Graphics
  Forum* 42(3), 2023.
- S. Lee, S.-H. Kim, and B. C. Kwon. [VLAT: Development of a Visualization
  Literacy Assessment Test](https://doi.org/10.1109/TVCG.2016.2598920). *IEEE
  Transactions on Visualization and Computer Graphics* 23(1), 2017.

## Citation

If you use this work, please cite:

```bibtex
@inproceedings{sechayk2026ChartAccessibility,
author = {Sechayk, Yotam and Rave, Hennes and R\"adler, Max and Colley, Mark and Zhou, Zhongyi and Shamir, Ariel and Igarashi, Takeo},
title = {Improving Low-Vision Chart Accessibility via On-Cursor Visual Context},
year = {2026},
month = {April},
publisher = {Association for Computing Machinery},
address = {New York, NY, USA},
location = {Barcelona, Spain},
url = {https://doi.org/10.1145/3772318.3791165},
doi = {10.1145/3772318.3791165},
booktitle = {Proceedings of the 2026 CHI Conference on Human Factors in Computing Systems (CHI '26)},
numpages = {21},
series = {CHI '26}
}
```

## License

[AGPL-3.0](LICENSE). Because it's network-served software, the app links back to
this source from its header, which is what the AGPL asks of a hosted app.

## Credits

Created with care by [Yotam Sechayk](https://sechayk.com/).
Project page: https://visual-context.github.io/
