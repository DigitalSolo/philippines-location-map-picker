# Production Hardening

This package is designed to run without runtime CDN or third-party GIS dependencies in the normal static mode.

## Release checks

- Use static or backend-served PSGC data for production forms.
- Use static or backend-served geometry for reverse-fill.
- Keep delivery-zone, service-area, shipping fee, and vendor business rules in the host application.
- Do not rely on live PSGC or ArcGIS endpoints during checkout or address saving.
- The demo resolves its local data folder relative to `demo/demo.js`, so launching Vite from the package root or from the demo root does not change the demo data contract.
- Missing static files must fail visibly with provider-load messaging instead of silently saving incomplete locations.

## Modal and accessibility guardrails

The picker uses modal APIs and `inert` background handling. Do not add `aria-hidden` to ancestors of focused elements.
