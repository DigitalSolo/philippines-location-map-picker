import { boundsCenter, normalizeBounds } from './geo/bounds.js';

const TILE_SIZE = 256;
const EARTH_CIRCUMFERENCE_KM = 40075.016686;


function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toRadians(degrees) {
  return degrees * Math.PI / 180;
}

function toDegrees(radians) {
  return radians * 180 / Math.PI;
}

function latLngToPixel(lat, lng, zoom) {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const sinLat = Math.sin(toRadians(clamp(lat, -85.05112878, 85.05112878)));

  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale
  };
}

function pixelToLatLng(x, y, zoom) {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const lng = x / scale * 360 - 180;
  const n = Math.PI - 2 * Math.PI * y / scale;
  const lat = toDegrees(Math.atan(Math.sinh(n)));

  return { lat, lng };
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');
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


function normalizePositiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.round(number) : fallback;
}

function normalizeZoom(value, fallback) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : fallback;
}

function normalizePositiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function normalizeCssLength(value, fallback = null) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ? `${value}px` : fallback;
  }

  const text = String(value).trim();
  if (!text) {
    return fallback;
  }

  if (text === 'auto') {
    return text;
  }

  if (/^(?:\d+|\d*\.\d+)(?:px|rem|em|%|vh|vw|vmin|vmax|dvh|svh|lvh)$/i.test(text)) {
    return text;
  }

  if (/^(?:calc|clamp|min|max)\([^;{}]+\)$/i.test(text)) {
    return text;
  }

  return fallback;
}

function normalizeAspectRatio(value, fallback = null) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? String(value) : fallback;
  }

  const text = String(value).trim();
  if (!text) {
    return fallback;
  }

  if (text === 'auto') {
    return text;
  }

  if (/^(?:\d+|\d*\.\d+)(?:\s*\/\s*(?:\d+|\d*\.\d+))?$/.test(text)) {
    return text;
  }

  return fallback;
}

function zoomForVisibleWidthKm(lat, canvasWidth, visibleWidthKm, minZoom, maxZoom) {
  const width = Math.max(Number(canvasWidth) || 0, 320);
  const targetKm = normalizePositiveNumber(visibleWidthKm, 800);
  const latitudeFactor = Math.max(Math.cos(toRadians(clamp(lat, -85.05112878, 85.05112878))), 0.01);

  for (let zoom = maxZoom; zoom >= minZoom; zoom--) {
    const worldPixels = TILE_SIZE * Math.pow(2, zoom);
    const kmPerPixel = (EARTH_CIRCUMFERENCE_KM * latitudeFactor) / worldPixels;
    const visibleKm = kmPerPixel * width;

    if (visibleKm >= targetKm) {
      return zoom;
    }
  }

  return minZoom;
}

function zoomForLevel(level, options = {}) {
  if (level === 'barangay') {
    return Number.isFinite(options.selectedZoom) ? options.selectedZoom : 15;
  }
  if (level === 'city') {
    return Number.isFinite(options.cityZoom) ? options.cityZoom : 12;
  }
  if (level === 'province') {
    return Number.isFinite(options.provinceZoom) ? options.provinceZoom : 9;
  }
  return Number.isFinite(options.regionZoom) ? options.regionZoom : 7;
}

export class MapPicker {
  constructor(options = {}) {
    if (!options.mount) {
      throw new Error('MapPicker requires a mount element.');
    }

    this.mount = options.mount;
    this.provider = options.provider || null;
    this.tileUrlTemplate = options.tileUrlTemplate == null ? '' : String(options.tileUrlTemplate).trim();
    this.tileAttribution = options.tileAttribution == null ? '' : String(options.tileAttribution).trim();
    this.minZoom = Number.isFinite(options.minZoom) ? options.minZoom : 5;
    this.maxZoom = Number.isFinite(options.maxZoom) ? options.maxZoom : 19;
    this.zoom = Number.isFinite(options.defaultZoom) ? options.defaultZoom : 11;
    this.center = options.defaultCenter || { lat: 14.17, lng: 122.83 };
    this.pin = options.defaultPin || null;
    this.polygon = null;
    this.handlers = {};
    this.theme = cleanToken(options.theme, ['light', 'dark', 'auto'], 'light');
    this.size = cleanToken(options.size, ['compact', 'comfortable', 'spacious'], 'comfortable');
    this.density = cleanToken(options.density, ['tight', 'normal', 'relaxed'], 'normal');
    this.className = options.className || '';
    this.disabled = options.disabled === true;
    this.readOnly = options.readOnly === true || options.readonly === true;
    this.busy = options.busy === true;
    this.busyReason = '';
    this.statusText = options.statusText || 'Click the map to place the pin.';
    this.showStatus = options.showStatus !== false;
    this.clickToPlacePin = options.clickToPlacePin !== false;
    this.pinDraggable = options.pinDraggable !== false;
    this.mouseWheelZoomCentered = options.mouseWheelZoomCentered !== false;
    this.showBoundary = options.showBoundary !== false;
    this.fitBoundaryOnSelection = options.fitBoundaryOnSelection !== false;
    this.boundaryPadding = normalizePositiveInteger(options.boundaryPadding, 24);
    this.selectedZoom = Number.isFinite(Number(options.selectedZoom)) ? Number(options.selectedZoom) : 15;
    this.cityZoom = Number.isFinite(Number(options.cityZoom)) ? Number(options.cityZoom) : 12;
    this.provinceZoom = Number.isFinite(Number(options.provinceZoom)) ? Number(options.provinceZoom) : 9;
    this.regionZoom = Number.isFinite(Number(options.regionZoom)) ? Number(options.regionZoom) : 7;
    this.centerOnPin = options.centerOnPin !== false;
    this.pinMode = cleanToken(options.pinMode, ['centered', 'free'], options.lockPinToCenter === false ? 'free' : 'centered');
    this.firstPinVisibleWidthKm = normalizePositiveNumber(options.firstPinVisibleWidthKm, 800);
    this.firstPinZoom = normalizeZoom(options.firstPinZoom, null);
    this.zoomOnFirstPin = options.zoomOnFirstPin !== false;
    this.mapHeight = normalizeCssLength(options.mapHeight ?? options.height, null);
    this.mapMinHeight = normalizeCssLength(options.mapMinHeight ?? options.minHeight, null);
    this.mapMaxHeight = normalizeCssLength(options.mapMaxHeight ?? options.maxHeight, null);
    this.mapWidth = normalizeCssLength(options.mapWidth ?? options.width, null);
    this.mapMinWidth = normalizeCssLength(options.mapMinWidth ?? options.minWidth, null);
    this.mapMaxWidth = normalizeCssLength(options.mapMaxWidth ?? options.maxWidth, null);
    this.mapAspectRatio = normalizeAspectRatio(options.mapAspectRatio ?? options.aspectRatio, null);
    this.isDragging = false;
    this.isPinDragging = false;
    this.dragStart = null;
    this.isClickSuppressed = false;
    this.resizeObserver = null;
    this.windowResizeHandler = null;
    this.resizeRenderFrame = null;

    this.renderShell();
    this.bindEvents();
    this.observeResize();
    this.render();
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
    (this.handlers[eventName] || []).forEach((handler) => handler(payload));
  }

  hasCenteredPin() {
    return this.pinMode === 'centered' && Boolean(this.pin);
  }

  syncCenteredPin(emitChange = false) {
    if (!this.hasCenteredPin()) {
      return;
    }

    this.pin = { ...this.center };
    this.statusEl.textContent = `Pin: ${this.pin.lat.toFixed(6)}, ${this.pin.lng.toFixed(6)}`;

    if (emitChange) {
      this.emit('pinchange', this.pin);
    }
  }

  renderShell() {
    this.root = document.createElement('div');
    this.root.className = classNames(
      'plmp__map-picker',
      'ph-map-picker',
      `plmp--theme-${this.theme}`,
      `plmp--size-${this.size}`,
      `plmp--density-${this.density}`,
      this.disabled ? 'is-disabled' : '',
      this.readOnly ? 'is-readonly' : '',
      this.busy ? 'is-busy' : '',
      this.className
    );
    this.root.dataset.theme = this.theme;
    this.root.dataset.size = this.size;
    this.root.dataset.density = this.density;
    this.root.dataset.disabled = this.disabled ? 'true' : 'false';
    this.root.dataset.readonly = this.readOnly ? 'true' : 'false';
    this.root.dataset.busy = this.busy ? 'true' : 'false';
    this.root.dataset.busyReason = this.busyReason;
    this.root.setAttribute('aria-busy', this.busy ? 'true' : 'false');
    this.root.innerHTML = `
      <div class="plmp__map-canvas ph-map-picker__canvas" data-map-canvas>
        <div class="plmp__map-tiles ph-map-picker__tiles" data-map-tiles></div>
        <svg class="plmp__map-overlay ph-map-picker__overlay" data-map-overlay aria-hidden="true"></svg>
        <button class="plmp__map-pin ph-map-picker__pin" type="button" data-map-pin hidden aria-label="Selected pin"></button>
        <div class="plmp__map-hud ph-map-picker__hud" data-map-hud>
          <button type="button" data-map-zoom-in aria-label="Zoom in">+</button>
          <button type="button" data-map-zoom-out aria-label="Zoom out">−</button>
        </div>
        <div class="plmp__map-attribution ph-map-picker__attribution" data-map-attribution${this.tileAttribution ? '' : ' hidden'}>${escapeHtml(this.tileAttribution)}</div>
      </div>
      <div class="plmp__map-status ph-map-picker__status" data-map-status${this.showStatus ? '' : ' hidden'}>${escapeHtml(this.statusText)}</div>
    `;

    this.applySizeStyles();

    this.mount.innerHTML = '';
    this.mount.appendChild(this.root);

    this.canvasEl = this.root.querySelector('[data-map-canvas]');
    this.tilesEl = this.root.querySelector('[data-map-tiles]');
    this.overlayEl = this.root.querySelector('[data-map-overlay]');
    this.pinEl = this.root.querySelector('[data-map-pin]');
    this.statusEl = this.root.querySelector('[data-map-status]');
    this.hudEl = this.root.querySelector('[data-map-hud]');
    this.attributionEl = this.root.querySelector('[data-map-attribution]');
    this.applyInteractionState();
  }

  applySizeStyles() {
    if (!this.root) {
      return this;
    }

    const styles = {
      '--plmp-map-height': this.mapHeight,
      '--plmp-map-min-height': this.mapMinHeight,
      '--plmp-map-max-height': this.mapMaxHeight,
      '--plmp-map-width': this.mapWidth,
      '--plmp-map-min-width': this.mapMinWidth,
      '--plmp-map-max-width': this.mapMaxWidth,
      '--plmp-map-aspect-ratio': this.mapAspectRatio
    };

    Object.entries(styles).forEach(([name, value]) => {
      if (value === null || value === undefined || value === '') {
        this.root.style.removeProperty(name);
      } else {
        this.root.style.setProperty(name, value);
      }
    });

    return this;
  }

  setSize(options = {}) {
    if (Object.prototype.hasOwnProperty.call(options, 'mapHeight') || Object.prototype.hasOwnProperty.call(options, 'height')) {
      this.mapHeight = normalizeCssLength(options.mapHeight ?? options.height, null);
    }
    if (Object.prototype.hasOwnProperty.call(options, 'mapMinHeight') || Object.prototype.hasOwnProperty.call(options, 'minHeight')) {
      this.mapMinHeight = normalizeCssLength(options.mapMinHeight ?? options.minHeight, null);
    }
    if (Object.prototype.hasOwnProperty.call(options, 'mapMaxHeight') || Object.prototype.hasOwnProperty.call(options, 'maxHeight')) {
      this.mapMaxHeight = normalizeCssLength(options.mapMaxHeight ?? options.maxHeight, null);
    }
    if (Object.prototype.hasOwnProperty.call(options, 'mapWidth') || Object.prototype.hasOwnProperty.call(options, 'width')) {
      this.mapWidth = normalizeCssLength(options.mapWidth ?? options.width, null);
    }
    if (Object.prototype.hasOwnProperty.call(options, 'mapMinWidth') || Object.prototype.hasOwnProperty.call(options, 'minWidth')) {
      this.mapMinWidth = normalizeCssLength(options.mapMinWidth ?? options.minWidth, null);
    }
    if (Object.prototype.hasOwnProperty.call(options, 'mapMaxWidth') || Object.prototype.hasOwnProperty.call(options, 'maxWidth')) {
      this.mapMaxWidth = normalizeCssLength(options.mapMaxWidth ?? options.maxWidth, null);
    }
    if (Object.prototype.hasOwnProperty.call(options, 'mapAspectRatio') || Object.prototype.hasOwnProperty.call(options, 'aspectRatio')) {
      this.mapAspectRatio = normalizeAspectRatio(options.mapAspectRatio ?? options.aspectRatio, null);
    }

    this.applySizeStyles();
    this.resize();
    return this;
  }

  applyInteractionState() {
    if (!this.root) {
      return;
    }

    this.root.classList.toggle('is-disabled', this.disabled);
    this.root.classList.toggle('is-readonly', this.readOnly);
    this.root.classList.toggle('is-busy', this.busy);
    this.root.dataset.disabled = this.disabled ? 'true' : 'false';
    this.root.dataset.readonly = this.readOnly ? 'true' : 'false';
    this.root.dataset.busy = this.busy ? 'true' : 'false';
    this.root.dataset.busyReason = this.busyReason;
    this.root.setAttribute('aria-busy', this.busy ? 'true' : 'false');

    this.root.querySelectorAll('[data-map-zoom-in], [data-map-zoom-out], [data-map-pin]').forEach((button) => {
      button.disabled = this.disabled || this.busy;
      button.setAttribute('aria-disabled', (this.disabled || this.busy) ? 'true' : 'false');
    });
  }

  setBusy(busy = true, reason = '') {
    this.busy = busy === true;
    this.busyReason = this.busy ? String(reason || '') : '';
    this.isDragging = false;
    this.isPinDragging = false;
    this.dragStart = null;
    this.applyInteractionState();
    return this;
  }

  isBusy() {
    return this.busy;
  }

  setDisabled(disabled = true) {
    this.disabled = disabled === true;
    this.isDragging = false;
    this.isPinDragging = false;
    this.dragStart = null;
    this.applyInteractionState();
    return this;
  }

  setReadOnly(readOnly = true) {
    this.readOnly = readOnly === true;
    this.isDragging = false;
    this.isPinDragging = false;
    this.dragStart = null;
    this.applyInteractionState();
    return this;
  }

  canMutatePin() {
    return !this.busy && !this.disabled && !this.readOnly;
  }

  bindEvents() {
    this.hudEl.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      this.isClickSuppressed = true;
    });

    this.hudEl.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.isClickSuppressed = true;
    });

    this.hudEl.addEventListener('dblclick', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });

    this.root.querySelector('[data-map-zoom-in]').addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!this.disabled && !this.busy) {
        this.zoomAroundCanvasCenter(1);
      }
    });

    this.root.querySelector('[data-map-zoom-out]').addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!this.disabled && !this.busy) {
        this.zoomAroundCanvasCenter(-1);
      }
    });

    this.canvasEl.addEventListener('click', (event) => {
      if (event.target.closest('[data-map-hud]')) {
        return;
      }

      if (this.isClickSuppressed) {
        this.isClickSuppressed = false;
        return;
      }

      if (event.target.closest('[data-map-hud]')) {
        return;
      }

      if (!this.canMutatePin() || !this.clickToPlacePin) {
        return;
      }

      const point = this.pointFromEvent(event);
      this.setPin(point, true);
    });

    this.canvasEl.addEventListener('wheel', (event) => {
      event.preventDefault();

      if (this.disabled || this.busy) {
        return;
      }

      if (event.target.closest('[data-map-hud]')) {
        return;
      }

      const nextZoom = clamp(this.zoom + (event.deltaY < 0 ? 1 : -1), this.minZoom, this.maxZoom);
      if (nextZoom === this.zoom) {
        return;
      }

      if (this.hasCenteredPin()) {
        this.zoom = nextZoom;
        if (!this.readOnly) {
        this.syncCenteredPin(false);
      }
        this.render();
        return;
      }

      if (!this.mouseWheelZoomCentered) {
        this.zoom = nextZoom;
        this.render();
        return;
      }

      const rect = this.canvasEl.getBoundingClientRect();
      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;
      const pointerLatLng = this.pointFromEvent(event);
      const pointerPixelAfterZoom = latLngToPixel(pointerLatLng.lat, pointerLatLng.lng, nextZoom);

      this.zoom = nextZoom;
      this.center = pixelToLatLng(
        pointerPixelAfterZoom.x - pointerX + rect.width / 2,
        pointerPixelAfterZoom.y - pointerY + rect.height / 2,
        this.zoom
      );
      this.render();
    }, { passive: false });


    this.pinEl.addEventListener('pointerdown', (event) => {
      if (!this.canMutatePin() || !this.pinDraggable || event.button !== 0 || !this.pin || this.hasCenteredPin()) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      this.isPinDragging = true;
      this.isClickSuppressed = true;
      this.pinEl.setPointerCapture(event.pointerId);
    });

    this.pinEl.addEventListener('pointermove', (event) => {
      if (!this.isPinDragging) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      this.setPin(this.pointFromEvent(event), false);
    });

    this.pinEl.addEventListener('pointerup', (event) => {
      if (!this.isPinDragging) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      this.isPinDragging = false;
      this.setPin(this.pointFromEvent(event), true);
      try {
        this.pinEl.releasePointerCapture(event.pointerId);
      } catch (error) {
        // Browser already released it.
      }
    });

    this.canvasEl.addEventListener('pointerdown', (event) => {
      if (this.disabled || this.busy || event.button !== 0 || event.target.closest('[data-map-hud]') || event.target.closest('[data-map-pin]')) {
        return;
      }

      this.isDragging = true;
      this.dragStart = {
        x: event.clientX,
        y: event.clientY,
        centerPixel: latLngToPixel(this.center.lat, this.center.lng, this.zoom)
      };
      this.canvasEl.setPointerCapture(event.pointerId);
    });

    this.canvasEl.addEventListener('pointermove', (event) => {
      if (!this.isDragging || !this.dragStart) {
        return;
      }

      const dx = event.clientX - this.dragStart.x;
      const dy = event.clientY - this.dragStart.y;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        this.isClickSuppressed = true;
      }

      this.center = pixelToLatLng(
        this.dragStart.centerPixel.x - dx,
        this.dragStart.centerPixel.y - dy,
        this.zoom
      );
      if (!this.readOnly) {
        this.syncCenteredPin(false);
      }
      this.render();
    });

    this.canvasEl.addEventListener('pointerup', (event) => {
      const wasDragging = this.isDragging;
      this.isDragging = false;
      this.dragStart = null;
      if (wasDragging && !this.readOnly) {
        this.syncCenteredPin(true);
      }
      try {
        this.canvasEl.releasePointerCapture(event.pointerId);
      } catch (error) {
        // Browser already released it.
      }
    });
  }

  observeResize() {
    this.windowResizeHandler = () => this.scheduleRender();

    if (typeof ResizeObserver === 'function') {
      this.resizeObserver = new ResizeObserver(() => this.scheduleRender());
      this.resizeObserver.observe(this.canvasEl);
      this.resizeObserver.observe(this.root);
    }

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('resize', this.windowResizeHandler);
    }
  }

  scheduleRender() {
    if (this.resizeRenderFrame !== null || typeof requestAnimationFrame !== 'function') {
      if (typeof requestAnimationFrame !== 'function') {
        this.render();
      }
      return;
    }

    this.resizeRenderFrame = requestAnimationFrame(() => {
      this.resizeRenderFrame = null;
      this.render();
    });
  }

  resize() {
    this.render();
    return this;
  }

  zoomAroundCanvasCenter(delta) {
    const nextZoom = clamp(this.zoom + delta, this.minZoom, this.maxZoom);
    if (nextZoom === this.zoom) {
      return;
    }

    this.zoom = nextZoom;
    if (!this.pin && this.statusEl) {
      this.statusEl.textContent = `Zoom: ${this.zoom}. ${this.statusText}`;
    }
    this.render();
    window.setTimeout(() => {
      this.isClickSuppressed = false;
    }, 0);
  }

  pointFromEvent(event) {
    const rect = this.canvasEl.getBoundingClientRect();
    const centerPixel = latLngToPixel(this.center.lat, this.center.lng, this.zoom);

    return pixelToLatLng(
      centerPixel.x - rect.width / 2 + (event.clientX - rect.left),
      centerPixel.y - rect.height / 2 + (event.clientY - rect.top),
      this.zoom
    );
  }

  async focusLocation(location = {}) {
    const result = {
      level: '',
      id: '',
      bounds: null,
      centroid: null,
      polygon: null
    };

    if (!this.provider) {
      return result;
    }

    const level = location.barangay_id ? 'barangay' : (location.city_id ? 'city' : (location.province_id ? 'province' : (location.region_id ? 'region' : null)));
    const id = location.barangay_id || location.city_id || location.province_id || location.region_id;

    if (!level || !id) {
      this.polygon = null;
      this.render();
      return result;
    }

    result.level = level;
    result.id = id;

    const bounds = await this.provider.getBounds(level, id).catch(() => null);
    if (bounds) {
      result.bounds = bounds;
      if (this.fitBoundaryOnSelection) {
        this.fitBounds(bounds);
      } else {
        const normalized = normalizeBounds(bounds);
        if (normalized) {
          this.center = boundsCenter(normalized);
        }
        this.zoom = zoomForLevel(level, this);
      }
    } else {
      const centroid = await this.provider.getCentroid(level, id).catch(() => null);
      if (centroid) {
        result.centroid = centroid;
        this.center = centroid;
        this.zoom = zoomForLevel(level, this);
      }
    }

    if (this.showBoundary) {
      const polygon = await this.provider.getPolygon(level, id).catch(() => null);
      this.polygon = Array.isArray(polygon) && polygon.length >= 3 ? polygon : null;
      result.polygon = this.polygon;
    } else {
      this.polygon = null;
    }
    this.render();

    return result;
  }

  fitBounds(bounds) {
    const normalized = normalizeBounds(bounds);
    if (!normalized) {
      return;
    }

    this.center = boundsCenter(normalized);
    const rect = this.canvasEl.getBoundingClientRect();
    const width = Math.max(rect.width, 320);
    const height = Math.max(rect.height, 240);
    const availableWidth = Math.max(120, width - this.boundaryPadding * 2);
    const availableHeight = Math.max(120, height - this.boundaryPadding * 2);

    for (let zoom = this.maxZoom; zoom >= this.minZoom; zoom--) {
      const nw = latLngToPixel(normalized.north, normalized.west, zoom);
      const se = latLngToPixel(normalized.south, normalized.east, zoom);
      if (Math.abs(se.x - nw.x) <= availableWidth && Math.abs(se.y - nw.y) <= availableHeight) {
        this.zoom = zoom;
        return;
      }
    }

    this.zoom = this.minZoom;
  }

  firstPinTargetZoom(pin) {
    if (Number.isFinite(this.firstPinZoom)) {
      return clamp(this.firstPinZoom, this.minZoom, this.maxZoom);
    }

    const rect = this.canvasEl.getBoundingClientRect();
    return zoomForVisibleWidthKm(
      Number(pin && pin.lat),
      Math.max(rect.width, this.canvasEl.clientWidth, 320),
      this.firstPinVisibleWidthKm,
      this.minZoom,
      this.maxZoom
    );
  }

  setCenter(center, zoom = this.zoom, statusText = '') {
    const lat = Number(center && center.lat);
    const lng = Number(center && center.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }

    const nextZoom = Number.isFinite(Number(zoom)) ? Number(zoom) : this.zoom;
    this.center = { lat, lng };
    this.zoom = clamp(nextZoom, this.minZoom, this.maxZoom);
    this.syncCenteredPin(false);

    if (statusText) {
      this.statusEl.textContent = statusText;
    }

    this.render();
  }

  setPin(pin, emitChange = true, options = {}) {
    if (!this.canMutatePin() && options.force !== true) {
      return;
    }

    const nextPin = {
      lat: Number(pin.lat),
      lng: Number(pin.lng)
    };

    if (!Number.isFinite(nextPin.lat) || !Number.isFinite(nextPin.lng)) {
      return;
    }

    const hadPin = Boolean(this.pin);
    this.pin = nextPin;

    if (this.pinMode === 'centered' || this.centerOnPin || options.centerOnPin === true) {
      this.center = { ...nextPin };
    }

    if (!hadPin && this.zoomOnFirstPin) {
      this.zoom = this.firstPinTargetZoom(nextPin);
    }

    this.statusEl.textContent = `Pin: ${this.pin.lat.toFixed(6)}, ${this.pin.lng.toFixed(6)}`;
    this.render();

    if (emitChange) {
      this.emit('pinchange', this.pin);
    }
  }

  clearPin(emitChange = true, options = {}) {
    if (!this.canMutatePin() && options.force !== true) {
      return;
    }

    this.pin = null;
    this.statusEl.textContent = this.statusText;
    this.render();

    if (emitChange) {
      this.emit('pinchange', null);
    }
  }

  render() {
    this.applyZoomStyles();
    this.renderTiles();
    this.renderPin();
    this.renderPolygon();
  }

  applyZoomStyles() {
    if (!this.canvasEl) {
      return;
    }

    const gridSize = clamp(Math.round(24 * Math.pow(1.28, this.zoom - this.minZoom)), 24, 192);
    this.canvasEl.style.setProperty('--plmp-map-grid-size', `${gridSize}px`);
    this.canvasEl.dataset.zoom = String(this.zoom);
    this.canvasEl.dataset.tileMode = this.tileUrlTemplate ? 'tiles' : 'offline-grid';
  }

  renderTiles() {
    if (!this.tileUrlTemplate) {
      this.tilesEl.innerHTML = '';
      return;
    }

    const rect = this.canvasEl.getBoundingClientRect();
    const width = Math.max(rect.width, this.canvasEl.clientWidth, 320);
    const height = Math.max(rect.height, this.canvasEl.clientHeight, 240);
    const centerPixel = latLngToPixel(this.center.lat, this.center.lng, this.zoom);

    const startX = Math.floor((centerPixel.x - width / 2) / TILE_SIZE);
    const endX = Math.floor((centerPixel.x + width / 2) / TILE_SIZE);
    const startY = Math.floor((centerPixel.y - height / 2) / TILE_SIZE);
    const endY = Math.floor((centerPixel.y + height / 2) / TILE_SIZE);
    const tileCount = Math.pow(2, this.zoom);
    const html = [];

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        if (y < 0 || y >= tileCount) {
          continue;
        }

        const wrappedX = ((x % tileCount) + tileCount) % tileCount;
        const left = Math.round(x * TILE_SIZE - centerPixel.x + width / 2);
        const top = Math.round(y * TILE_SIZE - centerPixel.y + height / 2);
        const src = this.tileUrlTemplate
          .split('{z}').join(String(this.zoom))
          .split('{x}').join(String(wrappedX))
          .split('{y}').join(String(y));

        html.push(`<img class="plmp__map-tile ph-map-picker__tile" src="${escapeHtml(src)}" alt="" draggable="false" loading="lazy" decoding="async" style="left:${left}px;top:${top}px;">`);
      }
    }

    this.tilesEl.innerHTML = html.join('');
  }

  projectToScreen(lat, lng) {
    const rect = this.canvasEl.getBoundingClientRect();
    const centerPixel = latLngToPixel(this.center.lat, this.center.lng, this.zoom);
    const pixel = latLngToPixel(lat, lng, this.zoom);

    return {
      x: pixel.x - centerPixel.x + rect.width / 2,
      y: pixel.y - centerPixel.y + rect.height / 2
    };
  }

  renderPin() {
    if (!this.pin) {
      this.pinEl.hidden = true;
      return;
    }

    const rect = this.canvasEl.getBoundingClientRect();
    const point = this.hasCenteredPin()
      ? { x: rect.width / 2, y: rect.height / 2 }
      : this.projectToScreen(this.pin.lat, this.pin.lng);
    this.pinEl.hidden = false;
    this.pinEl.style.left = `${point.x}px`;
    this.pinEl.style.top = `${point.y}px`;
  }

  renderPolygon() {
    const rect = this.canvasEl.getBoundingClientRect();
    this.overlayEl.setAttribute('viewBox', `0 0 ${Math.max(rect.width, 320)} ${Math.max(rect.height, 240)}`);

    if (!Array.isArray(this.polygon) || this.polygon.length < 3) {
      this.overlayEl.innerHTML = '';
      return;
    }

    const points = this.polygon
      .map((point) => this.projectToScreen(point.lat, point.lng))
      .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
      .join(' ');

    this.overlayEl.innerHTML = `<polygon class="plmp__map-polygon ph-map-picker__polygon" points="${points}"></polygon>`;
  }

  destroy() {
    if (this.resizeRenderFrame !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.resizeRenderFrame);
      this.resizeRenderFrame = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.windowResizeHandler && typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
      window.removeEventListener('resize', this.windowResizeHandler);
      this.windowResizeHandler = null;
    }

    this.handlers = {};
    this.mount.innerHTML = '';
    this.isDragging = false;
    this.isPinDragging = false;
    this.dragStart = null;
  }

}
