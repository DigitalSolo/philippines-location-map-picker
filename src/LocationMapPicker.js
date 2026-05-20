import { LocationPicker } from './LocationPicker.js';
import { MapPicker } from './MapPicker.js';

const OPTION_EVENT_HANDLERS = {
  change: 'onChange',
  locationchange: 'onLocationChange',
  pinchange: 'onPinChange',
  reversematch: 'onReverseMatch',
  reversenomatch: 'onReverseNoMatch',
  geoipresolved: 'onGeoIpResolved',
  geoipnomatch: 'onGeoIpNoMatch',
  geoiperror: 'onGeoIpError',
  browserlocationresolved: 'onBrowserLocationResolved',
  browserlocationnomatch: 'onBrowserLocationNoMatch',
  browserlocationerror: 'onBrowserLocationError',
  busychange: 'onBusyChange',
  dirtychange: 'onDirtyChange',
  statuschange: 'onStatusChange',
  open: 'onOpen',
  close: 'onClose',
  openchange: 'onOpenChange',
  debug: 'onDebug',
  error: 'onError'
};

function resolveInput(input) {
  if (!input) {
    return null;
  }

  if (typeof input === 'string') {
    return document.querySelector(input);
  }

  return input;
}

function setInput(input, value) {
  const element = resolveInput(input);
  if (!element) {
    return;
  }

  const nextValue = value == null ? '' : String(value);
  if (element.value !== nextValue) {
    element.value = nextValue;
  }
}

function serializeHiddenValue(value) {
  return JSON.stringify(value);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function emptyTouchedState() {
  return {
    location: false,
    pin: false,
    reverse: false,
    geoIp: false,
    browserLocation: false,
    clear: false
  };
}

function serializeComparableValue(value) {
  const normalized = {
    location: normalizeLocation(value.location || {}),
    pin: normalizePin(value.pin),
    geometry: normalizeGeometry(value.geometry || {})
  };

  return JSON.stringify(normalized);
}

function emptyLocation() {
  return {
    region_id: '',
    region_name: '',
    province_id: '',
    province_name: '',
    city_id: '',
    city_name: '',
    barangay_id: '',
    barangay_name: '',
    label: '',
    display_label: ''
  };
}

function normalizeLocation(value = {}) {
  const location = emptyLocation();

  Object.keys(location).forEach((key) => {
    location[key] = value[key] == null ? '' : String(value[key]);
  });

  if (!location.label) {
    location.label = [location.city_name, location.barangay_name].filter(Boolean).join(' → ');
  }

  if (!location.display_label) {
    location.display_label = location.label;
  }

  return location;
}

function normalizePin(value) {
  if (!value) {
    return null;
  }

  const lat = cleanNumber(value.lat);
  const lng = cleanNumber(value.lng);

  if (lat === null || lng === null) {
    return null;
  }

  return { lat, lng };
}

function normalizeReverseMatch(value) {
  if (!value) {
    return null;
  }

  return {
    match_quality: value.match_quality == null ? '' : String(value.match_quality),
    match_distance_km: Number.isFinite(Number(value.match_distance_km)) ? Number(value.match_distance_km) : 0,
    barangay_id: value.barangay_id == null ? '' : String(value.barangay_id),
    barangay_name: value.barangay_name == null ? '' : String(value.barangay_name),
    city_id: value.city_id == null ? '' : String(value.city_id),
    city_name: value.city_name == null ? '' : String(value.city_name)
  };
}

function normalizeGeometry(value = {}) {
  return {
    focus_result: value.focus_result || null,
    reverse_match: normalizeReverseMatch(value.reverse_match),
    reverse_error: value.reverse_error == null ? null : String(value.reverse_error)
  };
}

function normalizeStatus(level = 'idle', message = '', code = '') {
  const allowedLevels = ['idle', 'info', 'success', 'warning', 'error'];
  const nextLevel = cleanToken(level, allowedLevels, 'info');
  const nextMessage = message == null ? '' : String(message);

  return {
    level: nextMessage ? nextLevel : 'idle',
    code: code == null ? '' : String(code),
    message: nextMessage
  };
}


function normalizeDebug(options = {}) {
  return {
    enabled: options.enabled === true,
    maxEvents: Number.isFinite(Number(options.maxEvents)) ? Math.max(1, Number(options.maxEvents)) : 100,
    includeValue: options.includeValue === true,
    echoToConsole: options.echoToConsole === true
  };
}

function normalizeErrorPayload(error, context = {}) {
  const source = error instanceof Error ? error : null;
  const message = String(context.message || (source && source.message) || error || 'Location picker error.');
  const status = cleanNumber(context.status ?? (source && source.status));

  return {
    timestamp: new Date().toISOString(),
    code: String(context.code || (source && source.code) || 'location_picker_error'),
    message,
    source: String(context.source || (source && source.source) || 'location-map-picker'),
    operation: String(context.operation || (source && source.operation) || ''),
    recoverable: context.recoverable !== false,
    provider: String(context.provider || (source && source.provider) || ''),
    method: String(context.method || (source && source.method) || ''),
    status: status === null ? null : status,
    path: String(context.path || (source && source.path) || ''),
    reason: String(context.reason || (source && source.reason) || ''),
    provider_error: Boolean(source && source.provider_error),
    raw_message: source && source.message ? String(source.message) : message
  };
}

function safeDebugPayload(value) {
  if (value == null) {
    return value;
  }

  try {
    return cloneJson(value);
  } catch (error) {
    return String(value);
  }
}

function cleanNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function cleanToken(value, allowed, fallback) {
  const token = String(value || '').trim().toLowerCase();
  return allowed.includes(token) ? token : fallback;
}

function classNames(...parts) {
  return parts
    .flatMap((part) => String(part || '').split(/\s+/))
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ');
}

const DEFAULT_MESSAGES = {
  applyingValue: 'Applying location value.',
  focusBoundaryPolygon: 'Boundary polygon loaded for the selected location.',
  focusBounds: 'Bounds loaded for the selected location. Polygon geometry is not available.',
  focusCentroid: 'Centered on centroid. Boundary geometry is not available.',
  focusNoGeometry: 'No boundary or centroid geometry is available for the selected location.',
  pinPlaced: 'Pin placed. Reverse-fill can match it to cached barangay geometry.',
  reverseDisabled: 'Reverse-fill is disabled.',
  reversePinRequired: 'Drop a pin on the map first.',
  reverseBusy: 'Matching pin to location.',
  busyOverlayDefault: 'Please wait.',
  reverseFailed: 'Reverse geocode failed.',
  setValueFailed: 'Could not apply the location value.',
  invalidConfig: 'Location picker configuration is invalid.',
  providerFailure: 'Location data provider failed.',
  reverseNoMatch: 'Static reverse-fill could not match this pin to cached barangay geometry. Select the barangay manually, keep the pin, or add geometry coverage for this area.',
  reverseMatch: 'Reverse-fill resolved using {match_quality}.',
  geoIpBusy: 'Resolving IP location estimate.',
  geoIpLookupFailed: 'GeoIP lookup failed.',
  geoIpNoResult: 'GeoIP lookup returned no result.',
  geoIpCountryMismatch: 'GeoIP country {country_code} is outside the required country.',
  geoIpLowAccuracy: 'GeoIP accuracy {accuracy_level} is below the required accuracy.',
  geoIpNoAdminMatch: 'IP estimate centered the map, but no administrative location could be matched.',
  geoIpEstimate: 'Estimated from IP. Confirm or correct the location before saving.',
  geoIpMapCentered: 'Centered from IP estimate. Confirm the exact location manually.',
  browserLocationBusy: 'Resolving browser location.',
  browserLocationUnavailable: 'Browser geolocation is not available in this environment.',
  browserLocationFailed: 'Browser location lookup failed.',
  browserLocationPermissionDenied: 'Browser location permission was denied.',
  browserLocationUnavailablePosition: 'Browser location is unavailable.',
  browserLocationTimeout: 'Browser location lookup timed out.',
  browserLocationNoCoordinates: 'Browser location returned no usable coordinates.',
  browserLocationNoAdminMatch: 'Browser location centered the map, but no administrative location could be matched.',
  browserLocationEstimate: 'Estimated from browser location. Confirm or correct the location before saving.',
  browserLocationMapCentered: 'Centered from browser location. Confirm the exact pin before saving.'
};

function normalizeMessages(options = {}) {
  return {
    ...DEFAULT_MESSAGES,
    ...(options || {})
  };
}

function formatMessage(template, replacements = {}) {
  return String(template || '').replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
    if (!Object.prototype.hasOwnProperty.call(replacements, key)) {
      return match;
    }
    const value = replacements[key];
    return value == null ? '' : String(value);
  });
}

function normalizeUi(options = {}) {
  return {
    displayMode: cleanToken(options.displayMode, ['embedded', 'modal'], 'embedded'),
    theme: cleanToken(options.theme, ['light', 'dark', 'auto'], 'light'),
    size: cleanToken(options.size, ['compact', 'comfortable', 'spacious'], 'comfortable'),
    density: cleanToken(options.density, ['tight', 'normal', 'relaxed'], 'normal'),
    selectedLabelFormat: cleanToken(options.selectedLabelFormat, [
      'region_province_city_barangay',
      'province_city_barangay',
      'city_barangay',
      'barangay_only'
    ], 'city_barangay'),
    className: options.className || '',
    locationClassName: options.locationClassName || '',
    mapClassName: options.mapClassName || '',
    messageClassName: options.messageClassName || '',
    modalClassName: options.modalClassName || '',
    triggerLabel: options.triggerLabel || '',
    emptyLabel: options.emptyLabel || '',
    title: options.title || '',
    subtitle: options.subtitle || '',
    triggerActionLabel: options.triggerActionLabel || '',
    saveLabel: options.saveLabel || '',
    cancelLabel: options.cancelLabel || '',
    clearLabel: options.clearLabel || '',
    searchPlaceholder: options.searchPlaceholder || '',
    showCurrentState: options.showCurrentState === true,
    showDebugPanel: options.showDebugPanel === true
  };
}


function normalizeReverse(options = {}) {
  return {
    enabled: options.enabled !== false,
    failOnNoMatch: options.failOnNoMatch === true
  };
}

function normalizeValidation(options = {}, locationRequiredLevel = 'barangay') {
  return {
    requiredLocationLevel: cleanToken(options.requiredLocationLevel || locationRequiredLevel, ['region', 'province', 'city', 'barangay'], 'barangay'),
    requirePin: options.requirePin === true,
    messageRequiredRegion: options.messageRequiredRegion || 'Select a region.',
    messageRequiredProvince: options.messageRequiredProvince || 'Select a province.',
    messageRequiredCity: options.messageRequiredCity || 'Select a city or municipality.',
    messageRequiredBarangay: options.messageRequiredBarangay || 'Select a barangay.',
    messageRequiredPin: options.messageRequiredPin || 'Place a pin on the map.'
  };
}

function normalizeGeoIp(options = {}) {
  const backfill = options.backfill || {};
  const confidence = options.confidence || {};

  return {
    enabled: options.enabled === true,
    endpoint: options.endpoint || '',
    lookup: typeof options.lookup === 'function' ? options.lookup : null,
    fetchOptions: options.fetchOptions || {},
    runOnInit: options.runOnInit === true,
    runOnlyWhenEmpty: options.runOnlyWhenEmpty !== false,
    updateMap: options.updateMap !== false,
    setPin: options.setPin === true,
    mapZoom: Number.isFinite(Number(options.mapZoom)) ? Number(options.mapZoom) : 9,
    backfill: {
      enabled: backfill.enabled !== false,
      maxLevel: cleanToken(backfill.maxLevel, ['country', 'region', 'province', 'city', 'barangay'], 'province'),
      allowCity: backfill.allowCity === true,
      allowBarangay: backfill.allowBarangay === true,
      reverseGeocode: backfill.reverseGeocode === true
    },
    confidence: {
      requireCountry: confidence.requireCountry == null ? 'PH' : String(confidence.requireCountry || '').trim().toUpperCase(),
      minimumAccuracyLevel: cleanToken(confidence.minimumAccuracyLevel, ['country', 'region', 'province', 'city', 'unknown'], 'province')
    }
  };
}


function normalizeBrowserLocation(options = {}) {
  const backfill = options.backfill || {};

  return {
    enabled: options.enabled === true,
    runOnInit: options.runOnInit === true,
    runOnlyWhenEmpty: options.runOnlyWhenEmpty !== false,
    updateMap: options.updateMap !== false,
    setPin: options.setPin === true,
    mapZoom: Number.isFinite(Number(options.mapZoom)) ? Number(options.mapZoom) : 15,
    enableHighAccuracy: options.enableHighAccuracy !== false,
    timeout: Number.isFinite(Number(options.timeout)) ? Number(options.timeout) : 10000,
    maximumAge: Number.isFinite(Number(options.maximumAge)) ? Number(options.maximumAge) : 60000,
    backfill: {
      enabled: backfill.enabled !== false,
      maxLevel: cleanToken(backfill.maxLevel, ['country', 'region', 'province', 'city', 'barangay'], 'barangay'),
      reverseGeocode: backfill.reverseGeocode !== false
    }
  };
}

function normalizeGeoIpResult(value = {}) {
  const lat = cleanNumber(value.lat ?? value.latitude);
  const lng = cleanNumber(value.lng ?? value.longitude);

  return {
    country_code: String(value.country_code || value.countryCode || '').trim().toUpperCase(),
    region_name: String(value.region_name || value.regionName || '').trim(),
    province_name: String(value.province_name || value.provinceName || '').trim(),
    city_name: String(value.city_name || value.cityName || '').trim(),
    barangay_name: String(value.barangay_name || value.barangayName || '').trim(),
    lat,
    lng,
    accuracy_level: cleanToken(value.accuracy_level || value.accuracyLevel, ['country', 'region', 'province', 'city', 'unknown'], 'unknown'),
    raw: value
  };
}


function normalizeBrowserLocationResult(position = {}) {
  const coords = position.coords || {};
  const lat = cleanNumber(coords.latitude);
  const lng = cleanNumber(coords.longitude);

  return {
    lat,
    lng,
    accuracy_meters: cleanNumber(coords.accuracy),
    altitude: cleanNumber(coords.altitude),
    altitude_accuracy_meters: cleanNumber(coords.altitudeAccuracy),
    heading: cleanNumber(coords.heading),
    speed_meters_per_second: cleanNumber(coords.speed),
    timestamp: Number.isFinite(Number(position.timestamp)) ? Number(position.timestamp) : Date.now(),
    raw: position
  };
}

function browserLocationErrorMessage(error, messages = DEFAULT_MESSAGES) {
  const message = (key, fallback) => formatMessage(messages[key] || fallback || key);

  if (!error || typeof error.code !== 'number') {
    return error && error.message ? error.message : message('browserLocationFailed');
  }

  if (error.code === 1) {
    return message('browserLocationPermissionDenied');
  }
  if (error.code === 2) {
    return message('browserLocationUnavailablePosition');
  }
  if (error.code === 3) {
    return message('browserLocationTimeout');
  }
  return error.message || message('browserLocationFailed');
}

function accuracyRank(level) {
  return {
    unknown: 0,
    country: 1,
    region: 2,
    province: 3,
    city: 4
  }[level] || 0;
}

function maxLevelRank(level) {
  return {
    country: 0,
    region: 1,
    province: 2,
    city: 3,
    barangay: 4
  }[level] ?? 2;
}

function normalizeComparableName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(region|province|city|municipality|of|the)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function rowId(row) {
  return String((row && (row.id || row.code)) || '').trim();
}

function rowName(row) {
  return String((row && row.name) || '').trim();
}

function findRowByName(rows, ...names) {
  const needles = names.map(normalizeComparableName).filter(Boolean);
  if (needles.length === 0) {
    return null;
  }

  return (rows || []).find((row) => {
    const haystack = normalizeComparableName(rowName(row));
    return needles.some((needle) => haystack === needle || haystack.includes(needle) || needle.includes(haystack));
  }) || null;
}

function trimLocationToMaxLevel(location = {}, maxLevel = 'province') {
  const rank = maxLevelRank(maxLevel);
  const next = normalizeLocation(location);

  if (rank < 4) {
    next.barangay_id = '';
    next.barangay_name = '';
  }
  if (rank < 3) {
    next.city_id = '';
    next.city_name = '';
  }
  if (rank < 2) {
    next.province_id = '';
    next.province_name = '';
  }
  if (rank < 1) {
    next.region_id = '';
    next.region_name = '';
  }

  const labelParts = [next.city_name, next.barangay_name].filter(Boolean);
  if (rank <= 2) {
    labelParts.length = 0;
    labelParts.push(...[next.province_name, next.region_name].filter(Boolean));
  }
  next.label = labelParts.join(' → ');
  next.display_label = next.label;

  return next;
}

export class LocationMapPicker {
  constructor(options = {}) {
    if (!options.mount) {
      throw new Error('LocationMapPicker requires a mount element.');
    }
    if (!options.provider) {
      throw new Error('LocationMapPicker requires a provider.');
    }

    this.mount = options.mount;
    this.provider = options.provider;
    this.ui = normalizeUi(options.ui || {});
    this.messages = normalizeMessages(options.messages || {});
    this.debugOptions = normalizeDebug(options.debug || {});
    this.hiddenInputs = options.hiddenInputs || {};
    this.mapOptions = options.map || {};
    this.locationOptions = options.location || {};
    this.reverseOptions = normalizeReverse(options.reverse || {});
    this.geoIpOptions = normalizeGeoIp(options.geoIp || {});
    this.browserLocationOptions = normalizeBrowserLocation(options.browserLocation || {});
    this.validationOptions = normalizeValidation(options.validation || {}, this.locationOptions.requiredLevel);
    this.initialValue = options.initialValue || options.value || null;
    this.mapEnabled = this.mapOptions.enabled !== false;
    this.disabled = options.disabled === true;
    this.readOnly = options.readOnly === true || options.readonly === true;
    this.busy = false;
    this.busyReason = '';
    this.dirty = false;
    this.touched = emptyTouchedState();
    this.dirtyBaselineValue = null;
    this.dirtyBaselineKey = '';
    this.optionHandlers = options;
    this.handlers = {};
    this.location = normalizeLocation();
    this.pin = null;
    this.geometry = {
      focus_result: null,
      reverse_match: null,
      reverse_error: null
    };
    this.status = normalizeStatus();
    this.lastError = null;
    this.debugEvents = [];

    this.renderShell();
    this.createChildren();
    this.bindChildren();
    this.ready = this.locationPicker.ready.then(async () => {
      if (this.initialValue) {
        await this.setValue(this.initialValue, false, { resetDirty: true });
      } else {
        this.resetDirty(false);
      }

      if (this.geoIpOptions.enabled && this.geoIpOptions.runOnInit) {
        await this.resolveGeoIpHint(true);
      }
      if (this.browserLocationOptions.enabled && this.browserLocationOptions.runOnInit) {
        await this.resolveBrowserLocationHint(true);
      }
    });
  }

  on(eventName, handler) {
    if (!this.handlers[eventName]) {
      this.handlers[eventName] = [];
    }
    this.handlers[eventName].push(handler);
    return this;
  }

  off(eventName, handler) {
    if (!this.handlers[eventName]) {
      return this;
    }

    if (typeof handler !== 'function') {
      this.handlers[eventName] = [];
      return this;
    }

    this.handlers[eventName] = this.handlers[eventName].filter((candidate) => candidate !== handler);
    return this;
  }

  emit(eventName, payload) {
    if (eventName !== 'debug') {
      this.recordDebugEvent(eventName, payload);
    }

    const optionHandlerName = OPTION_EVENT_HANDLERS[eventName];
    if (optionHandlerName && typeof this.optionHandlers[optionHandlerName] === 'function') {
      this.optionHandlers[optionHandlerName](payload);
    }
    (this.handlers[eventName] || []).forEach((handler) => handler(payload));
  }

  recordDebugEvent(type, payload = {}) {
    if (!this.debugOptions || !this.debugOptions.enabled) {
      return this;
    }

    const entry = {
      timestamp: new Date().toISOString(),
      type: String(type || 'event'),
      payload: safeDebugPayload(payload)
    };

    if (this.debugOptions.includeValue) {
      entry.value = this.value ? safeDebugPayload(this.value()) : null;
    }

    this.debugEvents.push(entry);
    while (this.debugEvents.length > this.debugOptions.maxEvents) {
      this.debugEvents.shift();
    }

    if (this.debugOptions.echoToConsole && typeof console !== 'undefined' && console.debug) {
      console.debug('[LocationMapPicker]', entry.type, entry.payload);
    }

    const optionHandlerName = OPTION_EVENT_HANDLERS.debug;
    if (optionHandlerName && typeof this.optionHandlers[optionHandlerName] === 'function') {
      this.optionHandlers[optionHandlerName](entry);
    }
    (this.handlers.debug || []).forEach((handler) => handler(entry));

    return this;
  }

  debugState() {
    return this.debugEvents.map((entry) => ({ ...entry }));
  }

  clearDebug() {
    this.debugEvents = [];
    this.updateHiddenInputs();
    return this;
  }

  handleError(error, context = {}) {
    const payload = normalizeErrorPayload(error, context);
    this.lastError = payload;
    this.recordDebugEvent('error', payload);
    this.updateHiddenInputs();

    if (context.setStatus !== false) {
      this.setMessage(payload.message, 'error', payload.code);
    }

    this.emit('error', payload);
    return payload;
  }

  renderShell() {
    this.root = document.createElement('div');
    this.root.className = classNames(
      'plmp',
      'ph-location-map-picker',
      'plmp--location-map-picker',
      `plmp--display-${this.ui.displayMode}`,
      `plmp--theme-${this.ui.theme}`,
      `plmp--size-${this.ui.size}`,
      `plmp--density-${this.ui.density}`,
      this.mapEnabled ? 'plmp--map-enabled' : 'plmp--map-disabled',
      this.disabled ? 'is-disabled' : '',
      this.readOnly ? 'is-readonly' : '',
      this.busy ? 'is-busy' : '',
      this.dirty ? 'is-dirty' : '',
      this.status.message ? 'has-status' : '',
      this.status.message ? `has-status-${this.status.level}` : '',
      this.ui.className
    );
    this.root.dataset.theme = this.ui.theme;
    this.root.dataset.size = this.ui.size;
    this.root.dataset.density = this.ui.density;
    this.root.dataset.displayMode = this.ui.displayMode;
    this.root.dataset.disabled = this.disabled ? 'true' : 'false';
    this.root.dataset.readonly = this.readOnly ? 'true' : 'false';
    this.root.dataset.busy = this.busy ? 'true' : 'false';
    this.root.dataset.dirty = this.dirty ? 'true' : 'false';
    this.root.dataset.statusLevel = this.status.level;
    this.root.dataset.statusCode = this.status.code;
    this.root.dataset.debug = this.debugOptions.enabled ? 'true' : 'false';
    this.root.setAttribute('aria-busy', this.busy ? 'true' : 'false');
    this.root.innerHTML = `
      <div class="plmp__picker ph-location-map-picker__picker" data-location-map-picker-location></div>
      <div class="plmp__map ph-location-map-picker__map" data-location-map-picker-map></div>
      <p class="plmp__message ph-location-map-picker__message ${this.ui.messageClassName}" data-location-map-picker-message data-status-level="idle" data-status-code="" hidden></p>
      <div class="plmp__busy-overlay ph-location-map-picker__busy-overlay" data-location-map-picker-busy-overlay hidden>
        <div class="plmp__busy-card ph-location-map-picker__busy-card" role="status" aria-live="polite">
          <span class="plmp__busy-spinner ph-location-map-picker__busy-spinner" aria-hidden="true"></span>
          <span class="plmp__busy-text ph-location-map-picker__busy-text" data-location-map-picker-busy-text>${this.message('busyOverlayDefault')}</span>
        </div>
      </div>
    `;

    this.mount.innerHTML = '';
    this.mount.appendChild(this.root);

    this.locationMount = this.root.querySelector('[data-location-map-picker-location]');
    this.mapMount = this.root.querySelector('[data-location-map-picker-map]');
    this.messageEl = this.root.querySelector('[data-location-map-picker-message]');
    this.busyOverlayEl = this.root.querySelector('[data-location-map-picker-busy-overlay]');
    this.busyTextEl = this.root.querySelector('[data-location-map-picker-busy-text]');
  }

  applyDirtyState() {
    if (!this.root) {
      return this;
    }

    this.root.classList.toggle('is-dirty', this.dirty);
    this.root.dataset.dirty = this.dirty ? 'true' : 'false';
    return this;
  }

  dirtyState() {
    return {
      dirty: this.dirty,
      touched: { ...this.touched },
      baseline: this.dirtyBaselineValue ? cloneJson(this.dirtyBaselineValue) : null,
      value: this.value()
    };
  }

  refreshDirtyState(emitChange = true) {
    const nextDirty = serializeComparableValue(this.value()) !== this.dirtyBaselineKey;
    const previousDirty = this.dirty;
    this.dirty = nextDirty;
    this.applyDirtyState();

    if (emitChange && previousDirty !== this.dirty) {
      this.emit('dirtychange', this.dirtyState());
    }

    return this.dirty;
  }

  markTouched(area, emitChange = true) {
    if (area && Object.prototype.hasOwnProperty.call(this.touched, area)) {
      this.touched[area] = true;
    }
    this.refreshDirtyState(emitChange);
    return this;
  }

  resetDirty(emitChange = true) {
    this.dirtyBaselineValue = this.value();
    this.dirtyBaselineKey = serializeComparableValue(this.dirtyBaselineValue);
    this.touched = emptyTouchedState();
    const previousDirty = this.dirty;
    this.dirty = false;
    this.applyDirtyState();
    this.updateHiddenInputs();

    if (emitChange && previousDirty !== this.dirty) {
      this.emit('dirtychange', this.dirtyState());
    }

    return this;
  }

  isDirty() {
    return this.dirty;
  }

  applyInteractionState() {
    if (!this.root) {
      return this;
    }

    this.root.classList.toggle('is-disabled', this.disabled);
    this.root.classList.toggle('is-readonly', this.readOnly);
    this.root.classList.toggle('is-busy', this.busy);
    this.root.classList.toggle('is-dirty', this.dirty);
    this.root.dataset.disabled = this.disabled ? 'true' : 'false';
    this.root.dataset.readonly = this.readOnly ? 'true' : 'false';
    this.root.dataset.busy = this.busy ? 'true' : 'false';
    this.root.dataset.dirty = this.dirty ? 'true' : 'false';
    this.root.dataset.statusLevel = this.status.level;
    this.root.dataset.statusCode = this.status.code;
    this.root.dataset.debug = this.debugOptions.enabled ? 'true' : 'false';
    this.root.setAttribute('aria-busy', this.busy ? 'true' : 'false');

    if (this.busyOverlayEl) {
      this.busyOverlayEl.hidden = !this.busy;
    }
    if (this.busyTextEl) {
      this.busyTextEl.textContent = this.busyReason || this.message('busyOverlayDefault');
    }

    if (this.locationPicker && typeof this.locationPicker.setDisabled === 'function') {
      this.locationPicker.setDisabled(this.disabled);
    }
    if (this.locationPicker && typeof this.locationPicker.setReadOnly === 'function') {
      this.locationPicker.setReadOnly(this.readOnly);
    }
    if (this.mapPicker && typeof this.mapPicker.setDisabled === 'function') {
      this.mapPicker.setDisabled(this.disabled);
    }
    if (this.mapPicker && typeof this.mapPicker.setReadOnly === 'function') {
      this.mapPicker.setReadOnly(this.readOnly);
    }

    return this;
  }

  applyBusyState() {
    if (!this.root) {
      return this;
    }

    this.root.classList.toggle('is-busy', this.busy);
    this.root.dataset.busy = this.busy ? 'true' : 'false';
    this.root.dataset.busyReason = this.busyReason;
    this.root.setAttribute('aria-busy', this.busy ? 'true' : 'false');

    if (this.busyOverlayEl) {
      this.busyOverlayEl.hidden = !this.busy;
    }
    if (this.busyTextEl) {
      this.busyTextEl.textContent = this.busyReason || this.message('busyOverlayDefault');
    }

    if (this.locationPicker && typeof this.locationPicker.setBusy === 'function') {
      this.locationPicker.setBusy(this.busy, this.busyReason);
    }
    if (this.mapPicker && typeof this.mapPicker.setBusy === 'function') {
      this.mapPicker.setBusy(this.busy, this.busyReason);
    }

    return this;
  }

  setBusy(busy = true, reason = '') {
    const nextBusy = busy === true;
    const nextReason = nextBusy ? String(reason || '') : '';
    const changed = this.busy !== nextBusy || this.busyReason !== nextReason;

    this.busy = nextBusy;
    this.busyReason = nextReason;
    this.applyBusyState();

    if (changed) {
      this.emit('busychange', { busy: this.busy, reason: this.busyReason });
    }

    return this;
  }

  isBusy() {
    return this.busy;
  }

  async runBusy(reason, callback) {
    this.setBusy(true, reason);
    try {
      return await callback();
    } finally {
      this.setBusy(false);
    }
  }

  setDisabled(disabled = true) {
    this.disabled = disabled === true;
    this.applyInteractionState();
    return this;
  }

  setReadOnly(readOnly = true) {
    this.readOnly = readOnly === true;
    this.applyInteractionState();
    return this;
  }

  createChildren() {
    this.locationPicker = new LocationPicker({
      selectedLabelFormat: this.ui.selectedLabelFormat,
      theme: this.ui.theme,
      size: this.ui.size,
      density: this.ui.density,
      className: this.ui.locationClassName,
      modalClassName: this.ui.modalClassName,
      summaryLabel: this.ui.triggerLabel || undefined,
      placeholder: this.ui.emptyLabel || undefined,
      modalTitle: this.ui.title || undefined,
      modalSubtitle: this.ui.subtitle || undefined,
      actionLabel: this.ui.triggerActionLabel || undefined,
      saveLabel: this.ui.saveLabel || undefined,
      cancelLabel: this.ui.cancelLabel || undefined,
      clearLabel: this.ui.clearLabel || undefined,
      searchPlaceholder: this.ui.searchPlaceholder || undefined,
      disabled: this.disabled,
      readOnly: this.readOnly,
      ...this.locationOptions,
      requiredLevel: this.validationOptions.requiredLocationLevel,
      mount: this.locationMount,
      provider: this.provider
    });

    if (this.mapEnabled) {
      this.mapPicker = new MapPicker({
        defaultCenter: { lat: 12.8797, lng: 121.7740 },
        defaultZoom: 6,
        theme: this.ui.theme,
        size: this.ui.size,
        density: this.ui.density,
        className: this.ui.mapClassName,
        disabled: this.disabled,
        readOnly: this.readOnly,
        ...this.mapOptions,
        mount: this.mapMount,
        provider: this.provider
      });
    } else {
      this.mapPicker = null;
      this.mapMount.hidden = true;
    }
  }

  bindChildren() {
    this.locationPicker.on('open', (payload) => {
      this.emit('open', payload || { open: true });
      this.emit('openchange', payload || { open: true });
    });

    this.locationPicker.on('close', (payload) => {
      this.emit('close', payload || { open: false });
      this.emit('openchange', payload || { open: false });
    });

    this.locationPicker.on('change', async (location) => {
      this.location = normalizeLocation(location);
      this.geometry.reverse_match = null;
      this.geometry.reverse_error = null;
      this.geometry.focus_result = this.mapPicker ? await this.mapPicker.focusLocation(this.location) : null;
      this.markTouched('location');
      this.updateHiddenInputs();
      this.setMessage(this.focusMessage(this.geometry.focus_result));
      this.emitChange();
      this.emit('locationchange', { ...this.location });
    });

    if (this.mapPicker) {
      this.mapPicker.on('pinchange', (pin) => {
        this.pin = pin || null;
        this.geometry.reverse_match = null;
        this.geometry.reverse_error = null;
        this.markTouched('pin');
        this.updateHiddenInputs();
        this.setMessage(this.pin ? this.message('pinPlaced') : '');
        this.emitChange();
        this.emit('pinchange', this.pin ? { ...this.pin } : null);
      });
    }
  }

  focusMessage(result) {
    if (!result || !result.id) {
      return '';
    }
    if (result.polygon) {
      return this.message('focusBoundaryPolygon');
    }
    if (result.bounds) {
      return this.message('focusBounds');
    }
    if (result.centroid) {
      return this.message('focusCentroid');
    }
    return this.message('focusNoGeometry');
  }

  applyStatusState() {
    if (!this.root || !this.messageEl) {
      return this;
    }

    const hasStatus = Boolean(this.status.message);
    ['info', 'success', 'warning', 'error'].forEach((level) => {
      this.root.classList.toggle(`has-status-${level}`, hasStatus && this.status.level === level);
    });
    this.root.classList.toggle('has-status', hasStatus);
    this.root.dataset.statusLevel = this.status.level;
    this.root.dataset.statusCode = this.status.code;

    this.messageEl.textContent = this.status.message;
    this.messageEl.dataset.statusLevel = this.status.level;
    this.messageEl.dataset.statusCode = this.status.code;
    this.messageEl.hidden = !hasStatus;
    if (this.status.level === 'error') {
      this.messageEl.setAttribute('role', 'alert');
      this.messageEl.setAttribute('aria-live', 'assertive');
    } else if (hasStatus) {
      this.messageEl.setAttribute('role', 'status');
      this.messageEl.setAttribute('aria-live', 'polite');
    } else {
      this.messageEl.removeAttribute('role');
      this.messageEl.removeAttribute('aria-live');
    }

    return this;
  }

  setStatus(level = 'info', message = '', code = '') {
    if (typeof level === 'object' && level !== null) {
      const next = level;
      level = next.level;
      message = next.message;
      code = next.code;
    }

    const nextStatus = normalizeStatus(level, message, code);
    const changed = this.status.level !== nextStatus.level || this.status.code !== nextStatus.code || this.status.message !== nextStatus.message;
    this.status = nextStatus;
    this.applyStatusState();
    this.updateHiddenInputs();

    if (changed) {
      this.emit('statuschange', this.statusState());
    }

    return this;
  }

  setMessage(message, level = 'info', code = '') {
    return this.setStatus(message ? level : 'idle', message || '', code);
  }

  clearStatus() {
    return this.setStatus('idle', '', '');
  }

  statusState() {
    return { ...this.status };
  }

  message(key, replacements = {}, fallback = '') {
    const template = this.messages[key] || fallback || key;
    return formatMessage(template, replacements);
  }

  updateHiddenInputs() {
    const value = this.value();

    setInput(this.hiddenInputs.regionId, value.location.region_id);
    setInput(this.hiddenInputs.regionName, value.location.region_name);
    setInput(this.hiddenInputs.provinceId, value.location.province_id);
    setInput(this.hiddenInputs.provinceName, value.location.province_name);
    setInput(this.hiddenInputs.cityId, value.location.city_id);
    setInput(this.hiddenInputs.cityName, value.location.city_name);
    setInput(this.hiddenInputs.barangayId, value.location.barangay_id);
    setInput(this.hiddenInputs.barangayName, value.location.barangay_name);
    setInput(this.hiddenInputs.label, value.location.display_label || value.location.label || '');
    setInput(this.hiddenInputs.pinLat, value.pin ? value.pin.lat.toFixed(6) : '');
    setInput(this.hiddenInputs.pinLng, value.pin ? value.pin.lng.toFixed(6) : '');
    setInput(this.hiddenInputs.valueJson, serializeHiddenValue(value));
    setInput(this.hiddenInputs.locationJson, serializeHiddenValue(value.location));
    setInput(this.hiddenInputs.pinJson, serializeHiddenValue(value.pin));
    setInput(this.hiddenInputs.geometryJson, serializeHiddenValue(value.geometry));

    const validation = this.validate();
    setInput(this.hiddenInputs.isValid, validation.valid ? '1' : '0');
    setInput(this.hiddenInputs.validationJson, serializeHiddenValue(validation));
    setInput(this.hiddenInputs.isDirty, this.dirty ? '1' : '0');
    setInput(this.hiddenInputs.dirtyJson, serializeHiddenValue(this.dirtyState()));
    setInput(this.hiddenInputs.touchedJson, serializeHiddenValue(this.touched));
    setInput(this.hiddenInputs.statusLevel, this.status.level);
    setInput(this.hiddenInputs.statusCode, this.status.code);
    setInput(this.hiddenInputs.statusMessage, this.status.message);
    setInput(this.hiddenInputs.statusJson, serializeHiddenValue(this.statusState()));
    setInput(this.hiddenInputs.lastErrorJson, serializeHiddenValue(this.lastError));
    setInput(this.hiddenInputs.debugJson, serializeHiddenValue(this.debugState()));
  }

  value() {
    return {
      location: normalizeLocation(this.location),
      pin: normalizePin(this.pin),
      geometry: normalizeGeometry(this.geometry)
    };
  }

  validate() {
    const value = this.value();
    const location = value.location;
    const requiredRank = maxLevelRank(this.validationOptions.requiredLocationLevel);
    const missing = [];
    const messages = [];

    if (requiredRank >= 1 && !location.region_id) {
      missing.push('region');
      messages.push(this.validationOptions.messageRequiredRegion);
    }

    if (requiredRank === 2 && !location.province_id) {
      missing.push('province');
      messages.push(this.validationOptions.messageRequiredProvince);
    }

    if (requiredRank >= 3 && !location.city_id) {
      missing.push('city');
      messages.push(this.validationOptions.messageRequiredCity);
    }

    if (requiredRank >= 4 && !location.barangay_id) {
      missing.push('barangay');
      messages.push(this.validationOptions.messageRequiredBarangay);
    }

    if (this.validationOptions.requirePin && !value.pin) {
      missing.push('pin');
      messages.push(this.validationOptions.messageRequiredPin);
    }

    return {
      valid: missing.length === 0,
      required_location_level: this.validationOptions.requiredLocationLevel,
      require_pin: this.validationOptions.requirePin,
      missing,
      messages,
      location,
      pin: value.pin
    };
  }

  isValid() {
    return this.validate().valid;
  }

  emitChange() {
    this.emit('change', this.value());
  }

  async setValue(value = {}, emitChange = true, options = {}) {
    return this.runBusy(this.message('applyingValue'), async () => {
      try {
    const nextLocation = value.location || {};
    const nextPin = normalizePin(value.pin);

    this.location = normalizeLocation(await this.locationPicker.setValue(nextLocation, false, nextLocation.resolved ? { hydrate: false } : {}));

    if (nextPin) {
      if (this.mapPicker) {
        this.mapPicker.setPin(nextPin, false, { force: true });
      }
      this.pin = nextPin;
    } else {
      if (this.mapPicker) {
        this.mapPicker.clearPin(false, { force: true });
      }
      this.pin = null;
    }

    this.geometry.reverse_match = null;
    this.geometry.reverse_error = null;
    this.geometry.focus_result = this.mapPicker ? await this.mapPicker.focusLocation(this.location) : null;
    if (options.trackDirty === true) {
      this.markTouched('location', false);
      if (nextPin) {
        this.markTouched('pin', false);
      }
      this.refreshDirtyState(false);
    }

    this.updateHiddenInputs();
    this.setMessage(this.focusMessage(this.geometry.focus_result));

    if (options.resetDirty === true) {
      this.resetDirty(false);
    } else {
      this.refreshDirtyState(false);
    }

    if (emitChange) {
      this.emitChange();
    }

    return this.value();
      } catch (error) {
        this.handleError(error, {
          source: 'value',
          operation: 'setValue',
          code: 'set_value_failed',
          message: error && error.message ? error.message : this.message('setValueFailed')
        });
        throw error;
      }
    });
  }

  async reverseFillFromPin(emitChange = true) {
    if (this.busy) {
      return null;
    }

    if (this.disabled || this.readOnly) {
      return null;
    }

    if (!this.reverseOptions.enabled) {
      this.setMessage(this.message('reverseDisabled'), 'warning', 'reverse_disabled');
      return null;
    }

    if (!this.pin) {
      this.setMessage(this.message('reversePinRequired'), 'warning', 'pin_required');
      return null;
    }

    let location = null;

    this.setMessage(this.message('reverseBusy'), 'info', 'reverse_busy');
    this.setBusy(true, this.message('reverseBusy'));
    try {
      location = await this.provider.reverseGeocode(this.pin.lat, this.pin.lng, this.location);
    } catch (error) {
      const payload = this.handleError(error, {
        source: 'reverse',
        operation: 'reverseGeocode',
        code: 'reverse_geocode_failed',
        message: error && error.message ? error.message : this.message('reverseFailed')
      });
      this.geometry.reverse_match = null;
      this.geometry.reverse_error = payload.message;
      if (emitChange) {
        this.emitChange();
      }
      this.setBusy(false);
      return null;
    }

    if (!location || !location.barangay_id) {
      const error = new Error(this.message('reverseNoMatch'));
      this.geometry.reverse_match = null;
      this.geometry.reverse_error = this.reverseOptions.failOnNoMatch ? error.message : null;
      this.setMessage(error.message, 'warning', 'reverse_no_match');
      if (emitChange) {
        this.emitChange();
      }
      this.emit('reversenomatch', { pin: this.pin ? { ...this.pin } : null, location: { ...this.location } });
      if (this.reverseOptions.failOnNoMatch) {
        this.handleError(error, {
          source: 'reverse',
          operation: 'reverseGeocode',
          code: 'reverse_no_match',
          recoverable: false
        });
        this.setBusy(false);
        throw error;
      }
      this.setBusy(false);
      return null;
    }

    this.location = normalizeLocation(await this.locationPicker.setValue(location, false, { hydrate: false }));
    this.geometry.reverse_match = normalizeReverseMatch(location);
    this.geometry.reverse_error = null;
    this.geometry.focus_result = this.mapPicker ? await this.mapPicker.focusLocation(this.location) : null;
    this.markTouched('reverse');
    this.updateHiddenInputs();
    this.setMessage(this.message('reverseMatch', { match_quality: this.geometry.reverse_match.match_quality || 'geometry' }), 'success', 'reverse_match');

    if (emitChange) {
      this.emitChange();
    }
    this.emit('reversematch', { ...this.geometry.reverse_match });

    const reverseValue = this.value();
    this.setBusy(false);
    return reverseValue;
  }


  hasAnyValue() {
    return Boolean(
      this.location.region_id ||
      this.location.province_id ||
      this.location.city_id ||
      this.location.barangay_id ||
      this.pin
    );
  }

  async lookupGeoIp() {
    if (this.geoIpOptions.lookup) {
      return this.geoIpOptions.lookup();
    }

    if (!this.geoIpOptions.endpoint) {
      throw new Error('GeoIP lookup requires either geoIp.lookup or geoIp.endpoint.');
    }

    if (typeof fetch !== 'function') {
      throw new Error('GeoIP lookup requires fetch support or a custom geoIp.lookup function.');
    }

    const response = await fetch(this.geoIpOptions.endpoint, {
      credentials: 'same-origin',
      ...this.geoIpOptions.fetchOptions
    });

    if (!response.ok) {
      throw new Error(`GeoIP lookup failed with HTTP ${response.status}.`);
    }

    return response.json();
  }

  validateGeoIpResult(result) {
    if (!result) {
      return this.message('geoIpNoResult');
    }

    if (this.geoIpOptions.confidence.requireCountry && result.country_code !== this.geoIpOptions.confidence.requireCountry) {
      return this.message('geoIpCountryMismatch', { country_code: result.country_code || 'unknown' });
    }

    if (accuracyRank(result.accuracy_level) < accuracyRank(this.geoIpOptions.confidence.minimumAccuracyLevel)) {
      return this.message('geoIpLowAccuracy', { accuracy_level: result.accuracy_level || 'unknown' });
    }

    return '';
  }

  async resolveGeoIpLocationByNames(result) {
    if (!this.geoIpOptions.backfill.enabled) {
      return null;
    }

    const maxLevel = this.geoIpOptions.backfill.maxLevel;
    const maxRank = maxLevelRank(maxLevel);
    const regions = await this.provider.getRegions().catch(() => []);
    let region = findRowByName(regions, result.region_name);
    let province = null;

    if (!region && result.province_name) {
      for (const candidateRegion of regions) {
        const candidateProvinces = await this.provider.getProvinces(rowId(candidateRegion)).catch(() => []);
        const candidateProvince = findRowByName(candidateProvinces, result.province_name);
        if (candidateProvince) {
          region = candidateRegion;
          province = candidateProvince;
          break;
        }
      }
    }

    if (!region) {
      return null;
    }

    const location = {
      region_id: rowId(region),
      region_name: rowName(region),
      province_id: '',
      province_name: '',
      city_id: '',
      city_name: '',
      barangay_id: '',
      barangay_name: ''
    };

    if (maxRank < 2) {
      return trimLocationToMaxLevel(location, maxLevel);
    }

    if (!province) {
      const provinces = await this.provider.getProvinces(location.region_id).catch(() => []);
      province = findRowByName(provinces, result.province_name);
    }

    if (province) {
      location.province_id = rowId(province);
      location.province_name = rowName(province);
    }

    if (maxRank < 3 || !this.geoIpOptions.backfill.allowCity || !result.city_name) {
      return trimLocationToMaxLevel(location, maxLevel);
    }

    const cityParentId = location.province_id || location.region_id;
    const cities = await this.provider.getCities(cityParentId, {
      region_id: location.region_id,
      province_id: location.province_id
    }).catch(() => []);
    const city = findRowByName(cities, result.city_name);

    if (city) {
      location.city_id = rowId(city);
      location.city_name = rowName(city);
    }

    if (maxRank >= 4 && this.geoIpOptions.backfill.allowBarangay && location.city_id && result.barangay_name) {
      const barangays = await this.provider.getBarangays(location.city_id, {
        region_id: location.region_id,
        region_name: location.region_name,
        province_id: location.province_id,
        province_name: location.province_name,
        city_id: location.city_id,
        city_name: location.city_name
      }).catch(() => []);
      const barangay = findRowByName(barangays, result.barangay_name);
      if (barangay) {
        location.barangay_id = rowId(barangay);
        location.barangay_name = rowName(barangay);
      }
    }

    return trimLocationToMaxLevel(location, maxLevel);
  }

  async resolveGeoIpLocationByReverse(result) {
    if (!this.geoIpOptions.backfill.enabled || !this.geoIpOptions.backfill.reverseGeocode || typeof this.provider.reverseGeocode !== 'function') {
      return null;
    }

    if (result.lat === null || result.lng === null) {
      return null;
    }

    const location = await this.provider.reverseGeocode(result.lat, result.lng, this.location).catch(() => null);
    return location ? trimLocationToMaxLevel(location, this.geoIpOptions.backfill.maxLevel) : null;
  }

  async resolveGeoIpHint(emitChange = true) {
    if (this.busy) {
      return null;
    }

    if (this.disabled || this.readOnly) {
      return null;
    }

    if (!this.geoIpOptions.enabled) {
      return null;
    }

    if (this.geoIpOptions.runOnlyWhenEmpty && this.hasAnyValue()) {
      return null;
    }

    let result;
    this.setBusy(true, this.message('geoIpBusy'));
    try {
      result = normalizeGeoIpResult(await this.lookupGeoIp());
    } catch (error) {
      const payload = this.handleError(error, {
        source: 'geoip',
        operation: 'lookupGeoIp',
        code: 'geoip_lookup_failed',
        message: error && error.message ? error.message : this.message('geoIpLookupFailed')
      });
      this.emit('geoiperror', payload);
      this.setBusy(false);
      return null;
    }

    const validationError = this.validateGeoIpResult(result);
    if (validationError) {
      this.setMessage(validationError, 'warning', 'geoip_no_match');
      this.emit('geoipnomatch', { result, reason: validationError });
      this.setBusy(false);
      return null;
    }

    if (this.mapPicker && this.geoIpOptions.updateMap && result.lat !== null && result.lng !== null) {
      if (this.geoIpOptions.setPin) {
        this.mapPicker.setPin({ lat: result.lat, lng: result.lng }, false);
        this.pin = { lat: result.lat, lng: result.lng };
      } else if (typeof this.mapPicker.setCenter === 'function') {
        this.mapPicker.setCenter(
          { lat: result.lat, lng: result.lng },
          this.geoIpOptions.mapZoom,
          this.message('geoIpMapCentered')
        );
      }
    }

    let location = await this.resolveGeoIpLocationByNames(result);
    if (!location || (!location.province_id && this.geoIpOptions.backfill.maxLevel === 'province')) {
      location = await this.resolveGeoIpLocationByReverse(result) || location;
    }

    if (!location || (!location.region_id && !location.province_id && !location.city_id && !location.barangay_id)) {
      this.setMessage(this.message('geoIpNoAdminMatch'), 'warning', 'geoip_no_admin_match');
      this.updateHiddenInputs();
      if (emitChange) {
        this.emitChange();
      }
      const payload = { result, location: null, value: this.value() };
      this.emit('geoipnomatch', { result, reason: 'No administrative location matched.' });
      this.setBusy(false);
      return payload;
    }

    this.location = normalizeLocation(await this.locationPicker.setValue(location, false, { hydrate: false }));
    this.geometry.reverse_match = null;
    this.geometry.reverse_error = null;
    this.geometry.focus_result = this.mapPicker ? await this.mapPicker.focusLocation(this.location) : null;
    this.markTouched('geoIp');
    this.updateHiddenInputs();
    this.setMessage(this.message('geoIpEstimate'), 'info', 'geoip_estimate');

    if (emitChange) {
      this.emitChange();
    }

    const payload = { result, location: { ...this.location }, value: this.value() };
    this.emit('geoipresolved', payload);
    this.setBusy(false);
    return payload;
  }


  lookupBrowserLocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation || typeof navigator.geolocation.getCurrentPosition !== 'function') {
      throw new Error(this.message('browserLocationUnavailable'));
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: this.browserLocationOptions.enableHighAccuracy,
        timeout: this.browserLocationOptions.timeout,
        maximumAge: this.browserLocationOptions.maximumAge
      });
    });
  }

  async resolveBrowserLocationByReverse(result) {
    if (!this.browserLocationOptions.backfill.enabled || !this.browserLocationOptions.backfill.reverseGeocode || typeof this.provider.reverseGeocode !== 'function') {
      return null;
    }

    if (result.lat === null || result.lng === null) {
      return null;
    }

    const location = await this.provider.reverseGeocode(result.lat, result.lng, this.location).catch(() => null);
    return location ? trimLocationToMaxLevel(location, this.browserLocationOptions.backfill.maxLevel) : null;
  }

  async resolveBrowserLocationHint(emitChange = true, force = false) {
    if (this.busy) {
      return null;
    }

    if (this.disabled || this.readOnly) {
      return null;
    }

    if (!this.browserLocationOptions.enabled && !force) {
      return null;
    }

    if (!force && this.browserLocationOptions.runOnlyWhenEmpty && this.hasAnyValue()) {
      return null;
    }

    let result;
    this.setBusy(true, this.message('browserLocationBusy'));
    try {
      result = normalizeBrowserLocationResult(await this.lookupBrowserLocation());
    } catch (error) {
      const message = browserLocationErrorMessage(error, this.messages);
      const payload = this.handleError(error, {
        source: 'browser-location',
        operation: 'getCurrentPosition',
        code: 'browser_location_failed',
        message
      });
      this.emit('browserlocationerror', payload);
      this.setBusy(false);
      return null;
    }

    if (result.lat === null || result.lng === null) {
      const reason = this.message('browserLocationNoCoordinates');
      this.setMessage(reason, 'warning', 'browser_location_no_coordinates');
      this.emit('browserlocationnomatch', { result, reason });
      this.setBusy(false);
      return null;
    }

    if (this.mapPicker && this.browserLocationOptions.updateMap) {
      if (this.browserLocationOptions.setPin) {
        this.mapPicker.setPin({ lat: result.lat, lng: result.lng }, false);
        this.pin = { lat: result.lat, lng: result.lng };
      } else if (typeof this.mapPicker.setCenter === 'function') {
        this.mapPicker.setCenter(
          { lat: result.lat, lng: result.lng },
          this.browserLocationOptions.mapZoom,
          this.message('browserLocationMapCentered')
        );
      }
    }

    const location = await this.resolveBrowserLocationByReverse(result);

    if (!location || (!location.region_id && !location.province_id && !location.city_id && !location.barangay_id)) {
      this.setMessage(this.message('browserLocationNoAdminMatch'), 'warning', 'browser_location_no_admin_match');
      this.updateHiddenInputs();
      if (emitChange) {
        this.emitChange();
      }
      const payload = { result, location: null, value: this.value() };
      this.emit('browserlocationnomatch', { result, reason: 'No administrative location matched.' });
      this.setBusy(false);
      return payload;
    }

    this.location = normalizeLocation(await this.locationPicker.setValue(location, false, { hydrate: false }));
    this.geometry.reverse_match = null;
    this.geometry.reverse_error = null;
    this.geometry.focus_result = this.mapPicker ? await this.mapPicker.focusLocation(this.location) : null;
    this.markTouched('browserLocation');
    this.updateHiddenInputs();
    this.setMessage(this.message('browserLocationEstimate'), 'info', 'browser_location_estimate');

    if (emitChange) {
      this.emitChange();
    }

    const payload = { result, location: { ...this.location }, value: this.value() };
    this.emit('browserlocationresolved', payload);
    this.setBusy(false);
    return payload;
  }

  requestBrowserLocation(emitChange = true) {
    return this.resolveBrowserLocationHint(emitChange, true);
  }

  clear(emitChange = true) {
    if (this.busy || this.disabled || this.readOnly) {
      return;
    }

    this.locationPicker.clear(false, { force: true });
    if (this.mapPicker) {
      this.mapPicker.clearPin(false, { force: true });
    }
    this.location = normalizeLocation();
    this.pin = null;
    this.geometry.focus_result = null;
    this.geometry.reverse_match = null;
    this.geometry.reverse_error = null;
    this.markTouched('clear');
    this.updateHiddenInputs();
    this.clearStatus();

    if (emitChange) {
      this.emitChange();
    }
  }

  resize() {
    if (this.mapPicker && typeof this.mapPicker.resize === 'function') {
      this.mapPicker.resize();
    }
    return this;
  }

  setSize(options = {}) {
    this.mapOptions = {
      ...this.mapOptions,
      ...(options || {})
    };

    if (this.mapPicker && typeof this.mapPicker.setSize === 'function') {
      this.mapPicker.setSize(options || {});
    } else {
      this.resize();
    }

    return this;
  }

  open() {
    if (this.locationPicker && typeof this.locationPicker.open === 'function') {
      this.locationPicker.open();
    }
    return this;
  }

  close() {
    if (this.locationPicker && typeof this.locationPicker.close === 'function') {
      this.locationPicker.close();
    }
    return this;
  }

  isOpen() {
    return Boolean(this.locationPicker && this.locationPicker.modalEl && !this.locationPicker.modalEl.hidden);
  }

  destroy() {
    if (this.locationPicker && typeof this.locationPicker.destroy === 'function') {
      this.locationPicker.destroy();
    }

    if (this.mapPicker && typeof this.mapPicker.destroy === 'function') {
      this.mapPicker.destroy();
    }

    this.handlers = {};
    this.mount.innerHTML = '';
    document.documentElement.classList.remove('plmp-modal-open');
  }

}
