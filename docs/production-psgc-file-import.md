# Production PSGC Flat-File Import

Use this path when the production PSGC hierarchy is available as a local CSV or JSON file instead of being fetched from the network.

The importer replaces the old `tools/import-psgc.js` stub with a real hierarchy importer.

## Supported source shapes

The source may be:

```text
.csv
.json array
.json object with data, items, records, or features
```

The importer auto-detects common columns:

```text
code
psgc_code
psgc
psgc_10_digit_code
correspondence_code
name
area_name
geographic_name
location_name
level
type
geographic_level
geo_level
```

You can override the column names:

```powershell
npm run import-psgc -- --input C:\path\psgc.csv --code-column "PSGC Code" --name-column "Name" --level-column "Geographic Level" --reset 1
```

## Build the production cache from a file

```powershell
cd C:\www\packages\philippines-location-map-picker
npm run build-production-psgc-cache:file -- --input C:\path\to\psgc.csv
npm run refresh-data-reports
npm run check-production-readiness
```

Equivalent explicit form:

```powershell
npm run build-production-psgc-cache -- --source file --input C:\path\to\psgc.csv
```

## Output structure

The importer writes the same static provider structure used by the demo and host apps:

```text
data/psgc/regions.json
data/psgc/provinces/{region_id}.json
data/psgc/cities/{province_or_region_id}.json
data/psgc/barangays/{city_id}.json
data/psgc/import-psgc-report.json
```

Province-less cities are grouped directly under the region file in `data/psgc/cities/{region_id}.json`.

## Release rule

After importing the production hierarchy, run:

```powershell
npm run refresh-data-reports
npm run check-production-readiness
```

The production gate must pass before the package is published as production-ready.

## Validate before importing

File-based production builds now run source validation before import.

You can validate manually:

```powershell
npm run validate-psgc-source -- --input C:\path\to\psgc.csv
```

The validator writes:

```text
data/psgc-source-validation-report.json
```

For parser smoke testing only:

```powershell
npm run smoke-psgc-source
```
