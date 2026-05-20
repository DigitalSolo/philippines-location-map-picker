# Provider QA

PLMP now has a small provider QA layer so the picker can be tested without importing a 550 MB location database into the package itself.

The package should be treated as:

```text
picker UI
  -> provider contract
      -> static fixture provider
      -> API/database provider
      -> hybrid provider
```

The host project owns the production database. PLMP owns the UI, provider contract, fixture tools, and reusable PHP adapters.

## Browser QA page

Open the Vite demo and go to:

```text
/demo/provider-qa.html
```

Use it to test:

- `static` mode from `data/fixtures/daet`
- `api` mode from a PHP endpoint
- `hybrid` mode with static dropdown data plus API reverse lookup

The QA page can mount the picker, copy a ready-to-use configuration block, run hierarchy checks, and test reverse lookup from a known pin.

## Static provider smoke test

From the package root:

```cmd
npm run check-provider-contract
```

Equivalent direct command:

```cmd
node tools\check-provider-contract.js --provider=static --base-url=data\fixtures\daet --report=data\provider-contract-report.json
```

This validates the small Daet fixture without a database.

## Fixture API smoke test

Start the built-in PHP server from the package root:

```cmd
npm run serve-fixture-api
```

Then in another terminal:

```cmd
npm run check-fixture-api-contract
```

Equivalent direct command:

```cmd
node tools\check-provider-contract.js ^
  --provider=api ^
  --api-url=http://127.0.0.1:8089/server/php/location-map-picker-fixture-api.example.php ^
  --reverse-lat=14.066 ^
  --reverse-lng=122.917 ^
  --report=data\provider-contract-fixture-api-report.json
```

That proves the same browser API contract can be tested without a MariaDB export.

## Production API smoke test

For Anita's/SukiMart, point the same checker to the host app endpoint:

```cmd
node tools\check-provider-contract.js ^
  --provider=api ^
  --api-url=https://admin.anitas.home.arpa/api/location-map-picker ^
  --region-id=05 ^
  --province-id=05016 ^
  --city-id=0501603 ^
  --reverse-lat=14.066 ^
  --reverse-lng=122.917 ^
  --report=data\provider-contract-anitas-report.json
```

Use the local URL that matches the host app route.

## Recommended endpoint set

The API provider expects these endpoints:

```text
GET  /regions
GET  /provinces?region_id=05
GET  /cities?province_id=05016&region_id=05
GET  /barangays?city_id=0501603
GET  /location?region_id=05&province_id=05016&city_id=0501603&barangay_id=0501603001
GET  /bounds?level=city&id=0501603
GET  /centroid?level=barangay&id=0501603001
GET  /polygon?level=barangay&id=0501603001
POST /reverse
GET  /health
GET  /coverage
```

`health` and `coverage` are technically optional for the browser picker, but they are strongly recommended because they make integration failures obvious.

## Coverage endpoint

The reusable PHP database adapter now exposes:

```text
GET /coverage
```

It returns counts for active barangays, geometry rows, active barangays with geometry, active barangays without geometry, and coverage percentage.

This gives the package a safe way to understand whether reverse lookup failures are caused by missing polygons rather than UI bugs.
