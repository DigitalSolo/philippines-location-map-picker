/*
 * Philippines Address Picker v2
 * Dependency-free, form-friendly Philippine address component.
 * Administrative hierarchy comes from the bundled PSA PSGC dataset.
 */
(function (global) {
  'use strict';

  var SCRIPT_URL = (document.currentScript && document.currentScript.src) || '';
  var DEFAULT_DATA_URL = SCRIPT_URL ? new URL('../data/psgc/', SCRIPT_URL).href.replace(/\/$/, '') : '/data/psgc';
  var DEFAULT_CSS_URL = SCRIPT_URL ? new URL('philippines-address-picker.css', SCRIPT_URL).href : '';
  var mounted = new WeakMap();

  function text(value) { return value == null ? '' : String(value).trim(); }
  function bool(value, fallback) {
    if (value == null || value === '') return fallback;
    if (typeof value === 'boolean') return value;
    return !['0', 'false', 'no', 'off'].includes(String(value).toLowerCase());
  }
  function numberOrNull(value) {
    var n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  function formatAccuracy(value) {
    var n = numberOrNull(value);
    if (n === null) return 'unknown accuracy';
    if (n >= 1000) return '±' + (Math.round(n / 100) / 10).toLocaleString() + ' km';
    return '±' + Math.round(n).toLocaleString() + ' m';
  }
  function maxPsgcLevelForAccuracy(value) {
    var n = numberOrNull(value);
    if (n === null) return 'locality';
    if (n <= 500) return 'barangay';
    if (n <= 5000) return 'locality';
    if (n <= 15000) return 'area';
    return 'region';
  }
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
  function byId(rows, id) { return (rows || []).find(function (row) { return row.id === id; }) || null; }
  function cleanBaseUrl(value) { return text(value || DEFAULT_DATA_URL).replace(/\/$/, ''); }
  function normalizePlaceName(value) {
    return text(value)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/\b(?:city|municipality|province)\s+of\s+/g, '')
      .replace(/\s+(?:city|municipality)\b/g, '')
      .replace(/\b(?:barangay|brgy\.?|bgy\.?)\s+/g, '')
      .replace(/\bnational capital region\b/g, 'metro manila')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function uniquePlaceNames(values) {
    var seen = new Set();
    return (values || []).map(text).filter(function (value) {
      var key = normalizePlaceName(value);
      if (!key || seen.has(key)) return false;
      seen.add(key); return true;
    });
  }
  function exactNameMatch(rows, candidates) {
    var wanted = new Set((candidates || []).map(normalizePlaceName).filter(Boolean));
    if (!wanted.size) return null;
    return (rows || []).find(function (row) { return wanted.has(normalizePlaceName(row && row.name)); }) || null;
  }
  function firstCandidateMatch(rows, candidates) {
    rows = rows || [];
    for (var i = 0; i < (candidates || []).length; i += 1) {
      var wanted = normalizePlaceName(candidates[i]);
      if (!wanted) continue;
      var match = rows.find(function (row) { return normalizePlaceName(row && row.name) === wanted; });
      if (match) return match;
    }
    return null;
  }
  function fieldName(prefix, name) { return prefix ? prefix + '_' + name : name; }
  function dispatch(el, name, detail) { el.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: detail })); }
  function visible(el, show) { el.hidden = !show; }

  function inferOptions(el, options) {
    var d = el.dataset || {};
    var base = Object.assign({}, options || {});
    base.dataUrl = cleanBaseUrl(base.dataUrl || d.dataUrl || d.baseUrl);
    base.prefix = text(base.prefix != null ? base.prefix : d.prefix);
    base.required = bool(base.required != null ? base.required : d.required, true);
    base.requireLine1 = bool(base.requireLine1 != null ? base.requireLine1 : d.requireLine1, base.required);
    base.requirePostalCode = bool(base.requirePostalCode != null ? base.requirePostalCode : d.requirePostalCode, false);
    base.geolocation = bool(base.geolocation != null ? base.geolocation : d.geolocation, true);
    base.autoFillCurrentLocation = bool(base.autoFillCurrentLocation != null ? base.autoFillCurrentLocation : d.autoFillCurrentLocation, true);
    base.locationLookupProvider = text(base.locationLookupProvider || d.locationLookupProvider || 'bigdatacloud').toLowerCase();
    base.locationLookup = typeof base.locationLookup === 'function' ? base.locationLookup : null;
    base.locationLanguage = text(base.locationLanguage || d.locationLanguage || 'en');
    base.autoCss = bool(base.autoCss != null ? base.autoCss : d.autoCss, true);
    base.country = text(base.country || d.country || 'Philippines');
    base.title = text(base.title != null ? base.title : d.title);
    base.compact = bool(base.compact != null ? base.compact : d.compact, false);
    base.theme = text(base.theme || d.theme || 'light').toLowerCase();
    base.initialValue = base.initialValue || null;
    if (!base.initialValue && d.value) {
      try { base.initialValue = JSON.parse(d.value); } catch (_) { /* ignore invalid attribute JSON */ }
    }
    return base;
  }

  function ensureCss(url) {
    if (!url || document.querySelector('link[data-ph-address-picker-style]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.setAttribute('data-ph-address-picker-style', '');
    document.head.appendChild(link);
  }

  function createOption(value, label, selected) {
    var option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    option.selected = !!selected;
    return option;
  }

  function fillSelect(select, rows, placeholder, selectedId) {
    select.innerHTML = '';
    select.appendChild(createOption('', placeholder || 'Select…', !selectedId));
    (rows || []).forEach(function (row) {
      select.appendChild(createOption(row.id, row.name, row.id === selectedId));
    });
    select.disabled = !(rows && rows.length);
  }

  function fillAreaSelect(select, rows, selectedId) {
    select.innerHTML = '';
    select.appendChild(createOption('', 'Select province or city…', !selectedId));
    var groups = [
      ['province', 'Provinces'],
      ['independent_city', 'Independent / highly urbanized cities'],
      ['special_area', 'Special administrative areas']
    ];
    groups.forEach(function (pair) {
      var items = (rows || []).filter(function (r) { return r.kind === pair[0]; });
      if (!items.length) return;
      var group = document.createElement('optgroup');
      group.label = pair[1];
      items.forEach(function (row) { group.appendChild(createOption(row.id, row.name, row.id === selectedId)); });
      select.appendChild(group);
    });
    select.disabled = !(rows && rows.length);
  }

  function normalizeInitialValue(value) {
    value = value || {};
    var loc = value.location || value;
    var pin = value.coordinates || value.pin || {};
    return {
      line1: text(value.address_line1 || value.line1 || value.street_address || value.street || ''),
      line2: text(value.address_line2 || value.line2 || value.subdivision || ''),
      postalCode: text(value.postal_code || value.zip_code || value.zip || ''),
      regionId: text(loc.region_id || loc.region_psgc || value.region_psgc || ''),
      provinceId: text(loc.province_id || loc.province_psgc || value.province_psgc || ''),
      adminAreaId: text(loc.administrative_area_id || loc.admin_area_id || value.administrative_area_psgc || ''),
      cityId: text(loc.city_id || loc.city_municipality_id || loc.city_psgc || value.city_psgc || ''),
      districtId: text(loc.district_id || loc.submunicipality_id || value.district_psgc || ''),
      barangayId: text(loc.barangay_id || loc.barangay_psgc || value.barangay_psgc || ''),
      lat: numberOrNull(pin.lat != null ? pin.lat : value.latitude),
      lng: numberOrNull(pin.lng != null ? pin.lng : value.longitude),
      accuracy: numberOrNull(pin.accuracy_m != null ? pin.accuracy_m : value.coordinate_accuracy_m)
    };
  }

  function AddressPicker(el, options) {
    if (!el) throw new Error('PhilippinesAddressPicker requires a mount element.');
    if (mounted.has(el)) return mounted.get(el);
    this.el = el;
    this.options = inferOptions(el, options);
    this.index = null;
    this.barangayCache = new Map();
    this.coordinateSource = '';
    this.coordinateAccuracy = null;
    this.destroyed = false;
    this.handlers = [];
    this.render();
    this.bind();
    if (this.options.autoCss) ensureCss(DEFAULT_CSS_URL);
    this.ready = this.load().then(this.applyInitial.bind(this));
    mounted.set(el, this);
  }

  AddressPicker.prototype.render = function () {
    var prefix = this.options.prefix;
    var compact = this.options.compact ? ' ph-address--compact' : '';
    this.el.classList.add('ph-address-picker-host');
    this.el.innerHTML = [
      '<section class="ph-address-picker' + compact + '" data-ph-address-root>',
      this.options.title ? '<div class="ph-address__title">' + esc(this.options.title) + '</div>' : '',
      '<div class="ph-address__grid">',
        '<label class="ph-address__field ph-address__span-2"><span>House / building and street' + (this.options.requireLine1 ? ' <b aria-hidden="true">*</b>' : '') + '</span><input type="text" autocomplete="address-line1" data-field="line1" name="' + esc(fieldName(prefix, 'address_line1')) + '" placeholder="House no., building, street"></label>',
        '<label class="ph-address__field ph-address__span-2"><span>Subdivision / Sitio / Purok / Landmark <em>optional</em></span><input type="text" autocomplete="address-line2" data-field="line2" name="' + esc(fieldName(prefix, 'address_line2')) + '" placeholder="Additional local address details"></label>',
        '<div class="ph-address__admin-grid" data-admin-grid>',
          '<label class="ph-address__field"><span>Region' + (this.options.required ? ' <b aria-hidden="true">*</b>' : '') + '</span><select data-field="region"><option>Loading…</option></select></label>',
          '<label class="ph-address__field"><span>Province / city' + (this.options.required ? ' <b aria-hidden="true">*</b>' : '') + '</span><select data-field="area" disabled><option>Select a region first</option></select></label>',
          '<label class="ph-address__field" data-row="locality"><span>City / municipality' + (this.options.required ? ' <b aria-hidden="true">*</b>' : '') + '</span><select data-field="locality" disabled><option>Select a province first</option></select></label>',
          '<label class="ph-address__field" data-row="district" hidden><span>District' + (this.options.required ? ' <b aria-hidden="true">*</b>' : '') + '</span><select data-field="district" disabled><option>Select a city first</option></select></label>',
          '<label class="ph-address__field"><span>Barangay' + (this.options.required ? ' <b aria-hidden="true">*</b>' : '') + '</span><select data-field="barangay" disabled><option>Select a city first</option></select></label>',
          '<label class="ph-address__field"><span>ZIP code' + (this.options.requirePostalCode ? ' <b aria-hidden="true">*</b>' : ' <em>optional</em>') + '</span><input type="text" inputmode="text" maxlength="12" autocomplete="postal-code" data-field="postal" name="' + esc(fieldName(prefix, 'postal_code')) + '" placeholder="4600"></label>',
        '</div>',
      '</div>',
      '<div class="ph-address__location" data-location-row>',
        this.options.geolocation ? '<button type="button" class="ph-address__geo" data-action="geolocate">Use my current location</button>' : '',
        '<span class="ph-address__coord" data-coordinate-label>No exact coordinate saved</span>',
      '</div>',
      '<div class="ph-address__status" data-status role="status" aria-live="polite"></div>',
      '<div data-hidden-fields></div>',
      '</section>'
    ].join('');

    this.root = this.el.querySelector('[data-ph-address-root]');
    this.root.dataset.theme = this.options.theme;
    this.fields = {};
    ['line1','line2','region','area','locality','district','barangay','postal'].forEach(function (name) {
      this.fields[name] = this.el.querySelector('[data-field="' + name + '"]');
    }, this);
    this.rows = {
      locality: this.el.querySelector('[data-row="locality"]'),
      district: this.el.querySelector('[data-row="district"]')
    };
    this.adminGrid = this.el.querySelector('[data-admin-grid]');
    this.statusEl = this.el.querySelector('[data-status]');
    this.coordinateLabel = this.el.querySelector('[data-coordinate-label]');
    this.geoButton = this.el.querySelector('[data-action="geolocate"]');
    this.hiddenRoot = this.el.querySelector('[data-hidden-fields]');
    this.hidden = {};
    var hiddenNames = ['region_psgc','region_name','province_psgc','province_name','administrative_area_psgc','administrative_area_name','city_psgc','city_name','district_psgc','district_name','barangay_psgc','barangay_name','latitude','longitude','coordinate_accuracy_m','formatted_address','address_json','address_dataset_as_of'];
    hiddenNames.forEach(function (name) {
      var input = document.createElement('input');
      input.type = 'hidden';
      input.name = fieldName(prefix, name);
      input.dataset.phAddressHidden = name;
      this.hidden[name] = input;
      this.hiddenRoot.appendChild(input);
    }, this);
  };

  AddressPicker.prototype.bind = function () {
    var self = this;
    function on(target, event, handler) { target.addEventListener(event, handler); self.handlers.push([target,event,handler]); }
    on(this.fields.region, 'change', function () { self.regionChanged(); });
    on(this.fields.area, 'change', function () { self.areaChanged(); });
    on(this.fields.locality, 'change', function () { self.localityChanged(); });
    on(this.fields.district, 'change', function () { self.districtChanged(); });
    ['barangay','line1','line2','postal'].forEach(function (name) {
      var event = ['line1','line2','postal'].includes(name) ? 'input' : 'change';
      on(self.fields[name], event, function () {
        self.sync();
        if (name === 'barangay' && self.fields.barangay.value) self.focusAndOpenField(self.fields.postal);
      });
    });
    if (this.geoButton) on(this.geoButton, 'click', function () { self.geolocate(); });
    this.form = this.el.closest('form');
    if (this.form) on(this.form, 'submit', function (event) {
      var result = self.validate();
      if (!result.valid) {
        event.preventDefault();
        var first = result.missing[0] && self.fields[result.missing[0]];
        if (first && typeof first.focus === 'function') first.focus();
      }
    });
  };

  AddressPicker.prototype.fetchJson = async function (path, optional) {
    var response;
    try {
      response = await fetch(this.options.dataUrl + '/' + path.replace(/^\//, ''), { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
    } catch (error) {
      if (optional) return null;
      throw new Error('Could not load Philippine address data. Check dataUrl and network access.');
    }
    if (!response.ok) {
      if (optional && (response.status === 404 || response.status === 403)) return null;
      throw new Error('Philippine address data request failed (' + response.status + ').');
    }
    return response.json();
  };

  AddressPicker.prototype.load = async function () {
    this.setBusy(true, 'Loading Philippine address data…');
    try {
      this.index = await this.fetchJson('hierarchy-index.json');
      fillSelect(this.fields.region, this.index.regions || [], 'Select region…', '');
      this.setStatus('', '');
      return this;
    } catch (error) {
      this.setStatus(error.message || 'Address data failed to load.', 'error');
      throw error;
    } finally {
      this.setBusy(false);
    }
  };

  AddressPicker.prototype.setBusy = function (busy, message) {
    this.root.classList.toggle('is-busy', !!busy);
    this.root.setAttribute('aria-busy', busy ? 'true' : 'false');
    if (message && busy) this.setStatus(message, 'info');
  };

  AddressPicker.prototype.setStatus = function (message, level) {
    this.statusEl.textContent = message || '';
    this.statusEl.dataset.level = level || '';
  };

  AddressPicker.prototype.currentRegion = function () {
    return byId(this.index && this.index.regions, this.fields.region.value);
  };
  AddressPicker.prototype.currentArea = function () {
    var rows = (this.index && this.index.areas_by_region && this.index.areas_by_region[this.fields.region.value]) || [];
    return byId(rows, this.fields.area.value);
  };
  AddressPicker.prototype.currentLocality = function () {
    var area = this.currentArea();
    if (!area) return null;
    if (area.kind === 'independent_city') return (this.index.lookup.localities || {})[area.id] || { id: area.id, name: area.name, region_id: area.region_id, area_id: area.id, area_kind: area.kind, province_id: '' };
    var rows = (this.index.localities_by_area && this.index.localities_by_area[area.id]) || [];
    return byId(rows, this.fields.locality.value);
  };
  AddressPicker.prototype.currentDistrict = function () {
    var city = this.currentLocality();
    var rows = city ? ((this.index.districts_by_city && this.index.districts_by_city[city.id]) || []) : [];
    return byId(rows, this.fields.district.value);
  };
  AddressPicker.prototype.currentBarangay = function () {
    var rows = this._currentBarangays || [];
    return byId(rows, this.fields.barangay.value);
  };

  AddressPicker.prototype.setDistrictVisible = function (show) {
    visible(this.rows.district, !!show);
    if (this.adminGrid) this.adminGrid.classList.toggle('has-district', !!show);
  };

  AddressPicker.prototype.closeAutoMenu = function () {
    if (this._autoMenu && this._autoMenu.parentNode) this._autoMenu.parentNode.removeChild(this._autoMenu);
    this._autoMenu = null;
    if (this._autoMenuOutsideHandler) {
      document.removeEventListener('pointerdown', this._autoMenuOutsideHandler, true);
      this._autoMenuOutsideHandler = null;
    }
    if (this._autoMenuKeyHandler) {
      document.removeEventListener('keydown', this._autoMenuKeyHandler, true);
      this._autoMenuKeyHandler = null;
    }
    if (this._autoMenuViewportHandler) {
      window.removeEventListener('resize', this._autoMenuViewportHandler, true);
      window.removeEventListener('scroll', this._autoMenuViewportHandler, true);
      this._autoMenuViewportHandler = null;
    }
  };

  AddressPicker.prototype.openAutoMenu = function (select) {
    if (!select || select.disabled || select.tagName !== 'SELECT') return false;
    var options = Array.from(select.options || []).filter(function (option) {
      return !!option.value && !option.disabled;
    });
    if (!options.length) return false;

    this.closeAutoMenu();
    var self = this;
    var rect = select.getBoundingClientRect();
    var menu = document.createElement('div');
    menu.className = 'ph-address__auto-menu';
    menu.setAttribute('role', 'listbox');
    menu.style.left = Math.max(8, rect.left) + 'px';
    menu.style.top = Math.min(window.innerHeight - 80, rect.bottom + 3) + 'px';
    menu.style.width = Math.max(180, rect.width) + 'px';
    menu.style.maxHeight = Math.max(120, Math.min(300, window.innerHeight - rect.bottom - 18)) + 'px';

    options.forEach(function (option) {
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'ph-address__auto-option';
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', option.value === select.value ? 'true' : 'false');
      item.textContent = option.textContent;
      item.addEventListener('pointerdown', function (event) { event.preventDefault(); });
      item.addEventListener('click', function () {
        select.value = option.value;
        self.closeAutoMenu();
        select.focus();
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });
      menu.appendChild(item);
    });

    this.root.appendChild(menu);
    this._autoMenu = menu;
    this._autoMenuOutsideHandler = function (event) {
      if (event.target === select || menu.contains(event.target)) return;
      self.closeAutoMenu();
    };
    this._autoMenuKeyHandler = function (event) {
      if (event.key === 'Escape') {
        self.closeAutoMenu();
        select.focus();
      }
    };
    this._autoMenuViewportHandler = function () { self.closeAutoMenu(); };
    document.addEventListener('pointerdown', this._autoMenuOutsideHandler, true);
    document.addEventListener('keydown', this._autoMenuKeyHandler, true);
    window.addEventListener('resize', this._autoMenuViewportHandler, true);
    window.addEventListener('scroll', this._autoMenuViewportHandler, true);
    return true;
  };

  AddressPicker.prototype.focusAndOpenField = function (field) {
    if (typeof field === 'string') field = this.fields[field];
    if (!field || field.disabled || field.hidden || (field.closest && field.closest('[hidden]'))) return false;
    this.closeAutoMenu();
    try { field.focus({ preventScroll: false }); } catch (_) { field.focus(); }
    if (field.tagName !== 'SELECT') return true;
    var hasChoices = Array.from(field.options || []).some(function (option) { return !!option.value && !option.disabled; });
    if (!hasChoices) return true;

    if (typeof field.showPicker === 'function') {
      try {
        field.showPicker();
        return true;
      } catch (_) {
        // Browsers require transient user activation for showPicker(). Geolocation
        // finishes asynchronously, so use our own lightweight menu as a fallback.
      }
    }
    return this.openAutoMenu(field);
  };

  AddressPicker.prototype.firstUnresolvedField = function () {
    if (!this.fields.region.value) return this.fields.region;
    if (!this.fields.area.value) return this.fields.area;
    var area = this.currentArea();
    if (area && area.kind !== 'independent_city' && !this.fields.locality.value) return this.fields.locality;
    if (!this.rows.district.hidden && !this.fields.district.value) return this.fields.district;
    if (!this.fields.barangay.value) return this.fields.barangay;
    if (!text(this.fields.postal.value)) return this.fields.postal;
    if (this.options.requireLine1 && !text(this.fields.line1.value)) return this.fields.line1;
    return null;
  };

  AddressPicker.prototype.advanceToFirstUnresolved = function () {
    var field = this.firstUnresolvedField();
    if (field) this.focusAndOpenField(field);
    return field;
  };

  AddressPicker.prototype.regionChanged = async function (options) {
    options = options || {};
    var rid = this.fields.region.value;
    this._currentBarangays = [];
    fillAreaSelect(this.fields.area, rid ? (this.index.areas_by_region[rid] || []) : [], '');
    fillSelect(this.fields.locality, [], 'Select a province first', '');
    fillSelect(this.fields.district, [], 'Select a city first', '');
    fillSelect(this.fields.barangay, [], 'Select a city first', '');
    visible(this.rows.locality, true);
    this.setDistrictVisible(false);
    this.sync();
    if (options.advance !== false && rid) this.focusAndOpenField(this.fields.area);
  };

  AddressPicker.prototype.areaChanged = async function (options) {
    options = options || {};
    var area = this.currentArea();
    this._currentBarangays = [];
    fillSelect(this.fields.locality, [], 'Select a province first', '');
    fillSelect(this.fields.district, [], 'Select a city first', '');
    fillSelect(this.fields.barangay, [], 'Select a city first', '');
    this.setDistrictVisible(false);
    if (!area) {
      visible(this.rows.locality, true);
      this.sync();
      return;
    }
    if (area.kind === 'independent_city') {
      visible(this.rows.locality, false);
      await this.afterLocalityResolved();
    } else {
      visible(this.rows.locality, true);
      var rows = (this.index.localities_by_area && this.index.localities_by_area[area.id]) || [];
      fillSelect(this.fields.locality, rows, 'Select city / municipality…', '');
    }
    this.sync();
    if (options.advance !== false) {
      if (area.kind !== 'independent_city') this.focusAndOpenField(this.fields.locality);
      else if (!this.rows.district.hidden) this.focusAndOpenField(this.fields.district);
      else this.focusAndOpenField(this.fields.barangay);
    }
  };

  AddressPicker.prototype.localityChanged = async function (options) {
    options = options || {};
    this._currentBarangays = [];
    fillSelect(this.fields.district, [], 'Select district…', '');
    fillSelect(this.fields.barangay, [], 'Select a city first', '');
    this.setDistrictVisible(false);
    await this.afterLocalityResolved();
    this.sync();
    if (options.advance !== false && this.fields.locality.value) {
      if (!this.rows.district.hidden) this.focusAndOpenField(this.fields.district);
      else this.focusAndOpenField(this.fields.barangay);
    }
  };

  AddressPicker.prototype.afterLocalityResolved = async function () {
    var city = this.currentLocality();
    if (!city) return;
    var districts = (this.index.districts_by_city && this.index.districts_by_city[city.id]) || [];
    if (districts.length) {
      this.setDistrictVisible(true);
      fillSelect(this.fields.district, districts, 'Select district…', '');
      fillSelect(this.fields.barangay, [], 'Select a district first', '');
      return;
    }
    this.setDistrictVisible(false);
    await this.loadBarangays(city.id);
  };

  AddressPicker.prototype.districtChanged = async function (options) {
    options = options || {};
    var district = this.currentDistrict();
    this._currentBarangays = [];
    if (!district) {
      fillSelect(this.fields.barangay, [], 'Select a district first', '');
      this.sync();
      return;
    }
    await this.loadBarangays(district.id);
    this.sync();
    if (options.advance !== false) this.focusAndOpenField(this.fields.barangay);
  };

  AddressPicker.prototype.loadBarangays = async function (parentId, selectedId) {
    if (!parentId) return;
    this.setBusy(true, 'Loading barangays…');
    try {
      var rows = this.barangayCache.get(parentId);
      if (!rows) {
        rows = await this.fetchJson('barangays/' + encodeURIComponent(parentId) + '.json');
        this.barangayCache.set(parentId, rows || []);
      }
      this._currentBarangays = rows || [];
      fillSelect(this.fields.barangay, this._currentBarangays, 'Select barangay…', selectedId || '');
      this.setStatus('', '');
    } catch (error) {
      this._currentBarangays = [];
      fillSelect(this.fields.barangay, [], 'Barangays unavailable', '');
      this.setStatus(error.message || 'Barangays could not be loaded.', 'error');
    } finally {
      this.setBusy(false);
    }
  };

  AddressPicker.prototype.applyInitial = async function () {
    var initial = normalizeInitialValue(this.options.initialValue || {});
    this.fields.line1.value = initial.line1;
    this.fields.line2.value = initial.line2;
    this.fields.postal.value = initial.postalCode;
    if (initial.lat !== null && initial.lng !== null) {
      this.setCoordinates(initial.lat, initial.lng, initial.accuracy, 'initial');
    }
    if (!initial.regionId && !initial.cityId && !initial.barangayId) {
      this.sync();
      return this;
    }
    await this.setValue(initial, { normalized: true, silent: true });
    return this;
  };

  AddressPicker.prototype.resolvePath = function (normalized) {
    var n = normalized;
    var lookup = this.index.lookup || {};
    var districtId = n.districtId;
    var cityId = n.cityId;
    if (cityId && lookup.districts && lookup.districts[cityId]) {
      districtId = cityId;
      cityId = lookup.districts[cityId].city_id;
    }
    if (n.barangayId && !districtId && !cityId && n.barangayId.length >= 7) {
      var parentId = n.barangayId.slice(0, 7) + '000';
      if (lookup.districts && lookup.districts[parentId]) {
        districtId = parentId;
        cityId = lookup.districts[parentId].city_id;
      } else {
        cityId = parentId;
      }
    }
    if (districtId && !cityId && lookup.districts && lookup.districts[districtId]) cityId = lookup.districts[districtId].city_id;
    var city = cityId && lookup.localities ? lookup.localities[cityId] : null;
    var areaId = n.adminAreaId || n.provinceId || (city && city.area_id) || '';
    var area = areaId && lookup.areas ? lookup.areas[areaId] : null;
    var regionId = n.regionId || (city && city.region_id) || (area && area.region_id) || '';
    return { regionId: regionId, areaId: areaId, cityId: cityId || '', districtId: districtId || '', barangayId: n.barangayId || '' };
  };

  AddressPicker.prototype.setValue = async function (value, options) {
    options = options || {};
    if (!this.index && this.ready) await this.ready.catch(function () {});
    var n = options.normalized ? value : normalizeInitialValue(value);
    if (!options.normalized) {
      this.fields.line1.value = n.line1;
      this.fields.line2.value = n.line2;
      this.fields.postal.value = n.postalCode;
      if (n.lat !== null && n.lng !== null) this.setCoordinates(n.lat, n.lng, n.accuracy, 'setValue');
    }
    var path = this.resolvePath(n);
    if (path.regionId) {
      this.fields.region.value = path.regionId;
      await this.regionChanged({ advance: false });
    }
    if (path.areaId) {
      this.fields.area.value = path.areaId;
      await this.areaChanged({ advance: false });
    }
    var area = this.currentArea();
    if (area && area.kind !== 'independent_city' && path.cityId) {
      this.fields.locality.value = path.cityId;
      await this.localityChanged({ advance: false });
    }
    if (path.districtId) {
      this.fields.district.value = path.districtId;
      await this.districtChanged({ advance: false });
    }
    var city = this.currentLocality();
    var district = this.currentDistrict();
    if (path.barangayId) {
      var parentId = district ? district.id : (city ? city.id : '');
      if (parentId && (!this._currentBarangays || !this._currentBarangays.length)) await this.loadBarangays(parentId, path.barangayId);
      this.fields.barangay.value = path.barangayId;
    }
    this.sync(options.silent);
    return this;
  };

  AddressPicker.prototype.locationCandidates = function (lookup) {
    lookup = lookup || {};
    var administrative = lookup.localityInfo && Array.isArray(lookup.localityInfo.administrative) ? lookup.localityInfo.administrative : [];
    var deepestFirst = administrative.slice().sort(function (a, b) {
      var aa = Number(a && a.adminLevel); var bb = Number(b && b.adminLevel);
      if (Number.isFinite(aa) && Number.isFinite(bb) && aa !== bb) return bb - aa;
      return Number(b && b.order || 0) - Number(a && a.order || 0);
    });
    var administrativeNames = uniquePlaceNames(deepestFirst.map(function (row) { return row && row.name; }));
    var barangayAdminNames = uniquePlaceNames(deepestFirst.filter(function (row) {
      return Number(row && row.adminLevel) >= 9;
    }).map(function (row) { return row && row.name; }));
    return {
      all: uniquePlaceNames([lookup.locality, lookup.city, lookup.principalSubdivision].concat(administrativeNames)),
      administrative: administrativeNames,
      city: uniquePlaceNames([lookup.city, lookup.locality].concat(administrativeNames)),
      province: uniquePlaceNames([lookup.principalSubdivision].concat(administrativeNames)),
      barangay: uniquePlaceNames(barangayAdminNames.concat([lookup.locality], administrativeNames))
    };
  };

  AddressPicker.prototype.reverseLookupCurrentLocation = async function (lat, lng) {
    if (this.options.locationLookup) {
      return this.options.locationLookup({ latitude: lat, longitude: lng, language: this.options.locationLanguage, picker: this });
    }
    if (!this.options.autoFillCurrentLocation || this.options.locationLookupProvider === 'none') return null;
    if (this.options.locationLookupProvider !== 'bigdatacloud') {
      throw new Error('Unknown current-location lookup provider: ' + this.options.locationLookupProvider);
    }
    var url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lng));
    url.searchParams.set('localityLanguage', this.options.locationLanguage || 'en');
    var response = await fetch(url.toString(), {
      method: 'GET', mode: 'cors', credentials: 'omit', cache: 'no-store', headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error('Location lookup failed (' + response.status + ').');
    return response.json();
  };

  AddressPicker.prototype.postalCodeFromLookup = function (lookup) {
    lookup = lookup || {};
    var value = text(lookup.postcode || lookup.postalCode || lookup.postal_code ||
      (lookup.address && (lookup.address.postcode || lookup.address.postalCode || lookup.address.postal_code)));
    return value && /^[A-Za-z0-9][A-Za-z0-9 -]{1,11}$/.test(value) ? value : '';
  };

  AddressPicker.prototype.applyLookupPostalCode = function (lookup) {
    var postal = this.postalCodeFromLookup(lookup);
    if (postal && !text(this.fields.postal.value)) this.fields.postal.value = postal;
    return postal;
  };

  AddressPicker.prototype.matchCurrentLocationToPsgc = async function (lookup, options) {
    if (!lookup || !this.index) return { level: '', matched: [] };
    options = options || {};
    var maxLevel = text(options.maxLevel || 'barangay');
    var countryCode = text(lookup.countryCode).toUpperCase();
    if (countryCode && countryCode !== 'PH') return { outsidePhilippines: true, level: '', matched: [] };

    var candidates = this.locationCandidates(lookup);
    var areas = Object.values((this.index.lookup && this.index.lookup.areas) || {});
    var localities = Object.values((this.index.lookup && this.index.lookup.localities) || {});
    var independentAreas = areas.filter(function (row) { return row.kind === 'independent_city'; });
    var area = firstCandidateMatch(independentAreas, uniquePlaceNames([lookup.city, lookup.locality]));
    if (!area) area = firstCandidateMatch(areas.filter(function (row) { return row.kind !== 'independent_city'; }), candidates.province);
    var locality = null;

    if (area && area.kind === 'independent_city') {
      locality = (this.index.lookup.localities || {})[area.id] || { id: area.id, name: area.name, region_id: area.region_id, area_id: area.id, area_kind: area.kind };
    } else if (area) {
      locality = exactNameMatch((this.index.localities_by_area && this.index.localities_by_area[area.id]) || [], candidates.city);
    }

    if (!locality) {
      var localityMatches = localities.filter(function (row) {
        var key = normalizePlaceName(row && row.name);
        return candidates.city.some(function (candidate) { return normalizePlaceName(candidate) === key; });
      });
      if (area) localityMatches = localityMatches.filter(function (row) { return row.area_id === area.id || row.id === area.id; });
      if (localityMatches.length === 1) locality = localityMatches[0];
      else if (localityMatches.length > 1) {
        var provinceCandidateKeys = new Set(candidates.province.map(normalizePlaceName));
        var narrowed = localityMatches.filter(function (row) {
          var parent = (this.index.lookup.areas || {})[row.area_id];
          return parent && provinceCandidateKeys.has(normalizePlaceName(parent.name));
        }, this);
        if (narrowed.length === 1) locality = narrowed[0];
      }
      if (locality && !area) area = (this.index.lookup.areas || {})[locality.area_id] || null;
    }

    if (!area && !locality) {
      var areaMatches = areas.filter(function (row) {
        var key = normalizePlaceName(row && row.name);
        return candidates.all.some(function (candidate) { return normalizePlaceName(candidate) === key; });
      });
      if (areaMatches.length === 1) area = areaMatches[0];
    }

    var regionId = locality && locality.region_id || area && area.region_id || '';
    if (!regionId) {
      var region = exactNameMatch(this.index.regions || [], candidates.all);
      regionId = region && region.id || '';
    }
    if (!regionId) return { level: '', matched: [] };

    this.fields.region.value = regionId;
    await this.regionChanged({ advance: false });
    var matched = [this.currentRegion() && this.currentRegion().name].filter(Boolean);
    if (maxLevel === 'region' || !area) {
      this.sync();
      return { level: 'region', matched: matched, area: null, locality: null, district: null, barangay: null };
    }

    this.fields.area.value = area.id;
    await this.areaChanged({ advance: false });
    matched.push(area.name);
    if (maxLevel === 'area') {
      this.sync();
      return { level: 'area', matched: matched, area: area, locality: null, district: null, barangay: null };
    }

    if (area.kind !== 'independent_city') {
      if (!locality) return { level: 'area', matched: matched };
      this.fields.locality.value = locality.id;
      await this.localityChanged({ advance: false });
    } else {
      locality = this.currentLocality();
    }
    if (!locality) return { level: 'area', matched: matched };
    if (!matched.includes(locality.name)) matched.push(locality.name);

    var cityDistricts = (this.index.districts_by_city && this.index.districts_by_city[locality.id]) || [];
    var district = cityDistricts.length ? exactNameMatch(cityDistricts, candidates.administrative) : null;
    if (district) {
      this.fields.district.value = district.id;
      await this.districtChanged({ advance: false });
      matched.push(district.name);
    }

    if (maxLevel === 'locality') {
      this.applyLookupPostalCode(lookup);
      this.sync();
      return { level: district ? 'district' : 'locality', matched: matched, barangay: null, district: district || null, locality: locality, area: area };
    }

    var barangay = firstCandidateMatch(this._currentBarangays || [], candidates.barangay);
    if (barangay) {
      this.fields.barangay.value = barangay.id;
      matched.push(barangay.name);
    }
    this.applyLookupPostalCode(lookup);
    this.sync();
    return {
      level: barangay ? 'barangay' : (district ? 'district' : 'locality'),
      matched: matched, barangay: barangay || null, district: district || null, locality: locality, area: area
    };
  };

  AddressPicker.prototype.setCoordinates = function (lat, lng, accuracy, source) {
    lat = numberOrNull(lat); lng = numberOrNull(lng); accuracy = numberOrNull(accuracy);
    if (lat === null || lng === null) return;
    this.lat = lat; this.lng = lng; this.coordinateAccuracy = accuracy; this.coordinateSource = source || '';
    var suffix = accuracy !== null ? ' (±' + Math.round(accuracy) + ' m)' : '';
    this.coordinateLabel.textContent = lat.toFixed(6) + ', ' + lng.toFixed(6) + suffix;
  };

  AddressPicker.prototype.clearCoordinates = function () {
    this.lat = null; this.lng = null; this.coordinateAccuracy = null; this.coordinateSource = '';
    this.coordinateLabel.textContent = 'No exact coordinate saved';
    this.sync();
  };

  AddressPicker.prototype.getBestCurrentPosition = async function () {
    var self = this;
    var initial = await new Promise(function (resolve, reject) {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true, timeout: 15000, maximumAge: 0
      });
    });
    var initialAccuracy = numberOrNull(initial && initial.coords && initial.coords.accuracy);
    if (initialAccuracy !== null && initialAccuracy <= 1500) return initial;
    if (typeof navigator.geolocation.watchPosition !== 'function') return initial;

    self.setStatus('Location found, but it is only accurate to about ' + formatAccuracy(initialAccuracy) + '. Trying to improve it…', 'info');
    return new Promise(function (resolve) {
      var best = initial;
      var finished = false;
      var watchId = null;
      var timer = null;
      function finish() {
        if (finished) return;
        finished = true;
        if (timer) clearTimeout(timer);
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        resolve(best);
      }
      try {
        watchId = navigator.geolocation.watchPosition(function (position) {
          var bestAccuracy = numberOrNull(best && best.coords && best.coords.accuracy);
          var nextAccuracy = numberOrNull(position && position.coords && position.coords.accuracy);
          if (nextAccuracy !== null && (bestAccuracy === null || nextAccuracy < bestAccuracy)) best = position;
          if (nextAccuracy !== null && nextAccuracy <= 1000) finish();
        }, function () {
          // Keep the best position already obtained. A refinement failure is not fatal.
        }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
        timer = setTimeout(finish, 10000);
      } catch (_) {
        finish();
      }
    });
  };

  AddressPicker.prototype.geolocate = async function () {
    var self = this;
    if (!window.isSecureContext) {
      this.setStatus('Current location requires HTTPS or localhost/127.0.0.1. This page is not in a secure browser context.', 'error');
      return null;
    }
    if (!navigator.geolocation || typeof navigator.geolocation.getCurrentPosition !== 'function') {
      this.setStatus('This browser does not support location access.', 'error');
      return null;
    }
    if (this.geoButton) this.geoButton.disabled = true;
    this.setStatus('Getting your current location…', 'info');
    try {
      var position = await self.getBestCurrentPosition();
      var lat = position.coords.latitude;
      var lng = position.coords.longitude;
      var accuracy = numberOrNull(position.coords.accuracy);
      var maxLevel = maxPsgcLevelForAccuracy(accuracy);
      self.setCoordinates(lat, lng, accuracy, 'browser');

      if (!self.options.autoFillCurrentLocation || self.options.locationLookupProvider === 'none') {
        self.setStatus('Coordinates captured. Select and verify the PSGC address fields.', 'success');
        self.sync();
        self.advanceToFirstUnresolved();
        return { position: position, lookup: null, match: null };
      }

      self.setStatus('Location found. Matching it to the Philippine address hierarchy…', 'info');
      var lookup;
      try {
        lookup = await self.reverseLookupCurrentLocation(lat, lng);
      } catch (lookupError) {
        self.setStatus('Coordinates captured, but the place lookup service could not be reached. Select the address manually.', 'warning');
        self.sync();
        dispatch(self.el, 'ph-address-geolocation', { position: position, lookup: null, match: null, error: lookupError });
        self.advanceToFirstUnresolved();
        return { position: position, lookup: null, match: null, error: lookupError };
      }

      var match = await self.matchCurrentLocationToPsgc(lookup, { maxLevel: maxLevel });
      if (match.outsidePhilippines) {
        self.setStatus('Your current location appears to be outside the Philippines. Coordinates were saved; select the address manually if needed.', 'warning');
      } else if (maxLevel === 'region' && match.level === 'region') {
        self.setStatus('Your browser location is only accurate to about ' + formatAccuracy(accuracy) + '. Region was filled, but province/city/barangay were left blank to avoid guessing. Enable more precise device location or select them manually.', 'warning');
      } else if (maxLevel === 'area' && match.level === 'area') {
        self.setStatus('Your browser location is accurate to about ' + formatAccuracy(accuracy) + '. Region and province/administrative area were filled; city and barangay were left for verification.', 'warning');
      } else if (match.level === 'barangay') {
        self.setStatus('Current location matched through barangay (' + formatAccuracy(accuracy) + '). Verify the address before saving.', 'success');
      } else if (match.level === 'district' || match.level === 'locality') {
        self.setStatus('Current location matched to the city/municipality (' + formatAccuracy(accuracy) + '). Select or verify the barangay before saving.', 'warning');
      } else if (match.level === 'area') {
        self.setStatus('Current location matched to the province/administrative area (' + formatAccuracy(accuracy) + '). Complete the city and barangay.', 'warning');
      } else if (match.level === 'region') {
        self.setStatus('Current location matched only to the region (' + formatAccuracy(accuracy) + '). Complete the remaining address fields.', 'warning');
      } else {
        self.setStatus('Coordinates captured (' + formatAccuracy(accuracy) + '), but the location could not be confidently matched to PSGC. Select the address manually.', 'warning');
      }
      self.sync();
      dispatch(self.el, 'ph-address-geolocation', { position: position, lookup: lookup, match: match });
      self.advanceToFirstUnresolved();
      return { position: position, lookup: lookup, match: match };
    } catch (error) {
      var message = 'Current location could not be determined.';
      if (error && error.code === 1) message = 'Location permission was denied or blocked by the browser. Allow location access for this site and try again.';
      else if (error && error.code === 2) message = 'Your device could not determine a current location. Check location services and try again.';
      else if (error && error.code === 3) message = 'Location lookup timed out. Try again where GPS or Wi-Fi positioning is available.';
      self.setStatus(message, 'error');
      dispatch(self.el, 'ph-address-geolocation-error', { error: error, message: message });
      return null;
    } finally {
      if (self.geoButton) self.geoButton.disabled = false;
    }
  };

  AddressPicker.prototype.value = function () {
    if (!this.index) return null;
    var region = this.currentRegion();
    var area = this.currentArea();
    var city = this.currentLocality();
    var district = this.currentDistrict();
    var barangay = this.currentBarangay();
    var province = area && area.kind === 'province' ? area : null;
    var special = area && area.kind === 'special_area' ? area : null;
    var parts = [
      text(this.fields.line1.value), text(this.fields.line2.value),
      barangay ? (/^barangay\b/i.test(barangay.name) ? barangay.name : 'Barangay ' + barangay.name) : '',
      district ? district.name : '',
      city ? city.name : '',
      province ? province.name : '',
      text(this.fields.postal.value), this.options.country
    ].filter(Boolean);
    return {
      address_line1: text(this.fields.line1.value),
      address_line2: text(this.fields.line2.value),
      region: region ? { id: region.id, name: region.name } : null,
      province: province ? { id: province.id, name: province.name } : null,
      administrative_area: special ? { id: special.id, name: special.name, kind: special.kind } : null,
      city_municipality: city ? { id: city.id, name: city.name } : null,
      district: district ? { id: district.id, name: district.name } : null,
      barangay: barangay ? { id: barangay.id, name: barangay.name } : null,
      postal_code: text(this.fields.postal.value),
      country: this.options.country,
      coordinates: this.lat != null && this.lng != null ? { lat: this.lat, lng: this.lng, accuracy_m: this.coordinateAccuracy, source: this.coordinateSource || null } : null,
      formatted_address: parts.join(', '),
      dataset: Object.assign({}, this.index.dataset || {})
    };
  };

  AddressPicker.prototype.sync = function (silent) {
    if (!this.index) return;
    var v = this.value();
    var set = function (input, value) { if (input) input.value = value == null ? '' : String(value); };
    set(this.hidden.region_psgc, v.region && v.region.id); set(this.hidden.region_name, v.region && v.region.name);
    set(this.hidden.province_psgc, v.province && v.province.id); set(this.hidden.province_name, v.province && v.province.name);
    set(this.hidden.administrative_area_psgc, v.administrative_area && v.administrative_area.id); set(this.hidden.administrative_area_name, v.administrative_area && v.administrative_area.name);
    set(this.hidden.city_psgc, v.city_municipality && v.city_municipality.id); set(this.hidden.city_name, v.city_municipality && v.city_municipality.name);
    set(this.hidden.district_psgc, v.district && v.district.id); set(this.hidden.district_name, v.district && v.district.name);
    set(this.hidden.barangay_psgc, v.barangay && v.barangay.id); set(this.hidden.barangay_name, v.barangay && v.barangay.name);
    set(this.hidden.latitude, v.coordinates && v.coordinates.lat); set(this.hidden.longitude, v.coordinates && v.coordinates.lng); set(this.hidden.coordinate_accuracy_m, v.coordinates && v.coordinates.accuracy_m);
    set(this.hidden.formatted_address, v.formatted_address); set(this.hidden.address_json, JSON.stringify(v)); set(this.hidden.address_dataset_as_of, v.dataset && v.dataset.as_of);
    if (!silent) dispatch(this.el, 'ph-address-change', v);
  };

  AddressPicker.prototype.validate = function (options) {
    options = Object.assign({ mark: true }, options || {});
    var missing = [];
    if (this.options.requireLine1 && !text(this.fields.line1.value)) missing.push(['line1','Enter the house/building and street.']);
    if (this.options.required) {
      if (!this.fields.region.value) missing.push(['region','Select a region.']);
      if (!this.fields.area.value) missing.push(['area','Select a province or independent city.']);
      var area = this.currentArea();
      if (area && area.kind !== 'independent_city' && !this.fields.locality.value) missing.push(['locality','Select a city or municipality.']);
      var city = this.currentLocality();
      var districts = city ? ((this.index.districts_by_city && this.index.districts_by_city[city.id]) || []) : [];
      if (districts.length && !this.fields.district.value) missing.push(['district','Select a district.']);
      if (!this.fields.barangay.value) missing.push(['barangay','Select a barangay.']);
    }
    if (this.options.requirePostalCode && !text(this.fields.postal.value)) missing.push(['postal','Enter the postal code.']);
    if (options.mark) {
      Object.keys(this.fields).forEach(function (key) { this.fields[key].removeAttribute('aria-invalid'); }, this);
      missing.forEach(function (m) { this.fields[m[0]].setAttribute('aria-invalid','true'); }, this);
      this.setStatus(missing.length ? missing[0][1] : '', missing.length ? 'error' : '');
    }
    return { valid: missing.length === 0, missing: missing.map(function (m) { return m[0]; }), message: missing.length ? missing[0][1] : '', value: this.value() };
  };

  AddressPicker.prototype.destroy = function () {
    if (this.destroyed) return;
    this.closeAutoMenu();
    this.handlers.forEach(function (h) { h[0].removeEventListener(h[1], h[2]); });
    this.handlers = [];
    mounted.delete(this.el);
    this.el.innerHTML = '';
    this.destroyed = true;
  };

  function mount(el, options) { return new AddressPicker(typeof el === 'string' ? document.querySelector(el) : el, options); }
  function mountAll(root, options) {
    root = root || document;
    return Array.from(root.querySelectorAll('[data-ph-address-picker]')).map(function (el) { return mount(el, options); });
  }

  var api = { mount: mount, mountAll: mountAll, AddressPicker: AddressPicker, version: '2.0.5' };
  global.PhilippinesAddressPicker = api;

  function autoMount() { mountAll(document); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoMount, { once: true });
  else autoMount();
})(window);
