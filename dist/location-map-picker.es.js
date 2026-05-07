function w(t) {
  return String(t ?? "").replace(/[^0-9]/g, "");
}
function ir(t) {
  return w(t).length === 10;
}
function nr(t) {
  return w(t).length === 9;
}
function he(t) {
  return [...new Set(t.map(w).filter(Boolean))];
}
function z(t) {
  const e = w(t);
  return e.length >= 10 ? `${e.slice(0, 2)}00000000` : e.length >= 2 ? e.slice(0, 2) : "";
}
function Ze(t) {
  return t.length === 4 ? `${t.slice(0, 2)}0${t.slice(2, 4)}00000` : t.length === 5 ? `${t}00000` : "";
}
function Ue(t) {
  return t.length === 6 ? `${t.slice(0, 2)}0${t.slice(2, 4)}${t.slice(4, 6)}000` : t.length === 7 ? `${t}000` : "";
}
function yt(t) {
  return t.length === 9 ? `${t.slice(0, 2)}0${t.slice(2, 4)}${t.slice(4, 6)}${t.slice(6, 9)}` : "";
}
function R(t, e = "") {
  const i = w(t);
  return i.length === 10 ? i : e === "region" && i.length === 2 ? `${i}00000000` : e === "province" ? Ze(i) : e === "city" ? Ue(i) : e === "barangay" || i.length === 9 ? yt(i) : i.length === 7 || i.length === 6 ? Ue(i) : i.length === 5 || i.length === 4 ? Ze(i) : i.length === 2 ? `${i}00000000` : "";
}
function F(t) {
  const e = w(t), i = e.length === 10 ? e : R(e);
  return i.length === 10 ? `${i.slice(0, 5)}00000` : "";
}
function D(t) {
  const e = w(t), i = e.length === 10 ? e : R(e);
  return i.length === 10 ? `${i.slice(0, 7)}000` : "";
}
function rr(t) {
  return D(t);
}
function ar(t) {
  return w(t).slice(0, 6);
}
function K(t) {
  const e = w(t), i = [];
  return e ? (e.length === 10 && e.endsWith("00000000") ? (i.push(e), i.push(e.slice(0, 2))) : e.length === 2 ? (i.push(e), i.push(`${e}00000000`)) : e.length >= 2 && (i.push(e.slice(0, 2)), i.push(`${e.slice(0, 2)}00000000`)), he(i)) : [];
}
function ne(t) {
  const e = w(t), i = [], n = R(e, "province") || F(e);
  return e ? (i.push(e), n && (e.length === 10 && i.push(n), i.push(`${n.slice(0, 2)}${n.slice(3, 5)}`), i.push(n.slice(0, 5)), i.push(n)), he(i)) : [];
}
function I(t) {
  const e = w(t), i = [], n = R(e, "city") || D(e);
  return e ? (i.push(e), n && (e.length === 10 && i.push(n), i.push(`${n.slice(0, 2)}${n.slice(3, 5)}${n.slice(5, 7)}`), i.push(n.slice(0, 7)), i.push(n)), he(i)) : [];
}
function Se(t) {
  const e = w(t), i = [], n = R(e, "barangay");
  return e ? (i.push(e), n && (e.length === 10 && i.push(n), i.push(`${n.slice(0, 2)}${n.slice(3, 5)}${n.slice(5, 7)}${n.slice(7, 10)}`), i.push(n)), e.length === 10 && i.push(`${e.slice(0, 2)}${e.slice(3, 5)}${e.slice(5, 7)}${e.slice(7, 10)}`), he(i)) : [];
}
function xe(t, e) {
  return t === "region" ? K(e) : t === "province" ? ne(e) : t === "city" ? I(e) : t === "barangay" ? Se(e) : he([e]);
}
function zt(t) {
  const e = w(t), i = [], n = D(e);
  return e.length === 9 ? (i.push(e.slice(0, 6)), n && i.push(...I(n)), i.push(...I(e))) : e.length === 10 && !e.endsWith("000") && n && n !== e ? (i.push(...I(n)), i.push(...I(e))) : (i.push(...I(e)), n && n !== e && i.push(...I(n))), he(i);
}
function sr(t, e) {
  const i = K(t), n = K(e);
  return i.some((r) => n.includes(r));
}
function or(t, e) {
  const i = ne(t), n = ne(e);
  return i.some((r) => n.includes(r));
}
function ai(t, e) {
  const i = I(t), n = I(e);
  return i.some((r) => n.includes(r));
}
const S = (t) => String(t ?? "").trim(), ft = (t) => String(t || "").toLowerCase().replace(/\s+/g, " ").trim(), Ce = (t) => S(t.id || t.code), de = (t) => String(t.name || "").trim(), bt = ["region", "province", "city", "barangay"], se = { region: 1, province: 2, city: 3, barangay: 4 };
function P(t) {
  return String(t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function G(t, e) {
  t && (t.value = e == null ? "" : String(e));
}
function me(t, e, i) {
  const n = String(t || "").trim().toLowerCase();
  return e.includes(n) ? n : i;
}
function si(...t) {
  return t.flatMap((e) => String(e || "").split(/\s+/)).map((e) => e.trim()).filter(Boolean).join(" ");
}
function oi(t) {
  if (!t || t.disabled || t.hidden)
    return !1;
  const e = window.getComputedStyle(t);
  return e.display !== "none" && e.visibility !== "hidden";
}
function Ke(t) {
  return t ? Array.from(t.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(oi) : [];
}
function pe(t) {
  const e = Math.random().toString(36).slice(2, 10);
  return `${t}-${e}`;
}
function st(t, e) {
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
function ci(t, e) {
  if (!t || !document.body)
    return [];
  const i = [];
  let n = t, r = n.parentElement;
  for (; r && r !== document.body.parentElement && (Array.from(r.children).forEach((a) => {
    a === n || a.contains(t) || (st(a, e), i.push(a));
  }), r !== document.body); )
    n = r, r = r.parentElement;
  return i;
}
function li(t = {}) {
  const e = {
    region_id: S(t.region_id),
    region_name: String(t.region_name || "").trim(),
    province_id: S(t.province_id),
    province_name: String(t.province_name || "").trim(),
    city_id: S(t.city_id),
    city_name: String(t.city_name || "").trim(),
    barangay_id: S(t.barangay_id),
    barangay_name: String(t.barangay_name || "").trim()
  };
  return e.barangay_id && !e.city_id && (e.city_id = D(e.barangay_id)), e.city_id && !e.province_id && (e.province_id = F(e.city_id)), (e.province_id || e.city_id || e.barangay_id) && !e.region_id && (e.region_id = z(e.province_id || e.city_id || e.barangay_id)), e;
}
function ui(t = {}) {
  return !!(t.barangay_id && t.barangay_name && t.city_id && t.city_name);
}
class hi {
  constructor(e = {}) {
    if (!e.mount)
      throw new Error("LocationPicker requires a mount element.");
    if (!e.provider)
      throw new Error("LocationPicker requires a provider.");
    this.mount = e.mount, this.provider = e.provider, this.requiredLevel = me(e.requiredLevel, bt, "barangay"), this.validationMessages = {
      region: e.messageRequiredRegion || "Select a region.",
      province: e.messageRequiredProvince || "Select a province.",
      city: e.messageRequiredCity || "Select a city or municipality.",
      barangay: e.messageRequiredBarangay || "Select a barangay before saving."
    }, this.hiddenInputs = e.hiddenInputs || {}, this.summaryLabel = e.summaryLabel || "Address location", this.placeholder = e.placeholder || "Select City → Barangay", this.modalTitle = e.modalTitle || "Select address location", this.modalSubtitle = e.modalSubtitle || "Choose Region, Province if applicable, City/Municipality, then Barangay.", this.modalEyebrow = e.modalEyebrow || "Philippines address", this.actionLabel = e.actionLabel || "Select", this.saveLabel = e.saveLabel || "Save address", this.cancelLabel = e.cancelLabel || "Cancel", this.clearLabel = e.clearLabel || "Clear", this.searchPlaceholder = e.searchPlaceholder || "Search", this.triggerIcon = e.triggerIcon || "⌖", this.selectedLabelFormat = me(e.selectedLabelFormat, [
      "region_province_city_barangay",
      "province_city_barangay",
      "city_barangay",
      "barangay_only"
    ], "city_barangay"), this.theme = me(e.theme, ["light", "dark", "auto"], "light"), this.size = me(e.size, ["compact", "comfortable", "spacious"], "comfortable"), this.density = me(e.density, ["tight", "normal", "relaxed"], "normal"), this.className = e.className || "", this.modalClassName = e.modalClassName || "", this.disabled = e.disabled === !0, this.readOnly = e.readOnly === !0 || e.readonly === !0, this.busy = e.busy === !0, this.busyReason = "", this.previousFocusEl = null, this.modalInertElements = [], this.titleId = pe("plmp-location-title"), this.subtitleId = pe("plmp-location-subtitle"), this.listId = pe("plmp-location-list"), this.messageId = pe("plmp-location-message"), this.searchId = pe("plmp-location-search"), this.boundDocumentFocus = (i) => this.enforceModalFocus(i), this.boundDocumentKeydown = (i) => this.handleDocumentKeydown(i), this.handlers = {}, this.lists = { region: [], province: [], city: [], barangay: [] }, this.state = {
      region_id: S(e.defaultRegionId),
      region_name: "",
      province_id: S(e.defaultProvinceId),
      province_name: "",
      city_id: S(e.defaultCityId),
      city_name: "",
      barangay_id: S(e.defaultBarangayId),
      barangay_name: ""
    }, this.activeLevel = "region", this.searchTerm = "", this.renderShell(), this.bindEvents(), this.ready = this.initialize();
  }
  on(e, i) {
    return this.handlers[e] || (this.handlers[e] = []), this.handlers[e].push(i), this;
  }
  off(e, i) {
    return this.handlers[e] ? typeof i != "function" ? (this.handlers[e] = [], this) : (this.handlers[e] = this.handlers[e].filter((n) => n !== i), this) : this;
  }
  emit(e, i) {
    (this.handlers[e] || []).forEach((n) => n(i));
  }
  async initialize() {
    await this.loadRegions(), this.state.barangay_id && !this.state.city_id && (this.state.city_id = D(this.state.barangay_id)), this.state.city_id && !this.state.province_id && (this.state.province_id = F(this.state.city_id)), (this.state.province_id || this.state.city_id || this.state.barangay_id) && !this.state.region_id && (this.state.region_id = z(this.state.province_id || this.state.city_id || this.state.barangay_id)), this.state.region_id || this.state.province_id || this.state.city_id || this.state.barangay_id ? await this.setValue(this.state, !1) : (this.updateSummary(), this.updateHiddenInputs(), this.renderCurrentLevel());
  }
  renderShell() {
    this.root = document.createElement("div"), this.root.className = si(
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
    this.disabled || this.busy || this.modalEl.hidden && (this.previousFocusEl = document.activeElement instanceof HTMLElement ? document.activeElement : null, this.modalEl.hidden = !1, this.modalEl.classList.add("is-open"), this.openButtonEl && this.openButtonEl.setAttribute("aria-expanded", "true"), this.modalInertElements = ci(this.modalEl, !0), document.documentElement.classList.add("plmp-modal-open"), document.addEventListener("focusin", this.boundDocumentFocus, !0), document.addEventListener("keydown", this.boundDocumentKeydown, !0), this.setActiveLevel(this.firstIncompleteLevel()), setTimeout(() => {
      const e = Ke(this.modalEl);
      (this.searchEl || e[0] || this.dialogEl)?.focus();
    }, 0), this.emit("open", { open: !0 }), this.emit("openchange", { open: !0 }));
  }
  close() {
    !this.modalEl || this.modalEl.hidden || (this.modalEl.classList.remove("is-open"), this.modalEl.hidden = !0, this.searchTerm = "", this.searchEl.value = "", this.openButtonEl && this.openButtonEl.setAttribute("aria-expanded", "false"), this.modalInertElements.forEach((e) => st(e, !1)), this.modalInertElements = [], document.documentElement.classList.remove("plmp-modal-open"), document.removeEventListener("focusin", this.boundDocumentFocus, !0), document.removeEventListener("keydown", this.boundDocumentKeydown, !0), this.previousFocusEl && typeof this.previousFocusEl.focus == "function" && document.contains(this.previousFocusEl) && setTimeout(() => this.previousFocusEl.focus(), 0), this.emit("close", { open: !1 }), this.emit("openchange", { open: !1 }));
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
    (Ke(this.modalEl)[0] || this.dialogEl)?.focus();
  }
  trapModalFocus(e) {
    const i = Ke(this.modalEl);
    if (i.length === 0) {
      e.preventDefault();
      return;
    }
    const n = i[0], r = i[i.length - 1];
    if (e.shiftKey && document.activeElement === n) {
      e.preventDefault(), r.focus();
      return;
    }
    !e.shiftKey && document.activeElement === r && (e.preventDefault(), n.focus());
  }
  firstIncompleteLevel() {
    return this.state.region_id ? this.hasProvinceStep() && !this.state.province_id ? "province" : this.state.city_id ? "barangay" : "city" : "region";
  }
  async setActiveLevel(e) {
    bt.includes(e) && (e === "province" && !this.state.region_id && (e = "region"), e === "province" && this.state.region_id && this.lists.province.length === 0 && await this.loadProvinces(), e === "province" && this.state.region_id && this.lists.province.length === 0 && (e = "city"), e === "city" && !this.state.region_id && (e = "region"), e === "city" && this.hasProvinceStep() && !this.state.province_id && (e = "province"), e === "barangay" && !this.state.city_id && (e = this.firstIncompleteLevel()), this.activeLevel = e, this.searchTerm = "", this.searchEl.value = "", e === "region" && this.lists.region.length === 0 && await this.loadRegions(), e === "province" && this.lists.province.length === 0 && await this.loadProvinces(), e === "city" && this.lists.city.length === 0 && await this.loadCities(), e === "barangay" && this.lists.barangay.length === 0 && await this.loadBarangays(), this.renderCurrentLevel());
  }
  ensureSelectedRows() {
    const e = (i, n, r) => {
      const a = S(this.state[n]), s = String(this.state[r] || "").trim();
      if (!a || !s)
        return;
      const o = this.lists[i] || [];
      o.some((l) => Ce(l) === a) || (this.lists[i] = [...o, { id: a, code: a, name: s }].sort((l, h) => de(l).localeCompare(de(h))));
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
      const n = Ce(i), r = this.state[`${this.activeLevel}_id`] === n, a = this.disabled || this.readOnly;
      return `<button class="plmp__option ph-location-picker__option${r ? " is-selected" : ""}" type="button" role="option" aria-selected="${r ? "true" : "false"}" data-lp-option="${P(n)}"${a ? ' disabled aria-disabled="true"' : ""}>${P(de(i))}</button>`;
    }).join(""), this.listEl.querySelectorAll("[data-lp-option]").forEach((i) => {
      i.addEventListener("click", () => {
        const n = i.getAttribute("data-lp-option"), r = (this.lists[this.activeLevel] || []).find((a) => Ce(a) === n);
        r && this.selectRow(this.activeLevel, r).catch((a) => this.setMessage(a.message || "Location data could not be loaded.", "error"));
      });
    });
  }
  renderTabs() {
    this.root.querySelectorAll("[data-lp-level]").forEach((e) => {
      const i = e.getAttribute("data-lp-level"), n = this.hasProvinceStep(), r = this.disabled || i === "province" && !this.state.region_id || i === "province" && this.state.region_id && this.lists.province.length === 0 || i === "city" && (!this.state.region_id || n && !this.state.province_id) || i === "barangay" && !this.state.city_id;
      e.classList.toggle("is-active", i === this.activeLevel), e.setAttribute("aria-selected", i === this.activeLevel ? "true" : "false"), e.setAttribute("tabindex", i === this.activeLevel ? "0" : "-1"), e.setAttribute("aria-controls", this.listId), e.disabled = r;
    });
  }
  renderPath() {
    const e = [this.state.region_name, this.state.province_name, this.state.city_name, this.state.barangay_name].filter(Boolean);
    this.pathEl.textContent = e.length ? e.join(" → ") : "No location selected yet.";
  }
  filteredRows(e) {
    const i = ft(this.searchTerm);
    return i ? e.filter((n) => ft(de(n)).includes(i)) : e;
  }
  async selectRow(e, i) {
    if (this.busy || this.disabled || this.readOnly)
      return;
    const n = Ce(i), r = de(i);
    if (this.setMessage("", ""), e === "region") {
      Object.assign(this.state, {
        region_id: n,
        region_name: r,
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
        province_id: n,
        province_name: r,
        city_id: "",
        city_name: "",
        barangay_id: "",
        barangay_name: ""
      }), this.lists.city = [], this.lists.barangay = [], await this.loadCities(), await this.setActiveLevel("city");
      return;
    }
    if (e === "city") {
      Object.assign(this.state, {
        city_id: n,
        city_name: r,
        barangay_id: "",
        barangay_name: ""
      }), this.lists.barangay = [], await this.loadBarangays(), await this.setActiveLevel("barangay");
      return;
    }
    e === "barangay" && (Object.assign(this.state, { barangay_id: n, barangay_name: r }), this.updateHiddenInputs(), this.updateSummary(), this.renderCurrentLevel(), this.emit("change", this.currentLocation()));
  }
  async setValue(e = {}, i = !0, n = {}) {
    if (n.hydrate !== !1 && !e.resolved && !ui(e)) {
      const a = S(e.barangay_id || this.state.barangay_id), s = S(e.city_id || this.state.city_id || D(a)), o = S(e.province_id || this.state.province_id || F(s || a)), l = S(e.region_id || this.state.region_id || z(o || s || a));
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
      Object.assign(this.state, li(e));
    return await this.loadProvinces().catch(() => {
      this.lists.province = [];
    }), await this.loadCities().catch(() => {
      this.lists.city = [];
    }), await this.loadBarangays().catch(() => {
      this.lists.barangay = [];
    }), this.ensureSelectedRows(), this.updateHiddenInputs(), this.updateSummary(), this.renderCurrentLevel(), i && this.emit("change", this.currentLocation()), this.currentLocation();
  }
  validate() {
    const e = se[this.requiredLevel] || se.barangay, i = [], n = [];
    return e >= se.region && !this.state.region_id && (i.push("region"), n.push(this.validationMessages.region)), e === se.province && !this.state.province_id && (i.push("province"), n.push(this.validationMessages.province)), e >= se.city && !this.state.city_id && (i.push("city"), n.push(this.validationMessages.city)), e >= se.barangay && !this.state.barangay_id && (i.push("barangay"), n.push(this.validationMessages.barangay)), {
      valid: i.length === 0,
      required_location_level: this.requiredLevel,
      missing: i,
      messages: n,
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
    G(this.hiddenInputs.regionId, this.state.region_id), G(this.hiddenInputs.regionName, this.state.region_name), G(this.hiddenInputs.provinceId, this.state.province_id), G(this.hiddenInputs.provinceName, this.state.province_name), G(this.hiddenInputs.cityId, this.state.city_id), G(this.hiddenInputs.cityName, this.state.city_name), G(this.hiddenInputs.barangayId, this.state.barangay_id), G(this.hiddenInputs.barangayName, this.state.barangay_name), G(this.hiddenInputs.label, this.displayLabel());
  }
  currentLocation() {
    const e = this.displayLabel();
    return { ...this.state, label: e, display_label: e };
  }
  setMessage(e, i) {
    this.messageEl.textContent = e || "", this.messageEl.classList.toggle("is-error", i === "error");
  }
  destroy() {
    this.modalEl && !this.modalEl.hidden && this.close(), this.modalInertElements.forEach((e) => st(e, !1)), this.modalInertElements = [], document.removeEventListener("focusin", this.boundDocumentFocus, !0), document.removeEventListener("keydown", this.boundDocumentKeydown, !0), this.handlers = {}, this.mount.innerHTML = "", document.documentElement.classList.remove("plmp-modal-open");
  }
}
function re(t) {
  return t ? Array.isArray(t) && t.length >= 4 ? { south: Number(t[0]), west: Number(t[1]), north: Number(t[2]), east: Number(t[3]) } : typeof t == "object" ? { south: Number(t.south), west: Number(t.west), north: Number(t.north), east: Number(t.east) } : null : null;
}
function ue(t) {
  const e = re(t);
  return e ? { lat: (e.south + e.north) / 2, lng: (e.west + e.east) / 2 } : null;
}
function ze(t, e, i) {
  const n = re(t);
  return !!n && e >= n.south && e <= n.north && i >= n.west && i <= n.east;
}
const Z = 256, di = 40075.016686;
function te(t, e, i) {
  return Math.max(e, Math.min(i, t));
}
function Dt(t) {
  return t * Math.PI / 180;
}
function mi(t) {
  return t * 180 / Math.PI;
}
function X(t, e, i) {
  const n = Z * Math.pow(2, i), r = Math.sin(Dt(te(t, -85.05112878, 85.05112878)));
  return {
    x: (e + 180) / 360 * n,
    y: (0.5 - Math.log((1 + r) / (1 - r)) / (4 * Math.PI)) * n
  };
}
function We(t, e, i) {
  const n = Z * Math.pow(2, i), r = t / n * 360 - 180, a = Math.PI - 2 * Math.PI * e / n;
  return { lat: mi(Math.atan(Math.sinh(a))), lng: r };
}
function Ye(t) {
  return String(t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}
function Me(t, e, i) {
  const n = String(t || "").trim().toLowerCase();
  return e.includes(n) ? n : i;
}
function pi(...t) {
  return t.flatMap((e) => String(e || "").split(/\s+/)).map((e) => e.trim()).filter(Boolean).join(" ");
}
function gi(t, e) {
  const i = Number(t);
  return Number.isFinite(i) && i >= 0 ? Math.round(i) : e;
}
function yi(t, e) {
  if (t == null || t === "")
    return e;
  const i = Number(t);
  return Number.isFinite(i) ? Math.round(i) : e;
}
function jt(t, e) {
  const i = Number(t);
  return Number.isFinite(i) && i > 0 ? i : e;
}
function N(t, e = null) {
  if (t == null || t === "")
    return e;
  if (typeof t == "number")
    return Number.isFinite(t) && t >= 0 ? `${t}px` : e;
  const i = String(t).trim();
  return i && (i === "auto" || /^(?:\d+|\d*\.\d+)(?:px|rem|em|%|vh|vw|vmin|vmax|dvh|svh|lvh)$/i.test(i) || /^(?:calc|clamp|min|max)\([^;{}]+\)$/i.test(i)) ? i : e;
}
function _t(t, e = null) {
  if (t == null || t === "")
    return e;
  if (typeof t == "number")
    return Number.isFinite(t) && t > 0 ? String(t) : e;
  const i = String(t).trim();
  return i && (i === "auto" || /^(?:\d+|\d*\.\d+)(?:\s*\/\s*(?:\d+|\d*\.\d+))?$/.test(i)) ? i : e;
}
function fi(t, e, i, n, r) {
  const a = Math.max(Number(e) || 0, 320), s = jt(i, 800), o = Math.max(Math.cos(Dt(te(t, -85.05112878, 85.05112878))), 0.01);
  for (let l = r; l >= n; l--) {
    const h = Z * Math.pow(2, l);
    if (di * o / h * a >= s)
      return l;
  }
  return n;
}
function vt(t, e = {}) {
  return t === "barangay" ? Number.isFinite(e.selectedZoom) ? e.selectedZoom : 15 : t === "city" ? Number.isFinite(e.cityZoom) ? e.cityZoom : 12 : t === "province" ? Number.isFinite(e.provinceZoom) ? e.provinceZoom : 9 : Number.isFinite(e.regionZoom) ? e.regionZoom : 7;
}
class bi {
  constructor(e = {}) {
    if (!e.mount)
      throw new Error("MapPicker requires a mount element.");
    this.mount = e.mount, this.provider = e.provider || null, this.tileUrlTemplate = e.tileUrlTemplate == null ? "" : String(e.tileUrlTemplate).trim(), this.tileAttribution = e.tileAttribution == null ? "" : String(e.tileAttribution).trim(), this.minZoom = Number.isFinite(e.minZoom) ? e.minZoom : 5, this.maxZoom = Number.isFinite(e.maxZoom) ? e.maxZoom : 19, this.zoom = Number.isFinite(e.defaultZoom) ? e.defaultZoom : 11, this.center = e.defaultCenter || { lat: 14.17, lng: 122.83 }, this.pin = e.defaultPin || null, this.polygon = null, this.handlers = {}, this.theme = Me(e.theme, ["light", "dark", "auto"], "light"), this.size = Me(e.size, ["compact", "comfortable", "spacious"], "comfortable"), this.density = Me(e.density, ["tight", "normal", "relaxed"], "normal"), this.className = e.className || "", this.disabled = e.disabled === !0, this.readOnly = e.readOnly === !0 || e.readonly === !0, this.busy = e.busy === !0, this.busyReason = "", this.statusText = e.statusText || "Click the map to place the pin.", this.showStatus = e.showStatus !== !1, this.clickToPlacePin = e.clickToPlacePin !== !1, this.pinDraggable = e.pinDraggable !== !1, this.mouseWheelZoomCentered = e.mouseWheelZoomCentered !== !1, this.showBoundary = e.showBoundary !== !1, this.fitBoundaryOnSelection = e.fitBoundaryOnSelection !== !1, this.boundaryPadding = gi(e.boundaryPadding, 24), this.selectedZoom = Number.isFinite(Number(e.selectedZoom)) ? Number(e.selectedZoom) : 15, this.cityZoom = Number.isFinite(Number(e.cityZoom)) ? Number(e.cityZoom) : 12, this.provinceZoom = Number.isFinite(Number(e.provinceZoom)) ? Number(e.provinceZoom) : 9, this.regionZoom = Number.isFinite(Number(e.regionZoom)) ? Number(e.regionZoom) : 7, this.centerOnPin = e.centerOnPin !== !1, this.pinMode = Me(e.pinMode, ["centered", "free"], e.lockPinToCenter === !1 ? "free" : "centered"), this.firstPinVisibleWidthKm = jt(e.firstPinVisibleWidthKm, 800), this.firstPinZoom = yi(e.firstPinZoom, null), this.zoomOnFirstPin = e.zoomOnFirstPin !== !1, this.mapHeight = N(e.mapHeight ?? e.height, null), this.mapMinHeight = N(e.mapMinHeight ?? e.minHeight, null), this.mapMaxHeight = N(e.mapMaxHeight ?? e.maxHeight, null), this.mapWidth = N(e.mapWidth ?? e.width, null), this.mapMinWidth = N(e.mapMinWidth ?? e.minWidth, null), this.mapMaxWidth = N(e.mapMaxWidth ?? e.maxWidth, null), this.mapAspectRatio = _t(e.mapAspectRatio ?? e.aspectRatio, null), this.isDragging = !1, this.isPinDragging = !1, this.dragStart = null, this.isClickSuppressed = !1, this.resizeObserver = null, this.windowResizeHandler = null, this.resizeRenderFrame = null, this.renderShell(), this.bindEvents(), this.observeResize(), this.render();
  }
  on(e, i) {
    return this.handlers[e] || (this.handlers[e] = []), this.handlers[e].push(i), this;
  }
  off(e, i) {
    return this.handlers[e] ? typeof i != "function" ? (this.handlers[e] = [], this) : (this.handlers[e] = this.handlers[e].filter((n) => n !== i), this) : this;
  }
  emit(e, i) {
    (this.handlers[e] || []).forEach((n) => n(i));
  }
  hasCenteredPin() {
    return this.pinMode === "centered" && !!this.pin;
  }
  syncCenteredPin(e = !1) {
    this.hasCenteredPin() && (this.pin = { ...this.center }, this.statusEl.textContent = `Pin: ${this.pin.lat.toFixed(6)}, ${this.pin.lng.toFixed(6)}`, e && this.emit("pinchange", this.pin));
  }
  renderShell() {
    this.root = document.createElement("div"), this.root.className = pi(
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
        <div class="plmp__map-attribution ph-map-picker__attribution" data-map-attribution${this.tileAttribution ? "" : " hidden"}>${Ye(this.tileAttribution)}</div>
      </div>
      <div class="plmp__map-status ph-map-picker__status" data-map-status${this.showStatus ? "" : " hidden"}>${Ye(this.statusText)}</div>
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
    return Object.entries(e).forEach(([i, n]) => {
      n == null || n === "" ? this.root.style.removeProperty(i) : this.root.style.setProperty(i, n);
    }), this;
  }
  setSize(e = {}) {
    return (Object.prototype.hasOwnProperty.call(e, "mapHeight") || Object.prototype.hasOwnProperty.call(e, "height")) && (this.mapHeight = N(e.mapHeight ?? e.height, null)), (Object.prototype.hasOwnProperty.call(e, "mapMinHeight") || Object.prototype.hasOwnProperty.call(e, "minHeight")) && (this.mapMinHeight = N(e.mapMinHeight ?? e.minHeight, null)), (Object.prototype.hasOwnProperty.call(e, "mapMaxHeight") || Object.prototype.hasOwnProperty.call(e, "maxHeight")) && (this.mapMaxHeight = N(e.mapMaxHeight ?? e.maxHeight, null)), (Object.prototype.hasOwnProperty.call(e, "mapWidth") || Object.prototype.hasOwnProperty.call(e, "width")) && (this.mapWidth = N(e.mapWidth ?? e.width, null)), (Object.prototype.hasOwnProperty.call(e, "mapMinWidth") || Object.prototype.hasOwnProperty.call(e, "minWidth")) && (this.mapMinWidth = N(e.mapMinWidth ?? e.minWidth, null)), (Object.prototype.hasOwnProperty.call(e, "mapMaxWidth") || Object.prototype.hasOwnProperty.call(e, "maxWidth")) && (this.mapMaxWidth = N(e.mapMaxWidth ?? e.maxWidth, null)), (Object.prototype.hasOwnProperty.call(e, "mapAspectRatio") || Object.prototype.hasOwnProperty.call(e, "aspectRatio")) && (this.mapAspectRatio = _t(e.mapAspectRatio ?? e.aspectRatio, null)), this.applySizeStyles(), this.resize(), this;
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
      const i = te(this.zoom + (e.deltaY < 0 ? 1 : -1), this.minZoom, this.maxZoom);
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
      const n = this.canvasEl.getBoundingClientRect(), r = e.clientX - n.left, a = e.clientY - n.top, s = this.pointFromEvent(e), o = X(s.lat, s.lng, i);
      this.zoom = i, this.center = We(
        o.x - r + n.width / 2,
        o.y - a + n.height / 2,
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
        centerPixel: X(this.center.lat, this.center.lng, this.zoom)
      }, this.canvasEl.setPointerCapture(e.pointerId));
    }), this.canvasEl.addEventListener("pointermove", (e) => {
      if (!this.isDragging || !this.dragStart)
        return;
      const i = e.clientX - this.dragStart.x, n = e.clientY - this.dragStart.y;
      (Math.abs(i) > 3 || Math.abs(n) > 3) && (this.isClickSuppressed = !0), this.center = We(
        this.dragStart.centerPixel.x - i,
        this.dragStart.centerPixel.y - n,
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
    const i = te(this.zoom + e, this.minZoom, this.maxZoom);
    i !== this.zoom && (this.zoom = i, !this.pin && this.statusEl && (this.statusEl.textContent = `Zoom: ${this.zoom}. ${this.statusText}`), this.render(), window.setTimeout(() => {
      this.isClickSuppressed = !1;
    }, 0));
  }
  pointFromEvent(e) {
    const i = this.canvasEl.getBoundingClientRect(), n = X(this.center.lat, this.center.lng, this.zoom);
    return We(
      n.x - i.width / 2 + (e.clientX - i.left),
      n.y - i.height / 2 + (e.clientY - i.top),
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
    const n = e.barangay_id ? "barangay" : e.city_id ? "city" : e.province_id ? "province" : e.region_id ? "region" : null, r = e.barangay_id || e.city_id || e.province_id || e.region_id;
    if (!n || !r)
      return this.polygon = null, this.render(), i;
    i.level = n, i.id = r;
    const a = await this.provider.getBounds(n, r).catch(() => null);
    if (a)
      if (i.bounds = a, this.fitBoundaryOnSelection)
        this.fitBounds(a);
      else {
        const s = re(a);
        s && (this.center = ue(s)), this.zoom = vt(n, this);
      }
    else {
      const s = await this.provider.getCentroid(n, r).catch(() => null);
      s && (i.centroid = s, this.center = s, this.zoom = vt(n, this));
    }
    if (this.showBoundary) {
      const s = await this.provider.getPolygon(n, r).catch(() => null);
      this.polygon = Array.isArray(s) && s.length >= 3 ? s : null, i.polygon = this.polygon;
    } else
      this.polygon = null;
    return this.render(), i;
  }
  fitBounds(e) {
    const i = re(e);
    if (!i)
      return;
    this.center = ue(i);
    const n = this.canvasEl.getBoundingClientRect(), r = Math.max(n.width, 320), a = Math.max(n.height, 240), s = Math.max(120, r - this.boundaryPadding * 2), o = Math.max(120, a - this.boundaryPadding * 2);
    for (let l = this.maxZoom; l >= this.minZoom; l--) {
      const h = X(i.north, i.west, l), c = X(i.south, i.east, l);
      if (Math.abs(c.x - h.x) <= s && Math.abs(c.y - h.y) <= o) {
        this.zoom = l;
        return;
      }
    }
    this.zoom = this.minZoom;
  }
  firstPinTargetZoom(e) {
    if (Number.isFinite(this.firstPinZoom))
      return te(this.firstPinZoom, this.minZoom, this.maxZoom);
    const i = this.canvasEl.getBoundingClientRect();
    return fi(
      Number(e && e.lat),
      Math.max(i.width, this.canvasEl.clientWidth, 320),
      this.firstPinVisibleWidthKm,
      this.minZoom,
      this.maxZoom
    );
  }
  setCenter(e, i = this.zoom, n = "") {
    const r = Number(e && e.lat), a = Number(e && e.lng);
    if (!Number.isFinite(r) || !Number.isFinite(a))
      return;
    const s = Number.isFinite(Number(i)) ? Number(i) : this.zoom;
    this.center = { lat: r, lng: a }, this.zoom = te(s, this.minZoom, this.maxZoom), this.syncCenteredPin(!1), n && (this.statusEl.textContent = n), this.render();
  }
  setPin(e, i = !0, n = {}) {
    if (!this.canMutatePin() && n.force !== !0)
      return;
    const r = {
      lat: Number(e.lat),
      lng: Number(e.lng)
    };
    if (!Number.isFinite(r.lat) || !Number.isFinite(r.lng))
      return;
    const a = !!this.pin;
    this.pin = r, (this.pinMode === "centered" || this.centerOnPin || n.centerOnPin === !0) && (this.center = { ...r }), !a && this.zoomOnFirstPin && (this.zoom = this.firstPinTargetZoom(r)), this.statusEl.textContent = `Pin: ${this.pin.lat.toFixed(6)}, ${this.pin.lng.toFixed(6)}`, this.render(), i && this.emit("pinchange", this.pin);
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
    const e = te(Math.round(24 * Math.pow(1.28, this.zoom - this.minZoom)), 24, 192);
    this.canvasEl.style.setProperty("--plmp-map-grid-size", `${e}px`), this.canvasEl.dataset.zoom = String(this.zoom), this.canvasEl.dataset.tileMode = this.tileUrlTemplate ? "tiles" : "offline-grid";
  }
  renderTiles() {
    if (!this.tileUrlTemplate) {
      this.tilesEl.innerHTML = "";
      return;
    }
    const e = this.canvasEl.getBoundingClientRect(), i = Math.max(e.width, this.canvasEl.clientWidth, 320), n = Math.max(e.height, this.canvasEl.clientHeight, 240), r = X(this.center.lat, this.center.lng, this.zoom), a = Math.floor((r.x - i / 2) / Z), s = Math.floor((r.x + i / 2) / Z), o = Math.floor((r.y - n / 2) / Z), l = Math.floor((r.y + n / 2) / Z), h = Math.pow(2, this.zoom), c = [];
    for (let u = a; u <= s; u++)
      for (let d = o; d <= l; d++) {
        if (d < 0 || d >= h)
          continue;
        const m = (u % h + h) % h, y = Math.round(u * Z - r.x + i / 2), M = Math.round(d * Z - r.y + n / 2), W = this.tileUrlTemplate.split("{z}").join(String(this.zoom)).split("{x}").join(String(m)).split("{y}").join(String(d));
        c.push(`<img class="plmp__map-tile ph-map-picker__tile" src="${Ye(W)}" alt="" draggable="false" loading="lazy" decoding="async" style="left:${y}px;top:${M}px;">`);
      }
    this.tilesEl.innerHTML = c.join("");
  }
  projectToScreen(e, i) {
    const n = this.canvasEl.getBoundingClientRect(), r = X(this.center.lat, this.center.lng, this.zoom), a = X(e, i, this.zoom);
    return {
      x: a.x - r.x + n.width / 2,
      y: a.y - r.y + n.height / 2
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
    const i = this.polygon.map((n) => this.projectToScreen(n.lat, n.lng)).map((n) => `${n.x.toFixed(2)},${n.y.toFixed(2)}`).join(" ");
    this.overlayEl.innerHTML = `<polygon class="plmp__map-polygon ph-map-picker__polygon" points="${i}"></polygon>`;
  }
  destroy() {
    this.resizeRenderFrame !== null && typeof cancelAnimationFrame == "function" && (cancelAnimationFrame(this.resizeRenderFrame), this.resizeRenderFrame = null), this.resizeObserver && (this.resizeObserver.disconnect(), this.resizeObserver = null), this.windowResizeHandler && typeof window < "u" && typeof window.removeEventListener == "function" && (window.removeEventListener("resize", this.windowResizeHandler), this.windowResizeHandler = null), this.handlers = {}, this.mount.innerHTML = "", this.isDragging = !1, this.isPinDragging = !1, this.dragStart = null;
  }
}
const wt = {
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
function _i(t) {
  return t ? typeof t == "string" ? document.querySelector(t) : t : null;
}
function p(t, e) {
  const i = _i(t);
  if (!i)
    return;
  const n = e == null ? "" : String(e);
  i.value !== n && (i.value = n);
}
function T(t) {
  return JSON.stringify(t);
}
function Tt(t) {
  return JSON.parse(JSON.stringify(t));
}
function Pt() {
  return {
    location: !1,
    pin: !1,
    reverse: !1,
    geoIp: !1,
    browserLocation: !1,
    clear: !1
  };
}
function Lt(t) {
  const e = {
    location: H(t.location || {}),
    pin: ot(t.pin),
    geometry: Vt(t.geometry || {})
  };
  return JSON.stringify(e);
}
function vi() {
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
  const e = vi();
  return Object.keys(e).forEach((i) => {
    e[i] = t[i] == null ? "" : String(t[i]);
  }), e.label || (e.label = [e.city_name, e.barangay_name].filter(Boolean).join(" → ")), e.display_label || (e.display_label = e.label), e;
}
function ot(t) {
  if (!t)
    return null;
  const e = A(t.lat), i = A(t.lng);
  return e === null || i === null ? null : { lat: e, lng: i };
}
function Ht(t) {
  return t ? {
    match_quality: t.match_quality == null ? "" : String(t.match_quality),
    match_distance_km: Number.isFinite(Number(t.match_distance_km)) ? Number(t.match_distance_km) : 0,
    barangay_id: t.barangay_id == null ? "" : String(t.barangay_id),
    barangay_name: t.barangay_name == null ? "" : String(t.barangay_name),
    city_id: t.city_id == null ? "" : String(t.city_id),
    city_name: t.city_name == null ? "" : String(t.city_name)
  } : null;
}
function Vt(t = {}) {
  return {
    focus_result: t.focus_result || null,
    reverse_match: Ht(t.reverse_match),
    reverse_error: t.reverse_error == null ? null : String(t.reverse_error)
  };
}
function Et(t = "idle", e = "", i = "") {
  const r = x(t, ["idle", "info", "success", "warning", "error"], "info"), a = e == null ? "" : String(e);
  return {
    level: a ? r : "idle",
    code: i == null ? "" : String(i),
    message: a
  };
}
function wi(t = {}) {
  return {
    enabled: t.enabled === !0,
    maxEvents: Number.isFinite(Number(t.maxEvents)) ? Math.max(1, Number(t.maxEvents)) : 100,
    includeValue: t.includeValue === !0,
    echoToConsole: t.echoToConsole === !0
  };
}
function Pi(t, e = {}) {
  const i = t instanceof Error ? t : null, n = String(e.message || i && i.message || t || "Location picker error."), r = A(e.status ?? (i && i.status));
  return {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    code: String(e.code || i && i.code || "location_picker_error"),
    message: n,
    source: String(e.source || i && i.source || "location-map-picker"),
    operation: String(e.operation || i && i.operation || ""),
    recoverable: e.recoverable !== !1,
    provider: String(e.provider || i && i.provider || ""),
    method: String(e.method || i && i.method || ""),
    status: r === null ? null : r,
    path: String(e.path || i && i.path || ""),
    reason: String(e.reason || i && i.reason || ""),
    provider_error: !!(i && i.provider_error),
    raw_message: i && i.message ? String(i.message) : n
  };
}
function kt(t) {
  if (t == null)
    return t;
  try {
    return Tt(t);
  } catch {
    return String(t);
  }
}
function A(t) {
  const e = Number(t);
  return Number.isFinite(e) ? e : null;
}
function x(t, e, i) {
  const n = String(t || "").trim().toLowerCase();
  return e.includes(n) ? n : i;
}
function Li(...t) {
  return t.flatMap((e) => String(e || "").split(/\s+/)).map((e) => e.trim()).filter(Boolean).join(" ");
}
const Gt = {
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
  reverseNoMatch: "No cached barangay boundary matched that pin. The saved address was not changed. Move the pin inside cached geometry or expand the static geometry cache.",
  reverseMatch: "Reverse-fill matched using {match_quality}.",
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
function Ei(t = {}) {
  return {
    ...Gt,
    ...t || {}
  };
}
function Jt(t, e = {}) {
  return String(t || "").replace(/\{([a-zA-Z0-9_]+)\}/g, (i, n) => {
    if (!Object.prototype.hasOwnProperty.call(e, n))
      return i;
    const r = e[n];
    return r == null ? "" : String(r);
  });
}
function ki(t = {}) {
  return {
    displayMode: x(t.displayMode, ["embedded", "modal"], "embedded"),
    theme: x(t.theme, ["light", "dark", "auto"], "light"),
    size: x(t.size, ["compact", "comfortable", "spacious"], "comfortable"),
    density: x(t.density, ["tight", "normal", "relaxed"], "normal"),
    selectedLabelFormat: x(t.selectedLabelFormat, [
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
function Si(t = {}) {
  return {
    enabled: t.enabled !== !1,
    failOnNoMatch: t.failOnNoMatch === !0
  };
}
function Ii(t = {}, e = "barangay") {
  return {
    requiredLocationLevel: x(t.requiredLocationLevel || e, ["region", "province", "city", "barangay"], "barangay"),
    requirePin: t.requirePin === !0,
    messageRequiredRegion: t.messageRequiredRegion || "Select a region.",
    messageRequiredProvince: t.messageRequiredProvince || "Select a province.",
    messageRequiredCity: t.messageRequiredCity || "Select a city or municipality.",
    messageRequiredBarangay: t.messageRequiredBarangay || "Select a barangay.",
    messageRequiredPin: t.messageRequiredPin || "Place a pin on the map."
  };
}
function Ci(t = {}) {
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
      maxLevel: x(e.maxLevel, ["country", "region", "province", "city", "barangay"], "province"),
      allowCity: e.allowCity === !0,
      allowBarangay: e.allowBarangay === !0,
      reverseGeocode: e.reverseGeocode === !0
    },
    confidence: {
      requireCountry: i.requireCountry == null ? "PH" : String(i.requireCountry || "").trim().toUpperCase(),
      minimumAccuracyLevel: x(i.minimumAccuracyLevel, ["country", "region", "province", "city", "unknown"], "province")
    }
  };
}
function Mi(t = {}) {
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
      maxLevel: x(e.maxLevel, ["country", "region", "province", "city", "barangay"], "barangay"),
      reverseGeocode: e.reverseGeocode !== !1
    }
  };
}
function Oi(t = {}) {
  const e = A(t.lat ?? t.latitude), i = A(t.lng ?? t.longitude);
  return {
    country_code: String(t.country_code || t.countryCode || "").trim().toUpperCase(),
    region_name: String(t.region_name || t.regionName || "").trim(),
    province_name: String(t.province_name || t.provinceName || "").trim(),
    city_name: String(t.city_name || t.cityName || "").trim(),
    barangay_name: String(t.barangay_name || t.barangayName || "").trim(),
    lat: e,
    lng: i,
    accuracy_level: x(t.accuracy_level || t.accuracyLevel, ["country", "region", "province", "city", "unknown"], "unknown"),
    raw: t
  };
}
function Ni(t = {}) {
  const e = t.coords || {}, i = A(e.latitude), n = A(e.longitude);
  return {
    lat: i,
    lng: n,
    accuracy_meters: A(e.accuracy),
    altitude: A(e.altitude),
    altitude_accuracy_meters: A(e.altitudeAccuracy),
    heading: A(e.heading),
    speed_meters_per_second: A(e.speed),
    timestamp: Number.isFinite(Number(t.timestamp)) ? Number(t.timestamp) : Date.now(),
    raw: t
  };
}
function Bi(t, e = Gt) {
  const i = (n, r) => Jt(e[n] || r || n);
  return !t || typeof t.code != "number" ? t && t.message ? t.message : i("browserLocationFailed") : t.code === 1 ? i("browserLocationPermissionDenied") : t.code === 2 ? i("browserLocationUnavailablePosition") : t.code === 3 ? i("browserLocationTimeout") : t.message || i("browserLocationFailed");
}
function St(t) {
  return {
    unknown: 0,
    country: 1,
    region: 2,
    province: 3,
    city: 4
  }[t] || 0;
}
function ct(t) {
  return {
    country: 0,
    region: 1,
    province: 2,
    city: 3,
    barangay: 4
  }[t] ?? 2;
}
function It(t) {
  return String(t || "").toLowerCase().replace(/\([^)]*\)/g, " ").replace(/[^a-z0-9]+/g, " ").replace(/\b(region|province|city|municipality|of|the)\b/g, " ").replace(/\s+/g, " ").trim();
}
function ge(t) {
  return String(t && (t.id || t.code) || "").trim();
}
function Pe(t) {
  return String(t && t.name || "").trim();
}
function ye(t, ...e) {
  const i = e.map(It).filter(Boolean);
  return i.length === 0 ? null : (t || []).find((n) => {
    const r = It(Pe(n));
    return i.some((a) => r === a || r.includes(a) || a.includes(r));
  }) || null;
}
function fe(t = {}, e = "province") {
  const i = ct(e), n = H(t);
  i < 4 && (n.barangay_id = "", n.barangay_name = ""), i < 3 && (n.city_id = "", n.city_name = ""), i < 2 && (n.province_id = "", n.province_name = ""), i < 1 && (n.region_id = "", n.region_name = "");
  const r = [n.city_name, n.barangay_name].filter(Boolean);
  return i <= 2 && (r.length = 0, r.push(...[n.province_name, n.region_name].filter(Boolean))), n.label = r.join(" → "), n.display_label = n.label, n;
}
class $i {
  constructor(e = {}) {
    if (!e.mount)
      throw new Error("LocationMapPicker requires a mount element.");
    if (!e.provider)
      throw new Error("LocationMapPicker requires a provider.");
    this.mount = e.mount, this.provider = e.provider, this.ui = ki(e.ui || {}), this.messages = Ei(e.messages || {}), this.debugOptions = wi(e.debug || {}), this.hiddenInputs = e.hiddenInputs || {}, this.mapOptions = e.map || {}, this.locationOptions = e.location || {}, this.reverseOptions = Si(e.reverse || {}), this.geoIpOptions = Ci(e.geoIp || {}), this.browserLocationOptions = Mi(e.browserLocation || {}), this.validationOptions = Ii(e.validation || {}, this.locationOptions.requiredLevel), this.initialValue = e.initialValue || e.value || null, this.mapEnabled = this.mapOptions.enabled !== !1, this.disabled = e.disabled === !0, this.readOnly = e.readOnly === !0 || e.readonly === !0, this.busy = !1, this.busyReason = "", this.dirty = !1, this.touched = Pt(), this.dirtyBaselineValue = null, this.dirtyBaselineKey = "", this.optionHandlers = e, this.handlers = {}, this.location = H(), this.pin = null, this.geometry = {
      focus_result: null,
      reverse_match: null,
      reverse_error: null
    }, this.status = Et(), this.lastError = null, this.debugEvents = [], this.renderShell(), this.createChildren(), this.bindChildren(), this.ready = this.locationPicker.ready.then(async () => {
      this.initialValue ? await this.setValue(this.initialValue, !1, { resetDirty: !0 }) : this.resetDirty(!1), this.geoIpOptions.enabled && this.geoIpOptions.runOnInit && await this.resolveGeoIpHint(!0), this.browserLocationOptions.enabled && this.browserLocationOptions.runOnInit && await this.resolveBrowserLocationHint(!0);
    });
  }
  on(e, i) {
    return this.handlers[e] || (this.handlers[e] = []), this.handlers[e].push(i), this;
  }
  off(e, i) {
    return this.handlers[e] ? typeof i != "function" ? (this.handlers[e] = [], this) : (this.handlers[e] = this.handlers[e].filter((n) => n !== i), this) : this;
  }
  emit(e, i) {
    e !== "debug" && this.recordDebugEvent(e, i);
    const n = wt[e];
    n && typeof this.optionHandlers[n] == "function" && this.optionHandlers[n](i), (this.handlers[e] || []).forEach((r) => r(i));
  }
  recordDebugEvent(e, i = {}) {
    if (!this.debugOptions || !this.debugOptions.enabled)
      return this;
    const n = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      type: String(e || "event"),
      payload: kt(i)
    };
    for (this.debugOptions.includeValue && (n.value = this.value ? kt(this.value()) : null), this.debugEvents.push(n); this.debugEvents.length > this.debugOptions.maxEvents; )
      this.debugEvents.shift();
    this.debugOptions.echoToConsole && typeof console < "u" && console.debug && console.debug("[LocationMapPicker]", n.type, n.payload);
    const r = wt.debug;
    return typeof this.optionHandlers[r] == "function" && this.optionHandlers[r](n), (this.handlers.debug || []).forEach((a) => a(n)), this;
  }
  debugState() {
    return this.debugEvents.map((e) => ({ ...e }));
  }
  clearDebug() {
    return this.debugEvents = [], this.updateHiddenInputs(), this;
  }
  handleError(e, i = {}) {
    const n = Pi(e, i);
    return this.lastError = n, this.recordDebugEvent("error", n), this.updateHiddenInputs(), i.setStatus !== !1 && this.setMessage(n.message, "error", n.code), this.emit("error", n), n;
  }
  renderShell() {
    this.root = document.createElement("div"), this.root.className = Li(
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
      baseline: this.dirtyBaselineValue ? Tt(this.dirtyBaselineValue) : null,
      value: this.value()
    };
  }
  refreshDirtyState(e = !0) {
    const i = Lt(this.value()) !== this.dirtyBaselineKey, n = this.dirty;
    return this.dirty = i, this.applyDirtyState(), e && n !== this.dirty && this.emit("dirtychange", this.dirtyState()), this.dirty;
  }
  markTouched(e, i = !0) {
    return e && Object.prototype.hasOwnProperty.call(this.touched, e) && (this.touched[e] = !0), this.refreshDirtyState(i), this;
  }
  resetDirty(e = !0) {
    this.dirtyBaselineValue = this.value(), this.dirtyBaselineKey = Lt(this.dirtyBaselineValue), this.touched = Pt();
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
    const n = e === !0, r = n ? String(i || "") : "", a = this.busy !== n || this.busyReason !== r;
    return this.busy = n, this.busyReason = r, this.applyBusyState(), a && this.emit("busychange", { busy: this.busy, reason: this.busyReason }), this;
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
    this.locationPicker = new hi({
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
    }), this.mapEnabled ? this.mapPicker = new bi({
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
  setStatus(e = "info", i = "", n = "") {
    if (typeof e == "object" && e !== null) {
      const s = e;
      e = s.level, i = s.message, n = s.code;
    }
    const r = Et(e, i, n), a = this.status.level !== r.level || this.status.code !== r.code || this.status.message !== r.message;
    return this.status = r, this.applyStatusState(), this.updateHiddenInputs(), a && this.emit("statuschange", this.statusState()), this;
  }
  setMessage(e, i = "info", n = "") {
    return this.setStatus(e ? i : "idle", e || "", n);
  }
  clearStatus() {
    return this.setStatus("idle", "", "");
  }
  statusState() {
    return { ...this.status };
  }
  message(e, i = {}, n = "") {
    const r = this.messages[e] || n || e;
    return Jt(r, i);
  }
  updateHiddenInputs() {
    const e = this.value();
    p(this.hiddenInputs.regionId, e.location.region_id), p(this.hiddenInputs.regionName, e.location.region_name), p(this.hiddenInputs.provinceId, e.location.province_id), p(this.hiddenInputs.provinceName, e.location.province_name), p(this.hiddenInputs.cityId, e.location.city_id), p(this.hiddenInputs.cityName, e.location.city_name), p(this.hiddenInputs.barangayId, e.location.barangay_id), p(this.hiddenInputs.barangayName, e.location.barangay_name), p(this.hiddenInputs.label, e.location.display_label || e.location.label || ""), p(this.hiddenInputs.pinLat, e.pin ? e.pin.lat.toFixed(6) : ""), p(this.hiddenInputs.pinLng, e.pin ? e.pin.lng.toFixed(6) : ""), p(this.hiddenInputs.valueJson, T(e)), p(this.hiddenInputs.locationJson, T(e.location)), p(this.hiddenInputs.pinJson, T(e.pin)), p(this.hiddenInputs.geometryJson, T(e.geometry));
    const i = this.validate();
    p(this.hiddenInputs.isValid, i.valid ? "1" : "0"), p(this.hiddenInputs.validationJson, T(i)), p(this.hiddenInputs.isDirty, this.dirty ? "1" : "0"), p(this.hiddenInputs.dirtyJson, T(this.dirtyState())), p(this.hiddenInputs.touchedJson, T(this.touched)), p(this.hiddenInputs.statusLevel, this.status.level), p(this.hiddenInputs.statusCode, this.status.code), p(this.hiddenInputs.statusMessage, this.status.message), p(this.hiddenInputs.statusJson, T(this.statusState())), p(this.hiddenInputs.lastErrorJson, T(this.lastError)), p(this.hiddenInputs.debugJson, T(this.debugState()));
  }
  value() {
    return {
      location: H(this.location),
      pin: ot(this.pin),
      geometry: Vt(this.geometry)
    };
  }
  validate() {
    const e = this.value(), i = e.location, n = ct(this.validationOptions.requiredLocationLevel), r = [], a = [];
    return n >= 1 && !i.region_id && (r.push("region"), a.push(this.validationOptions.messageRequiredRegion)), n === 2 && !i.province_id && (r.push("province"), a.push(this.validationOptions.messageRequiredProvince)), n >= 3 && !i.city_id && (r.push("city"), a.push(this.validationOptions.messageRequiredCity)), n >= 4 && !i.barangay_id && (r.push("barangay"), a.push(this.validationOptions.messageRequiredBarangay)), this.validationOptions.requirePin && !e.pin && (r.push("pin"), a.push(this.validationOptions.messageRequiredPin)), {
      valid: r.length === 0,
      required_location_level: this.validationOptions.requiredLocationLevel,
      require_pin: this.validationOptions.requirePin,
      missing: r,
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
  async setValue(e = {}, i = !0, n = {}) {
    return this.runBusy(this.message("applyingValue"), async () => {
      try {
        const r = e.location || {}, a = ot(e.pin);
        return this.location = H(await this.locationPicker.setValue(r, !1, r.resolved ? { hydrate: !1 } : {})), a ? (this.mapPicker && this.mapPicker.setPin(a, !1, { force: !0 }), this.pin = a) : (this.mapPicker && this.mapPicker.clearPin(!1, { force: !0 }), this.pin = null), this.geometry.reverse_match = null, this.geometry.reverse_error = null, this.geometry.focus_result = this.mapPicker ? await this.mapPicker.focusLocation(this.location) : null, n.trackDirty === !0 && (this.markTouched("location", !1), a && this.markTouched("pin", !1), this.refreshDirtyState(!1)), this.updateHiddenInputs(), this.setMessage(this.focusMessage(this.geometry.focus_result)), n.resetDirty === !0 ? this.resetDirty(!1) : this.refreshDirtyState(!1), i && this.emitChange(), this.value();
      } catch (r) {
        throw this.handleError(r, {
          source: "value",
          operation: "setValue",
          code: "set_value_failed",
          message: r && r.message ? r.message : this.message("setValueFailed")
        }), r;
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
    } catch (r) {
      const a = this.handleError(r, {
        source: "reverse",
        operation: "reverseGeocode",
        code: "reverse_geocode_failed",
        message: r && r.message ? r.message : this.message("reverseFailed")
      });
      return this.geometry.reverse_match = null, this.geometry.reverse_error = a.message, e && this.emitChange(), this.setBusy(!1), null;
    }
    if (!i || !i.barangay_id) {
      const r = new Error(this.message("reverseNoMatch"));
      if (this.geometry.reverse_match = null, this.geometry.reverse_error = this.reverseOptions.failOnNoMatch ? r.message : null, this.setMessage(r.message, "warning", "reverse_no_match"), e && this.emitChange(), this.emit("reversenomatch", { pin: this.pin ? { ...this.pin } : null, location: { ...this.location } }), this.reverseOptions.failOnNoMatch)
        throw this.handleError(r, {
          source: "reverse",
          operation: "reverseGeocode",
          code: "reverse_no_match",
          recoverable: !1
        }), this.setBusy(!1), r;
      return this.setBusy(!1), null;
    }
    this.location = H(await this.locationPicker.setValue(i, !1, { hydrate: !1 })), this.geometry.reverse_match = Ht(i), this.geometry.reverse_error = null, this.geometry.focus_result = this.mapPicker ? await this.mapPicker.focusLocation(this.location) : null, this.markTouched("reverse"), this.updateHiddenInputs(), this.setMessage(this.message("reverseMatch", { match_quality: this.geometry.reverse_match.match_quality || "geometry" }), "success", "reverse_match"), e && this.emitChange(), this.emit("reversematch", { ...this.geometry.reverse_match });
    const n = this.value();
    return this.setBusy(!1), n;
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
    return e ? this.geoIpOptions.confidence.requireCountry && e.country_code !== this.geoIpOptions.confidence.requireCountry ? this.message("geoIpCountryMismatch", { country_code: e.country_code || "unknown" }) : St(e.accuracy_level) < St(this.geoIpOptions.confidence.minimumAccuracyLevel) ? this.message("geoIpLowAccuracy", { accuracy_level: e.accuracy_level || "unknown" }) : "" : this.message("geoIpNoResult");
  }
  async resolveGeoIpLocationByNames(e) {
    if (!this.geoIpOptions.backfill.enabled)
      return null;
    const i = this.geoIpOptions.backfill.maxLevel, n = ct(i), r = await this.provider.getRegions().catch(() => []);
    let a = ye(r, e.region_name), s = null;
    if (!a && e.province_name)
      for (const u of r) {
        const d = await this.provider.getProvinces(ge(u)).catch(() => []), m = ye(d, e.province_name);
        if (m) {
          a = u, s = m;
          break;
        }
      }
    if (!a)
      return null;
    const o = {
      region_id: ge(a),
      region_name: Pe(a),
      province_id: "",
      province_name: "",
      city_id: "",
      city_name: "",
      barangay_id: "",
      barangay_name: ""
    };
    if (n < 2)
      return fe(o, i);
    if (!s) {
      const u = await this.provider.getProvinces(o.region_id).catch(() => []);
      s = ye(u, e.province_name);
    }
    if (s && (o.province_id = ge(s), o.province_name = Pe(s)), n < 3 || !this.geoIpOptions.backfill.allowCity || !e.city_name)
      return fe(o, i);
    const l = o.province_id || o.region_id, h = await this.provider.getCities(l, {
      region_id: o.region_id,
      province_id: o.province_id
    }).catch(() => []), c = ye(h, e.city_name);
    if (c && (o.city_id = ge(c), o.city_name = Pe(c)), n >= 4 && this.geoIpOptions.backfill.allowBarangay && o.city_id && e.barangay_name) {
      const u = await this.provider.getBarangays(o.city_id, {
        region_id: o.region_id,
        region_name: o.region_name,
        province_id: o.province_id,
        province_name: o.province_name,
        city_id: o.city_id,
        city_name: o.city_name
      }).catch(() => []), d = ye(u, e.barangay_name);
      d && (o.barangay_id = ge(d), o.barangay_name = Pe(d));
    }
    return fe(o, i);
  }
  async resolveGeoIpLocationByReverse(e) {
    if (!this.geoIpOptions.backfill.enabled || !this.geoIpOptions.backfill.reverseGeocode || typeof this.provider.reverseGeocode != "function" || e.lat === null || e.lng === null)
      return null;
    const i = await this.provider.reverseGeocode(e.lat, e.lng, this.location).catch(() => null);
    return i ? fe(i, this.geoIpOptions.backfill.maxLevel) : null;
  }
  async resolveGeoIpHint(e = !0) {
    if (this.busy || this.disabled || this.readOnly || !this.geoIpOptions.enabled || this.geoIpOptions.runOnlyWhenEmpty && this.hasAnyValue())
      return null;
    let i;
    this.setBusy(!0, this.message("geoIpBusy"));
    try {
      i = Oi(await this.lookupGeoIp());
    } catch (s) {
      const o = this.handleError(s, {
        source: "geoip",
        operation: "lookupGeoIp",
        code: "geoip_lookup_failed",
        message: s && s.message ? s.message : this.message("geoIpLookupFailed")
      });
      return this.emit("geoiperror", o), this.setBusy(!1), null;
    }
    const n = this.validateGeoIpResult(i);
    if (n)
      return this.setMessage(n, "warning", "geoip_no_match"), this.emit("geoipnomatch", { result: i, reason: n }), this.setBusy(!1), null;
    this.mapPicker && this.geoIpOptions.updateMap && i.lat !== null && i.lng !== null && (this.geoIpOptions.setPin ? (this.mapPicker.setPin({ lat: i.lat, lng: i.lng }, !1), this.pin = { lat: i.lat, lng: i.lng }) : typeof this.mapPicker.setCenter == "function" && this.mapPicker.setCenter(
      { lat: i.lat, lng: i.lng },
      this.geoIpOptions.mapZoom,
      this.message("geoIpMapCentered")
    ));
    let r = await this.resolveGeoIpLocationByNames(i);
    if ((!r || !r.province_id && this.geoIpOptions.backfill.maxLevel === "province") && (r = await this.resolveGeoIpLocationByReverse(i) || r), !r || !r.region_id && !r.province_id && !r.city_id && !r.barangay_id) {
      this.setMessage(this.message("geoIpNoAdminMatch"), "warning", "geoip_no_admin_match"), this.updateHiddenInputs(), e && this.emitChange();
      const s = { result: i, location: null, value: this.value() };
      return this.emit("geoipnomatch", { result: i, reason: "No administrative location matched." }), this.setBusy(!1), s;
    }
    this.location = H(await this.locationPicker.setValue(r, !1, { hydrate: !1 })), this.geometry.reverse_match = null, this.geometry.reverse_error = null, this.geometry.focus_result = this.mapPicker ? await this.mapPicker.focusLocation(this.location) : null, this.markTouched("geoIp"), this.updateHiddenInputs(), this.setMessage(this.message("geoIpEstimate"), "info", "geoip_estimate"), e && this.emitChange();
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
    return i ? fe(i, this.browserLocationOptions.backfill.maxLevel) : null;
  }
  async resolveBrowserLocationHint(e = !0, i = !1) {
    if (this.busy || this.disabled || this.readOnly || !this.browserLocationOptions.enabled && !i || !i && this.browserLocationOptions.runOnlyWhenEmpty && this.hasAnyValue())
      return null;
    let n;
    this.setBusy(!0, this.message("browserLocationBusy"));
    try {
      n = Ni(await this.lookupBrowserLocation());
    } catch (s) {
      const o = Bi(s, this.messages), l = this.handleError(s, {
        source: "browser-location",
        operation: "getCurrentPosition",
        code: "browser_location_failed",
        message: o
      });
      return this.emit("browserlocationerror", l), this.setBusy(!1), null;
    }
    if (n.lat === null || n.lng === null) {
      const s = this.message("browserLocationNoCoordinates");
      return this.setMessage(s, "warning", "browser_location_no_coordinates"), this.emit("browserlocationnomatch", { result: n, reason: s }), this.setBusy(!1), null;
    }
    this.mapPicker && this.browserLocationOptions.updateMap && (this.browserLocationOptions.setPin ? (this.mapPicker.setPin({ lat: n.lat, lng: n.lng }, !1), this.pin = { lat: n.lat, lng: n.lng }) : typeof this.mapPicker.setCenter == "function" && this.mapPicker.setCenter(
      { lat: n.lat, lng: n.lng },
      this.browserLocationOptions.mapZoom,
      this.message("browserLocationMapCentered")
    ));
    const r = await this.resolveBrowserLocationByReverse(n);
    if (!r || !r.region_id && !r.province_id && !r.city_id && !r.barangay_id) {
      this.setMessage(this.message("browserLocationNoAdminMatch"), "warning", "browser_location_no_admin_match"), this.updateHiddenInputs(), e && this.emitChange();
      const s = { result: n, location: null, value: this.value() };
      return this.emit("browserlocationnomatch", { result: n, reason: "No administrative location matched." }), this.setBusy(!1), s;
    }
    this.location = H(await this.locationPicker.setValue(r, !1, { hydrate: !1 })), this.geometry.reverse_match = null, this.geometry.reverse_error = null, this.geometry.focus_result = this.mapPicker ? await this.mapPicker.focusLocation(this.location) : null, this.markTouched("browserLocation"), this.updateHiddenInputs(), this.setMessage(this.message("browserLocationEstimate"), "info", "browser_location_estimate"), e && this.emitChange();
    const a = { result: n, location: { ...this.location }, value: this.value() };
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
const Ai = [
  "region_id",
  "region_name",
  "province_id",
  "province_name",
  "city_id",
  "city_name",
  "barangay_id",
  "barangay_name"
], cr = "1.0.31";
function _(t) {
  return String(t ?? "").trim();
}
function U(t, e = null) {
  const i = Number(t);
  return Number.isFinite(i) ? i : e;
}
function Le(t) {
  return Array.isArray(t) ? t : t && Array.isArray(t.data) ? t.data : t && Array.isArray(t.items) ? t.items : t && Array.isArray(t.results) ? t.results : [];
}
function Oe(t = {}, e = "") {
  const i = t || {}, n = _(i.id || i.code || i.psgc_code || i.psgcCode || i.correspondence_code || i.correspondenceCode), r = _(i.code || i.psgc_code || i.psgcCode || n), a = _(i.name || i.area_name || i.areaName || i.label || i.code_name || i.codeName || i.slug || n || r), s = _(i.type || i.geographic_level || i.geographicLevel || e);
  return {
    ...i,
    id: n || r || a,
    code: r || n || a,
    name: a,
    type: s
  };
}
function Ri() {
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
function Fi(t = {}, e = "city_barangay") {
  const i = [];
  return e === "region_province_city_barangay" ? i.push(t.region_name, t.province_name, t.city_name, t.barangay_name) : e === "province_city_barangay" ? i.push(t.province_name, t.city_name, t.barangay_name) : e === "barangay_only" ? i.push(t.barangay_name) : i.push(t.city_name, t.barangay_name), i.map(_).filter(Boolean).join(" → ");
}
function V(t = {}, e = {}) {
  const i = t || {}, n = {
    ...i,
    ...Ri()
  };
  Ai.forEach((a) => {
    n[a] = _(i[a]);
  });
  const r = Fi(n, e.labelFormat || i.label_format || "city_barangay");
  return n.label = _(i.label) || r, n.display_label = _(i.display_label) || n.label, i.match_quality !== void 0 && (n.match_quality = _(i.match_quality)), i.match_distance_km !== void 0 && (n.match_distance_km = U(i.match_distance_km, 0)), i.resolved !== void 0 && (n.resolved = !!i.resolved), i.resolved_source !== void 0 && (n.resolved_source = _(i.resolved_source)), n;
}
function lr(t = {}) {
  const e = U(t && t.lat, null), i = U(t && t.lng, null);
  return e === null || i === null ? null : { lat: e, lng: i };
}
function ur(t = {}) {
  const e = t || {}, i = U(e.south, null), n = U(e.west, null), r = U(e.north, null), a = U(e.east, null);
  return [i, n, r, a].some((s) => s === null) ? null : { south: i, west: n, north: r, east: a };
}
function De(t = {}) {
  const e = V(t);
  return e.match_quality = _(t.match_quality || e.match_quality || "provider-match"), e.match_distance_km = U(t.match_distance_km, e.match_distance_km || 0), e;
}
function C(t, e = {}) {
  const i = t instanceof Error ? t : new Error(_(t) || "Provider request failed."), n = new Error(i.message || "Provider request failed.");
  return n.name = "ProviderError", n.provider_error = !0, n.provider = _(e.provider || i.provider || ""), n.method = _(e.method || i.method || ""), n.code = _(e.code || i.code || "provider_error") || "provider_error", n.status = U(e.status ?? i.status, null), n.path = _(e.path || i.path || ""), n.reason = _(e.reason || i.reason || ""), n.cause = i, n;
}
function hr(t = "no_match", e = {}) {
  return {
    matched: !1,
    reason: _(t) || "no_match",
    context: e || null
  };
}
async function dr(t, e, i, n = null) {
  try {
    return await i();
  } catch (r) {
    const a = C(r, {
      provider: t,
      method: e
    });
    if (n !== void 0)
      return n;
    throw a;
  }
}
function dt(t, e) {
  if (!t || !Array.isArray(e) || e.length < 3) return !1;
  const i = Number(t.lat), n = Number(t.lng);
  let r = !1;
  for (let a = 0, s = e.length - 1; a < e.length; s = a++) {
    const o = Number(e[a].lat), l = Number(e[a].lng), h = Number(e[s].lat), c = Number(e[s].lng);
    o > i != h > i && n < (c - l) * (i - o) / (h - o || Number.EPSILON) + l && (r = !r);
  }
  return r;
}
const Zt = (t) => Array.isArray(t) ? t : [], ee = (t) => String(t ?? "").trim(), oe = (t) => ee(t && (t.id || t.code)), le = (t) => String(t && t.name || "").trim();
function Ne(t) {
  return Zt(t).slice().sort((e, i) => le(e).localeCompare(le(i)));
}
function Be(t) {
  return Number(t) * Math.PI / 180;
}
function qi(t, e) {
  const n = Be(Number(e.lat) - Number(t.lat)), r = Be(Number(e.lng) - Number(t.lng)), a = Be(t.lat), s = Be(e.lat), o = Math.sin(n / 2) * Math.sin(n / 2) + Math.cos(a) * Math.cos(s) * Math.sin(r / 2) * Math.sin(r / 2);
  return 2 * 6371 * Math.atan2(Math.sqrt(o), Math.sqrt(1 - o));
}
class xi {
  constructor(e = {}) {
    this.baseUrl = String(e.baseUrl || "/data").replace(/\/+$/, ""), this.cache = /* @__PURE__ */ new Map(), this.reverseMaxNearestKm = Number.isFinite(Number(e.reverseMaxNearestKm)) ? Number(e.reverseMaxNearestKm) : 0;
  }
  async fetchJson(e) {
    const i = String(e || "").replace(/^\/+/, "");
    if (this.cache.has(i))
      return this.cache.get(i);
    let n;
    try {
      n = await fetch(`${this.baseUrl}/${i}`, {
        headers: { Accept: "application/json" },
        credentials: "same-origin"
      });
    } catch (a) {
      throw C(a, {
        provider: "static-json",
        method: "fetchJson",
        path: i,
        code: "static_json_network_failed",
        reason: "network"
      });
    }
    if (!n.ok)
      throw C(`Location data request failed: ${i} (${n.status})`, {
        provider: "static-json",
        method: "fetchJson",
        status: n.status,
        path: i,
        code: n.status === 404 ? "static_json_not_found" : "static_json_request_failed"
      });
    let r;
    try {
      r = await n.json();
    } catch (a) {
      throw C(a, {
        provider: "static-json",
        method: "fetchJson",
        status: n.status,
        path: i,
        code: "static_json_malformed_json",
        reason: "malformed_json"
      });
    }
    return this.cache.set(i, r), r;
  }
  async fetchOptionalJson(e, i = null) {
    try {
      return await this.fetchJson(e);
    } catch (n) {
      return n && (n.status === 404 || n.status === 403), i;
    }
  }
  async fetchFirst(e, i = null) {
    for (const n of e)
      try {
        return await this.fetchJson(n);
      } catch {
      }
    return i;
  }
  async getRegions() {
    return Ne(await this.fetchJson("psgc/regions.json"));
  }
  async getProvinces(e) {
    const i = K(e).map((n) => `psgc/provinces/${n}.json`);
    return Ne(await this.fetchFirst(i, []));
  }
  async getCities(e, i = {}) {
    const n = ee(i.province_id || e), r = ee(i.region_id || e), a = [];
    return n && ne(n).forEach((s) => a.push(`psgc/cities/${s}.json`)), !i.province_id && r && K(r).forEach((s) => a.push(`psgc/cities/${s}.json`)), Ne(await this.fetchFirst([...new Set(a)], []));
  }
  async getBarangays(e) {
    const i = I(e).map((n) => `psgc/barangays/${n}.json`);
    return Ne(await this.fetchFirst(i, []));
  }
  boundsFileName(e) {
    return e === "city" ? "cities" : `${e}s`;
  }
  async getBounds(e, i) {
    const n = this.boundsFileName(e);
    let r = {};
    if (r = await this.fetchOptionalJson(`geo/bounds/${n}.json`, null), !r && e === "city" && (r = await this.fetchOptionalJson("geo/bounds/citys.json", null)), !r || typeof r != "object")
      return null;
    for (const a of xe(e, i))
      if (r[a])
        return re(r[a]);
    return null;
  }
  async getCentroid(e, i) {
    const n = this.boundsFileName(e);
    try {
      const a = await this.fetchOptionalJson(`geo/centroids/${n}.json`, {});
      for (const s of xe(e, i)) {
        const o = a[s];
        if (o)
          return { lat: Number(o.lat), lng: Number(o.lng) };
      }
    } catch {
    }
    const r = await this.getBounds(e, i).catch(() => null);
    return ue(r);
  }
  async getPolygon(e, i) {
    if (e !== "barangay")
      return null;
    const n = Se(i), r = zt(i);
    for (const a of n)
      for (const s of r)
        try {
          const o = await this.fetchJson(`geo/polygons/barangays/${s}/${a}.json`);
          return Array.isArray(o) ? o : null;
        } catch {
        }
    return null;
  }
  findRow(e, i) {
    return Zt(e).find((n) => i.includes(oe(n))) || null;
  }
  async getLocationByIds(e = {}) {
    let i = ee(e.region_id), n = ee(e.province_id), r = ee(e.city_id), a = ee(e.barangay_id);
    a && !r && (r = D(a)), r && !n && (n = F(r)), (n || r || a) && !i && (i = z(n || r || a));
    const s = {
      region_id: i,
      region_name: "",
      province_id: n,
      province_name: "",
      city_id: r,
      city_name: "",
      barangay_id: a,
      barangay_name: ""
    };
    if (i) {
      const u = this.findRow(await this.getRegions(), K(i));
      u && (s.region_id = oe(u), s.region_name = le(u));
    }
    const o = s.region_id ? await this.getProvinces(s.region_id) : [];
    if (n && o.length > 0) {
      const u = this.findRow(o, ne(n));
      u && (s.province_id = oe(u), s.province_name = le(u));
    } else o.length === 0 && (s.province_id = "", s.province_name = "");
    const l = s.province_id || s.region_id, h = l ? await this.getCities(l, {
      region_id: s.region_id,
      province_id: s.province_id
    }) : [];
    if (r) {
      const u = this.findRow(h, I(r));
      u && (s.city_id = oe(u), s.city_name = le(u));
    }
    const c = s.city_id ? await this.getBarangays(s.city_id) : [];
    if (a) {
      const u = this.findRow(c, Se(a));
      u && (s.barangay_id = oe(u), s.barangay_name = le(u));
    }
    return s.label = [s.city_name, s.barangay_name].filter(Boolean).join(" → "), s.display_label = s.label, V(s);
  }
  async reverseGeocode(e, i, n = {}) {
    const r = { lat: Number(e), lng: Number(i) };
    if (!Number.isFinite(r.lat) || !Number.isFinite(r.lng))
      return null;
    const a = [];
    if (n.city_id)
      a.push(ee(n.city_id));
    else {
      const h = await this.fetchOptionalJson("geo/bounds/cities.json", null) || await this.fetchOptionalJson("geo/bounds/citys.json", {});
      Object.keys(h).forEach((c) => {
        ze(h[c], r.lat, r.lng) && a.push(c);
      });
    }
    const s = [];
    for (const h of a) {
      const c = await this.getBarangays(h).catch(() => []);
      for (const u of c) {
        const d = oe(u), m = await this.getBounds("barangay", d).catch(() => null), y = await this.getCentroid("barangay", d).catch(() => null);
        if (y && s.push({
          cityId: h,
          barangayId: d,
          distanceKm: qi(r, y)
        }), !ze(m, r.lat, r.lng))
          continue;
        const M = await this.getPolygon("barangay", d);
        if (M && M.length >= 3 && !dt(r, M))
          continue;
        const W = await this.getLocationByIds({
          region_id: z(d),
          province_id: F(d),
          city_id: h,
          barangay_id: d
        });
        return W.match_quality = M && M.length >= 3 ? "polygon" : "bounds", W.match_distance_km = 0, V(W);
      }
    }
    if (this.reverseMaxNearestKm <= 0)
      return null;
    s.sort((h, c) => h.distanceKm - c.distanceKm);
    const o = s[0];
    if (!o || o.distanceKm > this.reverseMaxNearestKm)
      return null;
    const l = await this.getLocationByIds({
      region_id: z(o.barangayId),
      province_id: F(o.barangayId),
      city_id: o.cityId,
      barangay_id: o.barangayId
    });
    return l.match_quality = "nearest-centroid", l.match_distance_km = Number(o.distanceKm.toFixed(3)), V(l);
  }
}
function v(t) {
  return String(t ?? "").trim();
}
function Xe(t) {
  return Le(t);
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
function k(t) {
  return [...new Set(t.map(v).filter(Boolean))];
}
function ce(t, e) {
  return k(t.map((i) => R(i, e) || v(i))).filter((i) => /^\d{10}$/.test(i));
}
function zi(t) {
  return [
    t.id,
    t.code,
    t.psgc_code,
    t.correspondence_code,
    t.correspondenceCode
  ].map(v).filter(Boolean);
}
function lt(t) {
  return String(t ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\b(city|municipality|province|region|of|the)\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}
function Ct(t) {
  return lt(t).split(" ").filter(Boolean);
}
function Di(t, e) {
  const i = lt(t), n = lt(e);
  if (!i || !n)
    return !1;
  if (i === n || i.includes(n) || n.includes(i))
    return !0;
  const r = new Set(Ct(i)), a = Ct(n);
  return a.length > 0 && a.every((s) => r.has(s));
}
function ji(t, e) {
  const i = k([
    t.name,
    t.area_name,
    t.label,
    t.code_name,
    t.slug
  ]), n = k(e);
  return i.some((r) => n.some((a) => Di(r, a)));
}
function Qe(t) {
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
function B(t, e = "") {
  const i = t || {}, n = v(i.code || i.id || i.psgc_code), r = b(i.name || i.area_name || i.label || i.code_name || i.slug || n), a = b(i.type || i.geographic_level || e);
  return {
    id: n || r,
    code: n || r,
    name: r,
    type: a,
    status: b(i.status || ""),
    zip_code: b(i.zip_code || i.postal_code || ""),
    code_name: b(i.code_name || i.codeName || ""),
    slug: b(i.slug || ""),
    label: b(i.label || ""),
    area_name: b(i.area_name || i.areaName || ""),
    psgc_code: v(i.psgc_code || i.psgcCode || ""),
    correspondence_code: v(i.correspondence_code || i.correspondenceCode || i.old_code || i.oldCode || ""),
    region: Qe(i.region),
    province: Qe(i.province),
    city_municipality: Qe(i.city_municipality || i.city || i.municipality)
  };
}
function Ti(t, e) {
  const i = e.map(v).filter(Boolean), n = new Set(i);
  if (i.forEach((a) => {
    ["region", "province", "city", "barangay"].forEach((s) => {
      const o = R(a, s);
      o && n.add(o);
    });
  }), n.size === 0)
    return !1;
  const r = zi(t);
  return [...r].forEach((a) => {
    ["region", "province", "city", "barangay"].forEach((s) => {
      const o = R(a, s);
      o && r.push(o);
    });
  }), r.some((a) => n.has(a));
}
function Ut(t, e, i = []) {
  return Ti(t, e) || ji(t, i);
}
function $e(t, e, i = []) {
  return t ? Ut(t, e, i) : !1;
}
function Hi(t) {
  const e = v(t);
  return !!e && !/^\d+$/.test(e);
}
function Ae(t, e = "", i = "", n = !1) {
  const r = [];
  t && (r.push(t.code_name, t.slug), n && r.push(t.name, t.label, t.area_name, t.code, t.id, t.psgc_code, t.correspondence_code)), n && r.push(e, i);
  const a = k(r);
  return n ? a : a.filter(Hi);
}
function et(t, e) {
  e && (e.region && (t.region_id = e.region.id || t.region_id, t.region_name = e.region.name || t.region_name), e.province && (t.province_id = e.province.id || t.province_id, t.province_name = e.province.name || t.province_name), e.city_municipality && (t.city_id = e.city_municipality.id || t.city_id, t.city_name = e.city_municipality.name || t.city_name));
}
class mr {
  constructor(e = {}) {
    this.baseUrl = String(e.baseUrl || "https://psgc.cloud/api/v2").replace(/\/+$/, ""), this.cache = /* @__PURE__ */ new Map(), this.notFoundCache = /* @__PURE__ */ new Set(), this.allowEndpointFallbacks = e.allowEndpointFallbacks === !0, this.cacheNotFound = e.cacheNotFound !== !1;
  }
  async fetchJson(e) {
    const i = String(e || "").replace(/^\/+/, "");
    if (this.cache.has(i))
      return this.cache.get(i);
    if (this.notFoundCache.has(i)) {
      const a = C(`PSGC Cloud request failed: ${i} (404)`, {
        provider: "psgc-cloud",
        method: "fetchJson",
        status: 404,
        path: i,
        code: "psgc_not_found"
      });
      throw a.cached = !0, a;
    }
    let n;
    try {
      n = await fetch(`${this.baseUrl}/${i}`, {
        headers: { Accept: "application/json" }
      });
    } catch (a) {
      throw C(a, {
        provider: "psgc-cloud",
        method: "fetchJson",
        path: i,
        code: "psgc_network_failed",
        reason: "network"
      });
    }
    if (!n.ok) {
      const a = C(`PSGC Cloud request failed: ${i} (${n.status})`, {
        provider: "psgc-cloud",
        method: "fetchJson",
        status: n.status,
        path: i,
        code: n.status === 404 ? "psgc_not_found" : "psgc_request_failed"
      });
      throw this.cacheNotFound && n.status === 404 && this.notFoundCache.add(i), a;
    }
    let r;
    try {
      r = await n.json();
    } catch (a) {
      throw C(a, {
        provider: "psgc-cloud",
        method: "fetchJson",
        status: n.status,
        path: i,
        code: "psgc_malformed_json",
        reason: "malformed_json"
      });
    }
    return this.cache.set(i, r), r;
  }
  async fetchOptionalArray(e) {
    try {
      return Xe(await this.fetchJson(e));
    } catch (i) {
      if (i.status === 404)
        return [];
      throw i;
    }
  }
  async fetchFirstArray(e) {
    for (const i of k(e)) {
      const n = await this.fetchOptionalArray(i);
      if (n.length > 0)
        return n;
    }
    return [];
  }
  async fetchOptionalItem(e, i = "") {
    if (!this.allowEndpointFallbacks)
      return null;
    for (const n of k(e))
      try {
        return B(await this.fetchJson(n), i);
      } catch (r) {
        if (r.status !== 404)
          throw r;
      }
    return null;
  }
  findRow(e, i, n = []) {
    return Xe(e).map((r) => B(r)).find((r) => Ut(r, i, n)) || null;
  }
  async getRegions() {
    return E(Xe(await this.fetchJson("regions")).map((e) => B(e, "region")));
  }
  async getAllProvinces() {
    return E((await this.fetchOptionalArray("provinces")).map((e) => B(e, "province")));
  }
  async getAllCities() {
    return E((await this.fetchOptionalArray("cities-municipalities")).map((e) => B(e, "city_municipality")));
  }
  async getAllBarangays() {
    return E((await this.fetchOptionalArray("barangays")).map((e) => B(e, "barangay")));
  }
  async getProvinces(e, i = {}) {
    const n = b(i.region_name || "");
    if (!e && !n)
      return [];
    const r = await this.resolveRegion(e, n).catch(() => null), a = K(e || r && r.id), s = k([n, r && r.name]), l = (await this.getAllProvinces().catch(() => [])).filter((c) => $e(c.region, a, s));
    if (l.length > 0)
      return E(l);
    if (r) {
      const c = Ae(r, n, e, this.allowEndpointFallbacks).map((u) => `regions/${L(u)}/provinces`);
      return E((await this.fetchFirstArray(c)).map((u) => B(u, "province")));
    }
    if (!this.allowEndpointFallbacks)
      return [];
    const h = ce(a, "region").map((c) => `regions/${L(c)}/provinces`);
    return E((await this.fetchFirstArray(h)).map((c) => B(c, "province")));
  }
  async getCities(e, i = {}) {
    const n = v(i.province_id || e), r = v(i.region_id || e), a = b(i.province_name || ""), s = b(i.region_name || ""), o = await this.getAllCities().catch(() => []);
    if (n || a) {
      const l = await this.resolveProvince(n, r, a, s).catch(() => null), h = ne(n || l && l.id), c = k([a, l && l.name]), u = o.filter((d) => $e(d.province, h, c));
      if (u.length > 0)
        return E(u);
      if (l) {
        const d = Ae(l, a, n, this.allowEndpointFallbacks).map((y) => `provinces/${L(y)}/cities-municipalities`), m = await this.fetchFirstArray(d);
        if (m.length > 0)
          return E(m.map((y) => B(y, "city_municipality")));
      }
    }
    if (r || s) {
      const l = await this.resolveRegion(r, s).catch(() => null), h = K(r || l && l.id), c = k([s, l && l.name]), u = o.filter((d) => $e(d.region, h, c));
      if (u.length > 0)
        return E(u);
      if (l) {
        const d = Ae(l, s, r, this.allowEndpointFallbacks).map((m) => `regions/${L(m)}/cities-municipalities`);
        return E((await this.fetchFirstArray(d)).map((m) => B(m, "city_municipality")));
      }
    }
    return [];
  }
  async getBarangays(e, i = {}) {
    const n = v(e || i.city_id), r = b(i.city_name || "");
    if (!n && !r)
      return [];
    const a = await this.resolveCity(n, i).catch(() => null), s = I(n || a && a.id), o = k([r, a && a.name]);
    if (a) {
      const u = Ae(a, r, n, this.allowEndpointFallbacks).map((m) => `cities-municipalities/${L(m)}/barangays`), d = await this.fetchFirstArray(u);
      if (d.length > 0)
        return E(d.map((m) => B(m, "barangay")));
    }
    const h = (await this.getAllBarangays().catch(() => [])).filter((u) => $e(u.city_municipality, s, o));
    if (h.length > 0)
      return E(h);
    if (!this.allowEndpointFallbacks)
      return [];
    const c = ce(s, "city").map((u) => `cities-municipalities/${L(u)}/barangays`);
    return E((await this.fetchFirstArray(c)).map((u) => B(u, "barangay")));
  }
  async resolveRegion(e, i = "") {
    const n = K(e), r = k([i]), a = this.findRow(await this.getRegions().catch(() => []), n, r);
    if (a)
      return a;
    const s = [i ? `regions/${L(i)}` : "", ...ce(n, "region").map((o) => `regions/${L(o)}`)].filter(Boolean);
    return this.fetchOptionalItem(s, "region");
  }
  async resolveProvince(e, i = "", n = "", r = "") {
    if (!e && !n)
      return null;
    const a = ne(e), s = k([n]), o = i || r ? await this.resolveRegion(i, r).catch(() => null) : null, l = o ? this.findRow(await this.getProvinces(o.id || i).catch(() => []), a, s) : null;
    if (l)
      return l;
    const h = this.findRow(await this.getAllProvinces().catch(() => []), a, s);
    if (h)
      return h;
    const c = [n ? `provinces/${L(n)}` : "", ...ce(a, "province").map((u) => `provinces/${L(u)}`)].filter(Boolean);
    return this.fetchOptionalItem(c, "province");
  }
  async resolveCity(e, i = {}) {
    const n = b(i.city_name || "");
    if (!e && !n)
      return null;
    const r = I(e), a = k([n]), s = i.province_id || i.region_id || "", o = s || i.province_name || i.region_name ? this.findRow(await this.getCities(s, i).catch(() => []), r, a) : null;
    if (o)
      return o;
    const l = await this.getAllCities().catch(() => []), h = this.findRow(l, r, a);
    if (h)
      return h;
    const c = [n ? `cities-municipalities/${L(n)}` : "", ...ce(r, "city").map((u) => `cities-municipalities/${L(u)}`)].filter(Boolean);
    return this.fetchOptionalItem(c, "city_municipality");
  }
  async resolveBarangay(e, i = "", n = "", r = "") {
    if (!e && !n)
      return null;
    const a = Se(e), s = k([n]), o = i || r ? this.findRow(await this.getBarangays(i, { city_id: i, city_name: r }).catch(() => []), a, s) : null;
    if (o)
      return o;
    const l = [n ? `barangays/${L(n)}` : "", ...ce(a, "barangay").map((h) => `barangays/${L(h)}`)].filter(Boolean);
    return this.fetchOptionalItem(l, "barangay");
  }
  async getLocationByIds(e = {}) {
    let i = v(e.region_id), n = v(e.province_id), r = v(e.city_id), a = v(e.barangay_id);
    const s = b(e.region_name || ""), o = b(e.province_name || ""), l = b(e.city_name || ""), h = b(e.barangay_name || "");
    a && !r && (r = D(a)), r && !n && (n = F(r)), (n || r || a) && !i && (i = z(n || r || a));
    const c = {
      region_id: i,
      region_name: s,
      province_id: n,
      province_name: o,
      city_id: r,
      city_name: l,
      barangay_id: a,
      barangay_name: h
    }, u = await this.resolveRegion(i, s).catch(() => null);
    u && (c.region_id = u.id, c.region_name = u.name);
    const d = await this.resolveProvince(n, c.region_id || i, o, c.region_name || s).catch(() => null);
    d && (c.province_id = d.id, c.province_name = d.name, et(c, d));
    const m = await this.resolveCity(r, {
      region_id: c.region_id || i,
      region_name: c.region_name || s,
      province_id: c.province_id || n,
      province_name: c.province_name || o,
      city_name: l
    }).catch(() => null);
    m && (c.city_id = m.id, c.city_name = m.name, et(c, m), m.province || (c.province_id = "", c.province_name = ""));
    const y = await this.resolveBarangay(a, c.city_id || r, h, c.city_name || l).catch(() => null);
    return y && (c.barangay_id = y.id, c.barangay_name = y.name, et(c, y)), c.label = [c.city_name, c.barangay_name].filter(Boolean).join(" → "), c.display_label = c.label, V(c);
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
class pr {
  constructor(e = {}) {
    this.baseUrl = String(e.baseUrl || "/api/location").replace(/\/+$/, ""), this.cache = /* @__PURE__ */ new Map();
  }
  async fetchJson(e, i = {}) {
    const n = new URL(`${this.baseUrl}/${String(e || "").replace(/^\/+/, "")}`, window.location.origin);
    Object.entries(i).forEach(([o, l]) => {
      l != null && String(l) !== "" && n.searchParams.set(o, String(l));
    });
    const r = n.toString();
    if (this.cache.has(r))
      return this.cache.get(r);
    let a;
    try {
      a = await fetch(n, {
        headers: { Accept: "application/json" },
        credentials: "same-origin"
      });
    } catch (o) {
      throw C(o, {
        provider: "api",
        method: "fetchJson",
        path: e,
        code: "api_network_failed",
        reason: "network"
      });
    }
    if (!a.ok)
      throw C(`Location API request failed: ${e} (${a.status})`, {
        provider: "api",
        method: "fetchJson",
        status: a.status,
        path: e,
        code: a.status === 404 ? "api_not_found" : "api_request_failed"
      });
    let s;
    try {
      s = await a.json();
    } catch (o) {
      throw C(o, {
        provider: "api",
        method: "fetchJson",
        status: a.status,
        path: e,
        code: "api_malformed_json",
        reason: "malformed_json"
      });
    }
    return this.cache.set(r, s), s;
  }
  async getRegions() {
    return Le(await this.fetchJson("regions")).map((e) => Oe(e, "region"));
  }
  async getProvinces(e) {
    return Le(await this.fetchJson("provinces", { region_id: e })).map((i) => Oe(i, "province"));
  }
  async getCities(e, i = {}) {
    return Le(await this.fetchJson("cities", {
      province_id: i.province_id || "",
      region_id: i.province_id ? "" : i.region_id || e
    })).map((n) => Oe(n, "city_municipality"));
  }
  async getBarangays(e) {
    return Le(await this.fetchJson("barangays", { city_id: e })).map((i) => Oe(i, "barangay"));
  }
  async getLocationByIds(e = {}) {
    return V(await this.fetchJson("location", e));
  }
  async getBounds(e, i) {
    return this.fetchJson("bounds", { level: e, id: i }).catch(() => null);
  }
  async getCentroid(e, i) {
    return this.fetchJson("centroid", { level: e, id: i }).catch(() => null);
  }
  async getPolygon(e, i) {
    return this.fetchJson("polygon", { level: e, id: i }).catch(() => null);
  }
  async reverseGeocode(e, i, n = {}) {
    const r = await this.fetchJson("reverse", {
      lat: e,
      lng: i,
      city_id: n.city_id || ""
    }).catch(() => null);
    return r ? De(r) : null;
  }
}
function Vi(t) {
  return String(t ?? "").trim();
}
function Gi(t) {
  return Array.isArray(t) ? t : [];
}
function Re(t) {
  return Number(t) * Math.PI / 180;
}
function Ji(t, e) {
  const n = Re(Number(e.lat) - Number(t.lat)), r = Re(Number(e.lng) - Number(t.lng)), a = Re(t.lat), s = Re(e.lat), o = Math.sin(n / 2) * Math.sin(n / 2) + Math.cos(a) * Math.cos(s) * Math.sin(r / 2) * Math.sin(r / 2);
  return 2 * 6371 * Math.atan2(Math.sqrt(o), Math.sqrt(1 - o));
}
class Zi {
  constructor(e = {}) {
    this.baseUrl = String(e.baseUrl || "/data").replace(/\/+$/, ""), this.cache = /* @__PURE__ */ new Map(), this.reverseMaxNearestKm = Number.isFinite(Number(e.reverseMaxNearestKm)) ? Number(e.reverseMaxNearestKm) : 0;
  }
  async fetchJson(e) {
    const i = String(e || "").replace(/^\/+/, "");
    if (this.cache.has(i))
      return this.cache.get(i);
    let n;
    try {
      n = await fetch(`${this.baseUrl}/${i}`, {
        headers: { Accept: "application/json" },
        credentials: "same-origin"
      });
    } catch (a) {
      throw C(a, {
        provider: "static-geometry",
        method: "fetchJson",
        path: i,
        code: "static_geometry_network_failed",
        reason: "network"
      });
    }
    if (!n.ok)
      throw C(`Geometry data request failed: ${i} (${n.status})`, {
        provider: "static-geometry",
        method: "fetchJson",
        status: n.status,
        path: i,
        code: n.status === 404 ? "static_geometry_not_found" : "static_geometry_request_failed"
      });
    let r;
    try {
      r = await n.json();
    } catch (a) {
      throw C(a, {
        provider: "static-geometry",
        method: "fetchJson",
        status: n.status,
        path: i,
        code: "static_geometry_malformed_json",
        reason: "malformed_json"
      });
    }
    return this.cache.set(i, r), r;
  }
  async fetchOptionalJson(e, i = null) {
    try {
      return await this.fetchJson(e);
    } catch (n) {
      return n && (n.status === 404 || n.status === 403), i;
    }
  }
  boundsFileName(e) {
    return e === "city" ? "cities" : `${e}s`;
  }
  async getBounds(e, i) {
    const n = this.boundsFileName(e);
    let r = {};
    if (r = await this.fetchOptionalJson(`geo/bounds/${n}.json`, null), !r && e === "city" && (r = await this.fetchOptionalJson("geo/bounds/citys.json", null)), !r || typeof r != "object")
      return null;
    for (const a of xe(e, i))
      if (r[a])
        return re(r[a]);
    return null;
  }
  async getCentroid(e, i) {
    const n = this.boundsFileName(e);
    try {
      const a = await this.fetchOptionalJson(`geo/centroids/${n}.json`, {});
      for (const s of xe(e, i)) {
        const o = a[s];
        if (o)
          return { lat: Number(o.lat), lng: Number(o.lng) };
      }
    } catch {
    }
    const r = await this.getBounds(e, i).catch(() => null);
    return ue(r);
  }
  async getPolygon(e, i) {
    if (e !== "barangay")
      return null;
    for (const n of Se(i))
      for (const r of zt(i))
        try {
          const a = await this.fetchJson(`geo/polygons/barangays/${r}/${n}.json`);
          return Gi(a);
        } catch {
        }
    return null;
  }
  async reverseGeocode(e, i, n = {}) {
    const r = {
      lat: Number(e),
      lng: Number(i)
    };
    if (!Number.isFinite(r.lat) || !Number.isFinite(r.lng))
      return null;
    const a = [];
    if (n.city_id)
      a.push(Vi(n.city_id));
    else {
      const c = await this.fetchOptionalJson("geo/bounds/cities.json", null) || await this.fetchOptionalJson("geo/bounds/citys.json", {});
      Object.keys(c).forEach((u) => {
        ze(c[u], r.lat, r.lng) && a.push(u);
      });
    }
    const s = await this.fetchOptionalJson("geo/bounds/barangays.json", {}), o = await this.fetchOptionalJson("geo/centroids/barangays.json", {}), l = [];
    for (const c of Object.keys(s)) {
      const u = D(c);
      if (a.length > 0 && !a.some((y) => ai(c, y)))
        continue;
      const d = o[c];
      if (d && l.push({
        barangay_id: c,
        city_id: u,
        distanceKm: Ji(r, {
          lat: Number(d.lat),
          lng: Number(d.lng)
        })
      }), !ze(s[c], r.lat, r.lng))
        continue;
      const m = await this.getPolygon("barangay", c);
      if (!(m && m.length >= 3 && !dt(r, m)))
        return De({
          region_id: z(c),
          province_id: F(c),
          city_id: u,
          barangay_id: c,
          match_quality: m && m.length >= 3 ? "polygon" : "bounds",
          match_distance_km: 0
        });
    }
    if (this.reverseMaxNearestKm <= 0)
      return null;
    l.sort((c, u) => c.distanceKm - u.distanceKm);
    const h = l[0];
    return !h || h.distanceKm > this.reverseMaxNearestKm ? null : De({
      region_id: z(h.barangay_id),
      province_id: F(h.barangay_id),
      city_id: h.city_id,
      barangay_id: h.barangay_id,
      match_quality: "nearest-centroid",
      match_distance_km: Number(h.distanceKm.toFixed(3))
    });
  }
}
function q(t) {
  return String(t ?? "").trim();
}
function Kt(t) {
  const e = Number(t);
  return Number.isFinite(e) ? e : 0;
}
function Ui() {
  return V({});
}
function Ki(t = {}) {
  const e = {
    region_id: q(t.region_id),
    region_name: q(t.region_name),
    province_id: q(t.province_id),
    province_name: q(t.province_name),
    city_id: q(t.city_id),
    city_name: q(t.city_name),
    barangay_id: q(t.barangay_id),
    barangay_name: q(t.barangay_name)
  };
  return e.label = [e.city_name, e.barangay_name].filter(Boolean).join(" → "), e.display_label = e.label, e.match_quality = q(t.match_quality), e.match_distance_km = Kt(t.match_distance_km), V(e);
}
function Wi(t = {}, e = {}) {
  const i = { ...Ui(), ...t };
  return [
    "region_id",
    "region_name",
    "province_id",
    "province_name",
    "city_id",
    "city_name",
    "barangay_id",
    "barangay_name"
  ].forEach((n) => {
    !i[n] && e[n] && (i[n] = q(e[n]));
  }), i.match_quality = q(e.match_quality || i.match_quality), i.match_distance_km = Kt(e.match_distance_km ?? i.match_distance_km), i.label = [i.city_name, i.barangay_name].filter(Boolean).join(" → "), i.display_label = i.label, i.resolved = !0, i.resolved_source = "composite-reverse-geocode", V(i);
}
class Yi {
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
    return V(await this.hierarchyProvider.getLocationByIds(e));
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
  async reverseGeocode(e, i, n = {}) {
    if (!this.geometryProvider || !this.geometryProvider.reverseGeocode)
      return null;
    const r = await this.geometryProvider.reverseGeocode(e, i, n).catch(() => null);
    if (!r || !r.barangay_id)
      return null;
    let a = null;
    try {
      a = await this.hierarchyProvider.getLocationByIds({
        region_id: r.region_id,
        region_name: r.region_name,
        province_id: r.province_id,
        province_name: r.province_name,
        city_id: r.city_id,
        city_name: r.city_name,
        barangay_id: r.barangay_id,
        barangay_name: r.barangay_name
      });
    } catch {
      a = Ki(r);
    }
    return Wi(a, r);
  }
}
function J(t) {
  return String(t || "").trim();
}
function $(t) {
  return String(t || "").replace(/'/g, "''");
}
function je(t) {
  const e = Number(t);
  return Number.isFinite(e) ? e : null;
}
function Q(t, ...e) {
  for (const i of e)
    if (t[i] !== void 0 && t[i] !== null && String(t[i]).trim() !== "")
      return t[i];
  return "";
}
function Mt(t) {
  let e = 0;
  for (let i = 0, n = t.length - 1; i < t.length; n = i++)
    e += t[n][0] * t[i][1] - t[i][0] * t[n][1];
  return Math.abs(e / 2);
}
function Xi(t) {
  if (!t)
    return [];
  const e = [];
  return t.type === "Polygon" && Array.isArray(t.coordinates[0]) && e.push(t.coordinates[0]), t.type === "MultiPolygon" && t.coordinates.forEach((i) => {
    Array.isArray(i[0]) && e.push(i[0]);
  }), e.filter((i) => Array.isArray(i) && i.length >= 4).sort((i, n) => Mt(n) - Mt(i))[0] || [];
}
function Qi(t) {
  let e = 1 / 0, i = 1 / 0, n = -1 / 0, r = -1 / 0;
  return t.forEach((a) => {
    const s = je(a.lat), o = je(a.lng);
    s === null || o === null || (e = Math.min(e, s), i = Math.min(i, o), n = Math.max(n, s), r = Math.max(r, o));
  }), !Number.isFinite(e) || !Number.isFinite(i) || !Number.isFinite(n) || !Number.isFinite(r) ? null : { south: e, west: i, north: n, east: r };
}
function Fe(t, e = 6) {
  const i = Math.pow(10, e);
  return Xi(t).map(([r, a]) => ({
    lat: Math.round(Number(a) * i) / i,
    lng: Math.round(Number(r) * i) / i
  })).filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng));
}
function Ot(t, e) {
  const n = (Number(e.lat) - Number(t.lat)) * Math.PI / 180, r = (Number(e.lng) - Number(t.lng)) * Math.PI / 180, a = Number(t.lat) * Math.PI / 180, s = Number(e.lat) * Math.PI / 180, o = Math.sin(n / 2) * Math.sin(n / 2) + Math.cos(a) * Math.cos(s) * Math.sin(r / 2) * Math.sin(r / 2);
  return 2 * 6371 * Math.atan2(Math.sqrt(o), Math.sqrt(1 - o));
}
function Nt(t) {
  if (!Array.isArray(t) || t.length === 0)
    return null;
  const e = t.reduce((i, n) => ({
    lat: i.lat + Number(n.lat),
    lng: i.lng + Number(n.lng),
    count: i.count + 1
  }), { lat: 0, lng: 0, count: 0 });
  return e.count > 0 ? { lat: e.lat / e.count, lng: e.lng / e.count } : null;
}
class gr {
  constructor(e = {}) {
    this.baseUrl = String(e.baseUrl || "https://portal.georisk.gov.ph/arcgis/rest/services/PSA/Barangay/MapServer/4").replace(/\/+$/, ""), this.geometryPrecision = Number.isFinite(Number(e.geometryPrecision)) ? Number(e.geometryPrecision) : 6, this.reverseDistanceMeters = Number.isFinite(Number(e.reverseDistanceMeters)) ? Number(e.reverseDistanceMeters) : 50, this.cache = /* @__PURE__ */ new Map();
  }
  buildUrl(e = {}) {
    const i = new URL(`${this.baseUrl}/query`);
    return Object.entries(e).forEach(([n, r]) => {
      r != null && String(r) !== "" && i.searchParams.set(n, String(r));
    }), i.toString();
  }
  async fetchQuery(e = {}) {
    const i = {
      f: "geojson",
      outFields: "*",
      outSR: "4326",
      returnGeometry: "true"
    }, n = this.buildUrl({ ...i, ...e });
    if (this.cache.has(n))
      return this.cache.get(n);
    const r = await fetch(n, {
      headers: { Accept: "application/json, application/geo+json" }
    });
    if (!r.ok)
      throw new Error(`ArcGIS barangay boundary request failed (${r.status}).`);
    const a = await r.json();
    if (a.error)
      throw new Error(a.error.message || "ArcGIS barangay boundary request failed.");
    return this.cache.set(n, a), a;
  }
  cityWhereClause(e) {
    const i = [];
    return I(e).forEach((n) => {
      i.push(`city_code='${$(n)}'`), i.push(`CITY_CODE='${$(n)}'`);
      const r = w(n);
      r.length >= 7 && (i.push(`psgc_10d LIKE '${$(r.slice(0, 7))}%'`), i.push(`PSGC_10D LIKE '${$(r.slice(0, 7))}%'`)), r.length >= 6 && (i.push(`psgc_10d LIKE '${$(r.slice(0, 6))}%'`), i.push(`PSGC_10D LIKE '${$(r.slice(0, 6))}%'`));
    }), i.length ? `(${[...new Set(i)].join(" OR ")})` : "1=1";
  }
  async queryByBarangayId(e) {
    const i = J(e);
    if (!i)
      return null;
    const n = w(i).slice(0, 9), r = `(psgc_10d='${$(i)}' OR PSGC_10D='${$(i)}' OR brgy_code='${$(i)}' OR BRGY_CODE='${$(i)}' OR brgy_code='${$(n)}' OR BRGY_CODE='${$(n)}')`, a = await this.fetchQuery({
      where: r,
      geometryPrecision: this.geometryPrecision,
      returnGeometry: "true"
    });
    return Array.isArray(a.features) && a.features.length > 0 ? a.features[0] : null;
  }
  async getPolygon(e, i) {
    if (e !== "barangay")
      return null;
    const n = await this.queryByBarangayId(i).catch(() => null);
    if (!n || !n.geometry)
      return null;
    const r = Fe(n.geometry, this.geometryPrecision);
    return r.length >= 3 ? r : null;
  }
  async getBounds(e, i) {
    if (e !== "barangay")
      return null;
    const n = await this.getPolygon(e, i).catch(() => null);
    return n ? re(Qi(n)) : null;
  }
  async getCentroid(e, i) {
    if (e !== "barangay") {
      const r = await this.getBounds(e, i).catch(() => null);
      return ue(r);
    }
    const n = await this.getBounds(e, i).catch(() => null);
    return ue(n);
  }
  featureToMatch(e, i = "") {
    const n = e && e.properties ? e.properties : {}, r = J(Q(n, "psgc_10d", "PSGC_10D", "brgy_code", "BRGY_CODE"));
    if (!r)
      return null;
    const a = J(Q(n, "city_code", "CITY_CODE")) || D(r), s = J(Q(n, "prov_code", "PROV_CODE")) || F(r), o = J(Q(n, "reg_code", "REG_CODE")) || z(r), l = R(r, "barangay") || r, h = R(a, "city") || D(l || r), c = R(s, "province") || F(l || r), u = R(o, "region") || z(c || l || r);
    return De({
      region_id: u,
      region_name: J(Q(n, "reg_name", "REG_NAME")),
      province_id: c,
      province_name: J(Q(n, "prov_name", "PROV_NAME")),
      city_id: h,
      city_name: J(Q(n, "city_name", "CITY_NAME")),
      barangay_id: l,
      barangay_name: J(Q(n, "brgy_name", "BRGY_NAME")),
      match_quality: i || (e.geometry ? "arcgis-polygon" : "arcgis-feature"),
      match_distance_km: 0
    });
  }
  sortFeaturesByCentroidDistance(e, i) {
    return e.slice().sort((n, r) => {
      const a = Fe(n.geometry, this.geometryPrecision), s = Fe(r.geometry, this.geometryPrecision), o = Nt(a), l = Nt(s), h = o ? Ot(i, o) : Number.POSITIVE_INFINITY, c = l ? Ot(i, l) : Number.POSITIVE_INFINITY;
      return h - c;
    });
  }
  pointQueryParams(e, i, n = {}) {
    const r = {
      where: "1=1",
      geometry: `${i},${e}`,
      geometryType: "esriGeometryPoint",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      returnGeometry: "true",
      geometryPrecision: this.geometryPrecision
    };
    return n.city_id && (r.where = this.cityWhereClause(n.city_id)), r;
  }
  async reverseGeocode(e, i, n = {}) {
    const r = je(e), a = je(i);
    if (r === null || a === null)
      return null;
    const s = { lat: r, lng: a }, o = await this.fetchQuery(this.pointQueryParams(r, a, n)).catch(() => null), l = o && Array.isArray(o.features) ? o.features : [];
    if (l.length > 0) {
      const m = l.find((y) => {
        const M = Fe(y.geometry, this.geometryPrecision);
        return M.length >= 3 ? dt(s, M) : !0;
      }) || l[0];
      return this.featureToMatch(m, "arcgis-polygon");
    }
    if (this.reverseDistanceMeters <= 0)
      return null;
    const h = await this.fetchQuery({
      ...this.pointQueryParams(r, a, n),
      distance: this.reverseDistanceMeters,
      units: "esriSRUnit_Meter"
    }).catch(() => null), c = h && Array.isArray(h.features) ? h.features : [];
    if (c.length === 0)
      return null;
    const u = this.sortFeaturesByCentroidDistance(c, s), d = this.featureToMatch(u[0], `arcgis-distance-${this.reverseDistanceMeters}m`);
    return d && (d.match_distance_km = Number((this.reverseDistanceMeters / 1e3).toFixed(3))), d;
  }
}
function tt(t, e = "/data") {
  return String(t || e).replace(/\/+$/, "");
}
function en(t = {}) {
  const e = tt(t.baseUrl), i = tt(t.hierarchyBaseUrl, e), n = tt(t.geometryBaseUrl, e), r = Number.isFinite(Number(t.reverseMaxNearestKm)) ? Number(t.reverseMaxNearestKm) : 0;
  return new Yi({
    hierarchyProvider: new xi({
      baseUrl: i
    }),
    geometryProvider: new Zi({
      baseUrl: n,
      reverseMaxNearestKm: r
    })
  });
}
function tn(t) {
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
function nn(t) {
  const e = String(t || "").trim().replace(/\/+$/, "");
  if (!e)
    throw new Error("createStaticLocationMapPicker requires baseUrl.");
  return e;
}
function be(t, e) {
  return {
    ...t,
    ...e || {}
  };
}
function rn(t = {}) {
  const e = nn(t.baseUrl), i = tn(t.mount), n = en({
    ...t.providerOptions || {},
    baseUrl: e
  });
  return new $i({
    ...t,
    mount: i,
    provider: n,
    ui: be({
      selectedLabelFormat: "city_barangay",
      theme: "light",
      size: "comfortable",
      density: "normal"
    }, t.ui),
    location: be({
      requiredLevel: "barangay"
    }, t.location),
    validation: be({
      requiredLocationLevel: "barangay",
      requirePin: !0
    }, t.validation),
    map: be({
      pinMode: "centered",
      showBoundary: !0,
      fitBoundaryOnSelection: !0
    }, t.map),
    reverse: be({
      enabled: !0,
      failOnNoMatch: !1
    }, t.reverse)
  });
}
function Bt(t) {
  return JSON.stringify(t ?? null);
}
function O(t) {
  return t == null ? "" : String(t);
}
function $t(t) {
  const e = Number(t);
  return Number.isFinite(e) ? e.toFixed(6) : "";
}
function an(t) {
  if (!t || typeof t.value != "function" || typeof t.validate != "function")
    throw new Error("createLocationMapPickerSubmitPayload requires a LocationMapPicker instance.");
  return t;
}
function sn(t) {
  const e = t && t.location ? t.location : {}, i = t && t.pin ? t.pin : null, n = t && t.geometry ? t.geometry : {
    focus_result: null,
    reverse_match: null,
    reverse_error: null
  };
  return {
    location: {
      region_id: O(e.region_id),
      region_name: O(e.region_name),
      province_id: O(e.province_id),
      province_name: O(e.province_name),
      city_id: O(e.city_id),
      city_name: O(e.city_name),
      barangay_id: O(e.barangay_id),
      barangay_name: O(e.barangay_name),
      label: O(e.label),
      display_label: O(e.display_label)
    },
    pin: i ? {
      lat: Number(i.lat),
      lng: Number(i.lng)
    } : null,
    geometry: n
  };
}
function on(t) {
  const e = t || {};
  return {
    valid: e.valid === !0,
    required_location_level: O(e.required_location_level),
    require_pin: e.require_pin === !0,
    missing: Array.isArray(e.missing) ? e.missing.map(O) : [],
    messages: Array.isArray(e.messages) ? e.messages.map(O) : [],
    location: e.location || {},
    pin: e.pin || null
  };
}
function cn(t) {
  const e = an(t);
  return ln(e.value(), e.validate());
}
function ln(t, e) {
  const i = sn(t || {}), n = on(e);
  return {
    barangay_id: i.location.barangay_id,
    pin_lat: i.pin ? $t(i.pin.lat) : "",
    pin_lng: i.pin ? $t(i.pin.lng) : "",
    location_picker_value_json: Bt(i),
    location_picker_validation_json: Bt(n)
  };
}
const Wt = "Complete the required location fields before saving.", un = "The location picker is still working. Try again after it finishes.", hn = "The location picker is disabled.", dn = "The location picker is read-only.";
function Ee(t) {
  return t == null ? "" : String(t);
}
function mn(t) {
  return Array.isArray(t) ? t.map(Ee).filter(Boolean) : [];
}
function pn(t) {
  if (!t || typeof t.validate != "function" || typeof t.value != "function")
    throw new Error("createLocationMapPickerSubmitResult requires a LocationMapPicker instance.");
  return t;
}
function gn(t) {
  return typeof t.isBusy == "function" ? t.isBusy() === !0 : t.busy === !0;
}
function yn(t) {
  return t.disabled === !0;
}
function fn(t) {
  return t.readOnly === !0;
}
function it(t, e, i, n) {
  return {
    valid: !1,
    blocked: !0,
    code: t,
    message: e || Wt,
    messages: e ? [e] : [],
    missing: i && Array.isArray(i.missing) ? i.missing.slice() : [],
    validation: i,
    payload: n
  };
}
function ut(t, e = {}) {
  const i = pn(t), n = i.validate(), r = cn(i);
  if (gn(i))
    return it("picker_busy", Ee(e.messageBusy || un), n, r);
  if (yn(i))
    return it("picker_disabled", Ee(e.messageDisabled || hn), n, r);
  if (fn(i))
    return it("picker_readonly", Ee(e.messageReadOnly || dn), n, r);
  if (!n.valid) {
    const a = mn(n.messages), s = a[0] || Ee(e.messageInvalid || Wt);
    return {
      valid: !1,
      blocked: !0,
      code: "picker_invalid",
      message: s,
      messages: a.length ? a : [s],
      missing: Array.isArray(n.missing) ? n.missing.slice() : [],
      validation: n,
      payload: r
    };
  }
  return {
    valid: !0,
    blocked: !1,
    code: "picker_valid",
    message: "",
    messages: [],
    missing: [],
    validation: n,
    payload: r
  };
}
function yr(t, e = {}) {
  const i = ut(t, e);
  return i.blocked && e.setStatus !== !1 && t && typeof t.setStatus == "function" && t.setStatus("error", i.message, i.code), i;
}
const bn = {
  barangay_id: "barangay_id",
  pin_lat: "pin_lat",
  pin_lng: "pin_lng",
  location_picker_value_json: "location_picker_value_json",
  location_picker_validation_json: "location_picker_validation_json"
}, _n = [
  "messageInvalid",
  "messageBusy",
  "messageDisabled",
  "messageReadOnly"
];
function vn(t) {
  if (!t || typeof t.validate != "function" || typeof t.value != "function")
    throw new Error("bindLocationMapPickerForm requires a LocationMapPicker instance.");
  return t;
}
function Yt(t) {
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
function wn(t) {
  return t == null ? "" : String(t).trim();
}
function Xt(t = {}) {
  return {
    ...bn,
    ...t || {}
  };
}
function Pn(t = {}) {
  const e = {};
  return _n.forEach((i) => {
    Object.prototype.hasOwnProperty.call(t, i) && (e[i] = t[i]);
  }), e;
}
function Ln(t, e) {
  if (!e || !t || typeof t.querySelector != "function")
    return null;
  if (t.elements && t.elements[e]) {
    const n = t.elements[e];
    if (n && typeof n.value < "u")
      return n;
  }
  const i = typeof CSS < "u" && CSS.escape ? CSS.escape(e) : e.replace(/"/g, '\\"');
  return t.querySelector(`[name="${i}"]`);
}
function En(t, e) {
  const i = wn(e);
  if (!i)
    return null;
  const n = Ln(t, i);
  if (n)
    return n;
  const r = document.createElement("input");
  return r.type = "hidden", r.name = i, r.setAttribute("data-location-map-picker-submit-field", i), t.appendChild(r), r;
}
function _e(t, e, i) {
  const n = En(t, e);
  if (!n)
    return null;
  const r = i == null ? "" : String(i);
  return n.value !== r && (n.value = r), n;
}
function kn(t) {
  const e = t && t.root;
  if (!e || typeof e.scrollIntoView != "function")
    return;
  e.scrollIntoView({ block: "center", inline: "nearest" });
  const i = e.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  i && typeof i.focus == "function" && i.focus({ preventScroll: !0 });
}
function At(t, e, i = {}) {
  const n = Yt(t), r = Xt(i.fieldNames), a = e || {};
  return _e(n, r.barangay_id, a.barangay_id), _e(n, r.pin_lat, a.pin_lat), _e(n, r.pin_lng, a.pin_lng), _e(n, r.location_picker_value_json, a.location_picker_value_json), _e(n, r.location_picker_validation_json, a.location_picker_validation_json), {
    form: n,
    fieldNames: r,
    payload: a
  };
}
function Sn(t = {}) {
  const e = Yt(t.form), i = vn(t.picker), n = Xt(t.fieldNames), r = t.writePayload !== !1, a = t.preventInvalid !== !1, s = t.stopInvalidPropagation === !0, o = t.setStatus !== !1, l = t.focusOnBlocked === !0, h = Pn(t);
  let c = !1;
  function u(d) {
    if (c)
      return null;
    const m = ut(i, h);
    return r && At(e, m.payload, { fieldNames: n }), typeof t.onResult == "function" && t.onResult(m, d || null), m.blocked ? (d && a && typeof d.preventDefault == "function" && d.preventDefault(), d && s && typeof d.stopPropagation == "function" && d.stopPropagation(), o && typeof i.setStatus == "function" && i.setStatus("error", m.message, m.code), l && kn(i), typeof t.onBlocked == "function" && t.onBlocked(m, d || null), m) : (typeof t.onValid == "function" && t.onValid(m, d || null), m);
  }
  return e.addEventListener("submit", u), {
    form: e,
    picker: i,
    fieldNames: n,
    submit: u,
    updatePayload() {
      const d = ut(i, h);
      return At(e, d.payload, { fieldNames: n }), d;
    },
    destroy() {
      c || (c = !0, e.removeEventListener("submit", u));
    }
  };
}
const nt = {
  region_province_city_barangay: ["region_name", "province_name", "city_name", "barangay_name"],
  province_city_barangay: ["province_name", "city_name", "barangay_name"],
  city_barangay: ["city_name", "barangay_name"],
  barangay_only: ["barangay_name"]
};
function Rt(t) {
  return t == null ? "" : String(t).trim();
}
function In(t, e, i) {
  const n = String(t || "").trim().toLowerCase();
  return e.includes(n) ? n : i;
}
function Cn(t = {}) {
  return t && typeof t == "object" && t.location && typeof t.location == "object" ? t.location : t || {};
}
function Mn(t = {}, e = {}) {
  const i = Cn(t), n = In(e.format || e.selectedLabelFormat, Object.keys(nt), "city_barangay"), r = Rt(e.separator) || " → ", a = e.emptyLabel == null ? "" : String(e.emptyLabel);
  return (nt[n] || nt.city_barangay).map((l) => Rt(i[l])).filter(Boolean).join(r) || a;
}
const Qt = ["region", "province", "city", "barangay"];
function ke(t) {
  return t == null ? "" : String(t).trim();
}
function On(t, e, i) {
  const n = ke(t).toLowerCase();
  return e.includes(n) ? n : i;
}
function Nn(t = {}) {
  return t && typeof t == "object" && t.location && typeof t.location == "object" ? t.location : t || {};
}
function Ft(t) {
  return Qt.indexOf(t);
}
function ei(t = {}) {
  const e = Nn(t);
  return ke(e.barangay_id) ? "barangay" : ke(e.city_id) ? "city" : ke(e.province_id) ? "province" : ke(e.region_id) ? "region" : "";
}
function Bn(t = {}, e = {}) {
  const i = ei(t);
  if (!i)
    return !1;
  const n = On(
    e.requiredLocationLevel || e.selectionRequiredLevel,
    Qt,
    "barangay"
  );
  return Ft(i) >= Ft(n);
}
function $n(t) {
  if (!t || typeof t.value != "function" || typeof t.open != "function" || typeof t.close != "function")
    throw new Error("bindLocationMapPickerFieldControls requires a LocationMapPicker instance.");
  return t;
}
function rt(t) {
  return t ? typeof t == "string" ? Array.from(document.querySelectorAll(t)) : typeof NodeList < "u" && t instanceof NodeList ? Array.from(t) : Array.isArray(t) ? t.filter(Boolean) : [t] : [];
}
function qt(t) {
  return t ? typeof t == "string" ? document.querySelector(t) : t : null;
}
function ie(t) {
  return t == null ? "" : String(t);
}
function xt(t, e) {
  if (!t)
    return;
  const i = ie(e);
  t.textContent !== i && (t.textContent = i);
}
function at(t, e) {
  t && ("disabled" in t && (t.disabled = e), t.setAttribute("aria-disabled", e ? "true" : "false"));
}
function An(t) {
  return t.disabled === !0 || t.readOnly === !0 || typeof t.isBusy == "function" && t.isBusy() === !0;
}
function Rn(t) {
  if (!t || typeof t != "object")
    return !1;
  if (t.pin && Number.isFinite(Number(t.pin.lat)) && Number.isFinite(Number(t.pin.lng)))
    return !0;
  const e = t.location && typeof t.location == "object" ? t.location : t;
  return !!(ie(e.region_id) || ie(e.province_id) || ie(e.city_id) || ie(e.barangay_id));
}
function Fn(t = {}) {
  const e = $n(t.picker), i = rt(t.openButton || t.openControl || t.trigger), n = rt(t.closeButton || t.closeControl), r = rt(t.clearButton || t.clearControl), a = qt(t.summary || t.summaryElement), s = qt(t.status || t.statusElement), o = ie(t.selectedClassName || "is-selected"), l = ie(t.invalidClassName || "is-invalid"), h = t.emptyLabel == null ? "Select City → Barangay" : String(t.emptyLabel);
  let c = !1;
  function u() {
    return Mn(e.value(), {
      selectedLabelFormat: t.selectedLabelFormat,
      format: t.format,
      separator: t.separator,
      emptyLabel: h
    });
  }
  function d() {
    if (c)
      return;
    const g = e.value(), ae = u(), Ie = typeof e.validate == "function" ? e.validate() : { valid: !0 }, ri = ei(g), He = Bn(g, {
      requiredLocationLevel: t.selectionRequiredLevel || t.requiredLocationLevel || Ie.required_location_level
    }), Ve = An(e), Ge = Rn(g), Je = typeof e.isOpen == "function" ? e.isOpen() : !1;
    xt(a, ae), a && (a.classList.toggle(o, He), a.classList.toggle(l, Ie.valid === !1), a.dataset.selected = He ? "true" : "false", a.dataset.selectedLevel = ri, a.dataset.valid = Ie.valid === !1 ? "false" : "true", a.dataset.clearable = Ge ? "true" : "false"), i.forEach((j) => {
      at(j, Ve), j.setAttribute("aria-expanded", Je ? "true" : "false"), j.classList.toggle(o, He), j.classList.toggle(l, Ie.valid === !1);
    }), n.forEach((j) => {
      at(j, Ve || !Je), j.setAttribute("aria-expanded", Je ? "true" : "false");
    }), r.forEach((j) => {
      at(j, Ve || !Ge), j.classList.toggle(o, Ge);
    });
  }
  function m(g) {
    if (c || !s)
      return;
    const ae = g || (typeof e.statusState == "function" ? e.statusState() : null) || {};
    xt(s, ae.message || ""), s.hidden = !ae.message, s.dataset.statusLevel = ae.level || "idle", s.dataset.statusCode = ae.code || "";
  }
  function y(g) {
    c || (g.preventDefault(), e.open(), d());
  }
  function M(g) {
    c || (g.preventDefault(), e.close(), d());
  }
  function W(g) {
    c || (g.preventDefault(), typeof e.clear == "function" && e.clear(!0), d(), m());
  }
  const Y = () => d(), gt = (g) => m(g);
  return i.forEach((g) => g.addEventListener("click", y)), n.forEach((g) => g.addEventListener("click", M)), r.forEach((g) => g.addEventListener("click", W)), typeof e.on == "function" && (e.on("change", Y), e.on("busychange", Y), e.on("dirtychange", Y), e.on("openchange", Y), e.on("statuschange", gt)), d(), m(), {
    picker: e,
    openButtons: i,
    closeButtons: n,
    clearButtons: r,
    summary: a,
    status: s,
    update() {
      return d(), m(), this;
    },
    destroy() {
      c || (c = !0, i.forEach((g) => g.removeEventListener("click", y)), n.forEach((g) => g.removeEventListener("click", M)), r.forEach((g) => g.removeEventListener("click", W)), typeof e.off == "function" && (e.off("change", Y), e.off("busychange", Y), e.off("dirtychange", Y), e.off("openchange", Y), e.off("statuschange", gt)));
    }
  };
}
function mt(t, e) {
  if (t == null)
    return {};
  if (typeof t != "object" || Array.isArray(t))
    throw new Error(`mountStaticLocationMapPickerField ${e} must be an object.`);
  return t;
}
function qe(t, e) {
  return Object.prototype.hasOwnProperty.call(t || {}, e);
}
function qn(t) {
  if (!t || typeof t != "object" || Array.isArray(t))
    throw new Error("mountStaticLocationMapPickerField requires an options object.");
  if (!qe(t, "mount"))
    throw new Error("mountStaticLocationMapPickerField requires mount.");
  if (!qe(t, "baseUrl"))
    throw new Error("mountStaticLocationMapPickerField requires baseUrl.");
  if (!t.form && qe(t, "formBinding"))
    throw new Error("mountStaticLocationMapPickerField formBinding requires form.");
  return t;
}
function xn(t) {
  return {
    ...mt(t.pickerOptions, "pickerOptions"),
    mount: t.mount,
    baseUrl: t.baseUrl
  };
}
function zn(t, e) {
  return t.form ? Sn({
    ...mt(t.formBinding, "formBinding"),
    form: t.form,
    picker: e
  }) : null;
}
function Dn(t, e) {
  return t.controls ? Fn({
    ...mt(t.controls, "controls"),
    picker: e
  }) : null;
}
async function jn(t, e) {
  return await t.picker.ready, qe(e, "initialValue") && await t.picker.setValue(e.initialValue || {}, !1, {
    resetDirty: e.resetDirtyOnInitialValue !== !1,
    trackDirty: e.trackDirtyOnInitialValue === !0
  }), e.openOnMount === !0 && t.open(), t;
}
function fr(t = {}) {
  const e = qn(t), i = rn(xn(e)), n = zn(e, i), r = Dn(e, i);
  let a = !1;
  const s = {
    picker: i,
    binding: n,
    controls: r,
    ready: null,
    open() {
      return !a && typeof i.open == "function" && i.open(), s;
    },
    close() {
      return !a && typeof i.close == "function" && i.close(), s;
    },
    isOpen() {
      return !a && typeof i.isOpen == "function" ? i.isOpen() : !1;
    },
    updatePayload() {
      if (!n)
        throw new Error("mountStaticLocationMapPickerField updatePayload requires form.");
      return n.updatePayload();
    },
    resize() {
      return !a && typeof i.resize == "function" && i.resize(), s;
    },
    destroy() {
      a || (a = !0, r && typeof r.destroy == "function" && r.destroy(), n && typeof n.destroy == "function" && n.destroy(), i.destroy());
    }
  };
  return s.ready = jn(s, e), s;
}
const Tn = {
  barangay_id: "barangay_id",
  pin_lat: "pin_lat",
  pin_lng: "pin_lng",
  location_picker_value_json: "location_picker_value_json",
  location_picker_validation_json: "location_picker_validation_json"
};
function Hn(t, e) {
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
function Vn(t) {
  return t == null ? "" : String(t).trim();
}
function ti(t = {}) {
  return {
    ...Tn,
    ...t || {}
  };
}
function f(t) {
  return t == null ? "" : String(t).trim();
}
function Gn(t) {
  return typeof CSS < "u" && CSS.escape ? CSS.escape(t) : String(t).replace(/"/g, '\\"');
}
function Jn(t) {
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
function Zn(t, e) {
  const i = Vn(e);
  return !i || !t ? null : t.elements && t.elements[i] ? Jn(t.elements[i]) : typeof t.querySelector == "function" ? t.querySelector(`[name="${Gn(i)}"]`) : null;
}
function ve(t, e) {
  const i = Zn(t, e);
  return i && typeof i.value < "u" ? f(i.value) : "";
}
function Un(t, e) {
  const i = f(t);
  if (!i)
    return null;
  let n;
  try {
    n = JSON.parse(i);
  } catch {
    throw new Error(`Invalid JSON in ${e}.`);
  }
  if (!n || typeof n != "object" || Array.isArray(n))
    throw new Error(`${e} must contain a JSON object.`);
  return n;
}
function Te(t, e) {
  const i = f(t);
  if (!i)
    return null;
  const n = Number(i);
  if (!Number.isFinite(n))
    throw new Error(`${e} must be a valid number.`);
  return n;
}
function ii(t = {}) {
  const e = t && typeof t == "object" ? t : {};
  return {
    region_id: f(e.region_id),
    region_name: f(e.region_name),
    province_id: f(e.province_id),
    province_name: f(e.province_name),
    city_id: f(e.city_id),
    city_name: f(e.city_name),
    barangay_id: f(e.barangay_id),
    barangay_name: f(e.barangay_name),
    label: f(e.label),
    display_label: f(e.display_label),
    resolved: e.resolved === !0,
    resolved_source: f(e.resolved_source)
  };
}
function Kn(t = null) {
  if (!t || typeof t != "object")
    return null;
  const e = Te(t.lat, "pin.lat"), i = Te(t.lng, "pin.lng");
  if (e === null && i === null)
    return null;
  if (e === null || i === null)
    throw new Error("pin requires both lat and lng.");
  return { lat: e, lng: i };
}
function Wn(t, e) {
  const i = Un(t.location_picker_value_json, e.location_picker_value_json);
  return i ? {
    location: ii(i.location || i),
    pin: Kn(i.pin || null)
  } : null;
}
function Yn(t, e) {
  const i = Te(t.pin_lat, e.pin_lat), n = Te(t.pin_lng, e.pin_lng);
  if (i === null && n !== null || i !== null && n === null)
    throw new Error(`${e.pin_lat} and ${e.pin_lng} must both be present or both be blank.`);
  return {
    location: ii({
      barangay_id: t.barangay_id
    }),
    pin: i === null ? null : { lat: i, lng: n }
  };
}
function Xn(t, e = {}) {
  const i = Hn(t, "readLocationMapPickerSubmitPayloadFromForm"), n = ti(e.fieldNames);
  return {
    barangay_id: ve(i, n.barangay_id),
    pin_lat: ve(i, n.pin_lat),
    pin_lng: ve(i, n.pin_lng),
    location_picker_value_json: ve(i, n.location_picker_value_json),
    location_picker_validation_json: ve(i, n.location_picker_validation_json)
  };
}
function Qn(t = {}, e = {}) {
  const i = ti(e.fieldNames), n = {
    barangay_id: f(t.barangay_id),
    pin_lat: f(t.pin_lat),
    pin_lng: f(t.pin_lng),
    location_picker_value_json: f(t.location_picker_value_json),
    location_picker_validation_json: f(t.location_picker_validation_json)
  };
  return Wn(n, i) || Yn(n, i);
}
function br(t, e = {}) {
  const i = Xn(t, e);
  return Qn(i, e);
}
const ht = Object.freeze({
  barangay_id: "barangay_id",
  pin_lat: "pin_lat",
  pin_lng: "pin_lng",
  location_picker_value_json: "location_picker_value_json",
  location_picker_validation_json: "location_picker_validation_json"
});
function ni(t) {
  return t == null ? "" : String(t).trim();
}
function er(t) {
  const e = ni(t).replace(/\/+$/, "");
  if (!e)
    throw new Error("createLocationMapPickerHostConfig requires baseUrl.");
  return e;
}
function pt(t, e) {
  if (t == null)
    return {};
  if (typeof t != "object" || Array.isArray(t))
    throw new Error(`createLocationMapPickerHostConfig ${e} must be an object.`);
  return t;
}
function tr(t = {}) {
  const e = pt(t, "fieldNames"), i = { ...ht };
  for (const n of Object.keys(e)) {
    if (!Object.prototype.hasOwnProperty.call(ht, n))
      throw new Error(`Unknown location picker field name: ${n}.`);
    const r = ni(e[n]);
    if (!r)
      throw new Error(`Location picker field name ${n} cannot be blank.`);
    i[n] = r;
  }
  return i;
}
function we(t, e, i) {
  return {
    ...t,
    ...pt(e, i)
  };
}
function _r(t = {}) {
  const e = pt(t, "options"), i = er(e.baseUrl), n = tr(e.fieldNames), r = we({
    selectedLabelFormat: "city_barangay",
    theme: "light",
    size: "comfortable",
    density: "normal"
  }, e.ui, "ui"), a = we({
    requiredLevel: "barangay"
  }, e.location, "location"), s = we({
    requiredLocationLevel: "barangay",
    requirePin: !0
  }, e.validation, "validation"), o = we({
    pinMode: "centered",
    showBoundary: !0,
    fitBoundaryOnSelection: !0,
    tileUrlTemplate: ""
  }, e.map, "map"), l = we({
    enabled: !0,
    failOnNoMatch: !1
  }, e.reverse, "reverse");
  return {
    baseUrl: i,
    fieldNames: n,
    pickerOptions: {
      ui: r,
      location: a,
      validation: s,
      map: o,
      reverse: l
    },
    formBinding: {
      fieldNames: n,
      preventInvalid: !0,
      writePayload: !0,
      focusOnBlocked: !0
    }
  };
}
function vr() {
  return { ...ht };
}
export {
  pr as ApiProvider,
  gr as ArcGisBarangayGeometryProvider,
  Yi as CompositeLocationProvider,
  $i as LocationMapPicker,
  hi as LocationPicker,
  bi as MapPicker,
  cr as PROVIDER_CONTRACT_VERSION,
  mr as PsgcCloudProvider,
  Zi as StaticGeometryProvider,
  xi as StaticJsonProvider,
  Se as barangayCodeCandidates,
  Fn as bindLocationMapPickerFieldControls,
  Sn as bindLocationMapPickerForm,
  yr as blockInvalidLocationMapPickerSubmit,
  ue as boundsCenter,
  ze as boundsContains,
  I as cityCodeCandidates,
  zt as cityFolderCandidates,
  U as cleanProviderNumber,
  _ as cleanProviderText,
  w as cleanPsgcCode,
  _r as createLocationMapPickerHostConfig,
  br as createLocationMapPickerInitialValueFromForm,
  Qn as createLocationMapPickerInitialValueFromSubmitPayload,
  cn as createLocationMapPickerSubmitPayload,
  ln as createLocationMapPickerSubmitPayloadFromValue,
  ut as createLocationMapPickerSubmitResult,
  C as createProviderError,
  hr as createProviderNoMatch,
  rn as createStaticLocationMapPicker,
  en as createStaticLocationProvider,
  vr as defaultLocationMapPickerFieldNames,
  rr as deriveBarangayCityId,
  D as deriveCityId,
  F as deriveProvinceId,
  z as deriveRegionId,
  Ri as emptyProviderLocation,
  Mn as formatLocationMapPickerValueLabel,
  Fi as formatProviderLocationLabel,
  Bn as hasLocationMapPickerSelection,
  nr as isLegacyNineDigitPsgc,
  ir as isTenDigitPsgc,
  ar as legacyCityPrefix,
  fr as mountStaticLocationMapPickerField,
  re as normalizeBounds,
  ur as normalizeBoundsValue,
  V as normalizeLocationValue,
  lr as normalizePinValue,
  Le as normalizeProviderArray,
  Oe as normalizeProviderRow,
  De as normalizeReverseMatch,
  xe as parentCodeCandidates,
  dt as pointInPolygon,
  ne as provinceCodeCandidates,
  Xn as readLocationMapPickerSubmitPayloadFromForm,
  K as regionCodeCandidates,
  dr as safeProviderCall,
  ai as sameCity,
  or as sameProvince,
  sr as sameRegion,
  ei as selectedLocationMapPickerLevel,
  R as toTenDigitPsgcCode,
  he as uniqueCodes,
  At as writeLocationMapPickerSubmitPayloadToForm
};
