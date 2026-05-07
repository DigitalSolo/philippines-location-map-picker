# Demo Sample Settings Panel

The demo includes a **Sample settings for this page** panel below the hidden-input form preview.

The sample updates whenever these demo controls change:

- scenario
- provider mode
- theme
- size
- density
- display mode
- pin mode
- map size
- debug panel

The panel outputs a host-page starter snippet using `createStaticLocationMapPicker()`. The copied snippet intentionally keeps production host pages on static/backend-served PSGC and geometry data, even when the demo is temporarily set to `live` or `mixed` provider mode for development testing.

The copied sample includes:

- UI settings matching the current demo page
- required location level
- required pin setting
- map sizing and pin mode
- hidden input selector contract
- saved initial value when the active scenario has one
- GeoIP settings when the mock GeoIP scenario is active
- browser location settings

The sample is not a business-rule layer. Host applications must still own account rules, delivery-zone rules, serviceability rules, and save-endpoint validation.
