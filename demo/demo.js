import '../src/css/location-map-picker.css';
import {
  LocationMapPicker,
  PsgcCloudProvider,
  StaticGeometryProvider,
  ArcGisBarangayGeometryProvider,
  CompositeLocationProvider,
  createStaticLocationProvider,
  bindLocationMapPickerForm
} from '../src/index.js';

const LIVE_HIERARCHY_LABEL = 'PSGC Cloud v2';
const LIVE_GEOMETRY_LABEL = 'GeoRisk PSA Barangay Boundary ArcGIS layer';
const DEMO_DATA_BASE_URL = new URL('./data', import.meta.url).toString().replace(/\/+$/, '');
const demoDataUrl = (path) => `${DEMO_DATA_BASE_URL}/${String(path || '').replace(/^\/+/, '')}`;
const MISSING_STATIC_DATA_BASE_URL = new URL('./missing-data', import.meta.url).toString().replace(/\/+$/, '');
const DEMO_TILE_URL_TEMPLATE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEMO_TILE_ATTRIBUTION = '© OpenStreetMap contributors';
const PACKAGE_VERSION = '1.0.67';

const STATIC_HIERARCHY_LABEL = 'Static JSON hierarchy from demo-local data/psgc';
const STATIC_GEOMETRY_LABEL = 'Static JSON geometry from demo-local data/geo';

const SAVED_VALUE = {
  location: {
    region_id: '05',
    region_name: 'Region V (Bicol Region)',
    province_id: '0516',
    province_name: 'Camarines Norte',
    city_id: '051611',
    city_name: 'Talisay',
    barangay_id: '051611004',
    barangay_name: 'Poblacion'
  },
  pin: { lat: 14.143, lng: 122.954 }
};

const scenarioSelect = document.getElementById('scenarioMode');
const modeSelect = document.getElementById('providerMode');
const statusEl = document.getElementById('demoStatus');
const themeSelect = document.getElementById('themeMode');
const sizeSelect = document.getElementById('sizeMode');
const densitySelect = document.getElementById('densityMode');
const displayModeSelect = document.getElementById('displayMode');
const pinModeSelect = document.getElementById('pinMode');
const mapSizeSelect = document.getElementById('mapSizeMode');
const debugModeSelect = document.getElementById('debugMode');
const reverseButton = document.getElementById('reverseButton');
const browserLocationButton = document.getElementById('browserLocationButton');
const geoIpButton = document.getElementById('geoIpButton');
const validateButton = document.getElementById('validateButton');
const savedValueButton = document.getElementById('savedValueButton');
const resetDirtyButton = document.getElementById('resetDirtyButton');
const clearButton = document.getElementById('clearButton');
const submitButton = document.getElementById('submitButton');
const demoForm = document.getElementById('demoForm');
const output = document.getElementById('output');
const componentMount = document.getElementById('component');
const qaValidation = document.getElementById('qaValidation');
const qaDirty = document.getElementById('qaDirty');
const qaTouched = document.getElementById('qaTouched');
const qaInteraction = document.getElementById('qaInteraction');
const previewLabel = document.getElementById('previewLabel');
const previewBarangay = document.getElementById('previewBarangay');
const previewPin = document.getElementById('previewPin');
const previewValidity = document.getElementById('previewValidity');
const sampleSettingsOutput = document.getElementById('sampleSettingsOutput');
const copySettingsButton = document.getElementById('copySettingsButton');
const copySettingsStatus = document.getElementById('copySettingsStatus');
const quickStartHtmlOutput = document.getElementById('quickStartHtmlOutput');
const copyQuickStartButton = document.getElementById('copyQuickStartButton');
const quickStartCopyStatus = document.getElementById('quickStartCopyStatus');
const qaRunnerList = document.getElementById('qaRunnerList');
const resetQaButton = document.getElementById('resetQaButton');
const exportQaButton = document.getElementById('exportQaButton');
const exportQaMarkdownButton = document.getElementById('exportQaMarkdownButton');
const qaRunnerStatus = document.getElementById('qaRunnerStatus');
const qaSummaryGrid = document.getElementById('qaSummaryGrid');
const hardeningSummary = document.getElementById('hardeningSummary');
const hardeningGrid = document.getElementById('hardeningGrid');
const coverageSummary = document.getElementById('coverageSummary');
const coverageGrid = document.getElementById('coverageGrid');

let component = null;
let provider = null;
let formBinding = null;
let activeScenario = null;

const state = {
  mode: '',
  hierarchyProvider: '',
  geometryProvider: '',
  runtimeThirdPartyCalls: false,
  geometryNote: '',
  value: null,
  validation: null,
  dirty: null,
  status: null,
  hiddenInputs: {},
  message: '',
  demoOptions: {},
  sampleSettings: {},
  finalQa: {},
  staticCoverage: {}
};

const SCENARIOS = {
  'basic-picker': { provider: 'static', theme: 'light', size: 'comfortable', density: 'normal', display: 'embedded', pin: 'centered', mapSize: 'standard', debug: 'off' },
  'centered-pin-picker': { provider: 'static', theme: 'light', size: 'comfortable', density: 'normal', display: 'embedded', pin: 'centered', mapSize: 'standard', debug: 'on' },
  'free-pin-picker': { provider: 'static', theme: 'light', size: 'comfortable', density: 'normal', display: 'embedded', pin: 'free', mapSize: 'standard', debug: 'on' },
  'static-hierarchy-static-geometry': { provider: 'static', theme: 'light', size: 'comfortable', density: 'normal', display: 'embedded', pin: 'centered', mapSize: 'standard', debug: 'on' },
  'live-hierarchy-live-geometry': { provider: 'live', theme: 'light', size: 'comfortable', density: 'normal', display: 'embedded', pin: 'centered', mapSize: 'standard', debug: 'on' },
  'browser-location-hint': { provider: 'static', theme: 'light', size: 'comfortable', density: 'normal', display: 'embedded', pin: 'centered', mapSize: 'standard', debug: 'on', browserLocation: true },
  'dirty-touched-guard': { provider: 'static', theme: 'light', size: 'comfortable', density: 'normal', display: 'embedded', pin: 'centered', mapSize: 'standard', debug: 'on', initialValue: SAVED_VALUE },
  'sample-settings-copy': { provider: 'static', theme: 'light', size: 'compact', density: 'tight', display: 'embedded', pin: 'centered', mapSize: 'short', debug: 'on' },
  'readonly-saved': { provider: 'static', theme: 'light', size: 'comfortable', density: 'normal', display: 'embedded', pin: 'centered', mapSize: 'standard', debug: 'on', readOnly: true, initialValue: SAVED_VALUE },
  'disabled-saved': { provider: 'static', theme: 'light', size: 'comfortable', density: 'normal', display: 'embedded', pin: 'centered', mapSize: 'standard', debug: 'on', disabled: true, initialValue: SAVED_VALUE },
  'pin-required': { provider: 'static', theme: 'light', size: 'comfortable', density: 'normal', display: 'embedded', pin: 'centered', mapSize: 'standard', debug: 'on', requirePin: true },
  'geoip-hint': { provider: 'static', theme: 'light', size: 'comfortable', density: 'normal', display: 'embedded', pin: 'centered', mapSize: 'standard', debug: 'on', geoIp: true },
  'hidden-inputs': { provider: 'static', theme: 'light', size: 'compact', density: 'tight', display: 'embedded', pin: 'centered', mapSize: 'short', debug: 'on', requirePin: true, initialValue: SAVED_VALUE },
  'dark-compact': { provider: 'static', theme: 'dark', size: 'compact', density: 'tight', display: 'embedded', pin: 'centered', mapSize: 'short', debug: 'on' },
  'modal-tall': { provider: 'static', theme: 'light', size: 'spacious', density: 'relaxed', display: 'modal', pin: 'centered', mapSize: 'tall', debug: 'off' },
  responsive: { provider: 'static', theme: 'light', size: 'comfortable', density: 'normal', display: 'embedded', pin: 'centered', mapSize: 'responsive', debug: 'off' },
  'reverse-no-geometry-match': { provider: 'static', theme: 'light', size: 'comfortable', density: 'normal', display: 'embedded', pin: 'centered', mapSize: 'standard', debug: 'on', initialValue: { location: {}, pin: { lat: 8.0, lng: 125.0 } } },
  'missing-static-files': { provider: 'static', theme: 'light', size: 'comfortable', density: 'normal', display: 'embedded', pin: 'centered', mapSize: 'standard', debug: 'on', missingStaticFiles: true },
  'static-default': { provider: 'static', theme: 'light', size: 'comfortable', density: 'normal', display: 'embedded', pin: 'centered', mapSize: 'standard', debug: 'off' },
  'live-centered': { provider: 'live', theme: 'light', size: 'comfortable', density: 'normal', display: 'embedded', pin: 'centered', mapSize: 'standard', debug: 'on' },
  'live-free': { provider: 'live', theme: 'light', size: 'comfortable', density: 'normal', display: 'embedded', pin: 'free', mapSize: 'standard', debug: 'on' }
};

const QA_STORAGE_KEY = 'philippines-location-map-picker-final-qa-v1';
const QA_CASES = [
  { id: 'basic-picker', title: 'Basic picker', scenario: 'basic-picker', actions: 'Open the picker, choose Region V → Camarines Norte → Talisay → Poblacion, save, then validate.', expected: 'The selected label shows Talisay → Poblacion, auto-created barangay_id is 051611004, and validation passes.' },
  { id: 'centered-pin-picker', title: 'Centered pin picker', scenario: 'centered-pin-picker', actions: 'Pan/zoom the map, place a centered pin, then run reverse-fill from pin.', expected: 'The pin stays centered while moving the map and reverse-fill resolves only when the center point is inside cached geometry.' },
  { id: 'free-pin-picker', title: 'Free pin picker', scenario: 'free-pin-picker', actions: 'Click different map points, drag or replace the pin, then run reverse-fill from pin.', expected: 'The pin follows explicit clicks instead of the map center, and auto-created pin fields update after each placement.' },
  { id: 'static-hierarchy-static-geometry', title: 'Static hierarchy + static geometry', scenario: 'static-hierarchy-static-geometry', actions: 'Load the case, select an address, focus the map, and run reverse-fill.', expected: 'The status indicates no runtime third-party hierarchy/geometry calls and all data loads from local /data files.' },
  { id: 'live-hierarchy-live-geometry', title: 'Live hierarchy + live geometry', scenario: 'live-hierarchy-live-geometry', actions: 'Load the case, confirm the warning, select an address, and run a reverse-fill test when the network is available.', expected: 'The status warns that third-party calls are used; failures are visible and do not silently save bad data.' },
  { id: 'readonly-saved', title: 'Read-only saved address', scenario: 'readonly-saved', actions: 'Try to open, clear, reverse-fill, use browser location, and submit.', expected: 'The saved address is visible, editing actions are locked, and the saved auto-created fields remain stable.' },
  { id: 'disabled-saved', title: 'Disabled saved address', scenario: 'disabled-saved', actions: 'Try every visible control including clear, reverse-fill, saved value, and submit.', expected: 'The component is disabled, cannot be changed, and does not mutate auto-created address or pin values.' },
  { id: 'pin-required', title: 'Validation required pin', scenario: 'pin-required', actions: 'Clear the picker, select only an address, validate, then place a pin and validate again.', expected: 'Validation blocks without a pin and passes after both barangay and pin are present.' },
  { id: 'geoip-hint', title: 'GeoIP hint', scenario: 'geoip-hint', actions: 'Run mock GeoIP hint, inspect the status message, then validate or correct the result.', expected: 'The hint resolves to the sample Talisay/Poblacion context and clearly tells the user to confirm or correct it.' },
  { id: 'browser-location-hint', title: 'Browser location hint', scenario: 'browser-location-hint', actions: 'Click Use browser location from localhost/HTTPS, allow or deny permission, and inspect the status.', expected: 'Permission denial, no-match, and resolved states are all visible; the picker never saves silently without user confirmation.' },
  { id: 'hidden-inputs', title: 'Auto-created form post', scenario: 'hidden-inputs', actions: 'Submit once with the saved value, then clear and submit again.', expected: 'Valid saved data posts through auto-created package fields; invalid or missing required data is blocked by the submit guard.' },
  { id: 'dirty-touched-guard', title: 'Dirty/touched guard', scenario: 'dirty-touched-guard', actions: 'Load saved value, change address or pin, inspect Dirty/Touched cards, then reset dirty baseline.', expected: 'Dirty changes from Clean to Dirty, touched keys identify the changed areas, and reset returns the baseline to Clean.' },
  { id: 'sample-settings-copy', title: 'Sample settings copy panel', scenario: 'sample-settings-copy', actions: 'Change scenario, provider, density, pin mode, and map size, then copy the sample settings.', expected: 'The generated settings mirror the visible page options and use the /packages/philippines-location-map-picker path.' }
];


function getInitialMode() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  return ['static', 'mixed', 'live'].includes(mode) ? mode : 'static';
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function applyScenario(name) {
  const scenario = SCENARIOS[name];
  if (!scenario) {
    activeScenario = {};
    return;
  }
  activeScenario = scenario;
  modeSelect.value = scenario.provider;
  themeSelect.value = scenario.theme;
  sizeSelect.value = scenario.size;
  densitySelect.value = scenario.density;
  displayModeSelect.value = scenario.display;
  pinModeSelect.value = scenario.pin;
  mapSizeSelect.value = scenario.mapSize;
  debugModeSelect.value = scenario.debug;
}

function currentScenario() {
  return scenarioSelect.value === 'custom' ? {} : (activeScenario || SCENARIOS[scenarioSelect.value] || {});
}

function currentDemoOptions() {
  const scenario = currentScenario();
  return {
    scenario: scenarioSelect.value,
    providerMode: modeSelect.value,
    theme: themeSelect.value,
    size: sizeSelect.value,
    density: densitySelect.value,
    displayMode: displayModeSelect.value,
    pinMode: pinModeSelect.value,
    mapSize: mapSizeSelect.value,
    debugPanel: debugModeSelect.value === 'on',
    disabled: scenario.disabled === true,
    readOnly: scenario.readOnly === true,
    requirePin: scenario.requirePin === true,
    geoIpMockEnabled: scenario.geoIp === true,
    browserLocationEnabled: scenario.browserLocation === true,
    initialValue: scenario.initialValue || null
  };
}

function mapSizeOptions(mode) {
  if (mode === 'short') return { mapHeight: 280, mapMinHeight: 220 };
  if (mode === 'tall') return { mapHeight: 560, mapMinHeight: 360 };
  if (mode === 'wide') return { mapHeight: 460, mapWidth: '100%', mapMaxWidth: '1440px' };
  if (mode === 'responsive') return { mapHeight: 'clamp(320px, 52vh, 620px)', mapMinHeight: 280, mapMaxHeight: '70vh' };
  return { mapHeight: sizeSelect.value === 'compact' ? 340 : 420 };
}

function currentPickerStarterSettings() {
  const scenario = currentScenario();
  const settings = {
    providerMode: modeSelect.value,
    dataBaseUrl: '/packages/philippines-location-map-picker/data',
    disabled: scenario.disabled === true,
    readOnly: scenario.readOnly === true,
    ui: {
      displayMode: displayModeSelect.value,
      theme: themeSelect.value,
      size: sizeSelect.value,
      density: densitySelect.value,
      selectedLabelFormat: 'city_barangay',
      className: 'demo-location-instance',
      triggerLabel: 'Philippines address',
      emptyLabel: 'Select City → Barangay',
      title: 'Select address location',
      subtitle: 'Choose Region, Province if applicable, City/Municipality, then Barangay.',
      showDebugPanel: debugModeSelect.value === 'on'
    },
    location: { requiredLevel: 'barangay' },
    validation: {
      requiredLocationLevel: 'barangay',
      requirePin: scenario.requirePin === true
    },
    map: {
      defaultCenter: { lat: 12.8797, lng: 121.7740 },
      defaultZoom: 6,
      pinMode: pinModeSelect.value,
      tileUrlTemplate: DEMO_TILE_URL_TEMPLATE,
      tileAttribution: DEMO_TILE_ATTRIBUTION,
      ...mapSizeOptions(mapSizeSelect.value)
    },
    formBinding: {
      fieldNames: {
        barangay_id: 'barangay_id',
        pin_lat: 'pin_lat',
        pin_lng: 'pin_lng',
        location_picker_value_json: 'location_picker_value_json',
        location_picker_validation_json: 'location_picker_validation_json'
      }
    },
    browserLocation: {
      enabled: scenario.browserLocation === true,
      updateMap: true,
      setPin: false,
      backfill: { enabled: true, maxLevel: 'barangay', reverseGeocode: true }
    }
  };

  if (scenario.initialValue) settings.initialValue = clone(scenario.initialValue);
  if (scenario.geoIp === true) {
    settings.geoIp = {
      enabled: true,
      updateMap: true,
      setPin: false,
      mapZoom: 13,
      backfill: { enabled: true, maxLevel: 'barangay', allowCity: true, allowBarangay: true, reverseGeocode: true },
      confidence: { requireCountry: 'PH', minimumAccuracyLevel: 'city' }
    };
  }

  return settings;
}

function stringifyJsObject(value) {
  return JSON.stringify(value, null, 2).replace(/^  "([A-Za-z_$][A-Za-z0-9_$]*)":/gm, '  $1:').replace(/^    "([A-Za-z_$][A-Za-z0-9_$]*)":/gm, '    $1:').replace(/^      "([A-Za-z_$][A-Za-z0-9_$]*)":/gm, '      $1:').replace(/^        "([A-Za-z_$][A-Za-z0-9_$]*)":/gm, '        $1:').replace(/^          "([A-Za-z_$][A-Za-z0-9_$]*)":/gm, '          $1:');
}

function pickerOptionsSource(settings) {
  const pickerOptions = { ...settings };
  delete pickerOptions.providerMode;
  delete pickerOptions.dataBaseUrl;
  return stringifyJsObject(pickerOptions)
    .replace(/^\{\n/, '')
    .replace(/\n\}$/, '')
    .trimEnd();
}

function sampleSettingsSource() {
  const settings = currentPickerStarterSettings();
  const optionText = pickerOptionsSource(settings);
  const providerNote = settings.providerMode === 'static'
    ? ''
    : `// Current demo provider mode is ${settings.providerMode}. For production host pages, prefer static/backend-served PSGC and geometry data.
`;

  return `${providerNote}const pickerApi = window.PhilippinesLocationMapPicker;
if (!pickerApi || typeof pickerApi.mountStaticLocationMapPicker !== 'function') {
  throw new Error('Philippines Location Map Picker UMD script is not loaded.');
}

const controller = pickerApi.mountStaticLocationMapPicker({
  mount: '#locationPicker',
  baseUrl: '${settings.dataBaseUrl}',
${optionText}
});

controller.picker.on('change', function (value) {
  // Optional: react when the selected address or pin changes.
  console.log('Location picker changed:', value);
});`;
}

function quickStartHtmlSource() {
  return `<!-- Copy dist/ and data/ to /packages/philippines-location-map-picker/ first. -->
<link rel="stylesheet" href="/packages/philippines-location-map-picker/dist/location-map-picker.css">

<form id="deliveryAddressForm" method="post" action="/account/address-save.php">
  <div id="locationPicker"></div>
  <button type="submit">Save address</button>
</form>

<script src="/packages/philippines-location-map-picker/dist/location-map-picker.umd.js"></script>
<script>
(function () {
  const pickerApi = window.PhilippinesLocationMapPicker;
  if (!pickerApi || typeof pickerApi.mountStaticLocationMapPicker !== 'function') {
    throw new Error('Philippines Location Map Picker UMD script is not loaded.');
  }

  pickerApi.mountStaticLocationMapPicker({
    mount: '#locationPicker',
    baseUrl: '/packages/philippines-location-map-picker/data',
    validation: {
      requiredLocationLevel: 'barangay',
      requirePin: true
    },
    map: {
      defaultCenter: { lat: 12.8797, lng: 121.7740 },
      defaultZoom: 6,
      pinMode: 'centered'
    }
  });
})();
</script>`;
}

function renderSampleSettings() {
  const settings = currentPickerStarterSettings();
  state.sampleSettings = settings;
  sampleSettingsOutput.textContent = sampleSettingsSource();
}

function renderQuickStartGuide() {
  if (quickStartHtmlOutput) quickStartHtmlOutput.textContent = quickStartHtmlSource();
}

function fallbackCopyText(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', 'readonly');
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textArea);
  if (!copied) throw new Error('Copy command was not accepted by the browser.');
}

async function copyTextFromElement(sourceEl, buttonEl, statusEl, copiedMessage) {
  const text = sourceEl ? sourceEl.textContent || '' : '';
  if (!text.trim()) return;
  buttonEl.disabled = true;
  statusEl.textContent = 'Copying...';
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') await navigator.clipboard.writeText(text);
    else fallbackCopyText(text);
    statusEl.textContent = copiedMessage || 'Copied.';
  } catch (error) {
    statusEl.textContent = error.message || 'Copy failed.';
  } finally {
    buttonEl.disabled = false;
    window.setTimeout(() => { statusEl.textContent = ''; }, 2400);
  }
}

async function copySampleSettings() {
  return copyTextFromElement(sampleSettingsOutput, copySettingsButton, copySettingsStatus, 'Settings copied.');
}

async function copyQuickStartHtml() {
  return copyTextFromElement(quickStartHtmlOutput, copyQuickStartButton, quickStartCopyStatus, 'Quick start HTML copied.');
}


function readQaResults() {
  try {
    return JSON.parse(localStorage.getItem(QA_STORAGE_KEY) || '{}') || {};
  } catch (error) {
    return {};
  }
}

function writeQaResults(results) {
  localStorage.setItem(QA_STORAGE_KEY, JSON.stringify(results));
  state.finalQa = results;
}

function qaResultFor(id) {
  return readQaResults()[id] || { status: 'untested', updatedAt: '' };
}

function setQaStatus(id, status) {
  const results = readQaResults();
  results[id] = { status, scenario: QA_CASES.find((testCase) => testCase.id === id)?.scenario || '', updatedAt: new Date().toISOString() };
  writeQaResults(results);
  renderQaRunner();
  renderOutput();
}

function loadQaCase(id) {
  const testCase = QA_CASES.find((candidate) => candidate.id === id);
  if (!testCase) return;
  scenarioSelect.value = testCase.scenario;
  applyScenario(testCase.scenario);
  setMessage(`Loaded QA case: ${testCase.title}.`, 'success');
  initializeDemo(modeSelect.value);
}

function renderQaRunner() {
  if (!qaRunnerList) return;
  const results = readQaResults();
  state.finalQa = results;
  const total = QA_CASES.length;
  const passed = QA_CASES.filter((testCase) => qaResultFor(testCase.id).status === 'pass').length;
  const failed = QA_CASES.filter((testCase) => qaResultFor(testCase.id).status === 'fail').length;
  const untested = total - passed - failed;
  if (qaSummaryGrid) {
    qaSummaryGrid.innerHTML = [
      ['Total', total, 'QA cases'],
      ['Passed', passed, 'marked pass'],
      ['Failed', failed, 'needs attention'],
      ['Untested', untested, 'remaining']
    ].map(([label, value, note]) => `<div class="qa-summary-card"><strong>${label}</strong><span>${value}</span><small>${note}</small></div>`).join('');
  }
  qaRunnerList.innerHTML = QA_CASES.map((testCase) => {
    const result = qaResultFor(testCase.id);
    const status = result.status || 'untested';
    const safeStatus = status === 'pass' || status === 'fail' ? status : 'untested';
    const updated = result.updatedAt ? `<span class="qa-runner__badge">${new Date(result.updatedAt).toLocaleString()}</span>` : '';
    return `<article class="qa-runner__case is-${safeStatus}" data-qa-case="${testCase.id}">
      <h3>${testCase.title}</h3>
      <p><strong>Actions:</strong> ${testCase.actions}</p>
      <p><strong>Expected:</strong> ${testCase.expected}</p>
      <div class="qa-runner__actions">
        <span class="qa-runner__badge is-${safeStatus}">${safeStatus}</span>${updated}
        <button class="demo-button demo-button--secondary" type="button" data-qa-load="${testCase.id}">Load case</button>
        <button class="demo-button" type="button" data-qa-pass="${testCase.id}">Pass</button>
        <button class="demo-button demo-button--danger" type="button" data-qa-fail="${testCase.id}">Fail</button>
      </div>
    </article>`;
  }).join('');
}

function resetQaRunner() {
  writeQaResults({});
  renderQaRunner();
  qaRunnerStatus.textContent = 'QA pass reset.';
  window.setTimeout(() => { qaRunnerStatus.textContent = ''; }, 2400);
}

async function exportQaRunnerJson() {
  const payload = {
    generatedAt: new Date().toISOString(),
    packageVersion: PACKAGE_VERSION,
    cases: QA_CASES.map((testCase) => ({ ...testCase, result: qaResultFor(testCase.id) }))
  };
  const text = JSON.stringify(payload, null, 2);
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') await navigator.clipboard.writeText(text);
    else fallbackCopyText(text);
    qaRunnerStatus.textContent = 'QA JSON copied.';
  } catch (error) {
    qaRunnerStatus.textContent = error.message || 'Copy failed.';
  }
  window.setTimeout(() => { qaRunnerStatus.textContent = ''; }, 2400);
}

async function exportQaRunnerMarkdown() {
  const lines = [
    '# Philippines Location Map Picker QA Pass',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Package version: ${PACKAGE_VERSION}`,
    '',
    '| Case | Status | Scenario | Updated |',
    '|---|---:|---|---|'
  ];

  QA_CASES.forEach((testCase) => {
    const result = qaResultFor(testCase.id);
    lines.push(`| ${testCase.title} | ${result.status || 'untested'} | ${testCase.scenario} | ${result.updatedAt || ''} |`);
  });

  const text = lines.join('\n');
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') await navigator.clipboard.writeText(text);
    else fallbackCopyText(text);
    qaRunnerStatus.textContent = 'QA Markdown copied.';
  } catch (error) {
    qaRunnerStatus.textContent = error.message || 'Copy failed.';
  }
  window.setTimeout(() => { qaRunnerStatus.textContent = ''; }, 2400);
}

async function loadHardeningReport() {
  if (!hardeningSummary || !hardeningGrid) return;
  try {
    const response = await fetch(demoDataUrl('production-hardening-report.json'), { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
    const report = response.ok ? await response.json() : null;
    const summary = report?.summary || {};
    hardeningSummary.textContent = report
      ? `Production hardening report: ${summary.passed || 0}/${summary.total || 0} checks passed.`
      : 'Production hardening report could not be loaded.';
    const checks = Array.isArray(report?.checks) ? report.checks : [];
    hardeningGrid.innerHTML = checks.map((item) => `<div class="coverage-card"><strong>${item.label}</strong><span>${item.pass ? 'Pass' : 'Fail'}</span><small>${item.message}</small></div>`).join('');
  } catch (error) {
    hardeningSummary.textContent = error.message || 'Production hardening report could not be loaded.';
    hardeningGrid.innerHTML = '';
  }
}

async function loadStaticCoverage() {
  if (!coverageSummary || !coverageGrid) return;
  try {
    const [staticReportResponse, verificationReportResponse] = await Promise.all([
      fetch(demoDataUrl('static-data-report.json'), { headers: { Accept: 'application/json' }, credentials: 'same-origin' }),
      fetch(demoDataUrl('static-data-verification-report.json'), { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
    ]);
    const staticReport = staticReportResponse.ok ? await staticReportResponse.json() : null;
    const verificationReport = verificationReportResponse.ok ? await verificationReportResponse.json() : null;
    const psgc = staticReport?.psgc?.counts || {};
    const geo = staticReport?.geo?.counts || {};
    const verification = verificationReport?.summary || {};
    const coverage = staticReport?.coverage || {};
    const coverageLevel = coverage.level || 'unknown';
    const productionHierarchyReady = coverage.productionHierarchyReady === true;
    const productionReverseFillReady = coverage.productionReverseFillReady === true;
    state.staticCoverage = { staticReport, verificationReport };
    if (productionReverseFillReady) {
      coverageSummary.textContent = 'Static data report indicates nationwide PSGC hierarchy and nationwide reverse-fill geometry coverage.';
    } else if (productionHierarchyReady) {
      coverageSummary.textContent = 'Static data report indicates nationwide PSGC hierarchy coverage. Reverse-fill is limited to cached geometry areas.';
    } else {
      coverageSummary.textContent = `Static data report indicates ${coverageLevel} coverage. Current bundled data is suitable for demo/pilot verification only, not nationwide production address capture.`;
    }
    const cards = [
      ['Production PSGC', productionHierarchyReady ? 'Ready' : 'Not ready', 'nationwide address selection'],
      ['Production reverse-fill', productionReverseFillReady ? 'Ready' : 'Limited', 'barangay geometry coverage'],
      ['Regions', psgc.regions || 0, 'PSGC rows'],
      ['Provinces', psgc.provinces || 0, 'PSGC rows'],
      ['Cities', psgc.cities || 0, 'PSGC rows'],
      ['Barangays', psgc.barangays || 0, 'PSGC rows'],
      ['Geometry', geo.barangayPolygonFiles || 0, 'polygon files'],
      ['Missing geometry', verification.missingGeometry || 0, 'within cached PSGC']
    ];
    coverageGrid.innerHTML = cards.map(([label, value, note]) => `<div class="coverage-card"><strong>${label}</strong><span>${value}</span><small>${note}</small></div>`).join('');
  } catch (error) {
    coverageSummary.textContent = error.message || 'Static coverage reports could not be loaded.';
    coverageGrid.innerHTML = '';
  }
}

function makeProvider(mode) {
  const scenario = currentScenario();

  if (scenario.missingStaticFiles === true) {
    return {
      provider: createStaticLocationProvider({ baseUrl: MISSING_STATIC_DATA_BASE_URL }),
      hierarchyProvider: 'Missing static hierarchy path',
      geometryProvider: 'Missing static geometry path',
      runtimeThirdPartyCalls: false,
      geometryNote: 'Intentional failure case: Provider load failed because the static data folder is missing.'
    };
  }

  if (mode === 'live') {
    return {
      provider: new CompositeLocationProvider({
        hierarchyProvider: new PsgcCloudProvider({ baseUrl: 'https://psgc.cloud/api/v2' }),
        geometryProvider: new ArcGisBarangayGeometryProvider({
          baseUrl: 'https://portal.georisk.gov.ph/arcgis/rest/services/PSA/Barangay/MapServer/4',
          geometryPrecision: 6
        })
      }),
      hierarchyProvider: LIVE_HIERARCHY_LABEL,
      geometryProvider: LIVE_GEOMETRY_LABEL,
      runtimeThirdPartyCalls: true,
      geometryNote: 'Live mode is development/testing only. Do not use it for checkout or production address saving.'
    };
  }
  if (mode === 'mixed') {
    return {
      provider: new CompositeLocationProvider({
        hierarchyProvider: new PsgcCloudProvider({ baseUrl: 'https://psgc.cloud/api/v2' }),
        geometryProvider: new StaticGeometryProvider({ baseUrl: DEMO_DATA_BASE_URL, reverseFallbackToSelectedLocation: true })
      }),
      hierarchyProvider: LIVE_HIERARCHY_LABEL,
      geometryProvider: STATIC_GEOMETRY_LABEL,
      runtimeThirdPartyCalls: true,
      geometryNote: 'Mixed mode is development/testing only. It uses live PSGC hierarchy with cached geometry.'
    };
  }
  return {
    provider: createStaticLocationProvider({ baseUrl: DEMO_DATA_BASE_URL, reverseFallbackToSelectedLocation: true }),
    hierarchyProvider: STATIC_HIERARCHY_LABEL,
    geometryProvider: STATIC_GEOMETRY_LABEL,
    runtimeThirdPartyCalls: false,
    geometryNote: 'Static mode is the no-database mode. API or hybrid mode is preferred for database-backed production apps.'
  };
}

function setMessage(message, tone = '') {
  state.message = message || '';
  statusEl.textContent = state.message || 'Ready.';
  statusEl.classList.toggle('is-error', tone === 'error');
  statusEl.classList.toggle('is-warning', tone === 'warning');
  statusEl.classList.toggle('is-success', tone === 'success');
}

function readFormFieldValue(name) {
  if (!demoForm || !demoForm.elements || !demoForm.elements[name]) {
    return '';
  }
  return demoForm.elements[name].value || '';
}

function parseJsonValue(value, fallback = {}) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function collectHiddenInputs() {
  const valueJson = readFormFieldValue('location_picker_value_json');
  const validationJson = readFormFieldValue('location_picker_validation_json');
  const value = parseJsonValue(valueJson, {});
  const validation = parseJsonValue(validationJson, {});
  const location = value.location || {};
  const pin = value.pin || null;

  return {
    barangay_id: readFormFieldValue('barangay_id') || location.barangay_id || '',
    label: location.display_label || location.label || '',
    pin_lat: readFormFieldValue('pin_lat') || (pin ? String(pin.lat) : ''),
    pin_lng: readFormFieldValue('pin_lng') || (pin ? String(pin.lng) : ''),
    is_valid: validation.valid === true ? '1' : '0',
    validation_json: validationJson,
    value_json: valueJson
  };
}

function renderQaState() {
  if (!component) return;
  const validation = component.validate();
  const dirty = component.dirtyState();
  const status = component.statusState();
  const options = currentDemoOptions();
  const hidden = collectHiddenInputs();
  state.validation = validation;
  state.dirty = dirty;
  state.status = status;
  state.hiddenInputs = hidden;
  qaValidation.textContent = validation.valid ? 'Valid' : `Missing: ${validation.missing.join(', ') || 'unknown'}`;
  qaDirty.textContent = dirty.dirty ? 'Dirty' : 'Clean';
  qaTouched.textContent = Object.entries(dirty.touched).filter(([, touched]) => touched).map(([key]) => key).join(', ') || 'None';
  qaInteraction.textContent = [options.disabled ? 'Disabled' : '', options.readOnly ? 'Read-only' : '', component.isBusy() ? 'Busy' : 'Interactive'].filter(Boolean).join(' / ');
  previewLabel.value = hidden.label;
  previewBarangay.value = hidden.barangay_id;
  previewPin.value = [hidden.pin_lat, hidden.pin_lng].filter(Boolean).join(', ');
  previewValidity.value = hidden.is_valid === '1' ? 'Valid' : 'Invalid';
}

function renderOutput() {
  renderSampleSettings();
  renderQuickStartGuide();
  if (component) renderQaState();
  output.textContent = JSON.stringify(state, null, 2);
}

function resetState(mode, providerInfo) {
  state.mode = mode;
  state.hierarchyProvider = providerInfo.hierarchyProvider;
  state.geometryProvider = providerInfo.geometryProvider;
  state.runtimeThirdPartyCalls = providerInfo.runtimeThirdPartyCalls;
  state.geometryNote = providerInfo.geometryNote;
  state.value = null;
  state.validation = null;
  state.dirty = null;
  state.status = null;
  state.hiddenInputs = {};
  state.message = '';
  state.demoOptions = currentDemoOptions();
  state.sampleSettings = {};
}

function mockGeoIpLookup() {
  return Promise.resolve({ country_code: 'PH', region_name: 'Region V (Bicol Region)', province_name: 'Camarines Norte', city_name: 'Talisay', barangay_name: 'Poblacion', latitude: 14.143, longitude: 122.954, accuracy_level: 'city' });
}

function updateActionButtons(busy = false) {
  const options = currentDemoOptions();
  const locked = busy || options.disabled || options.readOnly;
  reverseButton.disabled = locked;
  browserLocationButton.disabled = locked;
  geoIpButton.disabled = locked || !options.geoIpMockEnabled;
  validateButton.disabled = busy;
  savedValueButton.disabled = busy || options.disabled || options.readOnly;
  resetDirtyButton.disabled = busy;
  clearButton.disabled = locked;
  submitButton.disabled = busy;
}

async function initializeDemo(mode) {
  const scenario = currentScenario();
  const providerInfo = makeProvider(mode);
  provider = providerInfo.provider;
  resetState(mode, providerInfo);
  setMessage('Loading provider mode...');
  renderOutput();
  if (formBinding && typeof formBinding.destroy === 'function') formBinding.destroy();
  formBinding = null;
  if (component && typeof component.destroy === 'function') component.destroy();
  component = null;
  componentMount.innerHTML = '';
  component = new LocationMapPicker({
    mount: componentMount,
    provider,
    disabled: scenario.disabled === true,
    readOnly: scenario.readOnly === true,
    initialValue: scenario.initialValue ? clone(scenario.initialValue) : null,
    ui: { displayMode: displayModeSelect.value, theme: themeSelect.value, size: sizeSelect.value, density: densitySelect.value, selectedLabelFormat: 'city_barangay', className: 'demo-location-instance', triggerLabel: 'Philippines address', emptyLabel: 'Select City → Barangay', title: 'Select address location', subtitle: 'Choose Region, Province if applicable, City/Municipality, then Barangay.', showDebugPanel: debugModeSelect.value === 'on' },
    location: { requiredLevel: 'barangay' },
    validation: { requiredLocationLevel: 'barangay', requirePin: scenario.requirePin === true },
    map: { defaultCenter: { lat: 12.8797, lng: 121.7740 }, defaultZoom: 6, pinMode: pinModeSelect.value, tileUrlTemplate: DEMO_TILE_URL_TEMPLATE, tileAttribution: DEMO_TILE_ATTRIBUTION, ...mapSizeOptions(mapSizeSelect.value) },
    geoIp: { enabled: scenario.geoIp === true, lookup: mockGeoIpLookup, updateMap: true, setPin: false, mapZoom: 13, backfill: { enabled: true, maxLevel: 'barangay', allowCity: true, allowBarangay: true, reverseGeocode: true }, confidence: { requireCountry: 'PH', minimumAccuracyLevel: 'city' } },
    browserLocation: { enabled: scenario.browserLocation === true, updateMap: true, setPin: false, backfill: { enabled: true, maxLevel: 'barangay', reverseGeocode: true } }
  });
  formBinding = bindLocationMapPickerForm({
    form: demoForm,
    picker: component,
    focusOnBlocked: true,
    onResult: (result) => {
      state.formSubmitResult = result;
    }
  });
  component.on('change', (value) => {
    state.value = value;
    if (formBinding && typeof formBinding.updatePayload === 'function') formBinding.updatePayload();
    renderOutput();
  });
  component.on('busychange', ({ busy, reason }) => { updateActionButtons(busy); document.body.classList.toggle('demo-is-busy', busy); if (busy && reason) setMessage(reason); renderOutput(); });
  component.on('dirtychange', () => renderOutput());
  component.on('statuschange', (status) => { if (status.message) setMessage(status.message, status.level === 'error' ? 'error' : status.level === 'warning' ? 'warning' : status.level === 'success' ? 'success' : ''); renderOutput(); });
  component.on('geoipresolved', (payload) => { state.value = payload.value; setMessage('Mock GeoIP hint resolved. Confirm or correct the result before saving.'); renderOutput(); });
  component.on('geoipnomatch', (payload) => { setMessage(payload.reason || 'Mock GeoIP did not match an administrative boundary.', 'warning'); renderOutput(); });
  component.on('geoiperror', (error) => { setMessage(error.message || 'Mock GeoIP failed.', 'error'); renderOutput(); });
  component.on('browserlocationresolved', (payload) => { state.value = payload.value; setMessage('Browser location resolved. Confirm or correct the result before saving.'); renderOutput(); });
  component.on('browserlocationnomatch', (payload) => { state.value = payload.value || component.value(); setMessage(payload.reason || 'Browser location did not match an administrative boundary.', 'warning'); renderOutput(); });
  component.on('browserlocationerror', (error) => { setMessage(error.message || 'Browser location failed.', 'error'); renderOutput(); });
  try {
    await component.ready;
    state.value = component.value();
    if (formBinding && typeof formBinding.updatePayload === 'function') formBinding.updatePayload();
    const runtimeNote = providerInfo.runtimeThirdPartyCalls ? ' This mode makes third-party calls.' : ' No runtime third-party hierarchy/geometry calls are used.';
    const scenarioNote = scenario.disabled ? ' Disabled saved-address mode is active.' : scenario.readOnly ? ' Read-only saved-address mode is active.' : scenario.requirePin ? ' Pin is required for validation.' : '';
    setMessage(`Ready in ${mode} mode.${runtimeNote}${scenarioNote}`, providerInfo.runtimeThirdPartyCalls ? 'warning' : '');
  } catch (error) { setMessage(`Provider load failed: ${error.message || 'Provider mode could not be loaded.'}`, 'error'); }
  updateActionButtons(false);
  renderOutput();
}

async function requestBrowserLocation() { const payload = await component.requestBrowserLocation(true); state.value = payload ? payload.value : component.value(); renderOutput(); }
async function reverseFillFromPin() { const value = await component.reverseFillFromPin(true); if (!value) { setMessage('Static reverse-fill could not match this pin to cached barangay geometry. Select the barangay manually, keep the pin, or add geometry coverage for this area.', 'warning'); state.value = component.value(); renderOutput(); return; } state.value = value; setMessage(`Reverse-fill matched using ${value.geometry.reverse_match.match_quality || 'geometry'}.`, 'success'); renderOutput(); }
async function runGeoIpHint() { const payload = await component.resolveGeoIpHint(true); state.value = payload ? payload.value : component.value(); renderOutput(); }
function runValidation() { const validation = component.validate(); if (validation.valid) setMessage('Validation passed.', 'success'); else setMessage(`Validation failed: ${validation.messages.join(' ')}`, 'warning'); renderOutput(); }
async function loadSavedValue() { await component.setValue(clone(SAVED_VALUE), true, { resetDirty: true }); setMessage('Saved value loaded and dirty baseline reset.', 'success'); renderOutput(); }
function resetDirtyBaseline() { component.resetDirty(true); setMessage('Dirty baseline reset to the current value.', 'success'); renderOutput(); }
function clearPicker() { component.clear(true); setMessage('Picker cleared.', 'warning'); renderOutput(); }
function simulateSubmit(event) { event.preventDefault(); const validation = component.validate(); if (!validation.valid) { setMessage(`Form submit blocked: ${validation.messages.join(' ')}`, 'warning'); renderOutput(); return; } setMessage('Form submit passed. Hidden fields are ready for posting.', 'success'); renderOutput(); }

const initialMode = getInitialMode();
applyScenario(scenarioSelect.value);
modeSelect.value = initialMode;
scenarioSelect.addEventListener('change', () => { applyScenario(scenarioSelect.value); initializeDemo(modeSelect.value); });
[themeSelect, sizeSelect, densitySelect, displayModeSelect, pinModeSelect, mapSizeSelect, debugModeSelect].forEach((select) => { select.addEventListener('change', () => { scenarioSelect.value = 'custom'; activeScenario = {}; initializeDemo(modeSelect.value); }); });
modeSelect.addEventListener('change', () => { scenarioSelect.value = 'custom'; activeScenario = {}; const url = new URL(window.location.href); url.searchParams.set('mode', modeSelect.value); window.history.replaceState({}, '', url.toString()); initializeDemo(modeSelect.value); });
reverseButton.addEventListener('click', () => { reverseFillFromPin().catch((error) => { setMessage(error.message || 'Reverse-fill failed.', 'error'); renderOutput(); }); });
browserLocationButton.addEventListener('click', () => { requestBrowserLocation().catch((error) => { setMessage(error.message || 'Browser location failed.', 'error'); renderOutput(); }); });
geoIpButton.addEventListener('click', () => { runGeoIpHint().catch((error) => { setMessage(error.message || 'Mock GeoIP failed.', 'error'); renderOutput(); }); });
validateButton.addEventListener('click', runValidation);
savedValueButton.addEventListener('click', () => { loadSavedValue().catch((error) => { setMessage(error.message || 'Saved value could not be loaded.', 'error'); renderOutput(); }); });
resetDirtyButton.addEventListener('click', resetDirtyBaseline);
clearButton.addEventListener('click', clearPicker);
copySettingsButton.addEventListener('click', () => { copySampleSettings().catch((error) => { copySettingsStatus.textContent = error.message || 'Copy failed.'; }); });
copyQuickStartButton.addEventListener('click', () => { copyQuickStartHtml().catch((error) => { quickStartCopyStatus.textContent = error.message || 'Copy failed.'; }); });
qaRunnerList.addEventListener('click', (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target) return;
  const loadId = target.getAttribute('data-qa-load');
  const passId = target.getAttribute('data-qa-pass');
  const failId = target.getAttribute('data-qa-fail');
  if (loadId) loadQaCase(loadId);
  if (passId) setQaStatus(passId, 'pass');
  if (failId) setQaStatus(failId, 'fail');
});
resetQaButton.addEventListener('click', resetQaRunner);
exportQaButton.addEventListener('click', () => { exportQaRunnerJson().catch((error) => { qaRunnerStatus.textContent = error.message || 'Copy failed.'; }); });
if (exportQaMarkdownButton) exportQaMarkdownButton.addEventListener('click', () => { exportQaRunnerMarkdown().catch((error) => { qaRunnerStatus.textContent = error.message || 'Copy failed.'; }); });
demoForm.addEventListener('submit', simulateSubmit);
renderQaRunner();
loadHardeningReport().catch(() => {});
loadStaticCoverage().catch(() => {});
initializeDemo(modeSelect.value);
