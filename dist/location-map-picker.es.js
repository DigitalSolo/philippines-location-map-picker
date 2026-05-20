function w(t) {
  return String(t ?? "").replace(/[^0-9]/g, "");
}
function ka(t) {
  return w(t).length === 10;
}
function Oa(t) {
  return w(t).length === 9;
}
function ge(t) {
  return [...new Set(t.map(w).filter(Boolean))];
}
function R(t) {
  const e = w(t);
  return e.length >= 10 ? `${e.slice(0, 2)}00000000` : e.length >= 2 ? e.slice(0, 2) : "";
}
function ht(t) {
  return t.length === 4 ? `${t.slice(0, 2)}0${t.slice(2, 4)}00000` : t.length === 5 ? `${t}00000` : "";
}
function mt(t) {
  return t.length === 6 ? `${t.slice(0, 2)}0${t.slice(2, 4)}${t.slice(4, 6)}000` : t.length === 7 ? `${t}000` : "";
}
function jt(t) {
  return t.length === 9 ? `${t.slice(0, 2)}0${t.slice(2, 4)}${t.slice(4, 6)}${t.slice(6, 9)}` : "";
}
function q(t, e = "") {
  const i = w(t);
  return i.length === 10 ? i : e === "region" && i.length === 2 ? `${i}00000000` : e === "province" ? ht(i) : e === "city" ? mt(i) : e === "barangay" || i.length === 9 ? jt(i) : i.length === 7 || i.length === 6 ? mt(i) : i.length === 5 || i.length === 4 ? ht(i) : i.length === 2 ? `${i}00000000` : "";
}
function C(t) {
  const e = w(t), i = e.length === 10 ? e : q(e);
  return i.length === 10 ? `${i.slice(0, 5)}00000` : "";
}
function z(t) {
  const e = w(t), i = e.length === 10 ? e : q(e);
  return i.length === 10 ? `${i.slice(0, 7)}000` : "";
}
function Ma(t) {
  return z(t);
}
function Ia(t) {
  return w(t).slice(0, 6);
}
function W(t) {
  const e = w(t), i = [];
  return e ? (e.length === 10 && e.endsWith("00000000") ? (i.push(e), i.push(e.slice(0, 2))) : e.length === 2 ? (i.push(e), i.push(`${e}00000000`)) : e.length >= 2 && (i.push(e.slice(0, 2)), i.push(`${e.slice(0, 2)}00000000`)), ge(i)) : [];
}
function se(t) {
  const e = w(t), i = [], r = q(e, "province") || C(e);
  return e ? (i.push(e), r && (e.length === 10 && i.push(r), i.push(`${r.slice(0, 2)}${r.slice(3, 5)}`), i.push(r.slice(0, 5)), i.push(r)), ge(i)) : [];
}
function O(t) {
  const e = w(t), i = [], r = q(e, "city") || z(e);
  return e ? (i.push(e), r && (e.length === 10 && i.push(r), i.push(`${r.slice(0, 2)}${r.slice(3, 5)}${r.slice(5, 7)}`), i.push(r.slice(0, 7)), i.push(r)), ge(i)) : [];
}
function Re(t) {
  const e = w(t), i = [], r = q(e, "barangay");
  return e ? (i.push(e), r && (e.length === 10 && i.push(r), i.push(`${r.slice(0, 2)}${r.slice(3, 5)}${r.slice(5, 7)}${r.slice(7, 10)}`), i.push(r)), e.length === 10 && i.push(`${e.slice(0, 2)}${e.slice(3, 5)}${e.slice(5, 7)}${e.slice(7, 10)}`), ge(i)) : [];
}
function Ye(t, e) {
  return t === "region" ? W(e) : t === "province" ? se(e) : t === "city" ? O(e) : t === "barangay" ? Re(e) : ge([e]);
}
function yi(t) {
  const e = w(t), i = [], r = z(e);
  return e.length === 9 ? (i.push(e.slice(0, 6)), r && i.push(...O(r)), i.push(...O(e))) : e.length === 10 && !e.endsWith("000") && r && r !== e ? (i.push(...O(r)), i.push(...O(e))) : (i.push(...O(e)), r && r !== e && i.push(...O(r))), ge(i);
}
function Na(t, e) {
  const i = W(t), r = W(e);
  return i.some((n) => r.includes(n));
}
function Ca(t, e) {
  const i = se(t), r = se(e);
  return i.some((n) => r.includes(n));
}
function Vi(t, e) {
  const i = O(t), r = O(e);
  return i.some((n) => r.includes(n));
}
const k = (t) => String(t ?? "").trim(), Tt = (t) => String(t || "").toLowerCase().replace(/\s+/g, " ").trim(), De = (t) => k(t.id || t.code), be = (t) => String(t.name || "").trim(), Dt = ["region", "province", "city", "barangay"], le = { region: 1, province: 2, city: 3, barangay: 4 };
function P(t) {
  return String(t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function V(t, e) {
  t && (t.value = e == null ? "" : String(e));
}
function _e(t, e, i) {
  const r = String(t || "").trim().toLowerCase();
  return e.includes(r) ? r : i;
}
function Gi(...t) {
  return t.flatMap((e) => String(e || "").split(/\s+/)).map((e) => e.trim()).filter(Boolean).join(" ");
}
function Ji(t) {
  if (!t || t.disabled || t.hidden)
    return !1;
  const e = window.getComputedStyle(t);
  return e.display !== "none" && e.visibility !== "hidden";
}
function pt(t) {
  return t ? Array.from(t.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(Ji) : [];
}
function ve(t) {
  const e = Math.random().toString(36).slice(2, 10);
  return `${t}-${e}`;
}
function St(t, e) {
  if (!t)
    return;
  if (e) {
    t.hasAttribute("data-plmp-original-inert") || t.setAttribute("data-plmp-original-inert", t.inert ? "true" : "false"), t.inert = !0, t.setAttribute("data-plmp-modal-inert", "true");
    return;
  }
  if (t.getAttribute("data-plmp-modal-inert") !== "true")
    return;
  const i = t.getAttribute("data-plmp-original-inert") === "true";
  t.inert = i, t.removeAttribute("data-plmp-modal-inert"), t.removeAttribute("data-plmp-original-inert");
}
function Zi(t, e) {
  if (!t || !document.body)
    return [];
  const i = [];
  let r = t, n = r.parentElement;
  for (; n && n !== document.body.parentElement && (Array.from(n.children).forEach((a) => {
    a === r || a.contains(t) || (St(a, e), i.push(a));
  }), n !== document.body); )
    r = n, n = n.parentElement;
  return i;
}
function Ki(t = {}) {
  const e = {
    region_id: k(t.region_id),
    region_name: String(t.region_name || "").trim(),
    province_id: k(t.province_id),
    province_name: String(t.province_name || "").trim(),
    city_id: k(t.city_id),
    city_name: String(t.city_name || "").trim(),
    barangay_id: k(t.barangay_id),
    barangay_name: String(t.barangay_name || "").trim()
  };
  return e.barangay_id && !e.city_id && (e.city_id = z(e.barangay_id)), e.city_id && !e.province_id && (e.province_id = C(e.city_id)), (e.province_id || e.city_id || e.barangay_id) && !e.region_id && (e.region_id = R(e.province_id || e.city_id || e.barangay_id)), e;
}
function Wi(t = {}) {
  return !!(t.barangay_id && t.barangay_name && t.city_id && t.city_name);
}
class Yi {
  constructor(e = {}) {
    if (!e.mount)
      throw new Error("LocationPicker requires a mount element.");
    if (!e.provider)
      throw new Error("LocationPicker requires a provider.");
    this.mount = e.mount, this.provider = e.provider, this.requiredLevel = _e(e.requiredLevel, Dt, "barangay"), this.validationMessages = {
      region: e.messageRequiredRegion || "Select a region.",
      province: e.messageRequiredProvince || "Select a province.",
      city: e.messageRequiredCity || "Select a city or municipality.",
      barangay: e.messageRequiredBarangay || "Select a barangay before saving."
    }, this.hiddenInputs = e.hiddenInputs || {}, this.summaryLabel = e.summaryLabel || "Address location", this.placeholder = e.placeholder || "Select City → Barangay", this.modalTitle = e.modalTitle || "Select address location", this.modalSubtitle = e.modalSubtitle || "Choose Region, Province if applicable, City/Municipality, then Barangay.", this.modalEyebrow = e.modalEyebrow || "Philippines address", this.actionLabel = e.actionLabel || "Select", this.saveLabel = e.saveLabel || "Save address", this.cancelLabel = e.cancelLabel || "Cancel", this.clearLabel = e.clearLabel || "Clear", this.searchPlaceholder = e.searchPlaceholder || "Search", this.triggerIcon = e.triggerIcon || "⌖", this.selectedLabelFormat = _e(e.selectedLabelFormat, [
      "region_province_city_barangay",
      "province_city_barangay",
      "city_barangay",
      "barangay_only"
    ], "city_barangay"), this.theme = _e(e.theme, ["light", "dark", "auto"], "light"), this.size = _e(e.size, ["compact", "comfortable", "spacious"], "comfortable"), this.density = _e(e.density, ["tight", "normal", "relaxed"], "normal"), this.className = e.className || "", this.modalClassName = e.modalClassName || "", this.disabled = e.disabled === !0, this.readOnly = e.readOnly === !0 || e.readonly === !0, this.busy = e.busy === !0, this.busyReason = "", this.previousFocusEl = null, this.modalInertElements = [], this.titleId = ve("plmp-location-title"), this.subtitleId = ve("plmp-location-subtitle"), this.listId = ve("plmp-location-list"), this.messageId = ve("plmp-location-message"), this.searchId = ve("plmp-location-search"), this.boundDocumentFocus = (i) => this.enforceModalFocus(i), this.boundDocumentKeydown = (i) => this.handleDocumentKeydown(i), this.handlers = {}, this.lists = { region: [], province: [], city: [], barangay: [] }, this.state = {
      region_id: k(e.defaultRegionId),
      region_name: "",
      province_id: k(e.defaultProvinceId),
      province_name: "",
      city_id: k(e.defaultCityId),
      city_name: "",
      barangay_id: k(e.defaultBarangayId),
      barangay_name: ""
    }, this.activeLevel = "region", this.searchTerm = "", this.renderShell(), this.bindEvents(), this.ready = this.initialize();
  }
  on(e, i) {
    return this.handlers[e] || (this.handlers[e] = []), this.handlers[e].push(i), this;
  }
  off(e, i) {
    return this.handlers[e] ? typeof i != "function" ? (this.handlers[e] = [], this) : (this.handlers[e] = this.handlers[e].filter((r) => r !== i), this) : this;
  }
  emit(e, i) {
    (this.handlers[e] || []).forEach((r) => r(i));
  }
  async initialize() {
    await this.loadRegions(), this.state.barangay_id && !this.state.city_id && (this.state.city_id = z(this.state.barangay_id)), this.state.city_id && !this.state.province_id && (this.state.province_id = C(this.state.city_id)), (this.state.province_id || this.state.city_id || this.state.barangay_id) && !this.state.region_id && (this.state.region_id = R(this.state.province_id || this.state.city_id || this.state.barangay_id)), this.state.region_id || this.state.province_id || this.state.city_id || this.state.barangay_id ? await this.setValue(this.state, !1) : (this.updateSummary(), this.updateHiddenInputs(), this.renderCurrentLevel());
  }
  renderShell() {
    this.root = document.createElement("div"), this.root.className = Gi(
      "plmp__location-picker",
      "ph-location-picker",
      `plmp--theme-${this.theme}`,
      `plmp--size-${this.size}`,
      `plmp--density-${this.density}`,
      this.disabled ? "is-disabled" : "",
      this.readOnly ? "is-readonly" : "",
      this.busy ? "is-busy" : "",
      this.className
    ), this.root.dataset.theme = this.theme, this.root.dataset.size = this.size, this.root.dataset.density = this.density, this.root.dataset.disabled = this.disabled ? "true" : "false", this.root.dataset.readonly = this.readOnly ? "true" : "false", this.root.dataset.busy = this.busy ? "true" : "false", this.root.setAttribute("aria-busy", this.busy ? "true" : "false"), this.root.innerHTML = `
      <div class="plmp__trigger-row ph-location-picker__control-row">
        <button class="plmp__trigger ph-location-picker__control" type="button" data-lp-open aria-haspopup="dialog" aria-expanded="false">
          <span class="plmp__trigger-icon ph-location-picker__control-icon" aria-hidden="true">${P(this.triggerIcon)}</span>
          <span class="plmp__trigger-main ph-location-picker__control-main"><span class="plmp__label ph-location-picker__label">${P(this.summaryLabel)}</span><span class="plmp__trigger-value ph-location-picker__value" data-lp-summary>${P(this.placeholder)}</span></span>
          <span class="plmp__trigger-action ph-location-picker__action">${P(this.actionLabel)}</span>
        </button>
        <button class="plmp__clear ph-location-picker__clear" type="button" data-lp-clear aria-label="Clear selected address">×</button>
      </div>
      <div class="plmp__modal ph-location-picker__modal ${P(this.modalClassName)}" data-lp-modal hidden>
        <div class="plmp__modal-backdrop ph-location-picker__backdrop" data-lp-cancel></div>
        <section class="plmp__modal-dialog ph-location-picker__dialog" role="dialog" aria-modal="true" aria-labelledby="${this.titleId}" aria-describedby="${this.subtitleId}" tabindex="-1">
          <header class="plmp__modal-header ph-location-picker__header"><div><p class="plmp__eyebrow ph-location-picker__eyebrow">${P(this.modalEyebrow)}</p><h2 class="plmp__title ph-location-picker__title" id="${this.titleId}">${P(this.modalTitle)}</h2><p class="plmp__subtitle ph-location-picker__subtitle" id="${this.subtitleId}">${P(this.modalSubtitle)}</p></div><button class="plmp__modal-close ph-location-picker__close" type="button" data-lp-cancel aria-label="Close location picker">×</button></header>
          <div class="plmp__modal-body ph-location-picker__body"><nav class="plmp__tabs ph-location-picker__tabs" aria-label="Location level" role="tablist"><button type="button" role="tab" data-lp-level="region">Region</button><button type="button" role="tab" data-lp-level="province">Province</button><button type="button" role="tab" data-lp-level="city">City / Municipality</button><button type="button" role="tab" data-lp-level="barangay">Barangay</button></nav><label class="plmp__sr-only ph-location-picker__sr-only" for="${this.searchId}">Search locations</label><input id="${this.searchId}" class="plmp__search ph-location-picker__search" type="search" data-lp-search placeholder="${P(this.searchPlaceholder)}" autocomplete="off" aria-controls="${this.listId}"><div class="plmp__path ph-location-picker__path" data-lp-path aria-live="polite"></div><div id="${this.listId}" class="plmp__list ph-location-picker__list" data-lp-list role="listbox" aria-describedby="${this.messageId}"></div><p id="${this.messageId}" class="plmp__status ph-location-picker__message" data-lp-message aria-live="polite"></p></div>
          <footer class="plmp__modal-footer ph-location-picker__footer"><button class="plmp__button plmp__button--secondary ph-location-picker__button ph-location-picker__button--secondary" type="button" data-lp-clear>${P(this.clearLabel)}</button><button class="plmp__button plmp__button--secondary ph-location-picker__button ph-location-picker__button--secondary" type="button" data-lp-cancel>${P(this.cancelLabel)}</button><button class="plmp__button plmp__button--primary ph-location-picker__button ph-location-picker__button--primary" type="button" data-lp-save>${P(this.saveLabel)}</button></footer>
        </section>
      </div>`, this.mount.innerHTML = "", this.mount.appendChild(this.root), this.openButtonEl = this.root.querySelector("[data-lp-open]"), this.triggerRowEl = this.root.querySelector(".ph-location-picker__control-row"), this.summaryEl = this.root.querySelector("[data-lp-summary]"), this.modalEl = this.root.querySelector("[data-lp-modal]"), this.dialogEl = this.root.querySelector(".ph-location-picker__dialog"), this.searchEl = this.root.querySelector("[data-lp-search]"), this.pathEl = this.root.querySelector("[data-lp-path]"), this.listEl = this.root.querySelector("[data-lp-list]"), this.messageEl = this.root.querySelector("[data-lp-message]"), this.applyInteractionState();
  }
  applyInteractionState() {
    if (!this.root)
      return;
    const e = this.disabled || this.readOnly || this.busy;
    this.root.classList.toggle("is-disabled", this.disabled), this.root.classList.toggle("is-readonly", this.readOnly), this.root.classList.toggle("is-busy", this.busy), this.root.dataset.disabled = this.disabled ? "true" : "false", this.root.dataset.readonly = this.readOnly ? "true" : "false", this.root.dataset.busy = this.busy ? "true" : "false", this.root.setAttribute("aria-busy", this.busy ? "true" : "false"), this.openButtonEl && (this.openButtonEl.disabled = this.disabled || this.busy, this.openButtonEl.setAttribute("aria-disabled", this.disabled || this.busy ? "true" : "false")), this.root.querySelectorAll("[data-lp-clear], [data-lp-save]").forEach((i) => {
      i.disabled = e, i.setAttribute("aria-disabled", e ? "true" : "false");
    }), this.renderTabs(), this.renderCurrentLevel();
  }
  setBusy(e = !0, i = "") {
    return this.busy = e === !0, this.busyReason = this.busy ? String(i || "") : "", this.applyInteractionState(), this;
  }
  isBusy() {
    return this.busy;
  }
  setDisabled(e = !0) {
    return this.disabled = e === !0, this.disabled && !this.modalEl.hidden && this.close(), this.applyInteractionState(), this;
  }
  setReadOnly(e = !0) {
    return this.readOnly = e === !0, this.applyInteractionState(), this;
  }
  bindEvents() {
    this.openButtonEl.addEventListener("click", () => this.open()), this.root.querySelectorAll("[data-lp-cancel]").forEach((e) => e.addEventListener("click", () => this.close())), this.root.querySelectorAll("[data-lp-clear]").forEach((e) => e.addEventListener("click", () => this.clear())), this.root.querySelector("[data-lp-save]").addEventListener("click", () => this.save()), this.searchEl.addEventListener("input", () => {
      this.searchTerm = this.searchEl.value, this.renderCurrentLevel();
    }), this.root.querySelectorAll("[data-lp-level]").forEach((e) => {
      e.addEventListener("click", () => this.setActiveLevel(e.getAttribute("data-lp-level")));
    }), this.root.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !this.modalEl.hidden) {
        e.preventDefault(), this.close();
        return;
      }
      e.key === "Tab" && !this.modalEl.hidden && this.trapModalFocus(e);
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
    const e = this.state.province_id || this.state.region_id;
    this.lists.city = e ? await this.provider.getCities(e, {
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
    return !!this.state.province_id || this.lists.province.length > 0;
  }
  open() {
    this.disabled || this.busy || this.modalEl.hidden && (this.previousFocusEl = document.activeElement instanceof HTMLElement ? document.activeElement : null, this.modalEl.hidden = !1, this.modalEl.classList.add("is-open"), this.openButtonEl && this.openButtonEl.setAttribute("aria-expanded", "true"), this.modalInertElements = Zi(this.modalEl, !0), document.documentElement.classList.add("plmp-modal-open"), document.addEventListener("focusin", this.boundDocumentFocus, !0), document.addEventListener("keydown", this.boundDocumentKeydown, !0), this.setActiveLevel(this.firstIncompleteLevel()), setTimeout(() => {
      const e = pt(this.modalEl);
      (this.searchEl || e[0] || this.dialogEl)?.focus();
    }, 0), this.emit("open", { open: !0 }), this.emit("openchange", { open: !0 }));
  }
  close() {
    !this.modalEl || this.modalEl.hidden || (this.modalEl.classList.remove("is-open"), this.modalEl.hidden = !0, this.searchTerm = "", this.searchEl.value = "", this.openButtonEl && this.openButtonEl.setAttribute("aria-expanded", "false"), this.modalInertElements.forEach((e) => St(e, !1)), this.modalInertElements = [], document.documentElement.classList.remove("plmp-modal-open"), document.removeEventListener("focusin", this.boundDocumentFocus, !0), document.removeEventListener("keydown", this.boundDocumentKeydown, !0), this.previousFocusEl && typeof this.previousFocusEl.focus == "function" && document.contains(this.previousFocusEl) && setTimeout(() => this.previousFocusEl.focus(), 0), this.emit("close", { open: !1 }), this.emit("openchange", { open: !1 }));
  }
  handleDocumentKeydown(e) {
    if (!this.modalEl.hidden) {
      if (e.key === "Escape") {
        e.preventDefault(), e.stopPropagation(), this.close();
        return;
      }
      e.key === "Tab" && this.trapModalFocus(e);
    }
  }
  enforceModalFocus(e) {
    if (this.modalEl.hidden || this.modalEl.contains(e.target))
      return;
    (pt(this.modalEl)[0] || this.dialogEl)?.focus();
  }
  trapModalFocus(e) {
    const i = pt(this.modalEl);
    if (i.length === 0) {
      e.preventDefault();
      return;
    }
    const r = i[0], n = i[i.length - 1];
    if (e.shiftKey && document.activeElement === r) {
      e.preventDefault(), n.focus();
      return;
    }
    !e.shiftKey && document.activeElement === n && (e.preventDefault(), r.focus());
  }
  firstIncompleteLevel() {
    return this.state.region_id ? this.hasProvinceStep() && !this.state.province_id ? "province" : this.state.city_id ? "barangay" : "city" : "region";
  }
  async setActiveLevel(e) {
    Dt.includes(e) && (e === "province" && !this.state.region_id && (e = "region"), e === "province" && this.state.region_id && this.lists.province.length === 0 && await this.loadProvinces(), e === "province" && this.state.region_id && this.lists.province.length === 0 && (e = "city"), e === "city" && !this.state.region_id && (e = "region"), e === "city" && this.hasProvinceStep() && !this.state.province_id && (e = "province"), e === "barangay" && !this.state.city_id && (e = this.firstIncompleteLevel()), this.activeLevel = e, this.searchTerm = "", this.searchEl.value = "", e === "region" && this.lists.region.length === 0 && await this.loadRegions(), e === "province" && this.lists.province.length === 0 && await this.loadProvinces(), e === "city" && this.lists.city.length === 0 && await this.loadCities(), e === "barangay" && this.lists.barangay.length === 0 && await this.loadBarangays(), this.renderCurrentLevel());
  }
  ensureSelectedRows() {
    const e = (i, r, n) => {
      const a = k(this.state[r]), s = String(this.state[n] || "").trim();
      if (!a || !s)
        return;
      const o = this.lists[i] || [];
      o.some((l) => De(l) === a) || (this.lists[i] = [...o, { id: a, code: a, name: s }].sort((l, d) => be(l).localeCompare(be(d))));
    };
    e("region", "region_id", "region_name"), e("province", "province_id", "province_name"), e("city", "city_id", "city_name"), e("barangay", "barangay_id", "barangay_name");
  }
  renderCurrentLevel() {
    this.ensureSelectedRows(), this.renderTabs(), this.renderPath();
    const e = this.filteredRows(this.lists[this.activeLevel] || []);
    if (e.length === 0) {
      this.listEl.innerHTML = '<div class="plmp__empty ph-location-picker__empty">No matching locations found.</div>';
      return;
    }
    this.listEl.innerHTML = e.map((i) => {
      const r = De(i), n = this.state[`${this.activeLevel}_id`] === r, a = this.disabled || this.readOnly;
      return `<button class="plmp__option ph-location-picker__option${n ? " is-selected" : ""}" type="button" role="option" aria-selected="${n ? "true" : "false"}" data-lp-option="${P(r)}"${a ? ' disabled aria-disabled="true"' : ""}>${P(be(i))}</button>`;
    }).join(""), this.listEl.querySelectorAll("[data-lp-option]").forEach((i) => {
      i.addEventListener("click", () => {
        const r = i.getAttribute("data-lp-option"), n = (this.lists[this.activeLevel] || []).find((a) => De(a) === r);
        n && this.selectRow(this.activeLevel, n).catch((a) => this.setMessage(a.message || "Location data could not be loaded.", "error"));
      });
    });
  }
  renderTabs() {
    this.root.querySelectorAll("[data-lp-level]").forEach((e) => {
      const i = e.getAttribute("data-lp-level"), r = this.hasProvinceStep(), n = this.disabled || i === "province" && !this.state.region_id || i === "province" && this.state.region_id && this.lists.province.length === 0 || i === "city" && (!this.state.region_id || r && !this.state.province_id) || i === "barangay" && !this.state.city_id;
      e.classList.toggle("is-active", i === this.activeLevel), e.setAttribute("aria-selected", i === this.activeLevel ? "true" : "false"), e.setAttribute("tabindex", i === this.activeLevel ? "0" : "-1"), e.setAttribute("aria-controls", this.listId), e.disabled = n;
    });
  }
  renderPath() {
    const e = [this.state.region_name, this.state.province_name, this.state.city_name, this.state.barangay_name].filter(Boolean);
    this.pathEl.textContent = e.length ? e.join(" → ") : "No location selected yet.";
  }
  filteredRows(e) {
    const i = Tt(this.searchTerm);
    return i ? e.filter((r) => Tt(be(r)).includes(i)) : e;
  }
  async selectRow(e, i) {
    if (this.busy || this.disabled || this.readOnly)
      return;
    const r = De(i), n = be(i);
    if (this.setMessage("", ""), e === "region") {
      Object.assign(this.state, {
        region_id: r,
        region_name: n,
        province_id: "",
        province_name: "",
        city_id: "",
        city_name: "",
        barangay_id: "",
        barangay_name: ""
      }), this.lists.province = [], this.lists.city = [], this.lists.barangay = [], await this.loadProvinces(), this.lists.province.length > 0 ? await this.setActiveLevel("province") : (await this.loadCities(), await this.setActiveLevel("city"));
      return;
    }
    if (e === "province") {
      Object.assign(this.state, {
        province_id: r,
        province_name: n,
        city_id: "",
        city_name: "",
        barangay_id: "",
        barangay_name: ""
      }), this.lists.city = [], this.lists.barangay = [], await this.loadCities(), await this.setActiveLevel("city");
      return;
    }
    if (e === "city") {
      Object.assign(this.state, {
        city_id: r,
        city_name: n,
        barangay_id: "",
        barangay_name: ""
      }), this.lists.barangay = [], await this.loadBarangays(), await this.setActiveLevel("barangay");
      return;
    }
    e === "barangay" && (Object.assign(this.state, { barangay_id: r, barangay_name: n }), this.updateHiddenInputs(), this.updateSummary(), this.renderCurrentLevel(), this.emit("change", this.currentLocation()));
  }
  async setValue(e = {}, i = !0, r = {}) {
    if (r.hydrate !== !1 && !e.resolved && !Wi(e)) {
      const a = k(e.barangay_id || this.state.barangay_id), s = k(e.city_id || this.state.city_id || z(a)), o = k(e.province_id || this.state.province_id || C(s || a)), l = k(e.region_id || this.state.region_id || R(o || s || a));
      Object.assign(this.state, await this.provider.getLocationByIds({
        region_id: l,
        region_name: e.region_name,
        province_id: o,
        province_name: e.province_name,
        city_id: s,
        city_name: e.city_name,
        barangay_id: a,
        barangay_name: e.barangay_name
      }));
    } else
      Object.assign(this.state, Ki(e));
    return await this.loadProvinces().catch(() => {
      this.lists.province = [];
    }), await this.loadCities().catch(() => {
      this.lists.city = [];
    }), await this.loadBarangays().catch(() => {
      this.lists.barangay = [];
    }), this.ensureSelectedRows(), this.updateHiddenInputs(), this.updateSummary(), this.renderCurrentLevel(), i && this.emit("change", this.currentLocation()), this.currentLocation();
  }
  validate() {
    const e = le[this.requiredLevel] || le.barangay, i = [], r = [];
    return e >= le.region && !this.state.region_id && (i.push("region"), r.push(this.validationMessages.region)), e === le.province && !this.state.province_id && (i.push("province"), r.push(this.validationMessages.province)), e >= le.city && !this.state.city_id && (i.push("city"), r.push(this.validationMessages.city)), e >= le.barangay && !this.state.barangay_id && (i.push("barangay"), r.push(this.validationMessages.barangay)), {
      valid: i.length === 0,
      required_location_level: this.requiredLevel,
      missing: i,
      messages: r,
      location: this.currentLocation()
    };
  }
  isValid() {
    return this.validate().valid;
  }
  save() {
    if (this.busy || this.disabled || this.readOnly)
      return;
    const e = this.validate();
    if (!e.valid) {
      this.setMessage(e.messages[0] || "Complete the required location fields before saving.", "error"), this.setActiveLevel(e.missing[0] || this.firstIncompleteLevel());
      return;
    }
    this.updateHiddenInputs(), this.updateSummary(), this.emit("change", this.currentLocation()), this.close();
  }
  clear(e = !0, i = {}) {
    (this.busy || this.disabled || this.readOnly) && i.force !== !0 || (this.state = {
      region_id: "",
      region_name: "",
      province_id: "",
      province_name: "",
      city_id: "",
      city_name: "",
      barangay_id: "",
      barangay_name: ""
    }, this.lists.province = [], this.lists.city = [], this.lists.barangay = [], this.updateHiddenInputs(), this.updateSummary(), e && this.emit("change", this.currentLocation()), this.setActiveLevel("region"));
  }
  displayLabel() {
    const e = {
      region_province_city_barangay: [this.state.region_name, this.state.province_name, this.state.city_name, this.state.barangay_name],
      province_city_barangay: [this.state.province_name, this.state.city_name, this.state.barangay_name],
      city_barangay: [this.state.city_name, this.state.barangay_name],
      barangay_only: [this.state.barangay_name]
    };
    return (e[this.selectedLabelFormat] || e.city_barangay).filter(Boolean).join(" → ");
  }
  updateSummary() {
    this.summaryEl.textContent = this.displayLabel() || this.placeholder, this.root.querySelector(".ph-location-picker__control").classList.toggle("is-selected", !!this.state.barangay_id);
  }
  updateHiddenInputs() {
    V(this.hiddenInputs.regionId, this.state.region_id), V(this.hiddenInputs.regionName, this.state.region_name), V(this.hiddenInputs.provinceId, this.state.province_id), V(this.hiddenInputs.provinceName, this.state.province_name), V(this.hiddenInputs.cityId, this.state.city_id), V(this.hiddenInputs.cityName, this.state.city_name), V(this.hiddenInputs.barangayId, this.state.barangay_id), V(this.hiddenInputs.barangayName, this.state.barangay_name), V(this.hiddenInputs.label, this.displayLabel());
  }
  currentLocation() {
    const e = this.displayLabel();
    return { ...this.state, label: e, display_label: e };
  }
  setMessage(e, i) {
    this.messageEl.textContent = e || "", this.messageEl.classList.toggle("is-error", i === "error");
  }
  destroy() {
    this.modalEl && !this.modalEl.hidden && this.close(), this.modalInertElements.forEach((e) => St(e, !1)), this.modalInertElements = [], document.removeEventListener("focusin", this.boundDocumentFocus, !0), document.removeEventListener("keydown", this.boundDocumentKeydown, !0), this.handlers = {}, this.mount.innerHTML = "", document.documentElement.classList.remove("plmp-modal-open");
  }
}
function oe(t) {
  return t ? Array.isArray(t) && t.length >= 4 ? { south: Number(t[0]), west: Number(t[1]), north: Number(t[2]), east: Number(t[3]) } : typeof t == "object" ? { south: Number(t.south), west: Number(t.west), north: Number(t.north), east: Number(t.east) } : null : null;
}
function ye(t) {
  const e = oe(t);
  return e ? { lat: (e.south + e.north) / 2, lng: (e.west + e.east) / 2 } : null;
}
function Xe(t, e, i) {
  const r = oe(t);
  return !!r && e >= r.south && e <= r.north && i >= r.west && i <= r.east;
}
const Z = 256, Xi = 40075.016686;
function re(t, e, i) {
  return Math.max(e, Math.min(i, t));
}
function gi(t) {
  return t * Math.PI / 180;
}
function Qi(t) {
  return t * 180 / Math.PI;
}
function Q(t, e, i) {
  const r = Z * Math.pow(2, i), n = Math.sin(gi(re(t, -85.05112878, 85.05112878)));
  return {
    x: (e + 180) / 360 * r,
    y: (0.5 - Math.log((1 + n) / (1 - n)) / (4 * Math.PI)) * r
  };
}
function ft(t, e, i) {
  const r = Z * Math.pow(2, i), n = t / r * 360 - 180, a = Math.PI - 2 * Math.PI * e / r;
  return { lat: Qi(Math.atan(Math.sinh(a))), lng: n };
}
function yt(t) {
  return String(t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}
function Ue(t, e, i) {
  const r = String(t || "").trim().toLowerCase();
  return e.includes(r) ? r : i;
}
function er(...t) {
  return t.flatMap((e) => String(e || "").split(/\s+/)).map((e) => e.trim()).filter(Boolean).join(" ");
}
function tr(t, e) {
  const i = Number(t);
  return Number.isFinite(i) && i >= 0 ? Math.round(i) : e;
}
function ir(t, e) {
  if (t == null || t === "")
    return e;
  const i = Number(t);
  return Number.isFinite(i) ? Math.round(i) : e;
}
function bi(t, e) {
  const i = Number(t);
  return Number.isFinite(i) && i > 0 ? i : e;
}
function B(t, e = null) {
  if (t == null || t === "")
    return e;
  if (typeof t == "number")
    return Number.isFinite(t) && t >= 0 ? `${t}px` : e;
  const i = String(t).trim();
  return i && (i === "auto" || /^(?:\d+|\d*\.\d+)(?:px|rem|em|%|vh|vw|vmin|vmax|dvh|svh|lvh)$/i.test(i) || /^(?:calc|clamp|min|max)\([^;{}]+\)$/i.test(i)) ? i : e;
}
function Ut(t, e = null) {
  if (t == null || t === "")
    return e;
  if (typeof t == "number")
    return Number.isFinite(t) && t > 0 ? String(t) : e;
  const i = String(t).trim();
  return i && (i === "auto" || /^(?:\d+|\d*\.\d+)(?:\s*\/\s*(?:\d+|\d*\.\d+))?$/.test(i)) ? i : e;
}
function rr(t, e, i, r, n) {
  const a = Math.max(Number(e) || 0, 320), s = bi(i, 800), o = Math.max(Math.cos(gi(re(t, -85.05112878, 85.05112878))), 0.01);
  for (let l = n; l >= r; l--) {
    const d = Z * Math.pow(2, l);
    if (Xi * o / d * a >= s)
      return l;
  }
  return r;
}
function Ht(t, e = {}) {
  return t === "barangay" ? Number.isFinite(e.selectedZoom) ? e.selectedZoom : 15 : t === "city" ? Number.isFinite(e.cityZoom) ? e.cityZoom : 12 : t === "province" ? Number.isFinite(e.provinceZoom) ? e.provinceZoom : 9 : Number.isFinite(e.regionZoom) ? e.regionZoom : 7;
}
class nr {
  constructor(e = {}) {
    if (!e.mount)
      throw new Error("MapPicker requires a mount element.");
    this.mount = e.mount, this.provider = e.provider || null, this.tileUrlTemplate = e.tileUrlTemplate == null ? "" : String(e.tileUrlTemplate).trim(), this.tileAttribution = e.tileAttribution == null ? "" : String(e.tileAttribution).trim(), this.minZoom = Number.isFinite(e.minZoom) ? e.minZoom : 5, this.maxZoom = Number.isFinite(e.maxZoom) ? e.maxZoom : 19, this.zoom = Number.isFinite(e.defaultZoom) ? e.defaultZoom : 11, this.center = e.defaultCenter || { lat: 14.17, lng: 122.83 }, this.pin = e.defaultPin || null, this.polygon = null, this.handlers = {}, this.theme = Ue(e.theme, ["light", "dark", "auto"], "light"), this.size = Ue(e.size, ["compact", "comfortable", "spacious"], "comfortable"), this.density = Ue(e.density, ["tight", "normal", "relaxed"], "normal"), this.className = e.className || "", this.disabled = e.disabled === !0, this.readOnly = e.readOnly === !0 || e.readonly === !0, this.busy = e.busy === !0, this.busyReason = "", this.statusText = e.statusText || "Click the map to place the pin.", this.showStatus = e.showStatus !== !1, this.clickToPlacePin = e.clickToPlacePin !== !1, this.pinDraggable = e.pinDraggable !== !1, this.mouseWheelZoomCentered = e.mouseWheelZoomCentered !== !1, this.showBoundary = e.showBoundary !== !1, this.fitBoundaryOnSelection = e.fitBoundaryOnSelection !== !1, this.boundaryPadding = tr(e.boundaryPadding, 24), this.selectedZoom = Number.isFinite(Number(e.selectedZoom)) ? Number(e.selectedZoom) : 15, this.cityZoom = Number.isFinite(Number(e.cityZoom)) ? Number(e.cityZoom) : 12, this.provinceZoom = Number.isFinite(Number(e.provinceZoom)) ? Number(e.provinceZoom) : 9, this.regionZoom = Number.isFinite(Number(e.regionZoom)) ? Number(e.regionZoom) : 7, this.centerOnPin = e.centerOnPin !== !1, this.pinMode = Ue(e.pinMode, ["centered", "free"], e.lockPinToCenter === !1 ? "free" : "centered"), this.firstPinVisibleWidthKm = bi(e.firstPinVisibleWidthKm, 800), this.firstPinZoom = ir(e.firstPinZoom, null), this.zoomOnFirstPin = e.zoomOnFirstPin !== !1, this.mapHeight = B(e.mapHeight ?? e.height, null), this.mapMinHeight = B(e.mapMinHeight ?? e.minHeight, null), this.mapMaxHeight = B(e.mapMaxHeight ?? e.maxHeight, null), this.mapWidth = B(e.mapWidth ?? e.width, null), this.mapMinWidth = B(e.mapMinWidth ?? e.minWidth, null), this.mapMaxWidth = B(e.mapMaxWidth ?? e.maxWidth, null), this.mapAspectRatio = Ut(e.mapAspectRatio ?? e.aspectRatio, null), this.isDragging = !1, this.isPinDragging = !1, this.dragStart = null, this.isClickSuppressed = !1, this.resizeObserver = null, this.windowResizeHandler = null, this.resizeRenderFrame = null, this.renderShell(), this.bindEvents(), this.observeResize(), this.render();
  }
  on(e, i) {
    return this.handlers[e] || (this.handlers[e] = []), this.handlers[e].push(i), this;
  }
  off(e, i) {
    return this.handlers[e] ? typeof i != "function" ? (this.handlers[e] = [], this) : (this.handlers[e] = this.handlers[e].filter((r) => r !== i), this) : this;
  }
  emit(e, i) {
    (this.handlers[e] || []).forEach((r) => r(i));
  }
  hasCenteredPin() {
    return this.pinMode === "centered" && !!this.pin;
  }
  syncCenteredPin(e = !1) {
    this.hasCenteredPin() && (this.pin = { ...this.center }, this.statusEl.textContent = `Pin: ${this.pin.lat.toFixed(6)}, ${this.pin.lng.toFixed(6)}`, e && this.emit("pinchange", this.pin));
  }
  renderShell() {
    this.root = document.createElement("div"), this.root.className = er(
      "plmp__map-picker",
      "ph-map-picker",
      `plmp--theme-${this.theme}`,
      `plmp--size-${this.size}`,
      `plmp--density-${this.density}`,
      this.disabled ? "is-disabled" : "",
      this.readOnly ? "is-readonly" : "",
      this.busy ? "is-busy" : "",
      this.className
    ), this.root.dataset.theme = this.theme, this.root.dataset.size = this.size, this.root.dataset.density = this.density, this.root.dataset.disabled = this.disabled ? "true" : "false", this.root.dataset.readonly = this.readOnly ? "true" : "false", this.root.dataset.busy = this.busy ? "true" : "false", this.root.dataset.busyReason = this.busyReason, this.root.setAttribute("aria-busy", this.busy ? "true" : "false"), this.root.innerHTML = `
      <div class="plmp__map-canvas ph-map-picker__canvas" data-map-canvas>
        <div class="plmp__map-tiles ph-map-picker__tiles" data-map-tiles></div>
        <svg class="plmp__map-overlay ph-map-picker__overlay" data-map-overlay aria-hidden="true"></svg>
        <button class="plmp__map-pin ph-map-picker__pin" type="button" data-map-pin hidden aria-label="Selected pin"></button>
        <div class="plmp__map-hud ph-map-picker__hud" data-map-hud>
          <button type="button" data-map-zoom-in aria-label="Zoom in">+</button>
          <button type="button" data-map-zoom-out aria-label="Zoom out">−</button>
        </div>
        <div class="plmp__map-attribution ph-map-picker__attribution" data-map-attribution${this.tileAttribution ? "" : " hidden"}>${yt(this.tileAttribution)}</div>
      </div>
      <div class="plmp__map-status ph-map-picker__status" data-map-status${this.showStatus ? "" : " hidden"}>${yt(this.statusText)}</div>
    `, this.applySizeStyles(), this.mount.innerHTML = "", this.mount.appendChild(this.root), this.canvasEl = this.root.querySelector("[data-map-canvas]"), this.tilesEl = this.root.querySelector("[data-map-tiles]"), this.overlayEl = this.root.querySelector("[data-map-overlay]"), this.pinEl = this.root.querySelector("[data-map-pin]"), this.statusEl = this.root.querySelector("[data-map-status]"), this.hudEl = this.root.querySelector("[data-map-hud]"), this.attributionEl = this.root.querySelector("[data-map-attribution]"), this.applyInteractionState();
  }
  applySizeStyles() {
    if (!this.root)
      return this;
    const e = {
      "--plmp-map-height": this.mapHeight,
      "--plmp-map-min-height": this.mapMinHeight,
      "--plmp-map-max-height": this.mapMaxHeight,
      "--plmp-map-width": this.mapWidth,
      "--plmp-map-min-width": this.mapMinWidth,
      "--plmp-map-max-width": this.mapMaxWidth,
      "--plmp-map-aspect-ratio": this.mapAspectRatio
    };
    return Object.entries(e).forEach(([i, r]) => {
      r == null || r === "" ? this.root.style.removeProperty(i) : this.root.style.setProperty(i, r);
    }), this;
  }
  setSize(e = {}) {
    return (Object.prototype.hasOwnProperty.call(e, "mapHeight") || Object.prototype.hasOwnProperty.call(e, "height")) && (this.mapHeight = B(e.mapHeight ?? e.height, null)), (Object.prototype.hasOwnProperty.call(e, "mapMinHeight") || Object.prototype.hasOwnProperty.call(e, "minHeight")) && (this.mapMinHeight = B(e.mapMinHeight ?? e.minHeight, null)), (Object.prototype.hasOwnProperty.call(e, "mapMaxHeight") || Object.prototype.hasOwnProperty.call(e, "maxHeight")) && (this.mapMaxHeight = B(e.mapMaxHeight ?? e.maxHeight, null)), (Object.prototype.hasOwnProperty.call(e, "mapWidth") || Object.prototype.hasOwnProperty.call(e, "width")) && (this.mapWidth = B(e.mapWidth ?? e.width, null)), (Object.prototype.hasOwnProperty.call(e, "mapMinWidth") || Object.prototype.hasOwnProperty.call(e, "minWidth")) && (this.mapMinWidth = B(e.mapMinWidth ?? e.minWidth, null)), (Object.prototype.hasOwnProperty.call(e, "mapMaxWidth") || Object.prototype.hasOwnProperty.call(e, "maxWidth")) && (this.mapMaxWidth = B(e.mapMaxWidth ?? e.maxWidth, null)), (Object.prototype.hasOwnProperty.call(e, "mapAspectRatio") || Object.prototype.hasOwnProperty.call(e, "aspectRatio")) && (this.mapAspectRatio = Ut(e.mapAspectRatio ?? e.aspectRatio, null)), this.applySizeStyles(), this.resize(), this;
  }
  applyInteractionState() {
    this.root && (this.root.classList.toggle("is-disabled", this.disabled), this.root.classList.toggle("is-readonly", this.readOnly), this.root.classList.toggle("is-busy", this.busy), this.root.dataset.disabled = this.disabled ? "true" : "false", this.root.dataset.readonly = this.readOnly ? "true" : "false", this.root.dataset.busy = this.busy ? "true" : "false", this.root.dataset.busyReason = this.busyReason, this.root.setAttribute("aria-busy", this.busy ? "true" : "false"), this.root.querySelectorAll("[data-map-zoom-in], [data-map-zoom-out], [data-map-pin]").forEach((e) => {
      e.disabled = this.disabled || this.busy, e.setAttribute("aria-disabled", this.disabled || this.busy ? "true" : "false");
    }));
  }
  setBusy(e = !0, i = "") {
    return this.busy = e === !0, this.busyReason = this.busy ? String(i || "") : "", this.isDragging = !1, this.isPinDragging = !1, this.dragStart = null, this.applyInteractionState(), this;
  }
  isBusy() {
    return this.busy;
  }
  setDisabled(e = !0) {
    return this.disabled = e === !0, this.isDragging = !1, this.isPinDragging = !1, this.dragStart = null, this.applyInteractionState(), this;
  }
  setReadOnly(e = !0) {
    return this.readOnly = e === !0, this.isDragging = !1, this.isPinDragging = !1, this.dragStart = null, this.applyInteractionState(), this;
  }
  canMutatePin() {
    return !this.busy && !this.disabled && !this.readOnly;
  }
  bindEvents() {
    this.hudEl.addEventListener("pointerdown", (e) => {
      e.stopPropagation(), this.isClickSuppressed = !0;
    }), this.hudEl.addEventListener("click", (e) => {
      e.preventDefault(), e.stopPropagation(), this.isClickSuppressed = !0;
    }), this.hudEl.addEventListener("dblclick", (e) => {
      e.preventDefault(), e.stopPropagation();
    }), this.root.querySelector("[data-map-zoom-in]").addEventListener("click", (e) => {
      e.preventDefault(), e.stopPropagation(), !this.disabled && !this.busy && this.zoomAroundCanvasCenter(1);
    }), this.root.querySelector("[data-map-zoom-out]").addEventListener("click", (e) => {
      e.preventDefault(), e.stopPropagation(), !this.disabled && !this.busy && this.zoomAroundCanvasCenter(-1);
    }), this.canvasEl.addEventListener("click", (e) => {
      if (e.target.closest("[data-map-hud]"))
        return;
      if (this.isClickSuppressed) {
        this.isClickSuppressed = !1;
        return;
      }
      if (e.target.closest("[data-map-hud]") || !this.canMutatePin() || !this.clickToPlacePin)
        return;
      const i = this.pointFromEvent(e);
      this.setPin(i, !0);
    }), this.canvasEl.addEventListener("wheel", (e) => {
      if (e.preventDefault(), this.disabled || this.busy || e.target.closest("[data-map-hud]"))
        return;
      const i = re(this.zoom + (e.deltaY < 0 ? 1 : -1), this.minZoom, this.maxZoom);
      if (i === this.zoom)
        return;
      if (this.hasCenteredPin()) {
        this.zoom = i, this.readOnly || this.syncCenteredPin(!1), this.render();
        return;
      }
      if (!this.mouseWheelZoomCentered) {
        this.zoom = i, this.render();
        return;
      }
      const r = this.canvasEl.getBoundingClientRect(), n = e.clientX - r.left, a = e.clientY - r.top, s = this.pointFromEvent(e), o = Q(s.lat, s.lng, i);
      this.zoom = i, this.center = ft(
        o.x - n + r.width / 2,
        o.y - a + r.height / 2,
        this.zoom
      ), this.render();
    }, { passive: !1 }), this.pinEl.addEventListener("pointerdown", (e) => {
      !this.canMutatePin() || !this.pinDraggable || e.button !== 0 || !this.pin || this.hasCenteredPin() || (e.preventDefault(), e.stopPropagation(), this.isPinDragging = !0, this.isClickSuppressed = !0, this.pinEl.setPointerCapture(e.pointerId));
    }), this.pinEl.addEventListener("pointermove", (e) => {
      this.isPinDragging && (e.preventDefault(), e.stopPropagation(), this.setPin(this.pointFromEvent(e), !1));
    }), this.pinEl.addEventListener("pointerup", (e) => {
      if (this.isPinDragging) {
        e.preventDefault(), e.stopPropagation(), this.isPinDragging = !1, this.setPin(this.pointFromEvent(e), !0);
        try {
          this.pinEl.releasePointerCapture(e.pointerId);
        } catch {
        }
      }
    }), this.canvasEl.addEventListener("pointerdown", (e) => {
      this.disabled || this.busy || e.button !== 0 || e.target.closest("[data-map-hud]") || e.target.closest("[data-map-pin]") || (this.isDragging = !0, this.dragStart = {
        x: e.clientX,
        y: e.clientY,
        centerPixel: Q(this.center.lat, this.center.lng, this.zoom)
      }, this.canvasEl.setPointerCapture(e.pointerId));
    }), this.canvasEl.addEventListener("pointermove", (e) => {
      if (!this.isDragging || !this.dragStart)
        return;
      const i = e.clientX - this.dragStart.x, r = e.clientY - this.dragStart.y;
      (Math.abs(i) > 3 || Math.abs(r) > 3) && (this.isClickSuppressed = !0), this.center = ft(
        this.dragStart.centerPixel.x - i,
        this.dragStart.centerPixel.y - r,
        this.zoom
      ), this.readOnly || this.syncCenteredPin(!1), this.render();
    }), this.canvasEl.addEventListener("pointerup", (e) => {
      const i = this.isDragging;
      this.isDragging = !1, this.dragStart = null, i && !this.readOnly && this.syncCenteredPin(!0);
      try {
        this.canvasEl.releasePointerCapture(e.pointerId);
      } catch {
      }
    });
  }
  observeResize() {
    this.windowResizeHandler = () => this.scheduleRender(), typeof ResizeObserver == "function" && (this.resizeObserver = new ResizeObserver(() => this.scheduleRender()), this.resizeObserver.observe(this.canvasEl), this.resizeObserver.observe(this.root)), typeof window < "u" && typeof window.addEventListener == "function" && window.addEventListener("resize", this.windowResizeHandler);
  }
  scheduleRender() {
    if (this.resizeRenderFrame !== null || typeof requestAnimationFrame != "function") {
      typeof requestAnimationFrame != "function" && this.render();
      return;
    }
    this.resizeRenderFrame = requestAnimationFrame(() => {
      this.resizeRenderFrame = null, this.render();
    });
  }
  resize() {
    return this.render(), this;
  }
  zoomAroundCanvasCenter(e) {
    const i = re(this.zoom + e, this.minZoom, this.maxZoom);
    i !== this.zoom && (this.zoom = i, !this.pin && this.statusEl && (this.statusEl.textContent = `Zoom: ${this.zoom}. ${this.statusText}`), this.render(), window.setTimeout(() => {
      this.isClickSuppressed = !1;
    }, 0));
  }
  pointFromEvent(e) {
    const i = this.canvasEl.getBoundingClientRect(), r = Q(this.center.lat, this.center.lng, this.zoom);
    return ft(
      r.x - i.width / 2 + (e.clientX - i.left),
      r.y - i.height / 2 + (e.clientY - i.top),
      this.zoom
    );
  }
  async focusLocation(e = {}) {
    const i = {
      level: "",
      id: "",
      bounds: null,
      centroid: null,
      polygon: null
    };
    if (!this.provider)
      return i;
    const r = e.barangay_id ? "barangay" : e.city_id ? "city" : e.province_id ? "province" : e.region_id ? "region" : null, n = e.barangay_id || e.city_id || e.province_id || e.region_id;
    if (!r || !n)
      return this.polygon = null, this.render(), i;
    i.level = r, i.id = n;
    const a = await this.provider.getBounds(r, n).catch(() => null);
    if (a)
      if (i.bounds = a, this.fitBoundaryOnSelection)
        this.fitBounds(a);
      else {
        const s = oe(a);
        s && (this.center = ye(s)), this.zoom = Ht(r, this);
      }
    else {
      const s = await this.provider.getCentroid(r, n).catch(() => null);
      s && (i.centroid = s, this.center = s, this.zoom = Ht(r, this));
    }
    if (this.showBoundary) {
      const s = await this.provider.getPolygon(r, n).catch(() => null);
      this.polygon = Array.isArray(s) && s.length >= 3 ? s : null, i.polygon = this.polygon;
    } else
      this.polygon = null;
    return this.render(), i;
  }
  fitBounds(e) {
    const i = oe(e);
    if (!i)
      return;
    this.center = ye(i);
    const r = this.canvasEl.getBoundingClientRect(), n = Math.max(r.width, 320), a = Math.max(r.height, 240), s = Math.max(120, n - this.boundaryPadding * 2), o = Math.max(120, a - this.boundaryPadding * 2);
    for (let l = this.maxZoom; l >= this.minZoom; l--) {
      const d = Q(i.north, i.west, l), c = Q(i.south, i.east, l);
      if (Math.abs(c.x - d.x) <= s && Math.abs(c.y - d.y) <= o) {
        this.zoom = l;
        return;
      }
    }
    this.zoom = this.minZoom;
  }
  firstPinTargetZoom(e) {
    if (Number.isFinite(this.firstPinZoom))
      return re(this.firstPinZoom, this.minZoom, this.maxZoom);
    const i = this.canvasEl.getBoundingClientRect();
    return rr(
      Number(e && e.lat),
      Math.max(i.width, this.canvasEl.clientWidth, 320),
      this.firstPinVisibleWidthKm,
      this.minZoom,
      this.maxZoom
    );
  }
  setCenter(e, i = this.zoom, r = "") {
    const n = Number(e && e.lat), a = Number(e && e.lng);
    if (!Number.isFinite(n) || !Number.isFinite(a))
      return;
    const s = Number.isFinite(Number(i)) ? Number(i) : this.zoom;
    this.center = { lat: n, lng: a }, this.zoom = re(s, this.minZoom, this.maxZoom), this.syncCenteredPin(!1), r && (this.statusEl.textContent = r), this.render();
  }
  setPin(e, i = !0, r = {}) {
    if (!this.canMutatePin() && r.force !== !0)
      return;
    const n = {
      lat: Number(e.lat),
      lng: Number(e.lng)
    };
    if (!Number.isFinite(n.lat) || !Number.isFinite(n.lng))
      return;
    const a = !!this.pin;
    this.pin = n, (this.pinMode === "centered" || this.centerOnPin || r.centerOnPin === !0) && (this.center = { ...n }), !a && this.zoomOnFirstPin && (this.zoom = this.firstPinTargetZoom(n)), this.statusEl.textContent = `Pin: ${this.pin.lat.toFixed(6)}, ${this.pin.lng.toFixed(6)}`, this.render(), i && this.emit("pinchange", this.pin);
  }
  clearPin(e = !0, i = {}) {
    !this.canMutatePin() && i.force !== !0 || (this.pin = null, this.statusEl.textContent = this.statusText, this.render(), e && this.emit("pinchange", null));
  }
  render() {
    this.applyZoomStyles(), this.renderTiles(), this.renderPin(), this.renderPolygon();
  }
  applyZoomStyles() {
    if (!this.canvasEl)
      return;
    const e = re(Math.round(24 * Math.pow(1.28, this.zoom - this.minZoom)), 24, 192);
    this.canvasEl.style.setProperty("--plmp-map-grid-size", `${e}px`), this.canvasEl.dataset.zoom = String(this.zoom), this.canvasEl.dataset.tileMode = this.tileUrlTemplate ? "tiles" : "offline-grid";
  }
  renderTiles() {
    if (!this.tileUrlTemplate) {
      this.tilesEl.innerHTML = "";
      return;
    }
    const e = this.canvasEl.getBoundingClientRect(), i = Math.max(e.width, this.canvasEl.clientWidth, 320), r = Math.max(e.height, this.canvasEl.clientHeight, 240), n = Q(this.center.lat, this.center.lng, this.zoom), a = Math.floor((n.x - i / 2) / Z), s = Math.floor((n.x + i / 2) / Z), o = Math.floor((n.y - r / 2) / Z), l = Math.floor((n.y + r / 2) / Z), d = Math.pow(2, this.zoom), c = [];
    for (let u = a; u <= s; u++)
      for (let h = o; h <= l; h++) {
        if (h < 0 || h >= d)
          continue;
        const m = (u % d + d) % d, y = Math.round(u * Z - n.x + i / 2), I = Math.round(h * Z - n.y + r / 2), Y = this.tileUrlTemplate.split("{z}").join(String(this.zoom)).split("{x}").join(String(m)).split("{y}").join(String(h));
        c.push(`<img class="plmp__map-tile ph-map-picker__tile" src="${yt(Y)}" alt="" draggable="false" loading="lazy" decoding="async" style="left:${y}px;top:${I}px;">`);
      }
    this.tilesEl.innerHTML = c.join("");
  }
  projectToScreen(e, i) {
    const r = this.canvasEl.getBoundingClientRect(), n = Q(this.center.lat, this.center.lng, this.zoom), a = Q(e, i, this.zoom);
    return {
      x: a.x - n.x + r.width / 2,
      y: a.y - n.y + r.height / 2
    };
  }
  renderPin() {
    if (!this.pin) {
      this.pinEl.hidden = !0;
      return;
    }
    const e = this.canvasEl.getBoundingClientRect(), i = this.hasCenteredPin() ? { x: e.width / 2, y: e.height / 2 } : this.projectToScreen(this.pin.lat, this.pin.lng);
    this.pinEl.hidden = !1, this.pinEl.style.left = `${i.x}px`, this.pinEl.style.top = `${i.y}px`;
  }
  renderPolygon() {
    const e = this.canvasEl.getBoundingClientRect();
    if (this.overlayEl.setAttribute("viewBox", `0 0 ${Math.max(e.width, 320)} ${Math.max(e.height, 240)}`), !Array.isArray(this.polygon) || this.polygon.length < 3) {
      this.overlayEl.innerHTML = "";
      return;
    }
    const i = this.polygon.map((r) => this.projectToScreen(r.lat, r.lng)).map((r) => `${r.x.toFixed(2)},${r.y.toFixed(2)}`).join(" ");
    this.overlayEl.innerHTML = `<polygon class="plmp__map-polygon ph-map-picker__polygon" points="${i}"></polygon>`;
  }
  destroy() {
    this.resizeRenderFrame !== null && typeof cancelAnimationFrame == "function" && (cancelAnimationFrame(this.resizeRenderFrame), this.resizeRenderFrame = null), this.resizeObserver && (this.resizeObserver.disconnect(), this.resizeObserver = null), this.windowResizeHandler && typeof window < "u" && typeof window.removeEventListener == "function" && (window.removeEventListener("resize", this.windowResizeHandler), this.windowResizeHandler = null), this.handlers = {}, this.mount.innerHTML = "", this.isDragging = !1, this.isPinDragging = !1, this.dragStart = null;
  }
}
const Vt = {
  change: "onChange",
  locationchange: "onLocationChange",
  pinchange: "onPinChange",
  reversematch: "onReverseMatch",
  reversenomatch: "onReverseNoMatch",
  geoipresolved: "onGeoIpResolved",
  geoipnomatch: "onGeoIpNoMatch",
  geoiperror: "onGeoIpError",
  browserlocationresolved: "onBrowserLocationResolved",
  browserlocationnomatch: "onBrowserLocationNoMatch",
  browserlocationerror: "onBrowserLocationError",
  busychange: "onBusyChange",
  dirtychange: "onDirtyChange",
  statuschange: "onStatusChange",
  open: "onOpen",
  close: "onClose",
  openchange: "onOpenChange",
  debug: "onDebug",
  error: "onError"
};
function ar(t) {
  return t ? typeof t == "string" ? document.querySelector(t) : t : null;
}
function p(t, e) {
  const i = ar(t);
  if (!i)
    return;
  const r = e == null ? "" : String(e);
  i.value !== r && (i.value = r);
}
function U(t) {
  return JSON.stringify(t);
}
function _i(t) {
  return JSON.parse(JSON.stringify(t));
}
function Gt() {
  return {
    location: !1,
    pin: !1,
    reverse: !1,
    geoIp: !1,
    browserLocation: !1,
    clear: !1
  };
}
function Jt(t) {
  const e = {
    location: H(t.location || {}),
    pin: kt(t.pin),
    geometry: wi(t.geometry || {})
  };
  return JSON.stringify(e);
}
function sr() {
  return {
    region_id: "",
    region_name: "",
    province_id: "",
    province_name: "",
    city_id: "",
    city_name: "",
    barangay_id: "",
    barangay_name: "",
    label: "",
    display_label: ""
  };
}
function H(t = {}) {
  const e = sr();
  return Object.keys(e).forEach((i) => {
    e[i] = t[i] == null ? "" : String(t[i]);
  }), e.label || (e.label = [e.city_name, e.barangay_name].filter(Boolean).join(" → ")), e.display_label || (e.display_label = e.label), e;
}
function kt(t) {
  if (!t)
    return null;
  const e = F(t.lat), i = F(t.lng);
  return e === null || i === null ? null : { lat: e, lng: i };
}
function vi(t) {
  return t ? {
    match_quality: t.match_quality == null ? "" : String(t.match_quality),
    match_distance_km: Number.isFinite(Number(t.match_distance_km)) ? Number(t.match_distance_km) : 0,
    barangay_id: t.barangay_id == null ? "" : String(t.barangay_id),
    barangay_name: t.barangay_name == null ? "" : String(t.barangay_name),
    city_id: t.city_id == null ? "" : String(t.city_id),
    city_name: t.city_name == null ? "" : String(t.city_name)
  } : null;
}
function wi(t = {}) {
  return {
    focus_result: t.focus_result || null,
    reverse_match: vi(t.reverse_match),
    reverse_error: t.reverse_error == null ? null : String(t.reverse_error)
  };
}
function Zt(t = "idle", e = "", i = "") {
  const n = j(t, ["idle", "info", "success", "warning", "error"], "info"), a = e == null ? "" : String(e);
  return {
    level: a ? n : "idle",
    code: i == null ? "" : String(i),
    message: a
  };
}
function or(t = {}) {
  return {
    enabled: t.enabled === !0,
    maxEvents: Number.isFinite(Number(t.maxEvents)) ? Math.max(1, Number(t.maxEvents)) : 100,
    includeValue: t.includeValue === !0,
    echoToConsole: t.echoToConsole === !0
  };
}
function cr(t, e = {}) {
  const i = t instanceof Error ? t : null, r = String(e.message || i && i.message || t || "Location picker error."), n = F(e.status ?? (i && i.status));
  return {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    code: String(e.code || i && i.code || "location_picker_error"),
    message: r,
    source: String(e.source || i && i.source || "location-map-picker"),
    operation: String(e.operation || i && i.operation || ""),
    recoverable: e.recoverable !== !1,
    provider: String(e.provider || i && i.provider || ""),
    method: String(e.method || i && i.method || ""),
    status: n === null ? null : n,
    path: String(e.path || i && i.path || ""),
    reason: String(e.reason || i && i.reason || ""),
    provider_error: !!(i && i.provider_error),
    raw_message: i && i.message ? String(i.message) : r
  };
}
function Kt(t) {
  if (t == null)
    return t;
  try {
    return _i(t);
  } catch {
    return String(t);
  }
}
function F(t) {
  const e = Number(t);
  return Number.isFinite(e) ? e : null;
}
function j(t, e, i) {
  const r = String(t || "").trim().toLowerCase();
  return e.includes(r) ? r : i;
}
function lr(...t) {
  return t.flatMap((e) => String(e || "").split(/\s+/)).map((e) => e.trim()).filter(Boolean).join(" ");
}
const Pi = {
  applyingValue: "Applying location value.",
  focusBoundaryPolygon: "Boundary polygon loaded for the selected location.",
  focusBounds: "Bounds loaded for the selected location. Polygon geometry is not available.",
  focusCentroid: "Centered on centroid. Boundary geometry is not available.",
  focusNoGeometry: "No boundary or centroid geometry is available for the selected location.",
  pinPlaced: "Pin placed. Reverse-fill can match it to cached barangay geometry.",
  reverseDisabled: "Reverse-fill is disabled.",
  reversePinRequired: "Drop a pin on the map first.",
  reverseBusy: "Matching pin to location.",
  busyOverlayDefault: "Please wait.",
  reverseFailed: "Reverse geocode failed.",
  setValueFailed: "Could not apply the location value.",
  invalidConfig: "Location picker configuration is invalid.",
  providerFailure: "Location data provider failed.",
  reverseNoMatch: "Static reverse-fill could not match this pin to cached barangay geometry. Select the barangay manually, keep the pin, or add geometry coverage for this area.",
  reverseMatch: "Reverse-fill resolved using {match_quality}.",
  geoIpBusy: "Resolving IP location estimate.",
  geoIpLookupFailed: "GeoIP lookup failed.",
  geoIpNoResult: "GeoIP lookup returned no result.",
  geoIpCountryMismatch: "GeoIP country {country_code} is outside the required country.",
  geoIpLowAccuracy: "GeoIP accuracy {accuracy_level} is below the required accuracy.",
  geoIpNoAdminMatch: "IP estimate centered the map, but no administrative location could be matched.",
  geoIpEstimate: "Estimated from IP. Confirm or correct the location before saving.",
  geoIpMapCentered: "Centered from IP estimate. Confirm the exact location manually.",
  browserLocationBusy: "Resolving browser location.",
  browserLocationUnavailable: "Browser geolocation is not available in this environment.",
  browserLocationFailed: "Browser location lookup failed.",
  browserLocationPermissionDenied: "Browser location permission was denied.",
  browserLocationUnavailablePosition: "Browser location is unavailable.",
  browserLocationTimeout: "Browser location lookup timed out.",
  browserLocationNoCoordinates: "Browser location returned no usable coordinates.",
  browserLocationNoAdminMatch: "Browser location centered the map, but no administrative location could be matched.",
  browserLocationEstimate: "Estimated from browser location. Confirm or correct the location before saving.",
  browserLocationMapCentered: "Centered from browser location. Confirm the exact pin before saving."
};
function ur(t = {}) {
  return {
    ...Pi,
    ...t || {}
  };
}
function Li(t, e = {}) {
  return String(t || "").replace(/\{([a-zA-Z0-9_]+)\}/g, (i, r) => {
    if (!Object.prototype.hasOwnProperty.call(e, r))
      return i;
    const n = e[r];
    return n == null ? "" : String(n);
  });
}
function dr(t = {}) {
  return {
    displayMode: j(t.displayMode, ["embedded", "modal"], "embedded"),
    theme: j(t.theme, ["light", "dark", "auto"], "light"),
    size: j(t.size, ["compact", "comfortable", "spacious"], "comfortable"),
    density: j(t.density, ["tight", "normal", "relaxed"], "normal"),
    selectedLabelFormat: j(t.selectedLabelFormat, [
      "region_province_city_barangay",
      "province_city_barangay",
      "city_barangay",
      "barangay_only"
    ], "city_barangay"),
    className: t.className || "",
    locationClassName: t.locationClassName || "",
    mapClassName: t.mapClassName || "",
    messageClassName: t.messageClassName || "",
    modalClassName: t.modalClassName || "",
    triggerLabel: t.triggerLabel || "",
    emptyLabel: t.emptyLabel || "",
    title: t.title || "",
    subtitle: t.subtitle || "",
    triggerActionLabel: t.triggerActionLabel || "",
    saveLabel: t.saveLabel || "",
    cancelLabel: t.cancelLabel || "",
    clearLabel: t.clearLabel || "",
    searchPlaceholder: t.searchPlaceholder || "",
    showCurrentState: t.showCurrentState === !0,
    showDebugPanel: t.showDebugPanel === !0
  };
}
function hr(t = {}) {
  return {
    enabled: t.enabled !== !1,
    failOnNoMatch: t.failOnNoMatch === !0
  };
}
function mr(t = {}, e = "barangay") {
  return {
    requiredLocationLevel: j(t.requiredLocationLevel || e, ["region", "province", "city", "barangay"], "barangay"),
    requirePin: t.requirePin === !0,
    messageRequiredRegion: t.messageRequiredRegion || "Select a region.",
    messageRequiredProvince: t.messageRequiredProvince || "Select a province.",
    messageRequiredCity: t.messageRequiredCity || "Select a city or municipality.",
    messageRequiredBarangay: t.messageRequiredBarangay || "Select a barangay.",
    messageRequiredPin: t.messageRequiredPin || "Place a pin on the map."
  };
}
function pr(t = {}) {
  const e = t.backfill || {}, i = t.confidence || {};
  return {
    enabled: t.enabled === !0,
    endpoint: t.endpoint || "",
    lookup: typeof t.lookup == "function" ? t.lookup : null,
    fetchOptions: t.fetchOptions || {},
    runOnInit: t.runOnInit === !0,
    runOnlyWhenEmpty: t.runOnlyWhenEmpty !== !1,
    updateMap: t.updateMap !== !1,
    setPin: t.setPin === !0,
    mapZoom: Number.isFinite(Number(t.mapZoom)) ? Number(t.mapZoom) : 9,
    backfill: {
      enabled: e.enabled !== !1,
      maxLevel: j(e.maxLevel, ["country", "region", "province", "city", "barangay"], "province"),
      allowCity: e.allowCity === !0,
      allowBarangay: e.allowBarangay === !0,
      reverseGeocode: e.reverseGeocode === !0
    },
    confidence: {
      requireCountry: i.requireCountry == null ? "PH" : String(i.requireCountry || "").trim().toUpperCase(),
      minimumAccuracyLevel: j(i.minimumAccuracyLevel, ["country", "region", "province", "city", "unknown"], "province")
    }
  };
}
function fr(t = {}) {
  const e = t.backfill || {};
  return {
    enabled: t.enabled === !0,
    runOnInit: t.runOnInit === !0,
    runOnlyWhenEmpty: t.runOnlyWhenEmpty !== !1,
    updateMap: t.updateMap !== !1,
    setPin: t.setPin === !0,
    mapZoom: Number.isFinite(Number(t.mapZoom)) ? Number(t.mapZoom) : 15,
    enableHighAccuracy: t.enableHighAccuracy !== !1,
    timeout: Number.isFinite(Number(t.timeout)) ? Number(t.timeout) : 1e4,
    maximumAge: Number.isFinite(Number(t.maximumAge)) ? Number(t.maximumAge) : 6e4,
    backfill: {
      enabled: e.enabled !== !1,
      maxLevel: j(e.maxLevel, ["country", "region", "province", "city", "barangay"], "barangay"),
      reverseGeocode: e.reverseGeocode !== !1
    }
  };
}
function yr(t = {}) {
  const e = F(t.lat ?? t.latitude), i = F(t.lng ?? t.longitude);
  return {
    country_code: String(t.country_code || t.countryCode || "").trim().toUpperCase(),
    region_name: String(t.region_name || t.regionName || "").trim(),
    province_name: String(t.province_name || t.provinceName || "").trim(),
    city_name: String(t.city_name || t.cityName || "").trim(),
    barangay_name: String(t.barangay_name || t.barangayName || "").trim(),
    lat: e,
    lng: i,
    accuracy_level: j(t.accuracy_level || t.accuracyLevel, ["country", "region", "province", "city", "unknown"], "unknown"),
    raw: t
  };
}
function gr(t = {}) {
  const e = t.coords || {}, i = F(e.latitude), r = F(e.longitude);
  return {
    lat: i,
    lng: r,
    accuracy_meters: F(e.accuracy),
    altitude: F(e.altitude),
    altitude_accuracy_meters: F(e.altitudeAccuracy),
    heading: F(e.heading),
    speed_meters_per_second: F(e.speed),
    timestamp: Number.isFinite(Number(t.timestamp)) ? Number(t.timestamp) : Date.now(),
    raw: t
  };
}
function br(t, e = Pi) {
  const i = (r, n) => Li(e[r] || n || r);
  return !t || typeof t.code != "number" ? t && t.message ? t.message : i("browserLocationFailed") : t.code === 1 ? i("browserLocationPermissionDenied") : t.code === 2 ? i("browserLocationUnavailablePosition") : t.code === 3 ? i("browserLocationTimeout") : t.message || i("browserLocationFailed");
}
function Wt(t) {
  return {
    unknown: 0,
    country: 1,
    region: 2,
    province: 3,
    city: 4
  }[t] || 0;
}
function Ot(t) {
  return {
    country: 0,
    region: 1,
    province: 2,
    city: 3,
    barangay: 4
  }[t] ?? 2;
}
function Yt(t) {
  return String(t || "").toLowerCase().replace(/\([^)]*\)/g, " ").replace(/[^a-z0-9]+/g, " ").replace(/\b(region|province|city|municipality|of|the)\b/g, " ").replace(/\s+/g, " ").trim();
}
function we(t) {
  return String(t && (t.id || t.code) || "").trim();
}
function Be(t) {
  return String(t && t.name || "").trim();
}
function Pe(t, ...e) {
  const i = e.map(Yt).filter(Boolean);
  return i.length === 0 ? null : (t || []).find((r) => {
    const n = Yt(Be(r));
    return i.some((a) => n === a || n.includes(a) || a.includes(n));
  }) || null;
}
function Le(t = {}, e = "province") {
  const i = Ot(e), r = H(t);
  i < 4 && (r.barangay_id = "", r.barangay_name = ""), i < 3 && (r.city_id = "", r.city_name = ""), i < 2 && (r.province_id = "", r.province_name = ""), i < 1 && (r.region_id = "", r.region_name = "");
  const n = [r.city_name, r.barangay_name].filter(Boolean);
  return i <= 2 && (n.length = 0, n.push(...[r.province_name, r.region_name].filter(Boolean))), r.label = n.join(" → "), r.display_label = r.label, r;
}
class Ct {
  constructor(e = {}) {
    if (!e.mount)
      throw new Error("LocationMapPicker requires a mount element.");
    if (!e.provider)
      throw new Error("LocationMapPicker requires a provider.");
    this.mount = e.mount, this.provider = e.provider, this.ui = dr(e.ui || {}), this.messages = ur(e.messages || {}), this.debugOptions = or(e.debug || {}), this.hiddenInputs = e.hiddenInputs || {}, this.mapOptions = e.map || {}, this.locationOptions = e.location || {}, this.reverseOptions = hr(e.reverse || {}), this.geoIpOptions = pr(e.geoIp || {}), this.browserLocationOptions = fr(e.browserLocation || {}), this.validationOptions = mr(e.validation || {}, this.locationOptions.requiredLevel), this.initialValue = e.initialValue || e.value || null, this.mapEnabled = this.mapOptions.enabled !== !1, this.disabled = e.disabled === !0, this.readOnly = e.readOnly === !0 || e.readonly === !0, this.busy = !1, this.busyReason = "", this.dirty = !1, this.touched = Gt(), this.dirtyBaselineValue = null, this.dirtyBaselineKey = "", this.optionHandlers = e, this.handlers = {}, this.location = H(), this.pin = null, this.geometry = {
      focus_result: null,
      reverse_match: null,
      reverse_error: null
    }, this.status = Zt(), this.lastError = null, this.debugEvents = [], this.renderShell(), this.createChildren(), this.bindChildren(), this.ready = this.locationPicker.ready.then(async () => {
      this.initialValue ? await this.setValue(this.initialValue, !1, { resetDirty: !0 }) : this.resetDirty(!1), this.geoIpOptions.enabled && this.geoIpOptions.runOnInit && await this.resolveGeoIpHint(!0), this.browserLocationOptions.enabled && this.browserLocationOptions.runOnInit && await this.resolveBrowserLocationHint(!0);
    });
  }
  on(e, i) {
    return this.handlers[e] || (this.handlers[e] = []), this.handlers[e].push(i), this;
  }
  off(e, i) {
    return this.handlers[e] ? typeof i != "function" ? (this.handlers[e] = [], this) : (this.handlers[e] = this.handlers[e].filter((r) => r !== i), this) : this;
  }
  emit(e, i) {
    e !== "debug" && this.recordDebugEvent(e, i);
    const r = Vt[e];
    r && typeof this.optionHandlers[r] == "function" && this.optionHandlers[r](i), (this.handlers[e] || []).forEach((n) => n(i));
  }
  recordDebugEvent(e, i = {}) {
    if (!this.debugOptions || !this.debugOptions.enabled)
      return this;
    const r = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      type: String(e || "event"),
      payload: Kt(i)
    };
    for (this.debugOptions.includeValue && (r.value = this.value ? Kt(this.value()) : null), this.debugEvents.push(r); this.debugEvents.length > this.debugOptions.maxEvents; )
      this.debugEvents.shift();
    this.debugOptions.echoToConsole && typeof console < "u" && console.debug && console.debug("[LocationMapPicker]", r.type, r.payload);
    const n = Vt.debug;
    return typeof this.optionHandlers[n] == "function" && this.optionHandlers[n](r), (this.handlers.debug || []).forEach((a) => a(r)), this;
  }
  debugState() {
    return this.debugEvents.map((e) => ({ ...e }));
  }
  clearDebug() {
    return this.debugEvents = [], this.updateHiddenInputs(), this;
  }
  handleError(e, i = {}) {
    const r = cr(e, i);
    return this.lastError = r, this.recordDebugEvent("error", r), this.updateHiddenInputs(), i.setStatus !== !1 && this.setMessage(r.message, "error", r.code), this.emit("error", r), r;
  }
  renderShell() {
    this.root = document.createElement("div"), this.root.className = lr(
      "plmp",
      "ph-location-map-picker",
      "plmp--location-map-picker",
      `plmp--display-${this.ui.displayMode}`,
      `plmp--theme-${this.ui.theme}`,
      `plmp--size-${this.ui.size}`,
      `plmp--density-${this.ui.density}`,
      this.mapEnabled ? "plmp--map-enabled" : "plmp--map-disabled",
      this.disabled ? "is-disabled" : "",
      this.readOnly ? "is-readonly" : "",
      this.busy ? "is-busy" : "",
      this.dirty ? "is-dirty" : "",
      this.status.message ? "has-status" : "",
      this.status.message ? `has-status-${this.status.level}` : "",
      this.ui.className
    ), this.root.dataset.theme = this.ui.theme, this.root.dataset.size = this.ui.size, this.root.dataset.density = this.ui.density, this.root.dataset.displayMode = this.ui.displayMode, this.root.dataset.disabled = this.disabled ? "true" : "false", this.root.dataset.readonly = this.readOnly ? "true" : "false", this.root.dataset.busy = this.busy ? "true" : "false", this.root.dataset.dirty = this.dirty ? "true" : "false", this.root.dataset.statusLevel = this.status.level, this.root.dataset.statusCode = this.status.code, this.root.dataset.debug = this.debugOptions.enabled ? "true" : "false", this.root.setAttribute("aria-busy", this.busy ? "true" : "false"), this.root.innerHTML = `
      <div class="plmp__picker ph-location-map-picker__picker" data-location-map-picker-location></div>
      <div class="plmp__map ph-location-map-picker__map" data-location-map-picker-map></div>
      <p class="plmp__message ph-location-map-picker__message ${this.ui.messageClassName}" data-location-map-picker-message data-status-level="idle" data-status-code="" hidden></p>
      <div class="plmp__busy-overlay ph-location-map-picker__busy-overlay" data-location-map-picker-busy-overlay hidden>
        <div class="plmp__busy-card ph-location-map-picker__busy-card" role="status" aria-live="polite">
          <span class="plmp__busy-spinner ph-location-map-picker__busy-spinner" aria-hidden="true"></span>
          <span class="plmp__busy-text ph-location-map-picker__busy-text" data-location-map-picker-busy-text>${this.message("busyOverlayDefault")}</span>
        </div>
      </div>
    `, this.mount.innerHTML = "", this.mount.appendChild(this.root), this.locationMount = this.root.querySelector("[data-location-map-picker-location]"), this.mapMount = this.root.querySelector("[data-location-map-picker-map]"), this.messageEl = this.root.querySelector("[data-location-map-picker-message]"), this.busyOverlayEl = this.root.querySelector("[data-location-map-picker-busy-overlay]"), this.busyTextEl = this.root.querySelector("[data-location-map-picker-busy-text]");
  }
  applyDirtyState() {
    return this.root ? (this.root.classList.toggle("is-dirty", this.dirty), this.root.dataset.dirty = this.dirty ? "true" : "false", this) : this;
  }
  dirtyState() {
    return {
      dirty: this.dirty,
      touched: { ...this.touched },
      baseline: this.dirtyBaselineValue ? _i(this.dirtyBaselineValue) : null,
      value: this.value()
    };
  }
  refreshDirtyState(e = !0) {
    const i = Jt(this.value()) !== this.dirtyBaselineKey, r = this.dirty;
    return this.dirty = i, this.applyDirtyState(), e && r !== this.dirty && this.emit("dirtychange", this.dirtyState()), this.dirty;
  }
  markTouched(e, i = !0) {
    return e && Object.prototype.hasOwnProperty.call(this.touched, e) && (this.touched[e] = !0), this.refreshDirtyState(i), this;
  }
  resetDirty(e = !0) {
    this.dirtyBaselineValue = this.value(), this.dirtyBaselineKey = Jt(this.dirtyBaselineValue), this.touched = Gt();
    const i = this.dirty;
    return this.dirty = !1, this.applyDirtyState(), this.updateHiddenInputs(), e && i !== this.dirty && this.emit("dirtychange", this.dirtyState()), this;
  }
  isDirty() {
    return this.dirty;
  }
  applyInteractionState() {
    return this.root ? (this.root.classList.toggle("is-disabled", this.disabled), this.root.classList.toggle("is-readonly", this.readOnly), this.root.classList.toggle("is-busy", this.busy), this.root.classList.toggle("is-dirty", this.dirty), this.root.dataset.disabled = this.disabled ? "true" : "false", this.root.dataset.readonly = this.readOnly ? "true" : "false", this.root.dataset.busy = this.busy ? "true" : "false", this.root.dataset.dirty = this.dirty ? "true" : "false", this.root.dataset.statusLevel = this.status.level, this.root.dataset.statusCode = this.status.code, this.root.dataset.debug = this.debugOptions.enabled ? "true" : "false", this.root.setAttribute("aria-busy", this.busy ? "true" : "false"), this.busyOverlayEl && (this.busyOverlayEl.hidden = !this.busy), this.busyTextEl && (this.busyTextEl.textContent = this.busyReason || this.message("busyOverlayDefault")), this.locationPicker && typeof this.locationPicker.setDisabled == "function" && this.locationPicker.setDisabled(this.disabled), this.locationPicker && typeof this.locationPicker.setReadOnly == "function" && this.locationPicker.setReadOnly(this.readOnly), this.mapPicker && typeof this.mapPicker.setDisabled == "function" && this.mapPicker.setDisabled(this.disabled), this.mapPicker && typeof this.mapPicker.setReadOnly == "function" && this.mapPicker.setReadOnly(this.readOnly), this) : this;
  }
  applyBusyState() {
    return this.root ? (this.root.classList.toggle("is-busy", this.busy), this.root.dataset.busy = this.busy ? "true" : "false", this.root.dataset.busyReason = this.busyReason, this.root.setAttribute("aria-busy", this.busy ? "true" : "false"), this.busyOverlayEl && (this.busyOverlayEl.hidden = !this.busy), this.busyTextEl && (this.busyTextEl.textContent = this.busyReason || this.message("busyOverlayDefault")), this.locationPicker && typeof this.locationPicker.setBusy == "function" && this.locationPicker.setBusy(this.busy, this.busyReason), this.mapPicker && typeof this.mapPicker.setBusy == "function" && this.mapPicker.setBusy(this.busy, this.busyReason), this) : this;
  }
  setBusy(e = !0, i = "") {
    const r = e === !0, n = r ? String(i || "") : "", a = this.busy !== r || this.busyReason !== n;
    return this.busy = r, this.busyReason = n, this.applyBusyState(), a && this.emit("busychange", { busy: this.busy, reason: this.busyReason }), this;
  }
  isBusy() {
    return this.busy;
  }
  async runBusy(e, i) {
    this.setBusy(!0, e);
    try {
      return await i();
    } finally {
      this.setBusy(!1);
    }
  }
  setDisabled(e = !0) {
    return this.disabled = e === !0, this.applyInteractionState(), this;
  }
  setReadOnly(e = !0) {
    return this.readOnly = e === !0, this.applyInteractionState(), this;
  }
  createChildren() {
    this.locationPicker = new Yi({
      selectedLabelFormat: this.ui.selectedLabelFormat,
      theme: this.ui.theme,
      size: this.ui.size,
      density: this.ui.density,
      className: this.ui.locationClassName,
      modalClassName: this.ui.modalClassName,
      summaryLabel: this.ui.triggerLabel || void 0,
      placeholder: this.ui.emptyLabel || void 0,
      modalTitle: this.ui.title || void 0,
      modalSubtitle: this.ui.subtitle || void 0,
      actionLabel: this.ui.triggerActionLabel || void 0,
      saveLabel: this.ui.saveLabel || void 0,
      cancelLabel: this.ui.cancelLabel || void 0,
      clearLabel: this.ui.clearLabel || void 0,
      searchPlaceholder: this.ui.searchPlaceholder || void 0,
      disabled: this.disabled,
      readOnly: this.readOnly,
      ...this.locationOptions,
      requiredLevel: this.validationOptions.requiredLocationLevel,
      mount: this.locationMount,
      provider: this.provider
    }), this.mapEnabled ? this.mapPicker = new nr({
      defaultCenter: { lat: 12.8797, lng: 121.774 },
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
    }) : (this.mapPicker = null, this.mapMount.hidden = !0);
  }
  bindChildren() {
    this.locationPicker.on("open", (e) => {
      this.emit("open", e || { open: !0 }), this.emit("openchange", e || { open: !0 });
    }), this.locationPicker.on("close", (e) => {
      this.emit("close", e || { open: !1 }), this.emit("openchange", e || { open: !1 });
    }), this.locationPicker.on("change", async (e) => {
      this.location = H(e), this.geometry.reverse_match = null, this.geometry.reverse_error = null, this.geometry.focus_result = this.mapPicker ? await this.mapPicker.focusLocation(this.location) : null, this.markTouched("location"), this.updateHiddenInputs(), this.setMessage(this.focusMessage(this.geometry.focus_result)), this.emitChange(), this.emit("locationchange", { ...this.location });
    }), this.mapPicker && this.mapPicker.on("pinchange", (e) => {
      this.pin = e || null, this.geometry.reverse_match = null, this.geometry.reverse_error = null, this.markTouched("pin"), this.updateHiddenInputs(), this.setMessage(this.pin ? this.message("pinPlaced") : ""), this.emitChange(), this.emit("pinchange", this.pin ? { ...this.pin } : null);
    });
  }
  focusMessage(e) {
    return !e || !e.id ? "" : e.polygon ? this.message("focusBoundaryPolygon") : e.bounds ? this.message("focusBounds") : e.centroid ? this.message("focusCentroid") : this.message("focusNoGeometry");
  }
  applyStatusState() {
    if (!this.root || !this.messageEl)
      return this;
    const e = !!this.status.message;
    return ["info", "success", "warning", "error"].forEach((i) => {
      this.root.classList.toggle(`has-status-${i}`, e && this.status.level === i);
    }), this.root.classList.toggle("has-status", e), this.root.dataset.statusLevel = this.status.level, this.root.dataset.statusCode = this.status.code, this.messageEl.textContent = this.status.message, this.messageEl.dataset.statusLevel = this.status.level, this.messageEl.dataset.statusCode = this.status.code, this.messageEl.hidden = !e, this.status.level === "error" ? (this.messageEl.setAttribute("role", "alert"), this.messageEl.setAttribute("aria-live", "assertive")) : e ? (this.messageEl.setAttribute("role", "status"), this.messageEl.setAttribute("aria-live", "polite")) : (this.messageEl.removeAttribute("role"), this.messageEl.removeAttribute("aria-live")), this;
  }
  setStatus(e = "info", i = "", r = "") {
    if (typeof e == "object" && e !== null) {
      const s = e;
      e = s.level, i = s.message, r = s.code;
    }
    const n = Zt(e, i, r), a = this.status.level !== n.level || this.status.code !== n.code || this.status.message !== n.message;
    return this.status = n, this.applyStatusState(), this.updateHiddenInputs(), a && this.emit("statuschange", this.statusState()), this;
  }
  setMessage(e, i = "info", r = "") {
    return this.setStatus(e ? i : "idle", e || "", r);
  }
  clearStatus() {
    return this.setStatus("idle", "", "");
  }
  statusState() {
    return { ...this.status };
  }
  message(e, i = {}, r = "") {
    const n = this.messages[e] || r || e;
    return Li(n, i);
  }
  updateHiddenInputs() {
    const e = this.value();
    p(this.hiddenInputs.regionId, e.location.region_id), p(this.hiddenInputs.regionName, e.location.region_name), p(this.hiddenInputs.provinceId, e.location.province_id), p(this.hiddenInputs.provinceName, e.location.province_name), p(this.hiddenInputs.cityId, e.location.city_id), p(this.hiddenInputs.cityName, e.location.city_name), p(this.hiddenInputs.barangayId, e.location.barangay_id), p(this.hiddenInputs.barangayName, e.location.barangay_name), p(this.hiddenInputs.label, e.location.display_label || e.location.label || ""), p(this.hiddenInputs.pinLat, e.pin ? e.pin.lat.toFixed(6) : ""), p(this.hiddenInputs.pinLng, e.pin ? e.pin.lng.toFixed(6) : ""), p(this.hiddenInputs.valueJson, U(e)), p(this.hiddenInputs.locationJson, U(e.location)), p(this.hiddenInputs.pinJson, U(e.pin)), p(this.hiddenInputs.geometryJson, U(e.geometry));
    const i = this.validate();
    p(this.hiddenInputs.isValid, i.valid ? "1" : "0"), p(this.hiddenInputs.validationJson, U(i)), p(this.hiddenInputs.isDirty, this.dirty ? "1" : "0"), p(this.hiddenInputs.dirtyJson, U(this.dirtyState())), p(this.hiddenInputs.touchedJson, U(this.touched)), p(this.hiddenInputs.statusLevel, this.status.level), p(this.hiddenInputs.statusCode, this.status.code), p(this.hiddenInputs.statusMessage, this.status.message), p(this.hiddenInputs.statusJson, U(this.statusState())), p(this.hiddenInputs.lastErrorJson, U(this.lastError)), p(this.hiddenInputs.debugJson, U(this.debugState()));
  }
  value() {
    return {
      location: H(this.location),
      pin: kt(this.pin),
      geometry: wi(this.geometry)
    };
  }
  validate() {
    const e = this.value(), i = e.location, r = Ot(this.validationOptions.requiredLocationLevel), n = [], a = [];
    return r >= 1 && !i.region_id && (n.push("region"), a.push(this.validationOptions.messageRequiredRegion)), r === 2 && !i.province_id && (n.push("province"), a.push(this.validationOptions.messageRequiredProvince)), r >= 3 && !i.city_id && (n.push("city"), a.push(this.validationOptions.messageRequiredCity)), r >= 4 && !i.barangay_id && (n.push("barangay"), a.push(this.validationOptions.messageRequiredBarangay)), this.validationOptions.requirePin && !e.pin && (n.push("pin"), a.push(this.validationOptions.messageRequiredPin)), {
      valid: n.length === 0,
      required_location_level: this.validationOptions.requiredLocationLevel,
      require_pin: this.validationOptions.requirePin,
      missing: n,
      messages: a,
      location: i,
      pin: e.pin
    };
  }
  isValid() {
    return this.validate().valid;
  }
  emitChange() {
    this.emit("change", this.value());
  }
  async setValue(e = {}, i = !0, r = {}) {
    return this.runBusy(this.message("applyingValue"), async () => {
      try {
        const n = e.location || {}, a = kt(e.pin);
        return this.location = H(await this.locationPicker.setValue(n, !1, n.resolved ? { hydrate: !1 } : {})), a ? (this.mapPicker && this.mapPicker.setPin(a, !1, { force: !0 }), this.pin = a) : (this.mapPicker && this.mapPicker.clearPin(!1, { force: !0 }), this.pin = null), this.geometry.reverse_match = null, this.geometry.reverse_error = null, this.geometry.focus_result = this.mapPicker ? await this.mapPicker.focusLocation(this.location) : null, r.trackDirty === !0 && (this.markTouched("location", !1), a && this.markTouched("pin", !1), this.refreshDirtyState(!1)), this.updateHiddenInputs(), this.setMessage(this.focusMessage(this.geometry.focus_result)), r.resetDirty === !0 ? this.resetDirty(!1) : this.refreshDirtyState(!1), i && this.emitChange(), this.value();
      } catch (n) {
        throw this.handleError(n, {
          source: "value",
          operation: "setValue",
          code: "set_value_failed",
          message: n && n.message ? n.message : this.message("setValueFailed")
        }), n;
      }
    });
  }
  async reverseFillFromPin(e = !0) {
    if (this.busy || this.disabled || this.readOnly)
      return null;
    if (!this.reverseOptions.enabled)
      return this.setMessage(this.message("reverseDisabled"), "warning", "reverse_disabled"), null;
    if (!this.pin)
      return this.setMessage(this.message("reversePinRequired"), "warning", "pin_required"), null;
    let i = null;
    this.setMessage(this.message("reverseBusy"), "info", "reverse_busy"), this.setBusy(!0, this.message("reverseBusy"));
    try {
      i = await this.provider.reverseGeocode(this.pin.lat, this.pin.lng, this.location);
    } catch (n) {
      const a = this.handleError(n, {
        source: "reverse",
        operation: "reverseGeocode",
        code: "reverse_geocode_failed",
        message: n && n.message ? n.message : this.message("reverseFailed")
      });
      return this.geometry.reverse_match = null, this.geometry.reverse_error = a.message, e && this.emitChange(), this.setBusy(!1), null;
    }
    if (!i || !i.barangay_id) {
      const n = new Error(this.message("reverseNoMatch"));
      if (this.geometry.reverse_match = null, this.geometry.reverse_error = this.reverseOptions.failOnNoMatch ? n.message : null, this.setMessage(n.message, "warning", "reverse_no_match"), e && this.emitChange(), this.emit("reversenomatch", { pin: this.pin ? { ...this.pin } : null, location: { ...this.location } }), this.reverseOptions.failOnNoMatch)
        throw this.handleError(n, {
          source: "reverse",
          operation: "reverseGeocode",
          code: "reverse_no_match",
          recoverable: !1
        }), this.setBusy(!1), n;
      return this.setBusy(!1), null;
    }
    this.location = H(await this.locationPicker.setValue(i, !1, { hydrate: !1 })), this.geometry.reverse_match = vi(i), this.geometry.reverse_error = null, this.geometry.focus_result = this.mapPicker ? await this.mapPicker.focusLocation(this.location) : null, this.markTouched("reverse"), this.updateHiddenInputs(), this.setMessage(this.message("reverseMatch", { match_quality: this.geometry.reverse_match.match_quality || "geometry" }), "success", "reverse_match"), e && this.emitChange(), this.emit("reversematch", { ...this.geometry.reverse_match });
    const r = this.value();
    return this.setBusy(!1), r;
  }
  hasAnyValue() {
    return !!(this.location.region_id || this.location.province_id || this.location.city_id || this.location.barangay_id || this.pin);
  }
  async lookupGeoIp() {
    if (this.geoIpOptions.lookup)
      return this.geoIpOptions.lookup();
    if (!this.geoIpOptions.endpoint)
      throw new Error("GeoIP lookup requires either geoIp.lookup or geoIp.endpoint.");
    if (typeof fetch != "function")
      throw new Error("GeoIP lookup requires fetch support or a custom geoIp.lookup function.");
    const e = await fetch(this.geoIpOptions.endpoint, {
      credentials: "same-origin",
      ...this.geoIpOptions.fetchOptions
    });
    if (!e.ok)
      throw new Error(`GeoIP lookup failed with HTTP ${e.status}.`);
    return e.json();
  }
  validateGeoIpResult(e) {
    return e ? this.geoIpOptions.confidence.requireCountry && e.country_code !== this.geoIpOptions.confidence.requireCountry ? this.message("geoIpCountryMismatch", { country_code: e.country_code || "unknown" }) : Wt(e.accuracy_level) < Wt(this.geoIpOptions.confidence.minimumAccuracyLevel) ? this.message("geoIpLowAccuracy", { accuracy_level: e.accuracy_level || "unknown" }) : "" : this.message("geoIpNoResult");
  }
  async resolveGeoIpLocationByNames(e) {
    if (!this.geoIpOptions.backfill.enabled)
      return null;
    const i = this.geoIpOptions.backfill.maxLevel, r = Ot(i), n = await this.provider.getRegions().catch(() => []);
    let a = Pe(n, e.region_name), s = null;
    if (!a && e.province_name)
      for (const u of n) {
        const h = await this.provider.getProvinces(we(u)).catch(() => []), m = Pe(h, e.province_name);
        if (m) {
          a = u, s = m;
          break;
        }
      }
    if (!a)
      return null;
    const o = {
      region_id: we(a),
      region_name: Be(a),
      province_id: "",
      province_name: "",
      city_id: "",
      city_name: "",
      barangay_id: "",
      barangay_name: ""
    };
    if (r < 2)
      return Le(o, i);
    if (!s) {
      const u = await this.provider.getProvinces(o.region_id).catch(() => []);
      s = Pe(u, e.province_name);
    }
    if (s && (o.province_id = we(s), o.province_name = Be(s)), r < 3 || !this.geoIpOptions.backfill.allowCity || !e.city_name)
      return Le(o, i);
    const l = o.province_id || o.region_id, d = await this.provider.getCities(l, {
      region_id: o.region_id,
      province_id: o.province_id
    }).catch(() => []), c = Pe(d, e.city_name);
    if (c && (o.city_id = we(c), o.city_name = Be(c)), r >= 4 && this.geoIpOptions.backfill.allowBarangay && o.city_id && e.barangay_name) {
      const u = await this.provider.getBarangays(o.city_id, {
        region_id: o.region_id,
        region_name: o.region_name,
        province_id: o.province_id,
        province_name: o.province_name,
        city_id: o.city_id,
        city_name: o.city_name
      }).catch(() => []), h = Pe(u, e.barangay_name);
      h && (o.barangay_id = we(h), o.barangay_name = Be(h));
    }
    return Le(o, i);
  }
  async resolveGeoIpLocationByReverse(e) {
    if (!this.geoIpOptions.backfill.enabled || !this.geoIpOptions.backfill.reverseGeocode || typeof this.provider.reverseGeocode != "function" || e.lat === null || e.lng === null)
      return null;
    const i = await this.provider.reverseGeocode(e.lat, e.lng, this.location).catch(() => null);
    return i ? Le(i, this.geoIpOptions.backfill.maxLevel) : null;
  }
  async resolveGeoIpHint(e = !0) {
    if (this.busy || this.disabled || this.readOnly || !this.geoIpOptions.enabled || this.geoIpOptions.runOnlyWhenEmpty && this.hasAnyValue())
      return null;
    let i;
    this.setBusy(!0, this.message("geoIpBusy"));
    try {
      i = yr(await this.lookupGeoIp());
    } catch (s) {
      const o = this.handleError(s, {
        source: "geoip",
        operation: "lookupGeoIp",
        code: "geoip_lookup_failed",
        message: s && s.message ? s.message : this.message("geoIpLookupFailed")
      });
      return this.emit("geoiperror", o), this.setBusy(!1), null;
    }
    const r = this.validateGeoIpResult(i);
    if (r)
      return this.setMessage(r, "warning", "geoip_no_match"), this.emit("geoipnomatch", { result: i, reason: r }), this.setBusy(!1), null;
    this.mapPicker && this.geoIpOptions.updateMap && i.lat !== null && i.lng !== null && (this.geoIpOptions.setPin ? (this.mapPicker.setPin({ lat: i.lat, lng: i.lng }, !1), this.pin = { lat: i.lat, lng: i.lng }) : typeof this.mapPicker.setCenter == "function" && this.mapPicker.setCenter(
      { lat: i.lat, lng: i.lng },
      this.geoIpOptions.mapZoom,
      this.message("geoIpMapCentered")
    ));
    let n = await this.resolveGeoIpLocationByNames(i);
    if ((!n || !n.province_id && this.geoIpOptions.backfill.maxLevel === "province") && (n = await this.resolveGeoIpLocationByReverse(i) || n), !n || !n.region_id && !n.province_id && !n.city_id && !n.barangay_id) {
      this.setMessage(this.message("geoIpNoAdminMatch"), "warning", "geoip_no_admin_match"), this.updateHiddenInputs(), e && this.emitChange();
      const s = { result: i, location: null, value: this.value() };
      return this.emit("geoipnomatch", { result: i, reason: "No administrative location matched." }), this.setBusy(!1), s;
    }
    this.location = H(await this.locationPicker.setValue(n, !1, { hydrate: !1 })), this.geometry.reverse_match = null, this.geometry.reverse_error = null, this.geometry.focus_result = this.mapPicker ? await this.mapPicker.focusLocation(this.location) : null, this.markTouched("geoIp"), this.updateHiddenInputs(), this.setMessage(this.message("geoIpEstimate"), "info", "geoip_estimate"), e && this.emitChange();
    const a = { result: i, location: { ...this.location }, value: this.value() };
    return this.emit("geoipresolved", a), this.setBusy(!1), a;
  }
  lookupBrowserLocation() {
    if (typeof navigator > "u" || !navigator.geolocation || typeof navigator.geolocation.getCurrentPosition != "function")
      throw new Error(this.message("browserLocationUnavailable"));
    return new Promise((e, i) => {
      navigator.geolocation.getCurrentPosition(e, i, {
        enableHighAccuracy: this.browserLocationOptions.enableHighAccuracy,
        timeout: this.browserLocationOptions.timeout,
        maximumAge: this.browserLocationOptions.maximumAge
      });
    });
  }
  async resolveBrowserLocationByReverse(e) {
    if (!this.browserLocationOptions.backfill.enabled || !this.browserLocationOptions.backfill.reverseGeocode || typeof this.provider.reverseGeocode != "function" || e.lat === null || e.lng === null)
      return null;
    const i = await this.provider.reverseGeocode(e.lat, e.lng, this.location).catch(() => null);
    return i ? Le(i, this.browserLocationOptions.backfill.maxLevel) : null;
  }
  async resolveBrowserLocationHint(e = !0, i = !1) {
    if (this.busy || this.disabled || this.readOnly || !this.browserLocationOptions.enabled && !i || !i && this.browserLocationOptions.runOnlyWhenEmpty && this.hasAnyValue())
      return null;
    let r;
    this.setBusy(!0, this.message("browserLocationBusy"));
    try {
      r = gr(await this.lookupBrowserLocation());
    } catch (s) {
      const o = br(s, this.messages), l = this.handleError(s, {
        source: "browser-location",
        operation: "getCurrentPosition",
        code: "browser_location_failed",
        message: o
      });
      return this.emit("browserlocationerror", l), this.setBusy(!1), null;
    }
    if (r.lat === null || r.lng === null) {
      const s = this.message("browserLocationNoCoordinates");
      return this.setMessage(s, "warning", "browser_location_no_coordinates"), this.emit("browserlocationnomatch", { result: r, reason: s }), this.setBusy(!1), null;
    }
    this.mapPicker && this.browserLocationOptions.updateMap && (this.browserLocationOptions.setPin ? (this.mapPicker.setPin({ lat: r.lat, lng: r.lng }, !1), this.pin = { lat: r.lat, lng: r.lng }) : typeof this.mapPicker.setCenter == "function" && this.mapPicker.setCenter(
      { lat: r.lat, lng: r.lng },
      this.browserLocationOptions.mapZoom,
      this.message("browserLocationMapCentered")
    ));
    const n = await this.resolveBrowserLocationByReverse(r);
    if (!n || !n.region_id && !n.province_id && !n.city_id && !n.barangay_id) {
      this.setMessage(this.message("browserLocationNoAdminMatch"), "warning", "browser_location_no_admin_match"), this.updateHiddenInputs(), e && this.emitChange();
      const s = { result: r, location: null, value: this.value() };
      return this.emit("browserlocationnomatch", { result: r, reason: "No administrative location matched." }), this.setBusy(!1), s;
    }
    this.location = H(await this.locationPicker.setValue(n, !1, { hydrate: !1 })), this.geometry.reverse_match = null, this.geometry.reverse_error = null, this.geometry.focus_result = this.mapPicker ? await this.mapPicker.focusLocation(this.location) : null, this.markTouched("browserLocation"), this.updateHiddenInputs(), this.setMessage(this.message("browserLocationEstimate"), "info", "browser_location_estimate"), e && this.emitChange();
    const a = { result: r, location: { ...this.location }, value: this.value() };
    return this.emit("browserlocationresolved", a), this.setBusy(!1), a;
  }
  requestBrowserLocation(e = !0) {
    return this.resolveBrowserLocationHint(e, !0);
  }
  clear(e = !0) {
    this.busy || this.disabled || this.readOnly || (this.locationPicker.clear(!1, { force: !0 }), this.mapPicker && this.mapPicker.clearPin(!1, { force: !0 }), this.location = H(), this.pin = null, this.geometry.focus_result = null, this.geometry.reverse_match = null, this.geometry.reverse_error = null, this.markTouched("clear"), this.updateHiddenInputs(), this.clearStatus(), e && this.emitChange());
  }
  resize() {
    return this.mapPicker && typeof this.mapPicker.resize == "function" && this.mapPicker.resize(), this;
  }
  setSize(e = {}) {
    return this.mapOptions = {
      ...this.mapOptions,
      ...e || {}
    }, this.mapPicker && typeof this.mapPicker.setSize == "function" ? this.mapPicker.setSize(e || {}) : this.resize(), this;
  }
  open() {
    return this.locationPicker && typeof this.locationPicker.open == "function" && this.locationPicker.open(), this;
  }
  close() {
    return this.locationPicker && typeof this.locationPicker.close == "function" && this.locationPicker.close(), this;
  }
  isOpen() {
    return !!(this.locationPicker && this.locationPicker.modalEl && !this.locationPicker.modalEl.hidden);
  }
  destroy() {
    this.locationPicker && typeof this.locationPicker.destroy == "function" && this.locationPicker.destroy(), this.mapPicker && typeof this.mapPicker.destroy == "function" && this.mapPicker.destroy(), this.handlers = {}, this.mount.innerHTML = "", document.documentElement.classList.remove("plmp-modal-open");
  }
}
const _r = [
  "region_id",
  "region_name",
  "province_id",
  "province_name",
  "city_id",
  "city_name",
  "barangay_id",
  "barangay_name"
], Ba = "1.0.31";
function _(t) {
  return String(t ?? "").trim();
}
function K(t, e = null) {
  const i = Number(t);
  return Number.isFinite(i) ? i : e;
}
function Ae(t) {
  return Array.isArray(t) ? t : t && Array.isArray(t.data) ? t.data : t && Array.isArray(t.items) ? t.items : t && Array.isArray(t.results) ? t.results : [];
}
function He(t = {}, e = "") {
  const i = t || {}, r = _(i.id || i.code || i.psgc_code || i.psgcCode || i.correspondence_code || i.correspondenceCode), n = _(i.code || i.psgc_code || i.psgcCode || r), a = _(i.name || i.area_name || i.areaName || i.label || i.code_name || i.codeName || i.slug || r || n), s = _(i.type || i.geographic_level || i.geographicLevel || e);
  return {
    ...i,
    id: r || n || a,
    code: n || r || a,
    name: a,
    type: s
  };
}
function vr() {
  return {
    region_id: "",
    region_name: "",
    province_id: "",
    province_name: "",
    city_id: "",
    city_name: "",
    barangay_id: "",
    barangay_name: "",
    label: "",
    display_label: ""
  };
}
function wr(t = {}, e = "city_barangay") {
  const i = [];
  return e === "region_province_city_barangay" ? i.push(t.region_name, t.province_name, t.city_name, t.barangay_name) : e === "province_city_barangay" ? i.push(t.province_name, t.city_name, t.barangay_name) : e === "barangay_only" ? i.push(t.barangay_name) : i.push(t.city_name, t.barangay_name), i.map(_).filter(Boolean).join(" → ");
}
function T(t = {}, e = {}) {
  const i = t || {}, r = {
    ...i,
    ...vr()
  };
  _r.forEach((a) => {
    r[a] = _(i[a]);
  });
  const n = wr(r, e.labelFormat || i.label_format || "city_barangay");
  return r.label = _(i.label) || n, r.display_label = _(i.display_label) || r.label, i.match_quality !== void 0 && (r.match_quality = _(i.match_quality)), i.match_distance_km !== void 0 && (r.match_distance_km = K(i.match_distance_km, 0)), i.resolved !== void 0 && (r.resolved = !!i.resolved), i.resolved_source !== void 0 && (r.resolved_source = _(i.resolved_source)), r;
}
function Aa(t = {}) {
  const e = K(t && t.lat, null), i = K(t && t.lng, null);
  return e === null || i === null ? null : { lat: e, lng: i };
}
function $a(t = {}) {
  const e = t || {}, i = K(e.south, null), r = K(e.west, null), n = K(e.north, null), a = K(e.east, null);
  return [i, r, n, a].some((s) => s === null) ? null : { south: i, west: r, north: n, east: a };
}
function ze(t = {}) {
  const e = T(t);
  return e.match_quality = _(t.match_quality || e.match_quality || "provider-match"), e.match_distance_km = K(t.match_distance_km, e.match_distance_km || 0), e;
}
function M(t, e = {}) {
  const i = t instanceof Error ? t : new Error(_(t) || "Provider request failed."), r = new Error(i.message || "Provider request failed.");
  return r.name = "ProviderError", r.provider_error = !0, r.provider = _(e.provider || i.provider || ""), r.method = _(e.method || i.method || ""), r.code = _(e.code || i.code || "provider_error") || "provider_error", r.status = K(e.status ?? i.status, null), r.path = _(e.path || i.path || ""), r.reason = _(e.reason || i.reason || ""), r.cause = i, r;
}
function Fa(t = "no_match", e = {}) {
  return {
    matched: !1,
    reason: _(t) || "no_match",
    context: e || null
  };
}
async function qa(t, e, i, r = null) {
  try {
    return await i();
  } catch (n) {
    const a = M(n, {
      provider: t,
      method: e
    });
    if (r !== void 0)
      return r;
    throw a;
  }
}
function Bt(t, e) {
  if (!t || !Array.isArray(e) || e.length < 3) return !1;
  const i = Number(t.lat), r = Number(t.lng);
  let n = !1;
  for (let a = 0, s = e.length - 1; a < e.length; s = a++) {
    const o = Number(e[a].lat), l = Number(e[a].lng), d = Number(e[s].lat), c = Number(e[s].lng);
    o > i != d > i && r < (c - l) * (i - o) / (d - o || Number.EPSILON) + l && (n = !n);
  }
  return n;
}
const Ei = (t) => Array.isArray(t) ? t : [], te = (t) => String(t ?? "").trim(), ue = (t) => te(t && (t.id || t.code)), he = (t) => String(t && t.name || "").trim();
function Ve(t) {
  return Ei(t).slice().sort((e, i) => he(e).localeCompare(he(i)));
}
function Ge(t) {
  return Number(t) * Math.PI / 180;
}
function Pr(t, e) {
  const r = Ge(Number(e.lat) - Number(t.lat)), n = Ge(Number(e.lng) - Number(t.lng)), a = Ge(t.lat), s = Ge(e.lat), o = Math.sin(r / 2) * Math.sin(r / 2) + Math.cos(a) * Math.cos(s) * Math.sin(n / 2) * Math.sin(n / 2);
  return 2 * 6371 * Math.atan2(Math.sqrt(o), Math.sqrt(1 - o));
}
class Si {
  constructor(e = {}) {
    this.baseUrl = String(e.baseUrl || "/data").replace(/\/+$/, ""), this.cache = /* @__PURE__ */ new Map(), this.reverseMaxNearestKm = Number.isFinite(Number(e.reverseMaxNearestKm)) ? Number(e.reverseMaxNearestKm) : 0;
  }
  async fetchJson(e) {
    const i = String(e || "").replace(/^\/+/, "");
    if (this.cache.has(i))
      return this.cache.get(i);
    let r;
    try {
      r = await fetch(`${this.baseUrl}/${i}`, {
        headers: { Accept: "application/json" },
        credentials: "same-origin"
      });
    } catch (a) {
      throw M(a, {
        provider: "static-json",
        method: "fetchJson",
        path: i,
        code: "static_json_network_failed",
        reason: "network"
      });
    }
    if (!r.ok)
      throw M(`Location data request failed: ${i} (${r.status})`, {
        provider: "static-json",
        method: "fetchJson",
        status: r.status,
        path: i,
        code: r.status === 404 ? "static_json_not_found" : "static_json_request_failed"
      });
    let n;
    try {
      n = await r.json();
    } catch (a) {
      throw M(a, {
        provider: "static-json",
        method: "fetchJson",
        status: r.status,
        path: i,
        code: "static_json_malformed_json",
        reason: "malformed_json"
      });
    }
    return this.cache.set(i, n), n;
  }
  async fetchOptionalJson(e, i = null) {
    try {
      return await this.fetchJson(e);
    } catch (r) {
      return r && (r.status === 404 || r.status === 403), i;
    }
  }
  async fetchFirst(e, i = null) {
    for (const r of e)
      try {
        return await this.fetchJson(r);
      } catch {
      }
    return i;
  }
  async getRegions() {
    return Ve(await this.fetchJson("psgc/regions.json"));
  }
  async getProvinces(e) {
    const i = W(e).map((r) => `psgc/provinces/${r}.json`);
    return Ve(await this.fetchFirst(i, []));
  }
  async getCities(e, i = {}) {
    const r = te(i.province_id || e), n = te(i.region_id || e), a = [];
    return r && se(r).forEach((s) => a.push(`psgc/cities/${s}.json`)), !i.province_id && n && W(n).forEach((s) => a.push(`psgc/cities/${s}.json`)), Ve(await this.fetchFirst([...new Set(a)], []));
  }
  async getBarangays(e) {
    const i = O(e).map((r) => `psgc/barangays/${r}.json`);
    return Ve(await this.fetchFirst(i, []));
  }
  boundsFileName(e) {
    return e === "city" ? "cities" : `${e}s`;
  }
  async getBounds(e, i) {
    const r = this.boundsFileName(e);
    let n = {};
    if (n = await this.fetchOptionalJson(`geo/bounds/${r}.json`, null), !n && e === "city" && (n = await this.fetchOptionalJson("geo/bounds/citys.json", null)), !n || typeof n != "object")
      return null;
    for (const a of Ye(e, i))
      if (n[a])
        return oe(n[a]);
    return null;
  }
  async getCentroid(e, i) {
    const r = this.boundsFileName(e);
    try {
      const a = await this.fetchOptionalJson(`geo/centroids/${r}.json`, {});
      for (const s of Ye(e, i)) {
        const o = a[s];
        if (o)
          return { lat: Number(o.lat), lng: Number(o.lng) };
      }
    } catch {
    }
    const n = await this.getBounds(e, i).catch(() => null);
    return ye(n);
  }
  async getPolygon(e, i) {
    if (e !== "barangay")
      return null;
    const r = Re(i), n = yi(i);
    for (const a of r)
      for (const s of n)
        try {
          const o = await this.fetchJson(`geo/polygons/barangays/${s}/${a}.json`);
          return Array.isArray(o) ? o : null;
        } catch {
        }
    return null;
  }
  findRow(e, i) {
    return Ei(e).find((r) => i.includes(ue(r))) || null;
  }
  async getLocationByIds(e = {}) {
    let i = te(e.region_id), r = te(e.province_id), n = te(e.city_id), a = te(e.barangay_id);
    a && !n && (n = z(a)), n && !r && (r = C(n)), (r || n || a) && !i && (i = R(r || n || a));
    const s = {
      region_id: i,
      region_name: "",
      province_id: r,
      province_name: "",
      city_id: n,
      city_name: "",
      barangay_id: a,
      barangay_name: ""
    };
    if (i) {
      const u = this.findRow(await this.getRegions(), W(i));
      u && (s.region_id = ue(u), s.region_name = he(u));
    }
    const o = s.region_id ? await this.getProvinces(s.region_id) : [];
    if (r && o.length > 0) {
      const u = this.findRow(o, se(r));
      u && (s.province_id = ue(u), s.province_name = he(u));
    } else o.length === 0 && (s.province_id = "", s.province_name = "");
    const l = s.province_id || s.region_id, d = l ? await this.getCities(l, {
      region_id: s.region_id,
      province_id: s.province_id
    }) : [];
    if (n) {
      const u = this.findRow(d, O(n));
      u && (s.city_id = ue(u), s.city_name = he(u));
    }
    const c = s.city_id ? await this.getBarangays(s.city_id) : [];
    if (a) {
      const u = this.findRow(c, Re(a));
      u && (s.barangay_id = ue(u), s.barangay_name = he(u));
    }
    return s.label = [s.city_name, s.barangay_name].filter(Boolean).join(" → "), s.display_label = s.label, T(s);
  }
  async reverseGeocode(e, i, r = {}) {
    const n = { lat: Number(e), lng: Number(i) };
    if (!Number.isFinite(n.lat) || !Number.isFinite(n.lng))
      return null;
    const a = [];
    if (r.city_id)
      a.push(te(r.city_id));
    else {
      const d = await this.fetchOptionalJson("geo/bounds/cities.json", null) || await this.fetchOptionalJson("geo/bounds/citys.json", {});
      Object.keys(d).forEach((c) => {
        Xe(d[c], n.lat, n.lng) && a.push(c);
      });
    }
    const s = [];
    for (const d of a) {
      const c = await this.getBarangays(d).catch(() => []);
      for (const u of c) {
        const h = ue(u), m = await this.getBounds("barangay", h).catch(() => null), y = await this.getCentroid("barangay", h).catch(() => null);
        if (y && s.push({
          cityId: d,
          barangayId: h,
          distanceKm: Pr(n, y)
        }), !Xe(m, n.lat, n.lng))
          continue;
        const I = await this.getPolygon("barangay", h);
        if (I && I.length >= 3 && !Bt(n, I))
          continue;
        const Y = await this.getLocationByIds({
          region_id: R(h),
          province_id: C(h),
          city_id: d,
          barangay_id: h
        });
        return Y.match_quality = I && I.length >= 3 ? "polygon" : "bounds", Y.match_distance_km = 0, T(Y);
      }
    }
    if (this.reverseMaxNearestKm <= 0)
      return null;
    s.sort((d, c) => d.distanceKm - c.distanceKm);
    const o = s[0];
    if (!o || o.distanceKm > this.reverseMaxNearestKm)
      return null;
    const l = await this.getLocationByIds({
      region_id: R(o.barangayId),
      province_id: C(o.barangayId),
      city_id: o.cityId,
      barangay_id: o.barangayId
    });
    return l.match_quality = "nearest-centroid", l.match_distance_km = Number(o.distanceKm.toFixed(3)), T(l);
  }
}
function v(t) {
  return String(t ?? "").trim();
}
function gt(t) {
  return Ae(t);
}
function L(t) {
  return encodeURIComponent(v(t));
}
function b(t) {
  return String(t ?? "").trim();
}
function E(t) {
  return t.slice().sort((e, i) => e.name.localeCompare(i.name));
}
function S(t) {
  return [...new Set(t.map(v).filter(Boolean))];
}
function de(t, e) {
  return S(t.map((i) => q(i, e) || v(i))).filter((i) => /^\d{10}$/.test(i));
}
function Lr(t) {
  return [
    t.id,
    t.code,
    t.psgc_code,
    t.correspondence_code,
    t.correspondenceCode
  ].map(v).filter(Boolean);
}
function Mt(t) {
  return String(t ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\b(city|municipality|province|region|of|the)\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}
function Xt(t) {
  return Mt(t).split(" ").filter(Boolean);
}
function Er(t, e) {
  const i = Mt(t), r = Mt(e);
  if (!i || !r)
    return !1;
  if (i === r || i.includes(r) || r.includes(i))
    return !0;
  const n = new Set(Xt(i)), a = Xt(r);
  return a.length > 0 && a.every((s) => n.has(s));
}
function Sr(t, e) {
  const i = S([
    t.name,
    t.area_name,
    t.label,
    t.code_name,
    t.slug
  ]), r = S(e);
  return i.some((n) => r.some((a) => Er(n, a)));
}
function bt(t) {
  if (!t)
    return null;
  if (typeof t == "string")
    return {
      id: t,
      code: t,
      name: t
    };
  const e = v(t.code || t.id || t.psgc_code), i = b(t.name || t.area_name || t.label || t.code_name || t.slug || e);
  return {
    id: e || i,
    code: e || i,
    name: i
  };
}
function A(t, e = "") {
  const i = t || {}, r = v(i.code || i.id || i.psgc_code), n = b(i.name || i.area_name || i.label || i.code_name || i.slug || r), a = b(i.type || i.geographic_level || e);
  return {
    id: r || n,
    code: r || n,
    name: n,
    type: a,
    status: b(i.status || ""),
    zip_code: b(i.zip_code || i.postal_code || ""),
    code_name: b(i.code_name || i.codeName || ""),
    slug: b(i.slug || ""),
    label: b(i.label || ""),
    area_name: b(i.area_name || i.areaName || ""),
    psgc_code: v(i.psgc_code || i.psgcCode || ""),
    correspondence_code: v(i.correspondence_code || i.correspondenceCode || i.old_code || i.oldCode || ""),
    region: bt(i.region),
    province: bt(i.province),
    city_municipality: bt(i.city_municipality || i.city || i.municipality)
  };
}
function kr(t, e) {
  const i = e.map(v).filter(Boolean), r = new Set(i);
  if (i.forEach((a) => {
    ["region", "province", "city", "barangay"].forEach((s) => {
      const o = q(a, s);
      o && r.add(o);
    });
  }), r.size === 0)
    return !1;
  const n = Lr(t);
  return [...n].forEach((a) => {
    ["region", "province", "city", "barangay"].forEach((s) => {
      const o = q(a, s);
      o && n.push(o);
    });
  }), n.some((a) => r.has(a));
}
function ki(t, e, i = []) {
  return kr(t, e) || Sr(t, i);
}
function Je(t, e, i = []) {
  return t ? ki(t, e, i) : !1;
}
function Or(t) {
  const e = v(t);
  return !!e && !/^\d+$/.test(e);
}
function Ze(t, e = "", i = "", r = !1) {
  const n = [];
  t && (n.push(t.code_name, t.slug), r && n.push(t.name, t.label, t.area_name, t.code, t.id, t.psgc_code, t.correspondence_code)), r && n.push(e, i);
  const a = S(n);
  return r ? a : a.filter(Or);
}
function _t(t, e) {
  e && (e.region && (t.region_id = e.region.id || t.region_id, t.region_name = e.region.name || t.region_name), e.province && (t.province_id = e.province.id || t.province_id, t.province_name = e.province.name || t.province_name), e.city_municipality && (t.city_id = e.city_municipality.id || t.city_id, t.city_name = e.city_municipality.name || t.city_name));
}
class Ra {
  constructor(e = {}) {
    this.baseUrl = String(e.baseUrl || "https://psgc.cloud/api/v2").replace(/\/+$/, ""), this.cache = /* @__PURE__ */ new Map(), this.notFoundCache = /* @__PURE__ */ new Set(), this.allowEndpointFallbacks = e.allowEndpointFallbacks === !0, this.cacheNotFound = e.cacheNotFound !== !1;
  }
  async fetchJson(e) {
    const i = String(e || "").replace(/^\/+/, "");
    if (this.cache.has(i))
      return this.cache.get(i);
    if (this.notFoundCache.has(i)) {
      const a = M(`PSGC Cloud request failed: ${i} (404)`, {
        provider: "psgc-cloud",
        method: "fetchJson",
        status: 404,
        path: i,
        code: "psgc_not_found"
      });
      throw a.cached = !0, a;
    }
    let r;
    try {
      r = await fetch(`${this.baseUrl}/${i}`, {
        headers: { Accept: "application/json" }
      });
    } catch (a) {
      throw M(a, {
        provider: "psgc-cloud",
        method: "fetchJson",
        path: i,
        code: "psgc_network_failed",
        reason: "network"
      });
    }
    if (!r.ok) {
      const a = M(`PSGC Cloud request failed: ${i} (${r.status})`, {
        provider: "psgc-cloud",
        method: "fetchJson",
        status: r.status,
        path: i,
        code: r.status === 404 ? "psgc_not_found" : "psgc_request_failed"
      });
      throw this.cacheNotFound && r.status === 404 && this.notFoundCache.add(i), a;
    }
    let n;
    try {
      n = await r.json();
    } catch (a) {
      throw M(a, {
        provider: "psgc-cloud",
        method: "fetchJson",
        status: r.status,
        path: i,
        code: "psgc_malformed_json",
        reason: "malformed_json"
      });
    }
    return this.cache.set(i, n), n;
  }
  async fetchOptionalArray(e) {
    try {
      return gt(await this.fetchJson(e));
    } catch (i) {
      if (i.status === 404)
        return [];
      throw i;
    }
  }
  async fetchFirstArray(e) {
    for (const i of S(e)) {
      const r = await this.fetchOptionalArray(i);
      if (r.length > 0)
        return r;
    }
    return [];
  }
  async fetchOptionalItem(e, i = "") {
    if (!this.allowEndpointFallbacks)
      return null;
    for (const r of S(e))
      try {
        return A(await this.fetchJson(r), i);
      } catch (n) {
        if (n.status !== 404)
          throw n;
      }
    return null;
  }
  findRow(e, i, r = []) {
    return gt(e).map((n) => A(n)).find((n) => ki(n, i, r)) || null;
  }
  async getRegions() {
    return E(gt(await this.fetchJson("regions")).map((e) => A(e, "region")));
  }
  async getAllProvinces() {
    return E((await this.fetchOptionalArray("provinces")).map((e) => A(e, "province")));
  }
  async getAllCities() {
    return E((await this.fetchOptionalArray("cities-municipalities")).map((e) => A(e, "city_municipality")));
  }
  async getAllBarangays() {
    return E((await this.fetchOptionalArray("barangays")).map((e) => A(e, "barangay")));
  }
  async getProvinces(e, i = {}) {
    const r = b(i.region_name || "");
    if (!e && !r)
      return [];
    const n = await this.resolveRegion(e, r).catch(() => null), a = W(e || n && n.id), s = S([r, n && n.name]), l = (await this.getAllProvinces().catch(() => [])).filter((c) => Je(c.region, a, s));
    if (l.length > 0)
      return E(l);
    if (n) {
      const c = Ze(n, r, e, this.allowEndpointFallbacks).map((u) => `regions/${L(u)}/provinces`);
      return E((await this.fetchFirstArray(c)).map((u) => A(u, "province")));
    }
    if (!this.allowEndpointFallbacks)
      return [];
    const d = de(a, "region").map((c) => `regions/${L(c)}/provinces`);
    return E((await this.fetchFirstArray(d)).map((c) => A(c, "province")));
  }
  async getCities(e, i = {}) {
    const r = v(i.province_id || e), n = v(i.region_id || e), a = b(i.province_name || ""), s = b(i.region_name || ""), o = await this.getAllCities().catch(() => []);
    if (r || a) {
      const l = await this.resolveProvince(r, n, a, s).catch(() => null), d = se(r || l && l.id), c = S([a, l && l.name]), u = o.filter((h) => Je(h.province, d, c));
      if (u.length > 0)
        return E(u);
      if (l) {
        const h = Ze(l, a, r, this.allowEndpointFallbacks).map((y) => `provinces/${L(y)}/cities-municipalities`), m = await this.fetchFirstArray(h);
        if (m.length > 0)
          return E(m.map((y) => A(y, "city_municipality")));
      }
    }
    if (n || s) {
      const l = await this.resolveRegion(n, s).catch(() => null), d = W(n || l && l.id), c = S([s, l && l.name]), u = o.filter((h) => Je(h.region, d, c));
      if (u.length > 0)
        return E(u);
      if (l) {
        const h = Ze(l, s, n, this.allowEndpointFallbacks).map((m) => `regions/${L(m)}/cities-municipalities`);
        return E((await this.fetchFirstArray(h)).map((m) => A(m, "city_municipality")));
      }
    }
    return [];
  }
  async getBarangays(e, i = {}) {
    const r = v(e || i.city_id), n = b(i.city_name || "");
    if (!r && !n)
      return [];
    const a = await this.resolveCity(r, i).catch(() => null), s = O(r || a && a.id), o = S([n, a && a.name]);
    if (a) {
      const u = Ze(a, n, r, this.allowEndpointFallbacks).map((m) => `cities-municipalities/${L(m)}/barangays`), h = await this.fetchFirstArray(u);
      if (h.length > 0)
        return E(h.map((m) => A(m, "barangay")));
    }
    const d = (await this.getAllBarangays().catch(() => [])).filter((u) => Je(u.city_municipality, s, o));
    if (d.length > 0)
      return E(d);
    if (!this.allowEndpointFallbacks)
      return [];
    const c = de(s, "city").map((u) => `cities-municipalities/${L(u)}/barangays`);
    return E((await this.fetchFirstArray(c)).map((u) => A(u, "barangay")));
  }
  async resolveRegion(e, i = "") {
    const r = W(e), n = S([i]), a = this.findRow(await this.getRegions().catch(() => []), r, n);
    if (a)
      return a;
    const s = [i ? `regions/${L(i)}` : "", ...de(r, "region").map((o) => `regions/${L(o)}`)].filter(Boolean);
    return this.fetchOptionalItem(s, "region");
  }
  async resolveProvince(e, i = "", r = "", n = "") {
    if (!e && !r)
      return null;
    const a = se(e), s = S([r]), o = i || n ? await this.resolveRegion(i, n).catch(() => null) : null, l = o ? this.findRow(await this.getProvinces(o.id || i).catch(() => []), a, s) : null;
    if (l)
      return l;
    const d = this.findRow(await this.getAllProvinces().catch(() => []), a, s);
    if (d)
      return d;
    const c = [r ? `provinces/${L(r)}` : "", ...de(a, "province").map((u) => `provinces/${L(u)}`)].filter(Boolean);
    return this.fetchOptionalItem(c, "province");
  }
  async resolveCity(e, i = {}) {
    const r = b(i.city_name || "");
    if (!e && !r)
      return null;
    const n = O(e), a = S([r]), s = i.province_id || i.region_id || "", o = s || i.province_name || i.region_name ? this.findRow(await this.getCities(s, i).catch(() => []), n, a) : null;
    if (o)
      return o;
    const l = await this.getAllCities().catch(() => []), d = this.findRow(l, n, a);
    if (d)
      return d;
    const c = [r ? `cities-municipalities/${L(r)}` : "", ...de(n, "city").map((u) => `cities-municipalities/${L(u)}`)].filter(Boolean);
    return this.fetchOptionalItem(c, "city_municipality");
  }
  async resolveBarangay(e, i = "", r = "", n = "") {
    if (!e && !r)
      return null;
    const a = Re(e), s = S([r]), o = i || n ? this.findRow(await this.getBarangays(i, { city_id: i, city_name: n }).catch(() => []), a, s) : null;
    if (o)
      return o;
    const l = [r ? `barangays/${L(r)}` : "", ...de(a, "barangay").map((d) => `barangays/${L(d)}`)].filter(Boolean);
    return this.fetchOptionalItem(l, "barangay");
  }
  async getLocationByIds(e = {}) {
    let i = v(e.region_id), r = v(e.province_id), n = v(e.city_id), a = v(e.barangay_id);
    const s = b(e.region_name || ""), o = b(e.province_name || ""), l = b(e.city_name || ""), d = b(e.barangay_name || "");
    a && !n && (n = z(a)), n && !r && (r = C(n)), (r || n || a) && !i && (i = R(r || n || a));
    const c = {
      region_id: i,
      region_name: s,
      province_id: r,
      province_name: o,
      city_id: n,
      city_name: l,
      barangay_id: a,
      barangay_name: d
    }, u = await this.resolveRegion(i, s).catch(() => null);
    u && (c.region_id = u.id, c.region_name = u.name);
    const h = await this.resolveProvince(r, c.region_id || i, o, c.region_name || s).catch(() => null);
    h && (c.province_id = h.id, c.province_name = h.name, _t(c, h));
    const m = await this.resolveCity(n, {
      region_id: c.region_id || i,
      region_name: c.region_name || s,
      province_id: c.province_id || r,
      province_name: c.province_name || o,
      city_name: l
    }).catch(() => null);
    m && (c.city_id = m.id, c.city_name = m.name, _t(c, m), m.province || (c.province_id = "", c.province_name = ""));
    const y = await this.resolveBarangay(a, c.city_id || n, d, c.city_name || l).catch(() => null);
    return y && (c.barangay_id = y.id, c.barangay_name = y.name, _t(c, y)), c.label = [c.city_name, c.barangay_name].filter(Boolean).join(" → "), c.display_label = c.label, T(c);
  }
  async getBounds() {
    return null;
  }
  async getCentroid() {
    return null;
  }
  async getPolygon() {
    return null;
  }
  async reverseGeocode() {
    return null;
  }
}
const Mr = Object.freeze({
  regions: "regions",
  provinces: "provinces",
  cities: "cities",
  barangays: "barangays",
  location: "location",
  bounds: "bounds",
  centroid: "centroid",
  polygon: "polygon",
  reverse: "reverse"
});
function At(t) {
  return String(t ?? "").trim();
}
function Qt(t, e = "GET") {
  return At(t || e).toUpperCase() === "POST" ? "POST" : "GET";
}
function Ir(t) {
  return At(t || "/api/location").replace(/\/+$/, "");
}
function ei(t) {
  return At(t).replace(/^\/+/, "").replace(/\/+$/, "");
}
function Nr(t) {
  return t && typeof t == "object" && !Array.isArray(t) && Object.prototype.hasOwnProperty.call(t, "data") ? t.data : t;
}
class $t {
  constructor(e = {}) {
    this.baseUrl = Ir(e.baseUrl || e.apiUrl), this.endpoints = { ...Mr, ...e.endpoints || {} }, this.reverseMethod = Qt(e.reverseMethod, "POST"), this.credentials = e.credentials || "same-origin", this.fetchOptions = e.fetchOptions && typeof e.fetchOptions == "object" ? e.fetchOptions : {}, this.cacheResponses = e.cacheResponses !== !1, this.cache = /* @__PURE__ */ new Map();
  }
  endpoint(e) {
    const i = ei(this.endpoints[e] || e);
    if (!i)
      throw new Error(`Location API endpoint is not configured: ${e}`);
    return i;
  }
  createUrl(e, i = {}) {
    const r = new URL(`${this.baseUrl}/${ei(e)}`, window.location.origin);
    return Object.entries(i || {}).forEach(([n, a]) => {
      a != null && String(a) !== "" && r.searchParams.set(n, String(a));
    }), r;
  }
  async requestJson(e, i = {}, r = {}) {
    const n = Qt(r.method, "GET"), a = n === "GET" ? this.createUrl(e, i) : this.createUrl(e), s = `${n} ${a.toString()} ${n === "POST" ? JSON.stringify(i || {}) : ""}`;
    if (n === "GET" && this.cacheResponses && this.cache.has(s))
      return this.cache.get(s);
    let o;
    try {
      o = await fetch(a, {
        ...this.fetchOptions,
        method: n,
        credentials: this.credentials,
        headers: {
          Accept: "application/json",
          ...n === "POST" ? { "Content-Type": "application/json" } : {},
          ...this.fetchOptions.headers || {}
        },
        body: n === "POST" ? JSON.stringify(i || {}) : void 0
      });
    } catch (c) {
      throw M(c, {
        provider: "api",
        method: "requestJson",
        path: e,
        code: "api_network_failed",
        reason: "network"
      });
    }
    if (!o.ok)
      throw M(`Location API request failed: ${e} (${o.status})`, {
        provider: "api",
        method: "requestJson",
        status: o.status,
        path: e,
        code: o.status === 404 ? "api_not_found" : "api_request_failed"
      });
    let l;
    try {
      l = await o.json();
    } catch (c) {
      throw M(c, {
        provider: "api",
        method: "requestJson",
        status: o.status,
        path: e,
        code: "api_malformed_json",
        reason: "malformed_json"
      });
    }
    const d = Nr(l);
    return n === "GET" && this.cacheResponses && this.cache.set(s, d), d;
  }
  async fetchJson(e, i = {}) {
    return this.requestJson(e, i, { method: "GET" });
  }
  async getRegions() {
    return Ae(await this.fetchJson(this.endpoint("regions"))).map((e) => He(e, "region"));
  }
  async getProvinces(e) {
    return Ae(await this.fetchJson(this.endpoint("provinces"), { region_id: e })).map((i) => He(i, "province"));
  }
  async getCities(e, i = {}) {
    return Ae(await this.fetchJson(this.endpoint("cities"), {
      province_id: i.province_id || "",
      region_id: i.province_id ? "" : i.region_id || e
    })).map((r) => He(r, "city_municipality"));
  }
  async getBarangays(e) {
    return Ae(await this.fetchJson(this.endpoint("barangays"), { city_id: e })).map((i) => He(i, "barangay"));
  }
  async getLocationByIds(e = {}) {
    const i = await this.fetchJson(this.endpoint("location"), e);
    return T(i || e);
  }
  async getBounds(e, i) {
    return this.fetchJson(this.endpoint("bounds"), { level: e, id: i }).catch(() => null);
  }
  async getCentroid(e, i) {
    return this.fetchJson(this.endpoint("centroid"), { level: e, id: i }).catch(() => null);
  }
  async getPolygon(e, i) {
    return this.fetchJson(this.endpoint("polygon"), { level: e, id: i }).catch(() => null);
  }
  async reverseGeocode(e, i, r = {}) {
    const n = {
      lat: e,
      lng: i,
      region_id: r.region_id || "",
      province_id: r.province_id || "",
      city_id: r.city_id || "",
      barangay_id: r.barangay_id || ""
    }, a = await this.requestJson(this.endpoint("reverse"), n, {
      method: this.reverseMethod
    }).catch(() => null);
    return a ? ze(a) : null;
  }
}
function J(t) {
  return String(t ?? "").trim();
}
function Cr(t) {
  return Array.isArray(t) ? t : [];
}
function Br(t = {}) {
  const e = J(t.barangay_id);
  return e ? ze({
    region_id: J(t.region_id) || R(e),
    region_name: J(t.region_name),
    province_id: J(t.province_id) || C(e),
    province_name: J(t.province_name),
    city_id: J(t.city_id) || z(e),
    city_name: J(t.city_name),
    barangay_id: e,
    barangay_name: J(t.barangay_name),
    match_quality: "selected-context",
    match_distance_km: 0
  }) : null;
}
function Ke(t) {
  return Number(t) * Math.PI / 180;
}
function Ar(t, e) {
  const r = Ke(Number(e.lat) - Number(t.lat)), n = Ke(Number(e.lng) - Number(t.lng)), a = Ke(t.lat), s = Ke(e.lat), o = Math.sin(r / 2) * Math.sin(r / 2) + Math.cos(a) * Math.cos(s) * Math.sin(n / 2) * Math.sin(n / 2);
  return 2 * 6371 * Math.atan2(Math.sqrt(o), Math.sqrt(1 - o));
}
class $r {
  constructor(e = {}) {
    this.baseUrl = String(e.baseUrl || "/data").replace(/\/+$/, ""), this.cache = /* @__PURE__ */ new Map(), this.reverseMaxNearestKm = Number.isFinite(Number(e.reverseMaxNearestKm)) ? Number(e.reverseMaxNearestKm) : 0, this.reverseFallbackToSelectedLocation = e.reverseFallbackToSelectedLocation === !0;
  }
  async fetchJson(e) {
    const i = String(e || "").replace(/^\/+/, "");
    if (this.cache.has(i))
      return this.cache.get(i);
    let r;
    try {
      r = await fetch(`${this.baseUrl}/${i}`, {
        headers: { Accept: "application/json" },
        credentials: "same-origin"
      });
    } catch (a) {
      throw M(a, {
        provider: "static-geometry",
        method: "fetchJson",
        path: i,
        code: "static_geometry_network_failed",
        reason: "network"
      });
    }
    if (!r.ok)
      throw M(`Geometry data request failed: ${i} (${r.status})`, {
        provider: "static-geometry",
        method: "fetchJson",
        status: r.status,
        path: i,
        code: r.status === 404 ? "static_geometry_not_found" : "static_geometry_request_failed"
      });
    let n;
    try {
      n = await r.json();
    } catch (a) {
      throw M(a, {
        provider: "static-geometry",
        method: "fetchJson",
        status: r.status,
        path: i,
        code: "static_geometry_malformed_json",
        reason: "malformed_json"
      });
    }
    return this.cache.set(i, n), n;
  }
  async fetchOptionalJson(e, i = null) {
    try {
      return await this.fetchJson(e);
    } catch (r) {
      return r && (r.status === 404 || r.status === 403), i;
    }
  }
  boundsFileName(e) {
    return e === "city" ? "cities" : `${e}s`;
  }
  async getBounds(e, i) {
    const r = this.boundsFileName(e);
    let n = {};
    if (n = await this.fetchOptionalJson(`geo/bounds/${r}.json`, null), !n && e === "city" && (n = await this.fetchOptionalJson("geo/bounds/citys.json", null)), !n || typeof n != "object")
      return null;
    for (const a of Ye(e, i))
      if (n[a])
        return oe(n[a]);
    return null;
  }
  async getCentroid(e, i) {
    const r = this.boundsFileName(e);
    try {
      const a = await this.fetchOptionalJson(`geo/centroids/${r}.json`, {});
      for (const s of Ye(e, i)) {
        const o = a[s];
        if (o)
          return { lat: Number(o.lat), lng: Number(o.lng) };
      }
    } catch {
    }
    const n = await this.getBounds(e, i).catch(() => null);
    return ye(n);
  }
  async getPolygon(e, i) {
    if (e !== "barangay")
      return null;
    for (const r of Re(i))
      for (const n of yi(i))
        try {
          const a = await this.fetchJson(`geo/polygons/barangays/${n}/${r}.json`);
          return Cr(a);
        } catch {
        }
    return null;
  }
  async reverseGeocode(e, i, r = {}) {
    const n = {
      lat: Number(e),
      lng: Number(i)
    };
    if (!Number.isFinite(n.lat) || !Number.isFinite(n.lng))
      return null;
    const a = [];
    if (r.city_id)
      a.push(J(r.city_id));
    else {
      const c = await this.fetchOptionalJson("geo/bounds/cities.json", null) || await this.fetchOptionalJson("geo/bounds/citys.json", {});
      Object.keys(c).forEach((u) => {
        Xe(c[u], n.lat, n.lng) && a.push(u);
      });
    }
    const s = await this.fetchOptionalJson("geo/bounds/barangays.json", {}), o = await this.fetchOptionalJson("geo/centroids/barangays.json", {}), l = [];
    for (const c of Object.keys(s)) {
      const u = z(c);
      if (a.length > 0 && !a.some((y) => Vi(c, y)))
        continue;
      const h = o[c];
      if (h && l.push({
        barangay_id: c,
        city_id: u,
        distanceKm: Ar(n, {
          lat: Number(h.lat),
          lng: Number(h.lng)
        })
      }), !Xe(s[c], n.lat, n.lng))
        continue;
      const m = await this.getPolygon("barangay", c);
      if (!(m && m.length >= 3 && !Bt(n, m)))
        return ze({
          region_id: R(c),
          province_id: C(c),
          city_id: u,
          barangay_id: c,
          match_quality: m && m.length >= 3 ? "polygon" : "bounds",
          match_distance_km: 0
        });
    }
    if (this.reverseFallbackToSelectedLocation) {
      const c = Br(r);
      if (c)
        return c;
    }
    if (this.reverseMaxNearestKm <= 0)
      return null;
    l.sort((c, u) => c.distanceKm - u.distanceKm);
    const d = l[0];
    return !d || d.distanceKm > this.reverseMaxNearestKm ? null : ze({
      region_id: R(d.barangay_id),
      province_id: C(d.barangay_id),
      city_id: d.city_id,
      barangay_id: d.barangay_id,
      match_quality: "nearest-centroid",
      match_distance_km: Number(d.distanceKm.toFixed(3))
    });
  }
}
function x(t) {
  return String(t ?? "").trim();
}
function Oi(t) {
  const e = Number(t);
  return Number.isFinite(e) ? e : 0;
}
function Fr() {
  return T({});
}
function qr(t = {}) {
  const e = {
    region_id: x(t.region_id),
    region_name: x(t.region_name),
    province_id: x(t.province_id),
    province_name: x(t.province_name),
    city_id: x(t.city_id),
    city_name: x(t.city_name),
    barangay_id: x(t.barangay_id),
    barangay_name: x(t.barangay_name)
  };
  return e.label = [e.city_name, e.barangay_name].filter(Boolean).join(" → "), e.display_label = e.label, e.match_quality = x(t.match_quality), e.match_distance_km = Oi(t.match_distance_km), T(e);
}
function Rr(t = {}, e = {}) {
  const i = { ...Fr(), ...t };
  return [
    "region_id",
    "region_name",
    "province_id",
    "province_name",
    "city_id",
    "city_name",
    "barangay_id",
    "barangay_name"
  ].forEach((r) => {
    !i[r] && e[r] && (i[r] = x(e[r]));
  }), i.match_quality = x(e.match_quality || i.match_quality), i.match_distance_km = Oi(e.match_distance_km ?? i.match_distance_km), i.label = [i.city_name, i.barangay_name].filter(Boolean).join(" → "), i.display_label = i.label, i.resolved = !0, i.resolved_source = "composite-reverse-geocode", T(i);
}
class Mi {
  constructor(e = {}) {
    if (!e.hierarchyProvider)
      throw new Error("CompositeLocationProvider requires hierarchyProvider.");
    this.hierarchyProvider = e.hierarchyProvider, this.geometryProvider = e.geometryProvider || null;
  }
  async getRegions() {
    return this.hierarchyProvider.getRegions();
  }
  async getProvinces(e, i = {}) {
    return this.hierarchyProvider.getProvinces(e, i);
  }
  async getCities(e, i = {}) {
    return this.hierarchyProvider.getCities(e, i);
  }
  async getBarangays(e, i = {}) {
    return this.hierarchyProvider.getBarangays(e, i);
  }
  async getLocationByIds(e = {}) {
    return T(await this.hierarchyProvider.getLocationByIds(e));
  }
  async getBounds(e, i) {
    return !this.geometryProvider || !this.geometryProvider.getBounds ? null : this.geometryProvider.getBounds(e, i).catch(() => null);
  }
  async getCentroid(e, i) {
    return !this.geometryProvider || !this.geometryProvider.getCentroid ? null : this.geometryProvider.getCentroid(e, i).catch(() => null);
  }
  async getPolygon(e, i) {
    return !this.geometryProvider || !this.geometryProvider.getPolygon ? null : this.geometryProvider.getPolygon(e, i).catch(() => null);
  }
  async reverseGeocode(e, i, r = {}) {
    if (!this.geometryProvider || !this.geometryProvider.reverseGeocode)
      return null;
    const n = await this.geometryProvider.reverseGeocode(e, i, r).catch(() => null);
    if (!n || !n.barangay_id)
      return null;
    let a = null;
    try {
      a = await this.hierarchyProvider.getLocationByIds({
        region_id: n.region_id,
        region_name: n.region_name,
        province_id: n.province_id,
        province_name: n.province_name,
        city_id: n.city_id,
        city_name: n.city_name,
        barangay_id: n.barangay_id,
        barangay_name: n.barangay_name
      });
    } catch {
      a = qr(n);
    }
    return Rr(a, n);
  }
}
function G(t) {
  return String(t || "").trim();
}
function $(t) {
  return String(t || "").replace(/'/g, "''");
}
function Qe(t) {
  const e = Number(t);
  return Number.isFinite(e) ? e : null;
}
function ee(t, ...e) {
  for (const i of e)
    if (t[i] !== void 0 && t[i] !== null && String(t[i]).trim() !== "")
      return t[i];
  return "";
}
function ti(t) {
  let e = 0;
  for (let i = 0, r = t.length - 1; i < t.length; r = i++)
    e += t[r][0] * t[i][1] - t[i][0] * t[r][1];
  return Math.abs(e / 2);
}
function zr(t) {
  if (!t)
    return [];
  const e = [];
  return t.type === "Polygon" && Array.isArray(t.coordinates[0]) && e.push(t.coordinates[0]), t.type === "MultiPolygon" && t.coordinates.forEach((i) => {
    Array.isArray(i[0]) && e.push(i[0]);
  }), e.filter((i) => Array.isArray(i) && i.length >= 4).sort((i, r) => ti(r) - ti(i))[0] || [];
}
function xr(t) {
  let e = 1 / 0, i = 1 / 0, r = -1 / 0, n = -1 / 0;
  return t.forEach((a) => {
    const s = Qe(a.lat), o = Qe(a.lng);
    s === null || o === null || (e = Math.min(e, s), i = Math.min(i, o), r = Math.max(r, s), n = Math.max(n, o));
  }), !Number.isFinite(e) || !Number.isFinite(i) || !Number.isFinite(r) || !Number.isFinite(n) ? null : { south: e, west: i, north: r, east: n };
}
function We(t, e = 6) {
  const i = Math.pow(10, e);
  return zr(t).map(([n, a]) => ({
    lat: Math.round(Number(a) * i) / i,
    lng: Math.round(Number(n) * i) / i
  })).filter((n) => Number.isFinite(n.lat) && Number.isFinite(n.lng));
}
function ii(t, e) {
  const r = (Number(e.lat) - Number(t.lat)) * Math.PI / 180, n = (Number(e.lng) - Number(t.lng)) * Math.PI / 180, a = Number(t.lat) * Math.PI / 180, s = Number(e.lat) * Math.PI / 180, o = Math.sin(r / 2) * Math.sin(r / 2) + Math.cos(a) * Math.cos(s) * Math.sin(n / 2) * Math.sin(n / 2);
  return 2 * 6371 * Math.atan2(Math.sqrt(o), Math.sqrt(1 - o));
}
function ri(t) {
  if (!Array.isArray(t) || t.length === 0)
    return null;
  const e = t.reduce((i, r) => ({
    lat: i.lat + Number(r.lat),
    lng: i.lng + Number(r.lng),
    count: i.count + 1
  }), { lat: 0, lng: 0, count: 0 });
  return e.count > 0 ? { lat: e.lat / e.count, lng: e.lng / e.count } : null;
}
class za {
  constructor(e = {}) {
    this.baseUrl = String(e.baseUrl || "https://portal.georisk.gov.ph/arcgis/rest/services/PSA/Barangay/MapServer/4").replace(/\/+$/, ""), this.geometryPrecision = Number.isFinite(Number(e.geometryPrecision)) ? Number(e.geometryPrecision) : 6, this.reverseDistanceMeters = Number.isFinite(Number(e.reverseDistanceMeters)) ? Number(e.reverseDistanceMeters) : 50, this.cache = /* @__PURE__ */ new Map();
  }
  buildUrl(e = {}) {
    const i = new URL(`${this.baseUrl}/query`);
    return Object.entries(e).forEach(([r, n]) => {
      n != null && String(n) !== "" && i.searchParams.set(r, String(n));
    }), i.toString();
  }
  async fetchQuery(e = {}) {
    const i = {
      f: "geojson",
      outFields: "*",
      outSR: "4326",
      returnGeometry: "true"
    }, r = this.buildUrl({ ...i, ...e });
    if (this.cache.has(r))
      return this.cache.get(r);
    const n = await fetch(r, {
      headers: { Accept: "application/json, application/geo+json" }
    });
    if (!n.ok)
      throw new Error(`ArcGIS barangay boundary request failed (${n.status}).`);
    const a = await n.json();
    if (a.error)
      throw new Error(a.error.message || "ArcGIS barangay boundary request failed.");
    return this.cache.set(r, a), a;
  }
  cityWhereClause(e) {
    const i = [];
    return O(e).forEach((r) => {
      i.push(`city_code='${$(r)}'`), i.push(`CITY_CODE='${$(r)}'`);
      const n = w(r);
      n.length >= 7 && (i.push(`psgc_10d LIKE '${$(n.slice(0, 7))}%'`), i.push(`PSGC_10D LIKE '${$(n.slice(0, 7))}%'`)), n.length >= 6 && (i.push(`psgc_10d LIKE '${$(n.slice(0, 6))}%'`), i.push(`PSGC_10D LIKE '${$(n.slice(0, 6))}%'`));
    }), i.length ? `(${[...new Set(i)].join(" OR ")})` : "1=1";
  }
  async queryByBarangayId(e) {
    const i = G(e);
    if (!i)
      return null;
    const r = w(i).slice(0, 9), n = `(psgc_10d='${$(i)}' OR PSGC_10D='${$(i)}' OR brgy_code='${$(i)}' OR BRGY_CODE='${$(i)}' OR brgy_code='${$(r)}' OR BRGY_CODE='${$(r)}')`, a = await this.fetchQuery({
      where: n,
      geometryPrecision: this.geometryPrecision,
      returnGeometry: "true"
    });
    return Array.isArray(a.features) && a.features.length > 0 ? a.features[0] : null;
  }
  async getPolygon(e, i) {
    if (e !== "barangay")
      return null;
    const r = await this.queryByBarangayId(i).catch(() => null);
    if (!r || !r.geometry)
      return null;
    const n = We(r.geometry, this.geometryPrecision);
    return n.length >= 3 ? n : null;
  }
  async getBounds(e, i) {
    if (e !== "barangay")
      return null;
    const r = await this.getPolygon(e, i).catch(() => null);
    return r ? oe(xr(r)) : null;
  }
  async getCentroid(e, i) {
    if (e !== "barangay") {
      const n = await this.getBounds(e, i).catch(() => null);
      return ye(n);
    }
    const r = await this.getBounds(e, i).catch(() => null);
    return ye(r);
  }
  featureToMatch(e, i = "") {
    const r = e && e.properties ? e.properties : {}, n = G(ee(r, "psgc_10d", "PSGC_10D", "brgy_code", "BRGY_CODE"));
    if (!n)
      return null;
    const a = G(ee(r, "city_code", "CITY_CODE")) || z(n), s = G(ee(r, "prov_code", "PROV_CODE")) || C(n), o = G(ee(r, "reg_code", "REG_CODE")) || R(n), l = q(n, "barangay") || n, d = q(a, "city") || z(l || n), c = q(s, "province") || C(l || n), u = q(o, "region") || R(c || l || n);
    return ze({
      region_id: u,
      region_name: G(ee(r, "reg_name", "REG_NAME")),
      province_id: c,
      province_name: G(ee(r, "prov_name", "PROV_NAME")),
      city_id: d,
      city_name: G(ee(r, "city_name", "CITY_NAME")),
      barangay_id: l,
      barangay_name: G(ee(r, "brgy_name", "BRGY_NAME")),
      match_quality: i || (e.geometry ? "arcgis-polygon" : "arcgis-feature"),
      match_distance_km: 0
    });
  }
  sortFeaturesByCentroidDistance(e, i) {
    return e.slice().sort((r, n) => {
      const a = We(r.geometry, this.geometryPrecision), s = We(n.geometry, this.geometryPrecision), o = ri(a), l = ri(s), d = o ? ii(i, o) : Number.POSITIVE_INFINITY, c = l ? ii(i, l) : Number.POSITIVE_INFINITY;
      return d - c;
    });
  }
  pointQueryParams(e, i, r = {}) {
    const n = {
      where: "1=1",
      geometry: `${i},${e}`,
      geometryType: "esriGeometryPoint",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      returnGeometry: "true",
      geometryPrecision: this.geometryPrecision
    };
    return r.city_id && (n.where = this.cityWhereClause(r.city_id)), n;
  }
  async reverseGeocode(e, i, r = {}) {
    const n = Qe(e), a = Qe(i);
    if (n === null || a === null)
      return null;
    const s = { lat: n, lng: a }, o = await this.fetchQuery(this.pointQueryParams(n, a, r)).catch(() => null), l = o && Array.isArray(o.features) ? o.features : [];
    if (l.length > 0) {
      const m = l.find((y) => {
        const I = We(y.geometry, this.geometryPrecision);
        return I.length >= 3 ? Bt(s, I) : !0;
      }) || l[0];
      return this.featureToMatch(m, "arcgis-polygon");
    }
    if (this.reverseDistanceMeters <= 0)
      return null;
    const d = await this.fetchQuery({
      ...this.pointQueryParams(n, a, r),
      distance: this.reverseDistanceMeters,
      units: "esriSRUnit_Meter"
    }).catch(() => null), c = d && Array.isArray(d.features) ? d.features : [];
    if (c.length === 0)
      return null;
    const u = this.sortFeaturesByCentroidDistance(c, s), h = this.featureToMatch(u[0], `arcgis-distance-${this.reverseDistanceMeters}m`);
    return h && (h.match_distance_km = Number((this.reverseDistanceMeters / 1e3).toFixed(3))), h;
  }
}
function vt(t, e = "/data") {
  return String(t || e).replace(/\/+$/, "");
}
function Ii(t = {}) {
  const e = vt(t.baseUrl), i = vt(t.hierarchyBaseUrl, e), r = vt(t.geometryBaseUrl, e), n = Number.isFinite(Number(t.reverseMaxNearestKm)) ? Number(t.reverseMaxNearestKm) : 0, a = t.reverseFallbackToSelectedLocation !== !1;
  return new Mi({
    hierarchyProvider: new Si({
      baseUrl: i
    }),
    geometryProvider: new $r({
      baseUrl: r,
      reverseMaxNearestKm: n,
      reverseFallbackToSelectedLocation: a
    })
  });
}
function jr(t) {
  if (!t)
    throw new Error("createStaticLocationMapPicker requires mount.");
  if (typeof t == "string") {
    const e = document.querySelector(t);
    if (!e)
      throw new Error(`createStaticLocationMapPicker mount was not found: ${t}`);
    return e;
  }
  return t;
}
function Tr(t) {
  const e = String(t || "").trim().replace(/\/+$/, "");
  if (!e)
    throw new Error("createStaticLocationMapPicker requires baseUrl.");
  return e;
}
function Ee(t, e) {
  return {
    ...t,
    ...e || {}
  };
}
function Dr(t = {}) {
  const e = Tr(t.baseUrl), i = jr(t.mount), r = Ii({
    ...t.providerOptions || {},
    baseUrl: e
  });
  return new Ct({
    ...t,
    mount: i,
    provider: r,
    ui: Ee({
      selectedLabelFormat: "city_barangay",
      theme: "light",
      size: "comfortable",
      density: "normal"
    }, t.ui),
    location: Ee({
      requiredLevel: "barangay"
    }, t.location),
    validation: Ee({
      requiredLocationLevel: "barangay",
      requirePin: !0
    }, t.validation),
    map: Ee({
      pinMode: "centered",
      showBoundary: !0,
      fitBoundaryOnSelection: !0
    }, t.map),
    reverse: Ee({
      enabled: !0,
      failOnNoMatch: !1
    }, t.reverse)
  });
}
function Ur(t) {
  if (!t)
    throw new Error("createApiLocationMapPicker requires mount.");
  if (typeof t == "string") {
    const e = document.querySelector(t);
    if (!e)
      throw new Error(`createApiLocationMapPicker mount was not found: ${t}`);
    return e;
  }
  return t;
}
function Hr(t) {
  const e = String(t || "").trim().replace(/\/+$/, "");
  if (!e)
    throw new Error("createApiLocationMapPicker requires apiUrl or baseUrl.");
  return e;
}
function Se(t, e) {
  return {
    ...t,
    ...e || {}
  };
}
function Vr(t = {}) {
  const e = Hr(t.apiUrl || t.baseUrl), i = Ur(t.mount), r = new $t({
    ...t.providerOptions || {},
    baseUrl: e
  });
  return new Ct({
    ...t,
    mount: i,
    provider: r,
    ui: Se({
      selectedLabelFormat: "city_barangay",
      theme: "light",
      size: "comfortable",
      density: "normal"
    }, t.ui),
    location: Se({
      requiredLevel: "barangay"
    }, t.location),
    validation: Se({
      requiredLocationLevel: "barangay",
      requirePin: !0
    }, t.validation),
    map: Se({
      pinMode: "centered",
      showBoundary: !0,
      fitBoundaryOnSelection: !0
    }, t.map),
    reverse: Se({
      enabled: !0,
      failOnNoMatch: !1
    }, t.reverse)
  });
}
const me = Object.freeze({
  STATIC: "static",
  API: "api",
  HYBRID: "hybrid"
});
function Ni(t) {
  return String(t ?? "").trim();
}
function ae(t, e = "") {
  return Ni(t || e).replace(/\/+$/, "");
}
function Ci(t = "static") {
  const e = Ni(t || "static").toLowerCase();
  return e === "database" || e === "db" || e === "server" ? me.API : e === me.API || e === me.HYBRID ? e : me.STATIC;
}
function Gr(t = {}) {
  const e = ae(t.apiUrl || t.baseUrl || t.providerOptions?.apiUrl || t.providerOptions?.baseUrl);
  if (!e)
    throw new Error("API provider mode requires apiUrl.");
  return new $t({
    ...t.providerOptions || {},
    ...t.apiProviderOptions || {},
    baseUrl: e
  });
}
function Jr(t = {}) {
  const e = ae(t.baseUrl || t.dataBaseUrl || t.providerOptions?.baseUrl || "/data");
  return Ii({
    ...t.providerOptions || {},
    ...t.staticProviderOptions || {},
    baseUrl: e,
    hierarchyBaseUrl: ae(t.hierarchyBaseUrl || t.providerOptions?.hierarchyBaseUrl || e),
    geometryBaseUrl: ae(t.geometryBaseUrl || t.providerOptions?.geometryBaseUrl || e)
  });
}
function Zr(t = {}) {
  const e = ae(t.baseUrl || t.dataBaseUrl || t.providerOptions?.baseUrl || "/data"), i = ae(t.hierarchyBaseUrl || t.providerOptions?.hierarchyBaseUrl || e), r = ae(t.apiUrl || t.geometryApiUrl || t.providerOptions?.apiUrl || t.providerOptions?.geometryApiUrl);
  if (!r)
    throw new Error("Hybrid provider mode requires apiUrl for geometry/reverse lookup.");
  return new Mi({
    hierarchyProvider: new Si({
      ...t.providerOptions || {},
      ...t.staticProviderOptions || {},
      baseUrl: i
    }),
    geometryProvider: new $t({
      ...t.providerOptions || {},
      ...t.apiProviderOptions || {},
      baseUrl: r
    })
  });
}
function Kr(t = {}) {
  if (t.provider && typeof t.provider == "object" && typeof t.provider.getRegions == "function")
    return t.provider;
  const e = Ci(t.provider || t.mode || t.providerMode || "static");
  return e === me.API ? Gr(t) : e === me.HYBRID ? Zr(t) : Jr(t);
}
function Wr(t) {
  if (!t)
    throw new Error("createLocationMapPicker requires mount.");
  if (typeof t == "string") {
    const e = document.querySelector(t);
    if (!e)
      throw new Error(`createLocationMapPicker mount was not found: ${t}`);
    return e;
  }
  return t;
}
function ke(t, e) {
  return {
    ...t,
    ...e || {}
  };
}
function Yr(t = {}) {
  const e = Ci(t.provider || t.mode || t.providerMode || "static"), i = Wr(t.mount), r = Kr({
    ...t,
    provider: e
  });
  return new Ct({
    ...t,
    mount: i,
    provider: r,
    providerMode: e,
    ui: ke({
      selectedLabelFormat: "city_barangay",
      theme: "light",
      size: "comfortable",
      density: "normal"
    }, t.ui),
    location: ke({
      requiredLevel: "barangay"
    }, t.location),
    validation: ke({
      requiredLocationLevel: "barangay",
      requirePin: !0
    }, t.validation),
    map: ke({
      pinMode: "centered",
      showBoundary: !0,
      fitBoundaryOnSelection: !0
    }, t.map),
    reverse: ke({
      enabled: !0,
      failOnNoMatch: !1
    }, t.reverse)
  });
}
function ni(t) {
  return JSON.stringify(t ?? null);
}
function N(t) {
  return t == null ? "" : String(t);
}
function ai(t) {
  const e = Number(t);
  return Number.isFinite(e) ? e.toFixed(6) : "";
}
function Xr(t) {
  if (!t || typeof t.value != "function" || typeof t.validate != "function")
    throw new Error("createLocationMapPickerSubmitPayload requires a LocationMapPicker instance.");
  return t;
}
function Qr(t) {
  const e = t && t.location ? t.location : {}, i = t && t.pin ? t.pin : null, r = t && t.geometry ? t.geometry : {
    focus_result: null,
    reverse_match: null,
    reverse_error: null
  };
  return {
    location: {
      region_id: N(e.region_id),
      region_name: N(e.region_name),
      province_id: N(e.province_id),
      province_name: N(e.province_name),
      city_id: N(e.city_id),
      city_name: N(e.city_name),
      barangay_id: N(e.barangay_id),
      barangay_name: N(e.barangay_name),
      label: N(e.label),
      display_label: N(e.display_label)
    },
    pin: i ? {
      lat: Number(i.lat),
      lng: Number(i.lng)
    } : null,
    geometry: r
  };
}
function en(t) {
  const e = t || {};
  return {
    valid: e.valid === !0,
    required_location_level: N(e.required_location_level),
    require_pin: e.require_pin === !0,
    missing: Array.isArray(e.missing) ? e.missing.map(N) : [],
    messages: Array.isArray(e.messages) ? e.messages.map(N) : [],
    location: e.location || {},
    pin: e.pin || null
  };
}
function tn(t) {
  const e = Xr(t);
  return rn(e.value(), e.validate());
}
function rn(t, e) {
  const i = Qr(t || {}), r = en(e);
  return {
    barangay_id: i.location.barangay_id,
    pin_lat: i.pin ? ai(i.pin.lat) : "",
    pin_lng: i.pin ? ai(i.pin.lng) : "",
    location_picker_value_json: ni(i),
    location_picker_validation_json: ni(r)
  };
}
const Bi = "Complete the required location fields before saving.", nn = "The location picker is still working. Try again after it finishes.", an = "The location picker is disabled.", sn = "The location picker is read-only.";
function $e(t) {
  return t == null ? "" : String(t);
}
function on(t) {
  return Array.isArray(t) ? t.map($e).filter(Boolean) : [];
}
function cn(t) {
  if (!t || typeof t.validate != "function" || typeof t.value != "function")
    throw new Error("createLocationMapPickerSubmitResult requires a LocationMapPicker instance.");
  return t;
}
function ln(t) {
  return typeof t.isBusy == "function" ? t.isBusy() === !0 : t.busy === !0;
}
function un(t) {
  return t.disabled === !0;
}
function dn(t) {
  return t.readOnly === !0;
}
function wt(t, e, i, r) {
  return {
    valid: !1,
    blocked: !0,
    code: t,
    message: e || Bi,
    messages: e ? [e] : [],
    missing: i && Array.isArray(i.missing) ? i.missing.slice() : [],
    validation: i,
    payload: r
  };
}
function It(t, e = {}) {
  const i = cn(t), r = i.validate(), n = tn(i);
  if (ln(i))
    return wt("picker_busy", $e(e.messageBusy || nn), r, n);
  if (un(i))
    return wt("picker_disabled", $e(e.messageDisabled || an), r, n);
  if (dn(i))
    return wt("picker_readonly", $e(e.messageReadOnly || sn), r, n);
  if (!r.valid) {
    const a = on(r.messages), s = a[0] || $e(e.messageInvalid || Bi);
    return {
      valid: !1,
      blocked: !0,
      code: "picker_invalid",
      message: s,
      messages: a.length ? a : [s],
      missing: Array.isArray(r.missing) ? r.missing.slice() : [],
      validation: r,
      payload: n
    };
  }
  return {
    valid: !0,
    blocked: !1,
    code: "picker_valid",
    message: "",
    messages: [],
    missing: [],
    validation: r,
    payload: n
  };
}
function xa(t, e = {}) {
  const i = It(t, e);
  return i.blocked && e.setStatus !== !1 && t && typeof t.setStatus == "function" && t.setStatus("error", i.message, i.code), i;
}
const nt = Object.freeze({
  barangay_id: "barangay_id",
  pin_lat: "pin_lat",
  pin_lng: "pin_lng",
  location_picker_value_json: "location_picker_value_json",
  location_picker_validation_json: "location_picker_validation_json"
}), hn = Object.freeze(Object.keys(nt));
function at(t) {
  return t == null ? "" : String(t).trim();
}
function si(t, e) {
  if (t == null)
    return {};
  if (typeof t != "object" || Array.isArray(t))
    throw new Error(`${e} must be an object.`);
  return t;
}
function mn(t) {
  const e = at(t || "underscore").toLowerCase();
  return e === "bracket" || e === "php" || e === "array" ? "bracket" : "underscore";
}
function pn(t, e, i) {
  const r = at(e);
  return r ? i === "bracket" ? `${r}[${t}]` : `${r}_${t}` : t;
}
function ja() {
  return { ...nt };
}
function fn(t = "", e = {}) {
  const i = at(t), r = mn(e.fieldNameStyle || e.style), n = {};
  return hn.forEach((a) => {
    n[a] = pn(nt[a], i, r);
  }), n;
}
function xe(t = {}) {
  const e = si(t, "normalizeLocationMapPickerSubmitFieldNames options"), i = si(e.fieldNames, "fieldNames"), r = fn(e.fieldPrefix || "", {
    fieldNameStyle: e.fieldNameStyle
  });
  for (const n of Object.keys(i)) {
    if (!Object.prototype.hasOwnProperty.call(nt, n))
      throw new Error(`Unknown location picker field name: ${n}.`);
    const a = at(i[n]);
    if (!a)
      throw new Error(`Location picker field name ${n} cannot be blank.`);
    r[n] = a;
  }
  return r;
}
const yn = [
  "messageInvalid",
  "messageBusy",
  "messageDisabled",
  "messageReadOnly"
];
function gn(t) {
  if (!t || typeof t.validate != "function" || typeof t.value != "function")
    throw new Error("bindLocationMapPickerForm requires a LocationMapPicker instance.");
  return t;
}
function Ai(t) {
  if (!t)
    throw new Error("bindLocationMapPickerForm requires form.");
  if (typeof t == "string") {
    const e = document.querySelector(t);
    if (!e)
      throw new Error(`bindLocationMapPickerForm form was not found: ${t}`);
    return e;
  }
  if (typeof t.addEventListener != "function" || typeof t.querySelector != "function")
    throw new Error("bindLocationMapPickerForm form must be an HTMLFormElement or selector.");
  return t;
}
function bn(t) {
  return t == null ? "" : String(t).trim();
}
function $i(t = {}) {
  return t && (Object.prototype.hasOwnProperty.call(t, "fieldNames") || Object.prototype.hasOwnProperty.call(t, "fieldPrefix") || Object.prototype.hasOwnProperty.call(t, "fieldNameStyle")) ? xe(t) : xe({ fieldNames: t || {} });
}
function _n(t = {}) {
  const e = {};
  return yn.forEach((i) => {
    Object.prototype.hasOwnProperty.call(t, i) && (e[i] = t[i]);
  }), e;
}
function vn(t, e) {
  if (!e || !t || typeof t.querySelector != "function")
    return null;
  if (t.elements && t.elements[e]) {
    const r = t.elements[e];
    if (r && typeof r.value < "u")
      return r;
  }
  const i = typeof CSS < "u" && CSS.escape ? CSS.escape(e) : e.replace(/"/g, '\\"');
  return t.querySelector(`[name="${i}"]`);
}
function wn(t, e) {
  const i = bn(e);
  if (!i)
    return null;
  const r = vn(t, i);
  if (r)
    return r;
  const n = document.createElement("input");
  return n.type = "hidden", n.name = i, n.setAttribute("data-location-map-picker-submit-field", i), t.appendChild(n), n;
}
function Oe(t, e, i) {
  const r = wn(t, e);
  if (!r)
    return null;
  const n = i == null ? "" : String(i);
  return r.value !== n && (r.value = n), r;
}
function Pn(t) {
  const e = t && t.root;
  if (!e || typeof e.scrollIntoView != "function")
    return;
  e.scrollIntoView({ block: "center", inline: "nearest" });
  const i = e.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  i && typeof i.focus == "function" && i.focus({ preventScroll: !0 });
}
function oi(t, e, i = {}) {
  const r = Ai(t), n = $i(i), a = e || {};
  return Oe(r, n.barangay_id, a.barangay_id), Oe(r, n.pin_lat, a.pin_lat), Oe(r, n.pin_lng, a.pin_lng), Oe(r, n.location_picker_value_json, a.location_picker_value_json), Oe(r, n.location_picker_validation_json, a.location_picker_validation_json), {
    form: r,
    fieldNames: n,
    payload: a
  };
}
function Ft(t = {}) {
  const e = Ai(t.form), i = gn(t.picker), r = $i(t), n = t.writePayload !== !1, a = t.preventInvalid !== !1, s = t.stopInvalidPropagation === !0, o = t.setStatus !== !1, l = t.focusOnBlocked === !0, d = _n(t);
  let c = !1;
  function u(h) {
    if (c)
      return null;
    const m = It(i, d);
    return n && oi(e, m.payload, { fieldNames: r }), typeof t.onResult == "function" && t.onResult(m, h || null), m.blocked ? (h && a && typeof h.preventDefault == "function" && h.preventDefault(), h && s && typeof h.stopPropagation == "function" && h.stopPropagation(), o && typeof i.setStatus == "function" && i.setStatus("error", m.message, m.code), l && Pn(i), typeof t.onBlocked == "function" && t.onBlocked(m, h || null), m) : (typeof t.onValid == "function" && t.onValid(m, h || null), m);
  }
  return e.addEventListener("submit", u), {
    form: e,
    picker: i,
    fieldNames: r,
    submit: u,
    updatePayload() {
      const h = It(i, d);
      return oi(e, h.payload, { fieldNames: r }), h;
    },
    destroy() {
      c || (c = !0, e.removeEventListener("submit", u));
    }
  };
}
const Pt = {
  region_province_city_barangay: ["region_name", "province_name", "city_name", "barangay_name"],
  province_city_barangay: ["province_name", "city_name", "barangay_name"],
  city_barangay: ["city_name", "barangay_name"],
  barangay_only: ["barangay_name"]
};
function ci(t) {
  return t == null ? "" : String(t).trim();
}
function Ln(t, e, i) {
  const r = String(t || "").trim().toLowerCase();
  return e.includes(r) ? r : i;
}
function En(t = {}) {
  return t && typeof t == "object" && t.location && typeof t.location == "object" ? t.location : t || {};
}
function Sn(t = {}, e = {}) {
  const i = En(t), r = Ln(e.format || e.selectedLabelFormat, Object.keys(Pt), "city_barangay"), n = ci(e.separator) || " → ", a = e.emptyLabel == null ? "" : String(e.emptyLabel);
  return (Pt[r] || Pt.city_barangay).map((l) => ci(i[l])).filter(Boolean).join(n) || a;
}
const Fi = ["region", "province", "city", "barangay"];
function Fe(t) {
  return t == null ? "" : String(t).trim();
}
function kn(t, e, i) {
  const r = Fe(t).toLowerCase();
  return e.includes(r) ? r : i;
}
function On(t = {}) {
  return t && typeof t == "object" && t.location && typeof t.location == "object" ? t.location : t || {};
}
function li(t) {
  return Fi.indexOf(t);
}
function qi(t = {}) {
  const e = On(t);
  return Fe(e.barangay_id) ? "barangay" : Fe(e.city_id) ? "city" : Fe(e.province_id) ? "province" : Fe(e.region_id) ? "region" : "";
}
function Mn(t = {}, e = {}) {
  const i = qi(t);
  if (!i)
    return !1;
  const r = kn(
    e.requiredLocationLevel || e.selectionRequiredLevel,
    Fi,
    "barangay"
  );
  return li(i) >= li(r);
}
function In(t) {
  if (!t || typeof t.value != "function" || typeof t.open != "function" || typeof t.close != "function")
    throw new Error("bindLocationMapPickerFieldControls requires a LocationMapPicker instance.");
  return t;
}
function Lt(t) {
  return t ? typeof t == "string" ? Array.from(document.querySelectorAll(t)) : typeof NodeList < "u" && t instanceof NodeList ? Array.from(t) : Array.isArray(t) ? t.filter(Boolean) : [t] : [];
}
function ui(t) {
  return t ? typeof t == "string" ? document.querySelector(t) : t : null;
}
function ne(t) {
  return t == null ? "" : String(t);
}
function di(t, e) {
  if (!t)
    return;
  const i = ne(e);
  t.textContent !== i && (t.textContent = i);
}
function Et(t, e) {
  t && ("disabled" in t && (t.disabled = e), t.setAttribute("aria-disabled", e ? "true" : "false"));
}
function Nn(t) {
  return t.disabled === !0 || t.readOnly === !0 || typeof t.isBusy == "function" && t.isBusy() === !0;
}
function Cn(t) {
  if (!t || typeof t != "object")
    return !1;
  if (t.pin && Number.isFinite(Number(t.pin.lat)) && Number.isFinite(Number(t.pin.lng)))
    return !0;
  const e = t.location && typeof t.location == "object" ? t.location : t;
  return !!(ne(e.region_id) || ne(e.province_id) || ne(e.city_id) || ne(e.barangay_id));
}
function qt(t = {}) {
  const e = In(t.picker), i = Lt(t.openButton || t.openControl || t.trigger), r = Lt(t.closeButton || t.closeControl), n = Lt(t.clearButton || t.clearControl), a = ui(t.summary || t.summaryElement), s = ui(t.status || t.statusElement), o = ne(t.selectedClassName || "is-selected"), l = ne(t.invalidClassName || "is-invalid"), d = t.emptyLabel == null ? "Select City → Barangay" : String(t.emptyLabel);
  let c = !1;
  function u() {
    return Sn(e.value(), {
      selectedLabelFormat: t.selectedLabelFormat,
      format: t.format,
      separator: t.separator,
      emptyLabel: d
    });
  }
  function h() {
    if (c)
      return;
    const f = e.value(), ce = u(), Te = typeof e.validate == "function" ? e.validate() : { valid: !0 }, Hi = qi(f), ct = Mn(f, {
      requiredLocationLevel: t.selectionRequiredLevel || t.requiredLocationLevel || Te.required_location_level
    }), lt = Nn(e), ut = Cn(f), dt = typeof e.isOpen == "function" ? e.isOpen() : !1;
    di(a, ce), a && (a.classList.toggle(o, ct), a.classList.toggle(l, Te.valid === !1), a.dataset.selected = ct ? "true" : "false", a.dataset.selectedLevel = Hi, a.dataset.valid = Te.valid === !1 ? "false" : "true", a.dataset.clearable = ut ? "true" : "false"), i.forEach((D) => {
      Et(D, lt), D.setAttribute("aria-expanded", dt ? "true" : "false"), D.classList.toggle(o, ct), D.classList.toggle(l, Te.valid === !1);
    }), r.forEach((D) => {
      Et(D, lt || !dt), D.setAttribute("aria-expanded", dt ? "true" : "false");
    }), n.forEach((D) => {
      Et(D, lt || !ut), D.classList.toggle(o, ut);
    });
  }
  function m(f) {
    if (c || !s)
      return;
    const ce = f || (typeof e.statusState == "function" ? e.statusState() : null) || {};
    di(s, ce.message || ""), s.hidden = !ce.message, s.dataset.statusLevel = ce.level || "idle", s.dataset.statusCode = ce.code || "";
  }
  function y(f) {
    c || (f.preventDefault(), e.open(), h());
  }
  function I(f) {
    c || (f.preventDefault(), e.close(), h());
  }
  function Y(f) {
    c || (f.preventDefault(), typeof e.clear == "function" && e.clear(!0), h(), m());
  }
  const X = () => h(), xt = (f) => m(f);
  return i.forEach((f) => f.addEventListener("click", y)), r.forEach((f) => f.addEventListener("click", I)), n.forEach((f) => f.addEventListener("click", Y)), typeof e.on == "function" && (e.on("change", X), e.on("busychange", X), e.on("dirtychange", X), e.on("openchange", X), e.on("statuschange", xt)), h(), m(), {
    picker: e,
    openButtons: i,
    closeButtons: r,
    clearButtons: n,
    summary: a,
    status: s,
    update() {
      return h(), m(), this;
    },
    destroy() {
      c || (c = !0, i.forEach((f) => f.removeEventListener("click", y)), r.forEach((f) => f.removeEventListener("click", I)), n.forEach((f) => f.removeEventListener("click", Y)), typeof e.off == "function" && (e.off("change", X), e.off("busychange", X), e.off("dirtychange", X), e.off("openchange", X), e.off("statuschange", xt)));
    }
  };
}
function et(t, e) {
  if (t == null)
    return {};
  if (typeof t != "object" || Array.isArray(t))
    throw new Error(`mountStaticLocationMapPickerField ${e} must be an object.`);
  return t;
}
function tt(t, e) {
  return Object.prototype.hasOwnProperty.call(t || {}, e);
}
function Bn(t) {
  return t && typeof t == "object" && (t.nodeType === 1 || typeof t.querySelector == "function");
}
function An(t, e = {}) {
  return typeof t == "string" || Bn(t) ? {
    ...e && typeof e == "object" && !Array.isArray(e) ? e : {},
    mount: t
  } : t || {};
}
function hi(t, e) {
  if (!t)
    return null;
  if (typeof t == "string") {
    const i = document.querySelector(t);
    if (!i)
      throw new Error(`mountStaticLocationMapPickerField ${e} was not found: ${t}`);
    return i;
  }
  return t;
}
function $n(t) {
  if (t.form === !1 || t.autoBindForm === !1)
    return null;
  if (t.form)
    return hi(t.form, "form");
  const e = hi(t.mount, "mount");
  return e && typeof e.closest == "function" ? e.closest("form") : null;
}
function Fn(t) {
  if (!t || typeof t != "object" || Array.isArray(t))
    throw new Error("mountStaticLocationMapPickerField requires an options object.");
  if (!tt(t, "mount"))
    throw new Error("mountStaticLocationMapPickerField requires mount.");
  if (!tt(t, "baseUrl"))
    throw new Error("mountStaticLocationMapPickerField requires baseUrl.");
  return t;
}
function qn(t) {
  return {
    ...et(t.pickerOptions, "pickerOptions"),
    mount: t.mount,
    baseUrl: t.baseUrl,
    providerOptions: et(t.providerOptions, "providerOptions")
  };
}
function Rn(t, e) {
  const i = $n(t);
  if (!i) {
    if (tt(t, "formBinding"))
      throw new Error("mountStaticLocationMapPickerField formBinding requires form or a mount inside a form.");
    return null;
  }
  return Ft({
    fieldPrefix: t.fieldPrefix,
    fieldNameStyle: t.fieldNameStyle,
    fieldNames: t.fieldNames,
    ...et(t.formBinding, "formBinding"),
    form: i,
    picker: e
  });
}
function zn(t, e) {
  return t.controls ? qt({
    ...et(t.controls, "controls"),
    picker: e
  }) : null;
}
async function xn(t, e) {
  return await t.picker.ready, tt(e, "initialValue") && await t.picker.setValue(e.initialValue || {}, !1, {
    resetDirty: e.resetDirtyOnInitialValue !== !1,
    trackDirty: e.trackDirtyOnInitialValue === !0
  }), e.openOnMount === !0 && t.open(), t;
}
function Ta(t = {}, e = {}) {
  const i = Fn(An(t, e)), r = Dr(qn(i)), n = Rn(i, r), a = zn(i, r);
  let s = !1;
  const o = {
    picker: r,
    binding: n,
    controls: a,
    ready: null,
    open() {
      return !s && typeof r.open == "function" && r.open(), o;
    },
    close() {
      return !s && typeof r.close == "function" && r.close(), o;
    },
    isOpen() {
      return !s && typeof r.isOpen == "function" ? r.isOpen() : !1;
    },
    updatePayload() {
      if (!n)
        throw new Error("mountStaticLocationMapPickerField updatePayload requires form binding.");
      return n.updatePayload();
    },
    resize() {
      return !s && typeof r.resize == "function" && r.resize(), o;
    },
    destroy() {
      s || (s = !0, a && typeof a.destroy == "function" && a.destroy(), n && typeof n.destroy == "function" && n.destroy(), r.destroy());
    }
  };
  return o.ready = xn(o, i), o;
}
function it(t, e) {
  if (t == null)
    return {};
  if (typeof t != "object" || Array.isArray(t))
    throw new Error(`mountApiLocationMapPickerField ${e} must be an object.`);
  return t;
}
function qe(t, e) {
  return Object.prototype.hasOwnProperty.call(t || {}, e);
}
function jn(t) {
  return t && typeof t == "object" && (t.nodeType === 1 || typeof t.querySelector == "function");
}
function Tn(t, e = {}) {
  return typeof t == "string" || jn(t) ? {
    ...e && typeof e == "object" && !Array.isArray(e) ? e : {},
    mount: t
  } : t || {};
}
function mi(t, e) {
  if (!t)
    return null;
  if (typeof t == "string") {
    const i = document.querySelector(t);
    if (!i)
      throw new Error(`mountApiLocationMapPickerField ${e} was not found: ${t}`);
    return i;
  }
  return t;
}
function Dn(t) {
  if (t.form === !1 || t.autoBindForm === !1)
    return null;
  if (t.form)
    return mi(t.form, "form");
  const e = mi(t.mount, "mount");
  return e && typeof e.closest == "function" ? e.closest("form") : null;
}
function Un(t) {
  if (!t || typeof t != "object" || Array.isArray(t))
    throw new Error("mountApiLocationMapPickerField requires an options object.");
  if (!qe(t, "mount"))
    throw new Error("mountApiLocationMapPickerField requires mount.");
  if (!qe(t, "apiUrl") && !qe(t, "baseUrl"))
    throw new Error("mountApiLocationMapPickerField requires apiUrl or baseUrl.");
  return t;
}
function Hn(t) {
  return {
    ...it(t.pickerOptions, "pickerOptions"),
    mount: t.mount,
    apiUrl: t.apiUrl || t.baseUrl,
    providerOptions: it(t.providerOptions, "providerOptions")
  };
}
function Vn(t, e) {
  const i = Dn(t);
  if (!i) {
    if (qe(t, "formBinding"))
      throw new Error("mountApiLocationMapPickerField formBinding requires form or a mount inside a form.");
    return null;
  }
  return Ft({
    fieldPrefix: t.fieldPrefix,
    fieldNameStyle: t.fieldNameStyle,
    fieldNames: t.fieldNames,
    ...it(t.formBinding, "formBinding"),
    form: i,
    picker: e
  });
}
function Gn(t, e) {
  return t.controls ? qt({
    ...it(t.controls, "controls"),
    picker: e
  }) : null;
}
async function Jn(t, e) {
  return await t.picker.ready, qe(e, "initialValue") && await t.picker.setValue(e.initialValue || {}, !1, {
    resetDirty: e.resetDirtyOnInitialValue !== !1,
    trackDirty: e.trackDirtyOnInitialValue === !0
  }), e.openOnMount === !0 && t.open(), t;
}
function Da(t = {}, e = {}) {
  const i = Un(Tn(t, e)), r = Vr(Hn(i)), n = Vn(i, r), a = Gn(i, r);
  let s = !1;
  const o = {
    picker: r,
    binding: n,
    controls: a,
    ready: null,
    open() {
      return !s && typeof r.open == "function" && r.open(), o;
    },
    close() {
      return !s && typeof r.close == "function" && r.close(), o;
    },
    isOpen() {
      return !s && typeof r.isOpen == "function" ? r.isOpen() : !1;
    },
    updatePayload() {
      if (!n)
        throw new Error("mountApiLocationMapPickerField updatePayload requires form binding.");
      return n.updatePayload();
    },
    resize() {
      return !s && typeof r.resize == "function" && r.resize(), o;
    },
    destroy() {
      s || (s = !0, a && typeof a.destroy == "function" && a.destroy(), n && typeof n.destroy == "function" && n.destroy(), r.destroy());
    }
  };
  return o.ready = Jn(o, i), o;
}
function pe(t, e) {
  if (t == null)
    return {};
  if (typeof t != "object" || Array.isArray(t))
    throw new Error(`mountLocationMapPickerField ${e} must be an object.`);
  return t;
}
function Rt(t, e) {
  return Object.prototype.hasOwnProperty.call(t || {}, e);
}
function Zn(t) {
  return t && typeof t == "object" && (t.nodeType === 1 || typeof t.querySelector == "function");
}
function Kn(t, e = {}) {
  return typeof t == "string" || Zn(t) ? {
    ...e && typeof e == "object" && !Array.isArray(e) ? e : {},
    mount: t
  } : t || {};
}
function pi(t, e) {
  if (!t)
    return null;
  if (typeof t == "string") {
    const i = document.querySelector(t);
    if (!i)
      throw new Error(`mountLocationMapPickerField ${e} was not found: ${t}`);
    return i;
  }
  return t;
}
function Wn(t) {
  if (t.form === !1 || t.autoBindForm === !1)
    return null;
  if (t.form)
    return pi(t.form, "form");
  const e = pi(t.mount, "mount");
  return e && typeof e.closest == "function" ? e.closest("form") : null;
}
function Yn(t) {
  if (!t || typeof t != "object" || Array.isArray(t))
    throw new Error("mountLocationMapPickerField requires an options object.");
  if (!Rt(t, "mount"))
    throw new Error("mountLocationMapPickerField requires mount.");
  return t;
}
function Xn(t) {
  return {
    ...pe(t.pickerOptions, "pickerOptions"),
    mount: t.mount,
    provider: t.provider || t.mode || t.providerMode || "static",
    baseUrl: t.baseUrl || t.dataBaseUrl,
    dataBaseUrl: t.dataBaseUrl,
    hierarchyBaseUrl: t.hierarchyBaseUrl,
    geometryBaseUrl: t.geometryBaseUrl,
    apiUrl: t.apiUrl,
    geometryApiUrl: t.geometryApiUrl,
    providerOptions: pe(t.providerOptions, "providerOptions"),
    staticProviderOptions: pe(t.staticProviderOptions, "staticProviderOptions"),
    apiProviderOptions: pe(t.apiProviderOptions, "apiProviderOptions")
  };
}
function Qn(t, e) {
  const i = Wn(t);
  if (!i) {
    if (Rt(t, "formBinding"))
      throw new Error("mountLocationMapPickerField formBinding requires form or a mount inside a form.");
    return null;
  }
  return Ft({
    fieldPrefix: t.fieldPrefix,
    fieldNameStyle: t.fieldNameStyle,
    fieldNames: t.fieldNames,
    ...pe(t.formBinding, "formBinding"),
    form: i,
    picker: e
  });
}
function ea(t, e) {
  return t.controls ? qt({
    ...pe(t.controls, "controls"),
    picker: e
  }) : null;
}
async function ta(t, e) {
  return await t.picker.ready, Rt(e, "initialValue") && await t.picker.setValue(e.initialValue || {}, !1, {
    resetDirty: e.resetDirtyOnInitialValue !== !1,
    trackDirty: e.trackDirtyOnInitialValue === !0
  }), e.openOnMount === !0 && t.open(), t;
}
function ia(t = {}, e = {}) {
  const i = Yn(Kn(t, e)), r = Yr(Xn(i)), n = Qn(i, r), a = ea(i, r);
  let s = !1;
  const o = {
    picker: r,
    binding: n,
    controls: a,
    ready: null,
    open() {
      return !s && typeof r.open == "function" && r.open(), o;
    },
    close() {
      return !s && typeof r.close == "function" && r.close(), o;
    },
    isOpen() {
      return !s && typeof r.isOpen == "function" ? r.isOpen() : !1;
    },
    updatePayload() {
      if (!n)
        throw new Error("mountLocationMapPickerField updatePayload requires form binding.");
      return n.updatePayload();
    },
    resize() {
      return !s && typeof r.resize == "function" && r.resize(), o;
    },
    destroy() {
      s || (s = !0, a && typeof a.destroy == "function" && a.destroy(), n && typeof n.destroy == "function" && n.destroy(), r.destroy());
    }
  };
  return o.ready = ta(o, i), o;
}
function ra(t, e) {
  if (!t)
    throw new Error(`${e} requires form.`);
  if (typeof t == "string") {
    const i = document.querySelector(t);
    if (!i)
      throw new Error(`${e} form was not found: ${t}`);
    return i;
  }
  if (!t.elements && typeof t.querySelector != "function")
    throw new Error(`${e} form must be an HTMLFormElement, selector, or form-like object with elements.`);
  return t;
}
function na(t) {
  return t == null ? "" : String(t).trim();
}
function Ri(t = {}) {
  return t && (Object.prototype.hasOwnProperty.call(t, "fieldNames") || Object.prototype.hasOwnProperty.call(t, "fieldPrefix") || Object.prototype.hasOwnProperty.call(t, "fieldNameStyle")) ? xe(t) : xe({ fieldNames: t || {} });
}
function g(t) {
  return t == null ? "" : String(t).trim();
}
function aa(t) {
  return typeof CSS < "u" && CSS.escape ? CSS.escape(t) : String(t).replace(/"/g, '\\"');
}
function sa(t) {
  if (!t)
    return null;
  if (typeof t.value < "u")
    return t;
  if (typeof t.length == "number") {
    for (let e = 0; e < t.length; e += 1)
      if (t[e] && typeof t[e].value < "u")
        return t[e];
  }
  return null;
}
function oa(t, e) {
  const i = na(e);
  return !i || !t ? null : t.elements && t.elements[i] ? sa(t.elements[i]) : typeof t.querySelector == "function" ? t.querySelector(`[name="${aa(i)}"]`) : null;
}
function Me(t, e) {
  const i = oa(t, e);
  return i && typeof i.value < "u" ? g(i.value) : "";
}
function ca(t, e) {
  const i = g(t);
  if (!i)
    return null;
  let r;
  try {
    r = JSON.parse(i);
  } catch {
    throw new Error(`Invalid JSON in ${e}.`);
  }
  if (!r || typeof r != "object" || Array.isArray(r))
    throw new Error(`${e} must contain a JSON object.`);
  return r;
}
function rt(t, e) {
  const i = g(t);
  if (!i)
    return null;
  const r = Number(i);
  if (!Number.isFinite(r))
    throw new Error(`${e} must be a valid number.`);
  return r;
}
function zi(t = {}) {
  const e = t && typeof t == "object" ? t : {};
  return {
    region_id: g(e.region_id),
    region_name: g(e.region_name),
    province_id: g(e.province_id),
    province_name: g(e.province_name),
    city_id: g(e.city_id),
    city_name: g(e.city_name),
    barangay_id: g(e.barangay_id),
    barangay_name: g(e.barangay_name),
    label: g(e.label),
    display_label: g(e.display_label),
    resolved: e.resolved === !0,
    resolved_source: g(e.resolved_source)
  };
}
function la(t = null) {
  if (!t || typeof t != "object")
    return null;
  const e = rt(t.lat, "pin.lat"), i = rt(t.lng, "pin.lng");
  if (e === null && i === null)
    return null;
  if (e === null || i === null)
    throw new Error("pin requires both lat and lng.");
  return { lat: e, lng: i };
}
function ua(t, e) {
  const i = ca(t.location_picker_value_json, e.location_picker_value_json);
  return i ? {
    location: zi(i.location || i),
    pin: la(i.pin || null)
  } : null;
}
function da(t, e) {
  const i = rt(t.pin_lat, e.pin_lat), r = rt(t.pin_lng, e.pin_lng);
  if (i === null && r !== null || i !== null && r === null)
    throw new Error(`${e.pin_lat} and ${e.pin_lng} must both be present or both be blank.`);
  return {
    location: zi({
      barangay_id: t.barangay_id
    }),
    pin: i === null ? null : { lat: i, lng: r }
  };
}
function ha(t, e = {}) {
  const i = ra(t, "readLocationMapPickerSubmitPayloadFromForm"), r = Ri(e);
  return {
    barangay_id: Me(i, r.barangay_id),
    pin_lat: Me(i, r.pin_lat),
    pin_lng: Me(i, r.pin_lng),
    location_picker_value_json: Me(i, r.location_picker_value_json),
    location_picker_validation_json: Me(i, r.location_picker_validation_json)
  };
}
function ma(t = {}, e = {}) {
  const i = Ri(e), r = {
    barangay_id: g(t.barangay_id),
    pin_lat: g(t.pin_lat),
    pin_lng: g(t.pin_lng),
    location_picker_value_json: g(t.location_picker_value_json),
    location_picker_validation_json: g(t.location_picker_validation_json)
  };
  return ua(r, i) || da(r, i);
}
function Ua(t, e = {}) {
  const i = ha(t, e);
  return ma(i, e);
}
function pa(t) {
  return t == null ? "" : String(t).trim();
}
function fa(t) {
  const e = pa(t).replace(/\/+$/, "");
  if (!e)
    throw new Error("createLocationMapPickerHostConfig requires baseUrl.");
  return e;
}
function xi(t, e) {
  if (t == null)
    return {};
  if (typeof t != "object" || Array.isArray(t))
    throw new Error(`createLocationMapPickerHostConfig ${e} must be an object.`);
  return t;
}
function Ie(t, e, i) {
  return {
    ...t,
    ...xi(e, i)
  };
}
function Ha(t = {}) {
  const e = xi(t, "options"), i = fa(e.baseUrl), r = xe({
    fieldPrefix: e.fieldPrefix,
    fieldNameStyle: e.fieldNameStyle,
    fieldNames: e.fieldNames
  }), n = Ie({
    selectedLabelFormat: "city_barangay",
    theme: "light",
    size: "comfortable",
    density: "normal"
  }, e.ui, "ui"), a = Ie({
    requiredLevel: "barangay"
  }, e.location, "location"), s = Ie({
    requiredLocationLevel: "barangay",
    requirePin: !0
  }, e.validation, "validation"), o = Ie({
    pinMode: "centered",
    showBoundary: !0,
    fitBoundaryOnSelection: !0,
    tileUrlTemplate: ""
  }, e.map, "map"), l = Ie({
    enabled: !0,
    failOnNoMatch: !1
  }, e.reverse, "reverse");
  return {
    baseUrl: i,
    fieldNames: r,
    pickerOptions: {
      ui: n,
      location: a,
      validation: s,
      map: o,
      reverse: l
    },
    formBinding: {
      fieldNames: r,
      preventInvalid: !0,
      writePayload: !0,
      focusOnBlocked: !0
    }
  };
}
const je = "[data-location-map-picker]", ie = "__philippinesLocationMapPickerController", ji = "data-location-map-picker-mounted", ya = /* @__PURE__ */ new Set([
  "provider",
  "mode",
  "providerMode",
  "baseUrl",
  "dataBaseUrl",
  "hierarchyBaseUrl",
  "geometryBaseUrl",
  "apiUrl",
  "geometryApiUrl",
  "fieldPrefix",
  "fieldNameStyle"
]), ga = Object.freeze({
  fieldNames: "fieldNames",
  providerOptions: "providerOptions",
  staticProviderOptions: "staticProviderOptions",
  apiProviderOptions: "apiProviderOptions",
  pickerOptions: "pickerOptions",
  formBinding: "formBinding",
  controls: "controls",
  initialValue: "initialValue"
}), ba = Object.freeze({
  displayMode: "displayMode",
  theme: "theme",
  size: "size",
  density: "density",
  selectedLabelFormat: "selectedLabelFormat",
  title: "title",
  subtitle: "subtitle",
  triggerLabel: "triggerLabel",
  triggerActionLabel: "triggerActionLabel",
  saveLabel: "saveLabel",
  cancelLabel: "cancelLabel",
  clearLabel: "clearLabel",
  searchPlaceholder: "searchPlaceholder"
}), _a = Object.freeze({
  requiredLevel: "requiredLevel"
}), va = Object.freeze({
  requiredLocationLevel: "requiredLocationLevel",
  requirePin: "requirePin"
}), wa = Object.freeze({
  pinMode: "pinMode",
  showBoundary: "showBoundary",
  fitBoundaryOnSelection: "fitBoundaryOnSelection",
  tileUrlTemplate: "tileUrlTemplate",
  mapHeight: "mapHeight",
  height: "height",
  mapMinHeight: "mapMinHeight",
  minHeight: "minHeight",
  mapMaxHeight: "mapMaxHeight",
  maxHeight: "maxHeight"
}), Pa = Object.freeze({
  reverseEnabled: "enabled",
  reverseFailOnNoMatch: "failOnNoMatch"
});
function fi() {
  return typeof document < "u" && document && typeof document.querySelectorAll == "function";
}
function st(t) {
  return t == null ? "" : String(t).trim();
}
function fe(t) {
  return st(t) !== "";
}
function ot(t) {
  return t && typeof t == "object" && t.nodeType === 1;
}
function zt(t) {
  return t && typeof t == "object" && typeof t.querySelectorAll == "function";
}
function Ti(t) {
  if (!t) {
    if (!fi())
      throw new Error("autoMountLocationMapPickers requires a root when document is unavailable.");
    return document;
  }
  if (typeof t == "string") {
    if (!fi())
      throw new Error("autoMountLocationMapPickers selector root requires document.");
    const e = document.querySelector(t);
    if (!e)
      throw new Error(`autoMountLocationMapPickers root was not found: ${t}`);
    return e;
  }
  if (zt(t))
    return t;
  throw new Error("autoMountLocationMapPickers root must be a selector, Element, Document, or DocumentFragment.");
}
function Di(t, e) {
  const i = st(e || je) || je, r = [];
  return ot(t) && typeof t.matches == "function" && t.matches(i) && r.push(t), typeof t.querySelectorAll == "function" && t.querySelectorAll(i).forEach((n) => r.push(n)), r;
}
function Nt(t) {
  const e = st(t).toLowerCase();
  return ["1", "true", "yes", "on"].includes(e) ? !0 : ["0", "false", "no", "off"].includes(e) ? !1 : null;
}
function Ui(t) {
  const e = st(t);
  if (e === "")
    return "";
  const i = Nt(e);
  return i !== null ? i : /^-?\d+(\.\d+)?$/.test(e) ? Number(e) : e;
}
function La(t, e) {
  const i = t.dataset[e];
  if (fe(i))
    try {
      const r = JSON.parse(i);
      if (r == null || typeof r != "object" || Array.isArray(r))
        throw new Error("JSON value must be an object.");
      return r;
    } catch (r) {
      const n = t.id ? `#${t.id}` : t.tagName.toLowerCase();
      throw new Error(`Invalid JSON in data-${e.replace(/[A-Z]/g, (a) => "-" + a.toLowerCase())} on ${n}: ${r.message}`);
    }
}
function Ne(t, e) {
  const i = {};
  return Object.entries(e).forEach(([r, n]) => {
    fe(t[r]) && (i[n] = Ui(t[r]));
  }), i;
}
function Ce(t, e, i) {
  Object.keys(i).length !== 0 && (t.pickerOptions = {
    ...t.pickerOptions || {},
    [e]: {
      ...t.pickerOptions && t.pickerOptions[e] || {},
      ...i
    }
  });
}
function Ea(t, e = {}) {
  const i = t.dataset || {}, r = { ...e };
  return ya.forEach((n) => {
    fe(i[n]) && (r[n] = Ui(i[n]));
  }), Object.entries(ga).forEach(([n, a]) => {
    const s = La(t, n);
    s !== void 0 && (r[a] = s);
  }), fe(i.form) && (r.form = i.form), fe(i.autoBindForm) && (r.autoBindForm = Nt(i.autoBindForm) !== !1), fe(i.openOnMount) && (r.openOnMount = Nt(i.openOnMount) === !0), Ce(r, "ui", Ne(i, ba)), Ce(r, "location", Ne(i, _a)), Ce(r, "validation", Ne(i, va)), Ce(r, "map", Ne(i, wa)), Ce(r, "reverse", Ne(i, Pa)), r;
}
function Sa(t, e = {}, i = {}) {
  if (!ot(t))
    throw new Error("autoMountLocationMapPickers can only mount on Element nodes.");
  const r = i.force === !0;
  if (!r && t[ie])
    return t[ie];
  r && t[ie] && typeof t[ie].destroy == "function" && t[ie].destroy();
  const n = Ea(t, e), a = ia(t, n);
  return t[ie] = a, t.setAttribute(ji, "true"), a;
}
function Va(t = void 0, e = {}) {
  let i = t, r = e || {};
  t && typeof t == "object" && !zt(t) && !ot(t) && (r = t, i = r.root);
  const n = Ti(i), a = r.selector || je, s = r.defaults && typeof r.defaults == "object" ? r.defaults : {}, o = r.continueOnError === !0, l = [], d = [];
  return Di(n, a).forEach((c) => {
    try {
      l.push(Sa(c, s, r));
    } catch (u) {
      if (!o)
        throw u;
      d.push({ element: c, error: u }), typeof r.onError == "function" && r.onError(u, c);
    }
  }), l.errors = d, l;
}
function Ga(t = void 0, e = {}) {
  let i = t, r = e || {};
  t && typeof t == "object" && !zt(t) && !ot(t) && (r = t, i = r.root);
  const n = Ti(i), a = r.selector || je, s = [];
  return Di(n, a).forEach((o) => {
    const l = o[ie];
    l && typeof l.destroy == "function" && (l.destroy(), s.push(l)), delete o[ie], o.removeAttribute(ji);
  }), s;
}
function Ja() {
  return je;
}
export {
  $t as ApiProvider,
  za as ArcGisBarangayGeometryProvider,
  Mi as CompositeLocationProvider,
  me as LOCATION_MAP_PICKER_PROVIDER_MODES,
  Ct as LocationMapPicker,
  Yi as LocationPicker,
  nr as MapPicker,
  Ba as PROVIDER_CONTRACT_VERSION,
  Ra as PsgcCloudProvider,
  $r as StaticGeometryProvider,
  Si as StaticJsonProvider,
  Va as autoMountLocationMapPickers,
  Re as barangayCodeCandidates,
  qt as bindLocationMapPickerFieldControls,
  Ft as bindLocationMapPickerForm,
  xa as blockInvalidLocationMapPickerSubmit,
  ye as boundsCenter,
  Xe as boundsContains,
  O as cityCodeCandidates,
  yi as cityFolderCandidates,
  K as cleanProviderNumber,
  _ as cleanProviderText,
  w as cleanPsgcCode,
  Vr as createApiLocationMapPicker,
  Yr as createLocationMapPicker,
  Ha as createLocationMapPickerHostConfig,
  Ua as createLocationMapPickerInitialValueFromForm,
  ma as createLocationMapPickerInitialValueFromSubmitPayload,
  fn as createLocationMapPickerPrefixedFieldNames,
  Kr as createLocationMapPickerProvider,
  tn as createLocationMapPickerSubmitPayload,
  rn as createLocationMapPickerSubmitPayloadFromValue,
  It as createLocationMapPickerSubmitResult,
  M as createProviderError,
  Fa as createProviderNoMatch,
  Dr as createStaticLocationMapPicker,
  Ii as createStaticLocationProvider,
  ja as defaultLocationMapPickerFieldNames,
  Ma as deriveBarangayCityId,
  z as deriveCityId,
  C as deriveProvinceId,
  R as deriveRegionId,
  Ga as destroyAutoMountedLocationMapPickers,
  vr as emptyProviderLocation,
  Sn as formatLocationMapPickerValueLabel,
  wr as formatProviderLocationLabel,
  Mn as hasLocationMapPickerSelection,
  Oa as isLegacyNineDigitPsgc,
  ka as isTenDigitPsgc,
  Ia as legacyCityPrefix,
  Ja as locationMapPickerAutoMountSelector,
  Da as mountApiLocationMapPickerField,
  ia as mountLocationMapPickerField,
  Ta as mountStaticLocationMapPickerField,
  oe as normalizeBounds,
  $a as normalizeBoundsValue,
  Ci as normalizeLocationMapPickerProviderMode,
  xe as normalizeLocationMapPickerSubmitFieldNames,
  T as normalizeLocationValue,
  Aa as normalizePinValue,
  Ae as normalizeProviderArray,
  He as normalizeProviderRow,
  ze as normalizeReverseMatch,
  Ye as parentCodeCandidates,
  Bt as pointInPolygon,
  se as provinceCodeCandidates,
  ha as readLocationMapPickerSubmitPayloadFromForm,
  W as regionCodeCandidates,
  qa as safeProviderCall,
  Vi as sameCity,
  Ca as sameProvince,
  Na as sameRegion,
  qi as selectedLocationMapPickerLevel,
  q as toTenDigitPsgcCode,
  ge as uniqueCodes,
  oi as writeLocationMapPickerSubmitPayloadToForm
};
