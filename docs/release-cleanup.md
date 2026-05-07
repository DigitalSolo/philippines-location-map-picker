# Release Cleanup Checklist

This package must keep the release documentation and the browser demo together.

## Required package files

- `README.md` must exist at the package root.
- `docs/*.md` must be present in the releasable source tree.
- `demo/index.html` must load `./demo.js` so the demo works when opened at `/demo/`.
- Root `index.html` must redirect to `/demo/` for local Vite startup.
- `dist/` must be rebuilt from current `src/` before release.

## Verification commands

```bash
npm run build
npm run verify-static-data
```

## Browser checks

- `/` loads without a 404.
- `/demo/` loads without a 404.
- `/demo/demo.js` loads without a 404.
- `/data/psgc/regions.json` loads without a 404.
- The browser console has no package-owned errors during normal static demo startup.

## GitHub publish readiness

Run this before a pilot/demo GitHub push:

```powershell
npm run check-publish-readiness:pilot
```

Run this before a production tag/release:

```powershell
npm run check-publish-readiness
```
