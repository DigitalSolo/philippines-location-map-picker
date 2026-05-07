# PSGC Source Validation

Validate a local PSGC CSV or JSON file before importing it into `data/psgc`.

```powershell
cd C:\www\packages\philippines-location-map-picker
npm run validate-psgc-source -- --input C:\path\to\psgc.csv
```

The validator checks:

```text
required code/name/level fields
PSGC code normalization
duplicate PSGC codes
region/province/city/barangay counts
province parent rows
city/municipality parent rows
barangay parent rows
province-less NCR-style city rows
production minimum thresholds
```

It writes:

```text
data/psgc-source-validation-report.json
```

## Supported input columns

The default importer/validator recognizes common column names:

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

Override columns when the source uses different names:

```powershell
npm run validate-psgc-source -- --input C:\path\to\psgc.csv --code-column "PSGC Code" --name-column "Name" --level-column "Geographic Level"
```

## Smoke test

Run the bundled small smoke file:

```powershell
npm run smoke-psgc-source
```

This only proves that the parser, parent checks, and province-less city support work. It is not production data.

## Production rule

The production file must pass the default thresholds:

```powershell
npm run validate-psgc-source -- --input C:\path\to\psgc.csv
```

Then build the cache from the same source:

```powershell
npm run build-production-psgc-cache:file -- --input C:\path\to\psgc.csv
npm run refresh-data-reports
npm run check-production-readiness
```

## Current production thresholds

Default validation thresholds are centralized in `tools/production-thresholds.js` and currently require:

```text
18 regions
82 provinces
1,642 cities/municipalities
42,010 barangays
```

Override the thresholds only for smoke tests or development fixtures. Do not override them for a production release.
