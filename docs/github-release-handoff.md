# GitHub Release Handoff

## Version

1.0.65

## Release focus

This release streamlines browser consumption for normal host pages that do not use a bundler.

## Required manual QA

1. Serve the package under `/packages/philippines-location-map-picker/`.
2. Open `/demo/`.
3. Confirm the Reusable Component appears directly above Quick Start.
4. Confirm Final Browser QA Pass is collapsed by default.
5. Confirm long JSON/code boxes scroll vertically.
6. Confirm the UMD quick-start example uses one mount element and no handwritten hidden fields.
7. Confirm form submit creates `barangay_id`, `pin_lat`, `pin_lng`, `location_picker_value_json`, and `location_picker_validation_json`.
8. Confirm static reverse-fill no longer shows the old cached-boundary failure message when a selected barangay can be kept.
