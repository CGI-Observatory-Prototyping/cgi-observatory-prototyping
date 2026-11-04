# CGI Observatory

React/Umi application with 2D city indicators and a 3D population prototype.

## Local development

Use Node.js 22 and pnpm 10.11.0:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Umi manages hash routing. Routes are `/#/map` and `/#/map3d`; `/` redirects
to the 2D map. Keep navigation within Umi's `history`/`Link` APIs.

## GitHub Pages

1. In repository **Settings → Pages → Build and deployment**, select
   **GitHub Actions** as the source.
2. Push the changes to `main`, or run **Deploy to GitHub Pages** manually
   from the Actions tab.
3. The workflow installs locked dependencies, builds `dist/`, and deploys
   that directory with the official GitHub Pages actions.

Expected URLs for this repository:

- https://cgi-observatory-prototyping.github.io/cgi-observatory-prototyping/#/map
- https://cgi-observatory-prototyping.github.io/cgi-observatory-prototyping/#/map3d

Hash routes support direct links, refresh, and browser back/forward without
server rewrites or a custom 404 page. Umi's router `base` stays `/`; do not
set it to the repository name, because the route lives after `#`.
Production `publicPath` is `./`, so HTML assets and lazy-loaded chunks resolve
relative to the site directory, including on a custom domain. Upload the
contents of `dist/` as the site root, not inside an `assets/` directory.

## External map services

GitHub Pages cannot host the tile API. To enable the 2D Population and
Settlement Model overlays, set a repository Actions variable named
`TILE_API_BASE_URL` to the HTTPS base URL of the existing tile server,
for example `https://tiles.example.org` (without `/api/tiles`). Rebuild after
changing it. The server must allow requests from the Pages origin through
CORS and serve `/api/tiles/layer/flat/...`.

For a local production build:

```sh
TILE_API_BASE_URL=https://tiles.example.org pnpm build
```

Without this variable, tile requests retain the same-origin behavior used
in development; those optional overlays will return 404 on GitHub Pages.
The base map and local city indicators do not use that API. Mapbox requires
a usable access token, and any token URL restrictions must allow the deployed
site. The 3D prototype uses its existing external CloudFront sources; their
availability and rendering must be checked separately after deployment.

After deploying, open both hash URLs directly, refresh each, switch views,
and test browser back/forward. Check that JS/CSS requests succeed under the
repository path, then verify the optional map overlays against their services.
