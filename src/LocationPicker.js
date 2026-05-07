import { deriveCityId, deriveProvinceId, deriveRegionId } from './geo/psgcCodes.js';

const cleanId = (value) => String(value ?? '').trim();
const normalizeText = (value) => String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
const rowId = (row) => cleanId(row.id || row.code);
const rowName = (row) => String(row.name || '').trim();
const LEVELS = ['region', 'province', 'city', 'barangay'];
const LEVEL_RANK = { region: 1, province: 2, city: 3, barangay: 4 };

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function setInput(input, value) {
  if (input) {
    input.value = value == null ? '' : String(value);
  }
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

function isVisibleFocusable(element) {
  if (!element || element.disabled || element.hidden) {
    return false;
  }
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

function focusableElements(container) {
  if (!container) {
    return [];
  }
  return Array.from(container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
    .filter(isVisibleFocusable);
}

function uniqueId(prefix) {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`;
}

function setElementInert(element, inert) {
  if (!element) {
    return;
  }

  if (inert) {
    if (!element.hasAttribute('data-plmp-original-inert')) {
      element.setAttribute('data-plmp-original-inert', element.inert ? 'true' : 'false');
    }
    element.inert = true;
    element.setAttribute('data-plmp-modal-inert', 'true');
    return;
  }

  if (element.getAttribute('data-plmp-modal-inert') !== 'true') {
    return;
  }

  const originalInert = element.getAttribute('data-plmp-original-inert') === 'true';
  element.inert = originalInert;
  element.removeAttribute('data-plmp-modal-inert');
  element.removeAttribute('data-plmp-original-inert');
}

function setBackgroundInert(modalElement, inert) {
  if (!modalElement || !document.body) {
    return [];
  }

  const affected = [];
  let current = modalElement;
  let parent = current.parentElement;

  while (parent && parent !== document.body.parentElement) {
    Array.from(parent.children).forEach((child) => {
      if (child === current || child.contains(modalElement)) {
        return;
      }
      setElementInert(child, inert);
      affected.push(child);
    });

    if (parent === document.body) {
      break;
    }

    current = parent;
    parent = parent.parentElement;
  }

  return affected;
}

function resolvedLocation(value = {}) {
  const state = {
    region_id: cleanId(value.region_id),
    region_name: String(value.region_name || '').trim(),
    province_id: cleanId(value.province_id),
    province_name: String(value.province_name || '').trim(),
    city_id: cleanId(value.city_id),
    city_name: String(value.city_name || '').trim(),
    barangay_id: cleanId(value.barangay_id),
    barangay_name: String(value.barangay_name || '').trim()
  };

  if (state.barangay_id && !state.city_id) {
    state.city_id = deriveCityId(state.barangay_id);
  }
  if (state.city_id && !state.province_id) {
    state.province_id = deriveProvinceId(state.city_id);
  }
  if ((state.province_id || state.city_id || state.barangay_id) && !state.region_id) {
    state.region_id = deriveRegionId(state.province_id || state.city_id || state.barangay_id);
  }

  return state;
}

function hasUsableResolvedNames(value = {}) {
  return Boolean(value.barangay_id && value.barangay_name && value.city_id && value.city_name);
}

export class LocationPicker {
  constructor(options = {}) {
    if (!options.mount) {
      throw new Error('LocationPicker requires a mount element.');
    }
    if (!options.provider) {
      throw new Error('LocationPicker requires a provider.');
    }

    this.mount = options.mount;
    this.provider = options.provider;
    this.requiredLevel = cleanToken(options.requiredLevel, LEVELS, 'barangay');
    this.validationMessages = {
      region: options.messageRequiredRegion || 'Select a region.',
      province: options.messageRequiredProvince || 'Select a province.',
      city: options.messageRequiredCity || 'Select a city or municipality.',
      barangay: options.messageRequiredBarangay || 'Select a barangay before saving.'
    };
    this.hiddenInputs = options.hiddenInputs || {};
    this.summaryLabel = options.summaryLabel || 'Address location';
    this.placeholder = options.placeholder || 'Select City → Barangay';
    this.modalTitle = options.modalTitle || 'Select address location';
    this.modalSubtitle = options.modalSubtitle || 'Choose Region, Province if applicable, City/Municipality, then Barangay.';
    this.modalEyebrow = options.modalEyebrow || 'Philippines address';
    this.actionLabel = options.actionLabel || 'Select';
    this.saveLabel = options.saveLabel || 'Save address';
    this.cancelLabel = options.cancelLabel || 'Cancel';
    this.clearLabel = options.clearLabel || 'Clear';
    this.searchPlaceholder = options.searchPlaceholder || 'Search';
    this.triggerIcon = options.triggerIcon || '⌖';
    this.selectedLabelFormat = cleanToken(options.selectedLabelFormat, [
      'region_province_city_barangay',
      'province_city_barangay',
      'city_barangay',
      'barangay_only'
    ], 'city_barangay');
    this.theme = cleanToken(options.theme, ['light', 'dark', 'auto'], 'light');
    this.size = cleanToken(options.size, ['compact', 'comfortable', 'spacious'], 'comfortable');
    this.density = cleanToken(options.density, ['tight', 'normal', 'relaxed'], 'normal');
    this.className = options.className || '';
    this.modalClassName = options.modalClassName || '';
    this.disabled = options.disabled === true;
    this.readOnly = options.readOnly === true || options.readonly === true;
    this.busy = options.busy === true;
    this.busyReason = '';
    this.previousFocusEl = null;
    this.modalInertElements = [];
    this.titleId = uniqueId('plmp-location-title');
    this.subtitleId = uniqueId('plmp-location-subtitle');
    this.listId = uniqueId('plmp-location-list');
    this.messageId = uniqueId('plmp-location-message');
    this.searchId = uniqueId('plmp-location-search');
    this.boundDocumentFocus = (event) => this.enforceModalFocus(event);
    this.boundDocumentKeydown = (event) => this.handleDocumentKeydown(event);
    this.handlers = {};
    this.lists = { region: [], province: [], city: [], barangay: [] };
    this.state = {
      region_id: cleanId(options.defaultRegionId),
      region_name: '',
      province_id: cleanId(options.defaultProvinceId),
      province_name: '',
      city_id: cleanId(options.defaultCityId),
      city_name: '',
      barangay_id: cleanId(options.defaultBarangayId),
      barangay_name: ''
    };
    this.activeLevel = 'region';
    this.searchTerm = '';

    this.renderShell();
    this.bindEvents();
    this.ready = this.initialize();
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

  async initialize() {
    await this.loadRegions();

    if (this.state.barangay_id && !this.state.city_id) {
      this.state.city_id = deriveCityId(this.state.barangay_id);
    }
    if (this.state.city_id && !this.state.province_id) {
      this.state.province_id = deriveProvinceId(this.state.city_id);
    }
    if ((this.state.province_id || this.state.city_id || this.state.barangay_id) && !this.state.region_id) {
      this.state.region_id = deriveRegionId(this.state.province_id || this.state.city_id || this.state.barangay_id);
    }

    if (this.state.region_id || this.state.province_id || this.state.city_id || this.state.barangay_id) {
      await this.setValue(this.state, false);
    } else {
      this.updateSummary();
      this.updateHiddenInputs();
      this.renderCurrentLevel();
    }
  }

  renderShell() {
    this.root = document.createElement('div');
    this.root.className = classNames(
      'plmp__location-picker',
      'ph-location-picker',
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
    this.root.setAttribute('aria-busy', this.busy ? 'true' : 'false');
    this.root.innerHTML = `
      <div class="plmp__trigger-row ph-location-picker__control-row">
        <button class="plmp__trigger ph-location-picker__control" type="button" data-lp-open aria-haspopup="dialog" aria-expanded="false">
          <span class="plmp__trigger-icon ph-location-picker__control-icon" aria-hidden="true">${escapeHtml(this.triggerIcon)}</span>
          <span class="plmp__trigger-main ph-location-picker__control-main"><span class="plmp__label ph-location-picker__label">${escapeHtml(this.summaryLabel)}</span><span class="plmp__trigger-value ph-location-picker__value" data-lp-summary>${escapeHtml(this.placeholder)}</span></span>
          <span class="plmp__trigger-action ph-location-picker__action">${escapeHtml(this.actionLabel)}</span>
        </button>
        <button class="plmp__clear ph-location-picker__clear" type="button" data-lp-clear aria-label="Clear selected address">×</button>
      </div>
      <div class="plmp__modal ph-location-picker__modal ${escapeHtml(this.modalClassName)}" data-lp-modal hidden>
        <div class="plmp__modal-backdrop ph-location-picker__backdrop" data-lp-cancel></div>
        <section class="plmp__modal-dialog ph-location-picker__dialog" role="dialog" aria-modal="true" aria-labelledby="${this.titleId}" aria-describedby="${this.subtitleId}" tabindex="-1">
          <header class="plmp__modal-header ph-location-picker__header"><div><p class="plmp__eyebrow ph-location-picker__eyebrow">${escapeHtml(this.modalEyebrow)}</p><h2 class="plmp__title ph-location-picker__title" id="${this.titleId}">${escapeHtml(this.modalTitle)}</h2><p class="plmp__subtitle ph-location-picker__subtitle" id="${this.subtitleId}">${escapeHtml(this.modalSubtitle)}</p></div><button class="plmp__modal-close ph-location-picker__close" type="button" data-lp-cancel aria-label="Close location picker">×</button></header>
          <div class="plmp__modal-body ph-location-picker__body"><nav class="plmp__tabs ph-location-picker__tabs" aria-label="Location level" role="tablist"><button type="button" role="tab" data-lp-level="region">Region</button><button type="button" role="tab" data-lp-level="province">Province</button><button type="button" role="tab" data-lp-level="city">City / Municipality</button><button type="button" role="tab" data-lp-level="barangay">Barangay</button></nav><label class="plmp__sr-only ph-location-picker__sr-only" for="${this.searchId}">Search locations</label><input id="${this.searchId}" class="plmp__search ph-location-picker__search" type="search" data-lp-search placeholder="${escapeHtml(this.searchPlaceholder)}" autocomplete="off" aria-controls="${this.listId}"><div class="plmp__path ph-location-picker__path" data-lp-path aria-live="polite"></div><div id="${this.listId}" class="plmp__list ph-location-picker__list" data-lp-list role="listbox" aria-describedby="${this.messageId}"></div><p id="${this.messageId}" class="plmp__status ph-location-picker__message" data-lp-message aria-live="polite"></p></div>
          <footer class="plmp__modal-footer ph-location-picker__footer"><button class="plmp__button plmp__button--secondary ph-location-picker__button ph-location-picker__button--secondary" type="button" data-lp-clear>${escapeHtml(this.clearLabel)}</button><button class="plmp__button plmp__button--secondary ph-location-picker__button ph-location-picker__button--secondary" type="button" data-lp-cancel>${escapeHtml(this.cancelLabel)}</button><button class="plmp__button plmp__button--primary ph-location-picker__button ph-location-picker__button--primary" type="button" data-lp-save>${escapeHtml(this.saveLabel)}</button></footer>
        </section>
      </div>`;
    this.mount.innerHTML = '';
    this.mount.appendChild(this.root);
    this.openButtonEl = this.root.querySelector('[data-lp-open]');
    this.triggerRowEl = this.root.querySelector('.ph-location-picker__control-row');
    this.summaryEl = this.root.querySelector('[data-lp-summary]');
    this.modalEl = this.root.querySelector('[data-lp-modal]');
    this.dialogEl = this.root.querySelector('.ph-location-picker__dialog');
    this.searchEl = this.root.querySelector('[data-lp-search]');
    this.pathEl = this.root.querySelector('[data-lp-path]');
    this.listEl = this.root.querySelector('[data-lp-list]');
    this.messageEl = this.root.querySelector('[data-lp-message]');
    this.applyInteractionState();
  }

  applyInteractionState() {
    if (!this.root) {
      return;
    }

    const locked = this.disabled || this.readOnly || this.busy;
    this.root.classList.toggle('is-disabled', this.disabled);
    this.root.classList.toggle('is-readonly', this.readOnly);
    this.root.classList.toggle('is-busy', this.busy);
    this.root.dataset.disabled = this.disabled ? 'true' : 'false';
    this.root.dataset.readonly = this.readOnly ? 'true' : 'false';
    this.root.dataset.busy = this.busy ? 'true' : 'false';
    this.root.setAttribute('aria-busy', this.busy ? 'true' : 'false');

    if (this.openButtonEl) {
      this.openButtonEl.disabled = this.disabled || this.busy;
      this.openButtonEl.setAttribute('aria-disabled', (this.disabled || this.busy) ? 'true' : 'false');
    }

    this.root.querySelectorAll('[data-lp-clear], [data-lp-save]').forEach((button) => {
      button.disabled = locked;
      button.setAttribute('aria-disabled', locked ? 'true' : 'false');
    });

    this.renderTabs();
    this.renderCurrentLevel();
  }

  setBusy(busy = true, reason = '') {
    this.busy = busy === true;
    this.busyReason = this.busy ? String(reason || '') : '';
    this.applyInteractionState();
    return this;
  }

  isBusy() {
    return this.busy;
  }

  setDisabled(disabled = true) {
    this.disabled = disabled === true;
    if (this.disabled && !this.modalEl.hidden) {
      this.close();
    }
    this.applyInteractionState();
    return this;
  }

  setReadOnly(readOnly = true) {
    this.readOnly = readOnly === true;
    this.applyInteractionState();
    return this;
  }

  bindEvents() {
    this.openButtonEl.addEventListener('click', () => this.open());
    this.root.querySelectorAll('[data-lp-cancel]').forEach((button) => button.addEventListener('click', () => this.close()));
    this.root.querySelectorAll('[data-lp-clear]').forEach((button) => button.addEventListener('click', () => this.clear()));
    this.root.querySelector('[data-lp-save]').addEventListener('click', () => this.save());
    this.searchEl.addEventListener('input', () => {
      this.searchTerm = this.searchEl.value;
      this.renderCurrentLevel();
    });
    this.root.querySelectorAll('[data-lp-level]').forEach((button) => {
      button.addEventListener('click', () => this.setActiveLevel(button.getAttribute('data-lp-level')));
    });
    this.root.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !this.modalEl.hidden) {
        event.preventDefault();
        this.close();
        return;
      }

      if (event.key === 'Tab' && !this.modalEl.hidden) {
        this.trapModalFocus(event);
      }
    });
  }

  async loadRegions() {
    this.lists.region = await this.provider.getRegions();
  }

  async loadProvinces() {
    this.lists.province = this.state.region_id || this.state.region_name ? await this.provider.getProvinces(this.state.region_id, {
      region_id: this.state.region_id,
      region_name: this.state.region_name
    }) : [];
  }

  async loadCities() {
    const parentId = this.state.province_id || this.state.region_id;
    this.lists.city = parentId ? await this.provider.getCities(parentId, {
      region_id: this.state.region_id,
      region_name: this.state.region_name,
      province_id: this.state.province_id,
      province_name: this.state.province_name
    }) : [];
  }

  async loadBarangays() {
    this.lists.barangay = this.state.city_id ? await this.provider.getBarangays(this.state.city_id, {
      region_id: this.state.region_id,
      region_name: this.state.region_name,
      province_id: this.state.province_id,
      province_name: this.state.province_name,
      city_id: this.state.city_id,
      city_name: this.state.city_name
    }) : [];
  }

  hasProvinceStep() {
    return Boolean(this.state.province_id) || this.lists.province.length > 0;
  }

  open() {
    if (this.disabled || this.busy) {
      return;
    }

    if (!this.modalEl.hidden) {
      return;
    }

    this.previousFocusEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.modalEl.hidden = false;
    this.modalEl.classList.add('is-open');
    if (this.openButtonEl) {
      this.openButtonEl.setAttribute('aria-expanded', 'true');
    }
    this.modalInertElements = setBackgroundInert(this.modalEl, true);
    document.documentElement.classList.add('plmp-modal-open');
    document.addEventListener('focusin', this.boundDocumentFocus, true);
    document.addEventListener('keydown', this.boundDocumentKeydown, true);
    this.setActiveLevel(this.firstIncompleteLevel());
    setTimeout(() => {
      const focusables = focusableElements(this.modalEl);
      (this.searchEl || focusables[0] || this.dialogEl)?.focus();
    }, 0);
    this.emit('open', { open: true });
    this.emit('openchange', { open: true });
  }

  close() {
    if (!this.modalEl || this.modalEl.hidden) {
      return;
    }

    this.modalEl.classList.remove('is-open');
    this.modalEl.hidden = true;
    this.searchTerm = '';
    this.searchEl.value = '';
    if (this.openButtonEl) {
      this.openButtonEl.setAttribute('aria-expanded', 'false');
    }
    this.modalInertElements.forEach((element) => setElementInert(element, false));
    this.modalInertElements = [];
    document.documentElement.classList.remove('plmp-modal-open');
    document.removeEventListener('focusin', this.boundDocumentFocus, true);
    document.removeEventListener('keydown', this.boundDocumentKeydown, true);
    if (this.previousFocusEl && typeof this.previousFocusEl.focus === 'function' && document.contains(this.previousFocusEl)) {
      setTimeout(() => this.previousFocusEl.focus(), 0);
    }
    this.emit('close', { open: false });
    this.emit('openchange', { open: false });
  }

  handleDocumentKeydown(event) {
    if (this.modalEl.hidden) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close();
      return;
    }

    if (event.key === 'Tab') {
      this.trapModalFocus(event);
    }
  }

  enforceModalFocus(event) {
    if (this.modalEl.hidden || this.modalEl.contains(event.target)) {
      return;
    }

    const focusables = focusableElements(this.modalEl);
    (focusables[0] || this.dialogEl)?.focus();
  }

  trapModalFocus(event) {
    const focusables = focusableElements(this.modalEl);
    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  firstIncompleteLevel() {
    if (!this.state.region_id) {
      return 'region';
    }
    if (this.hasProvinceStep() && !this.state.province_id) {
      return 'province';
    }
    if (!this.state.city_id) {
      return 'city';
    }
    return 'barangay';
  }

  async setActiveLevel(level) {
    if (!LEVELS.includes(level)) {
      return;
    }

    if (level === 'province' && !this.state.region_id) {
      level = 'region';
    }
    if (level === 'province' && this.state.region_id && this.lists.province.length === 0) {
      await this.loadProvinces();
    }
    if (level === 'province' && this.state.region_id && this.lists.province.length === 0) {
      level = 'city';
    }
    if (level === 'city' && !this.state.region_id) {
      level = 'region';
    }
    if (level === 'city' && this.hasProvinceStep() && !this.state.province_id) {
      level = 'province';
    }
    if (level === 'barangay' && !this.state.city_id) {
      level = this.firstIncompleteLevel();
    }

    this.activeLevel = level;
    this.searchTerm = '';
    this.searchEl.value = '';

    if (level === 'region' && this.lists.region.length === 0) {
      await this.loadRegions();
    }
    if (level === 'province' && this.lists.province.length === 0) {
      await this.loadProvinces();
    }
    if (level === 'city' && this.lists.city.length === 0) {
      await this.loadCities();
    }
    if (level === 'barangay' && this.lists.barangay.length === 0) {
      await this.loadBarangays();
    }

    this.renderCurrentLevel();
  }


  ensureSelectedRows() {
    const ensure = (level, idKey, nameKey) => {
      const id = cleanId(this.state[idKey]);
      const name = String(this.state[nameKey] || '').trim();

      if (!id || !name) {
        return;
      }

      const rows = this.lists[level] || [];
      if (!rows.some((row) => rowId(row) === id)) {
        this.lists[level] = [...rows, { id, code: id, name }].sort((a, b) => rowName(a).localeCompare(rowName(b)));
      }
    };

    ensure('region', 'region_id', 'region_name');
    ensure('province', 'province_id', 'province_name');
    ensure('city', 'city_id', 'city_name');
    ensure('barangay', 'barangay_id', 'barangay_name');
  }

  renderCurrentLevel() {
    this.ensureSelectedRows();
    this.renderTabs();
    this.renderPath();
    const rows = this.filteredRows(this.lists[this.activeLevel] || []);

    if (rows.length === 0) {
      this.listEl.innerHTML = '<div class="plmp__empty ph-location-picker__empty">No matching locations found.</div>';
      return;
    }

    this.listEl.innerHTML = rows.map((row) => {
      const id = rowId(row);
      const selected = this.state[`${this.activeLevel}_id`] === id;
      const disabled = this.disabled || this.readOnly;
      return `<button class="plmp__option ph-location-picker__option${selected ? ' is-selected' : ''}" type="button" role="option" aria-selected="${selected ? 'true' : 'false'}" data-lp-option="${escapeHtml(id)}"${disabled ? ' disabled aria-disabled="true"' : ''}>${escapeHtml(rowName(row))}</button>`;
    }).join('');

    this.listEl.querySelectorAll('[data-lp-option]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.getAttribute('data-lp-option');
        const row = (this.lists[this.activeLevel] || []).find((item) => rowId(item) === id);
        if (row) {
          this.selectRow(this.activeLevel, row).catch((error) => this.setMessage(error.message || 'Location data could not be loaded.', 'error'));
        }
      });
    });
  }

  renderTabs() {
    this.root.querySelectorAll('[data-lp-level]').forEach((button) => {
      const level = button.getAttribute('data-lp-level');
      const provinceRequired = this.hasProvinceStep();
      const disabled =
        this.disabled ||
        (level === 'province' && !this.state.region_id) ||
        (level === 'province' && this.state.region_id && this.lists.province.length === 0) ||
        (level === 'city' && (!this.state.region_id || (provinceRequired && !this.state.province_id))) ||
        (level === 'barangay' && !this.state.city_id);

      button.classList.toggle('is-active', level === this.activeLevel);
      button.setAttribute('aria-selected', level === this.activeLevel ? 'true' : 'false');
      button.setAttribute('tabindex', level === this.activeLevel ? '0' : '-1');
      button.setAttribute('aria-controls', this.listId);
      button.disabled = disabled;
    });
  }

  renderPath() {
    const parts = [this.state.region_name, this.state.province_name, this.state.city_name, this.state.barangay_name].filter(Boolean);
    this.pathEl.textContent = parts.length ? parts.join(' → ') : 'No location selected yet.';
  }

  filteredRows(rows) {
    const q = normalizeText(this.searchTerm);
    return q ? rows.filter((row) => normalizeText(rowName(row)).includes(q)) : rows;
  }

  async selectRow(level, row) {
    if (this.busy || this.disabled || this.readOnly) {
      return;
    }

    const id = rowId(row);
    const name = rowName(row);
    this.setMessage('', '');

    if (level === 'region') {
      Object.assign(this.state, {
        region_id: id,
        region_name: name,
        province_id: '',
        province_name: '',
        city_id: '',
        city_name: '',
        barangay_id: '',
        barangay_name: ''
      });
      this.lists.province = [];
      this.lists.city = [];
      this.lists.barangay = [];
      await this.loadProvinces();
      if (this.lists.province.length > 0) {
        await this.setActiveLevel('province');
      } else {
        await this.loadCities();
        await this.setActiveLevel('city');
      }
      return;
    }

    if (level === 'province') {
      Object.assign(this.state, {
        province_id: id,
        province_name: name,
        city_id: '',
        city_name: '',
        barangay_id: '',
        barangay_name: ''
      });
      this.lists.city = [];
      this.lists.barangay = [];
      await this.loadCities();
      await this.setActiveLevel('city');
      return;
    }

    if (level === 'city') {
      Object.assign(this.state, {
        city_id: id,
        city_name: name,
        barangay_id: '',
        barangay_name: ''
      });
      this.lists.barangay = [];
      await this.loadBarangays();
      await this.setActiveLevel('barangay');
      return;
    }

    if (level === 'barangay') {
      Object.assign(this.state, { barangay_id: id, barangay_name: name });
      this.updateHiddenInputs();
      this.updateSummary();
      this.renderCurrentLevel();
      this.emit('change', this.currentLocation());
    }
  }

  async setValue(value = {}, emitChange = true, options = {}) {
    const shouldHydrate = options.hydrate !== false && !value.resolved && !hasUsableResolvedNames(value);

    if (shouldHydrate) {
      const barangayId = cleanId(value.barangay_id || this.state.barangay_id);
      const cityId = cleanId(value.city_id || this.state.city_id || deriveCityId(barangayId));
      const provinceId = cleanId(value.province_id || this.state.province_id || deriveProvinceId(cityId || barangayId));
      const regionId = cleanId(value.region_id || this.state.region_id || deriveRegionId(provinceId || cityId || barangayId));

      Object.assign(this.state, await this.provider.getLocationByIds({
        region_id: regionId,
        region_name: value.region_name,
        province_id: provinceId,
        province_name: value.province_name,
        city_id: cityId,
        city_name: value.city_name,
        barangay_id: barangayId,
        barangay_name: value.barangay_name
      }));
    } else {
      Object.assign(this.state, resolvedLocation(value));
    }

    await this.loadProvinces().catch(() => { this.lists.province = []; });
    await this.loadCities().catch(() => { this.lists.city = []; });
    await this.loadBarangays().catch(() => { this.lists.barangay = []; });
    this.ensureSelectedRows();
    this.updateHiddenInputs();
    this.updateSummary();
    this.renderCurrentLevel();

    if (emitChange) {
      this.emit('change', this.currentLocation());
    }

    return this.currentLocation();
  }

  validate() {
    const requiredRank = LEVEL_RANK[this.requiredLevel] || LEVEL_RANK.barangay;
    const missing = [];
    const messages = [];

    if (requiredRank >= LEVEL_RANK.region && !this.state.region_id) {
      missing.push('region');
      messages.push(this.validationMessages.region);
    }

    if (requiredRank === LEVEL_RANK.province && !this.state.province_id) {
      missing.push('province');
      messages.push(this.validationMessages.province);
    }

    if (requiredRank >= LEVEL_RANK.city && !this.state.city_id) {
      missing.push('city');
      messages.push(this.validationMessages.city);
    }

    if (requiredRank >= LEVEL_RANK.barangay && !this.state.barangay_id) {
      missing.push('barangay');
      messages.push(this.validationMessages.barangay);
    }

    return {
      valid: missing.length === 0,
      required_location_level: this.requiredLevel,
      missing,
      messages,
      location: this.currentLocation()
    };
  }

  isValid() {
    return this.validate().valid;
  }

  save() {
    if (this.busy || this.disabled || this.readOnly) {
      return;
    }

    const validation = this.validate();
    if (!validation.valid) {
      this.setMessage(validation.messages[0] || 'Complete the required location fields before saving.', 'error');
      this.setActiveLevel(validation.missing[0] || this.firstIncompleteLevel());
      return;
    }

    this.updateHiddenInputs();
    this.updateSummary();
    this.emit('change', this.currentLocation());
    this.close();
  }

  clear(emitChange = true, options = {}) {
    if ((this.busy || this.disabled || this.readOnly) && options.force !== true) {
      return;
    }

    this.state = {
      region_id: '',
      region_name: '',
      province_id: '',
      province_name: '',
      city_id: '',
      city_name: '',
      barangay_id: '',
      barangay_name: ''
    };
    this.lists.province = [];
    this.lists.city = [];
    this.lists.barangay = [];
    this.updateHiddenInputs();
    this.updateSummary();
    if (emitChange) {
      this.emit('change', this.currentLocation());
    }
    this.setActiveLevel('region');
  }

  displayLabel() {
    const formats = {
      region_province_city_barangay: [this.state.region_name, this.state.province_name, this.state.city_name, this.state.barangay_name],
      province_city_barangay: [this.state.province_name, this.state.city_name, this.state.barangay_name],
      city_barangay: [this.state.city_name, this.state.barangay_name],
      barangay_only: [this.state.barangay_name]
    };
    return (formats[this.selectedLabelFormat] || formats.city_barangay).filter(Boolean).join(' → ');
  }

  updateSummary() {
    this.summaryEl.textContent = this.displayLabel() || this.placeholder;
    this.root.querySelector('.ph-location-picker__control').classList.toggle('is-selected', Boolean(this.state.barangay_id));
  }

  updateHiddenInputs() {
    setInput(this.hiddenInputs.regionId, this.state.region_id);
    setInput(this.hiddenInputs.regionName, this.state.region_name);
    setInput(this.hiddenInputs.provinceId, this.state.province_id);
    setInput(this.hiddenInputs.provinceName, this.state.province_name);
    setInput(this.hiddenInputs.cityId, this.state.city_id);
    setInput(this.hiddenInputs.cityName, this.state.city_name);
    setInput(this.hiddenInputs.barangayId, this.state.barangay_id);
    setInput(this.hiddenInputs.barangayName, this.state.barangay_name);
    setInput(this.hiddenInputs.label, this.displayLabel());
  }

  currentLocation() {
    const label = this.displayLabel();
    return { ...this.state, label, display_label: label };
  }

  setMessage(message, tone) {
    this.messageEl.textContent = message || '';
    this.messageEl.classList.toggle('is-error', tone === 'error');
  }

  destroy() {
    if (this.modalEl && !this.modalEl.hidden) {
      this.close();
    }

    this.modalInertElements.forEach((element) => setElementInert(element, false));
    this.modalInertElements = [];
    document.removeEventListener('focusin', this.boundDocumentFocus, true);
    document.removeEventListener('keydown', this.boundDocumentKeydown, true);
    this.handlers = {};
    this.mount.innerHTML = '';
    document.documentElement.classList.remove('plmp-modal-open');
  }

}
